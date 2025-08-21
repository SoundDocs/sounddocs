import asyncio
import json
import ssl
import pathlib
import time
from typing import Set
import websockets
from websockets.server import WebSocketServerProtocol
import numpy as np
import sounddevice as sd

from . import __version__
from . import audio
from . import dsp
from .schema import (
    CaptureConfig,
    ClientMessage,
    DevicesMessage,
    ErrorMessage,
    FrameMessage,
    HelloAckMessage,
    IncomingMessage,
    StartCaptureMessage,
    StoppedMessage,
    VersionMessage,
)

# --- State Management ---
connected_clients: Set[WebSocketServerProtocol] = set()
capture_task = None

ALLOWED_ORIGINS = ["https://sounddocs.org", "https://beta.sounddocs.org", "http://localhost:5173", "https://localhost:5173"]

async def process_message(ws: WebSocketServerProtocol, message_data: dict):
    """Parses and routes incoming messages."""
    global capture_task

    try:
        incoming = IncomingMessage(message=message_data)
        message = incoming.message
    except Exception as e:
        await send_error(ws, f"Invalid message format: {e}")
        return

    if message.type == "hello":
        ack = HelloAckMessage(
            type="hello_ack",
            agent="capture-agent-py",
            originAllowed=True,
            version=__version__,
        )
        await ws.send(json.dumps(ack.dict()))

    elif message.type == "get_version":
        version_msg = VersionMessage(type="version", version=__version__)
        await ws.send(json.dumps(version_msg.dict()))

    elif message.type == "list_devices":
        devices = audio.list_devices()
        response = DevicesMessage(type="devices", items=devices)
        await ws.send(json.dumps(response.dict()))

    elif message.type == "start":
        if capture_task and not capture_task.done():
            await send_error(ws, "Capture is already in progress.")
            return
        dsp.reset_dsp_state()
        config = CaptureConfig(**message.dict())
        capture_task = asyncio.create_task(run_capture(ws, config))

    elif message.type == "stop":
        if capture_task and not capture_task.done():
            capture_task.cancel()
            try:
                await capture_task
            except asyncio.CancelledError:
                pass
        dsp.reset_dsp_state()  # free cached windows & delay state
        capture_task = None

    elif message.type == "delay_freeze":
        enable = bool(message.enable)
        applied_ms = message.applied_ms
        dsp.delay_freeze(enable, applied_ms)
        await ws.send(json.dumps({"type": "delay_status", **dsp.delay_status()}))

    elif message.type == "set_manual_delay":
        ms = getattr(message, "delay_ms", None)
        dsp.delay_set_manual(ms)
        await ws.send(json.dumps({
            "type": "delay_status",
            **dsp.delay_status()
        }))

async def run_capture(ws: WebSocketServerProtocol, config: CaptureConfig):
    loop = asyncio.get_running_loop()
    aq = asyncio.Queue(maxsize=8)  # keep backlog small; prevents RAM spikes

    def audio_callback(indata, frames, time_info, status):
        # called on driver thread; never block here
        if status:
            print(f"Audio callback status: {status}")
        try:
            loop.call_soon_threadsafe(aq.put_nowait, indata.astype(np.float32, copy=True))
        except Exception:
            # queue full -> drop; never block RT
            pass

    try:
        fs = int(config.sampleRate)
        nperseg = int(config.nfft)
        max_delay_ms = int(getattr(config, "maxDelayMs", 300))
        max_lag_samples = int(np.ceil(fs * max_delay_ms / 1000.0))

        buffer_len = nperseg + 2*max_lag_samples + int(0.75*nperseg)
        noverlap = int(0.75 * nperseg)
        hop_size = nperseg - noverlap

        num_channels = max(config.refChan, config.measChan)
        analysis_buffer = np.zeros((buffer_len, num_channels), dtype=np.float32)
        carry = 0  # how many new samples since last analysis
        last_send = 0.0
        target_fps = 20.0  # UI update rate
        send_interval = 1.0 / target_fps

        stream = sd.InputStream(
            device=int(config.deviceId),
            samplerate=config.sampleRate,
            blocksize=1024,               # <= smaller, smoother
            channels=num_channels,
            dtype="float32",
            callback=audio_callback,
            latency="high",               # optional: reduce overruns
        )
        stream.start()

        while True:
            # wait for at least one block
            block = await aq.get()

            # drain whatever else is queued to catch up
            blocks = [block]
            total = block.shape[0]
            # Drain but cap to ~4 blocks worth to bound peak RAM
            while not aq.empty() and total < 4096:
                try:
                    b = aq.get_nowait()
                    blocks.append(b); total += b.shape[0]
                except asyncio.QueueEmpty:
                    break

            chunk = np.concatenate(blocks, axis=0)

            # roll new samples into analysis buffer
            L = chunk.shape[0]
            if L >= buffer_len:
                analysis_buffer[:] = chunk[-buffer_len:]
                carry = hop_size  # force immediate analysis
            else:
                analysis_buffer = np.roll(analysis_buffer, -L, axis=0)
                analysis_buffer[-L:, :] = chunk
                carry += L

            # run analysis only when we've advanced by one hop
            if carry >= hop_size:
                tf_data, spl_data, delay_ms = dsp.compute_metrics(analysis_buffer, config)
                now = time.monotonic()
                if now - last_send >= send_interval:
                    status = dsp.delay_status()
                    applied = status["applied_ms"]

                    frame = FrameMessage(
                        type="frame",
                        tf=tf_data,
                        spl=spl_data,
                        delay_ms=applied,              # <- show applied, not the local variable
                        latency_ms=float(stream.latency)*1000.0 if hasattr(stream, "latency") else 0.0,
                        ts=int(time.time() * 1000),
                        sampleRate=fs,
                        delay_mode=status["mode"],
                        applied_delay_ms=applied,
                    )
                    await ws.send(json.dumps(frame.dict()))
                    last_send = now
                carry -= hop_size

            await asyncio.sleep(0)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"Error during capture: {e}")
        await send_error(ws, f"Capture failed: {e}")
    finally:
        try:
            stream.stop(); stream.close()
        except Exception:
            pass
        import gc; gc.collect()
        await ws.send(json.dumps(StoppedMessage(type="stopped").dict()))

async def send_error(ws: WebSocketServerProtocol, error_message: str):
    error_msg = ErrorMessage(type="error", message=error_message)
    await ws.send(json.dumps(error_msg.dict()))

async def handler(ws: WebSocketServerProtocol, path: str):
    origin = ws.request_headers.get("Origin")
    if origin not in ALLOWED_ORIGINS:
        print(f"Connection rejected from disallowed origin: {origin}")
        return

    print(f"Client connected from origin: {origin}")
    connected_clients.add(ws)
    try:
        async for message in ws:
            try:
                message_data = json.loads(message)
                await process_message(ws, message_data)
            except json.JSONDecodeError:
                await send_error(ws, "Invalid JSON received.")
            except Exception as e:
                await send_error(ws, f"An unexpected error occurred: {e}")
    except websockets.exceptions.ConnectionClosed:
        print("Client disconnected.")
    finally:
        global capture_task
        if capture_task and not capture_task.done():
            capture_task.cancel()
            try:
                await capture_task
            except asyncio.CancelledError:
                pass
            dsp.reset_dsp_state()
        connected_clients.discard(ws)

async def start_server(host="127.0.0.1", port=9469):
    # Look for certificates in the user's .sounddocs-agent directory
    agent_dir = pathlib.Path.home() / ".sounddocs-agent"
    cert_path = agent_dir / "localhost.pem"
    key_path = agent_dir / "localhost-key.pem"

    # Check if certificates exist
    if not cert_path.exists() or not key_path.exists():
        raise FileNotFoundError(
            f"SSL certificates not found!\n"
            f"Expected certificates at:\n"
            f"  {cert_path}\n"
            f"  {key_path}\n"
            f"Please run the setup process to generate certificates."
        )
    
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(cert_path, key_path)

    async with websockets.serve(handler, host, port, ssl=ssl_context):
        print(f"Secure WebSocket server started at wss://{host}:{port}")
        await asyncio.Future()

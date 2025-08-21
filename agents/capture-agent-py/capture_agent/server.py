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

from . import audio
from . import dsp
from .dsp import SignalGenerator
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
_generator_state = {
    "config": {
        "signalType": "off",
        "outputChannel": 1,
        "loopback": False,
    },
    "instance": None,
}

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
            agent="capture-agent-py/0.1.0",
            version="0.1.8",
            originAllowed=True,
        )
        await ws.send(json.dumps(ack.dict()))

    elif message.type == "get_version":
        version_msg = VersionMessage(type="version", version="0.1.0")
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
            capture_task = None

    elif message.type == "delay_freeze":
        enable = bool(message.enable)
        applied_ms = message.applied_ms
        dsp.delay_freeze(enable, applied_ms)
        await ws.send(json.dumps({"type": "delay_status", **dsp.delay_status()}))

    elif message.type == "configure_generator":
        g_config = _generator_state["config"]
        g_config["signalType"] = message.signalType
        g_config["outputChannel"] = message.outputChannel
        g_config["loopback"] = message.loopback
        # No response needed, generator will pick it up

    elif message.type == "set_manual_delay":
        ms = getattr(message, "delay_ms", None)
        dsp.delay_set_manual(ms)
        await ws.send(json.dumps({
            "type": "delay_status",
            **dsp.delay_status()
        }))

async def run_capture(ws: WebSocketServerProtocol, config: CaptureConfig):
    loop = asyncio.get_running_loop()
    aq = asyncio.Queue(maxsize=32)  # async queue for inter-thread handoff
    in_stream, out_stream = None, None

    fs = int(config.sampleRate)
    block_size = 1024  # Must match InputStream blocksize for sync
    _generator_state["instance"] = dsp.SignalGenerator(fs, block_size)
    gen = _generator_state["instance"]

    def audio_callback(indata, frames, time_info, status):
        if status:
            print(f"Audio callback status: {status}")
        try:
            loop.call_soon_threadsafe(aq.put_nowait, indata.astype(np.float32, copy=True))
        except Exception:
            pass

    def output_callback(outdata, frames, time_info, status):
        if status:
            print(f"Audio output callback status: {status}")
        outdata.fill(0)
        g_config = _generator_state["config"]
        signal_type = g_config["signalType"]
        output_channel_idx = g_config["outputChannel"] - 1
        if signal_type != "off" and 0 <= output_channel_idx < outdata.shape[1]:
            chunk = gen.generate(signal_type, frames)
            outdata[:, output_channel_idx] = chunk

    try:
        # ---- buffer geometry (always 2 columns: [ref, meas]) ----
        nperseg = int(config.nfft)
        max_delay_ms = int(getattr(config, "maxDelayMs", 300))
        max_lag_samples = int(np.ceil(fs * max_delay_ms / 1000.0))
        buffer_len = nperseg + 2 * max_lag_samples + int(0.75 * nperseg)
        noverlap = int(0.75 * nperseg)
        hop_size = nperseg - noverlap

        device_info = sd.query_devices(int(config.deviceId))
        num_output_channels = device_info['max_output_channels']

        # Input channels to open from the device (capture enough to include meas/ref)
        # NOTE: sounddevice InputStream(channels=N) grabs the first N channels (1..N).
        input_chans_to_capture = max(config.refChan if config.refChan > 0 else config.measChan,
                                     config.measChan)

        # analysis buffer is ALWAYS 2 columns: [ref, meas]
        analysis_buffer = np.zeros((buffer_len, 2), dtype=np.float32)
        carry = 0
        last_send = 0.0
        target_fps = 20.0
        send_interval = 1.0 / target_fps

        in_stream = sd.InputStream(
            device=int(config.deviceId),
            samplerate=fs,
            blocksize=block_size,
            channels=input_chans_to_capture,
            dtype="float32",
            callback=audio_callback,
            latency="high",
        )

        out_stream = None
        if num_output_channels > 0:
            out_stream = sd.OutputStream(
                device=int(config.deviceId),
                samplerate=fs,
                blocksize=block_size,
                channels=num_output_channels,
                dtype="float32",
                callback=output_callback,
                latency="high",
            )

        in_stream.start()
        if out_stream:
            out_stream.start()

        while True:
            block = await aq.get()

            # drain queue
            blocks = [block]
            while not aq.empty():
                try:
                    blocks.append(aq.get_nowait())
                except asyncio.QueueEmpty:
                    break
            chunk_in = np.concatenate(blocks, axis=0)  # shape: (L, input_chans_to_capture)
            L = chunk_in.shape[0]

            # ---- re-read generator config each block ----
            g_config = _generator_state["config"]
            signal_type = g_config["signalType"]
            loopback_now = bool(g_config["loopback"]) and (config.refChan == 0)

            # ---- build 2-ch analysis chunk: [ref, meas] ----
            if loopback_now:
                # ref = internally generated signal; meas = chosen input channel
                ref = gen.generate(signal_type, L)
                meas = chunk_in[:, config.measChan - 1]
                chunk2 = np.column_stack((ref.astype(np.float32, copy=False), meas))
                # Use indices 1/2 for compute_metrics
                ref_idx, meas_idx = 1, 2
            else:
                # both come from input device channels
                ref = chunk_in[:, config.refChan - 1]
                meas = chunk_in[:, config.measChan - 1]
                chunk2 = np.column_stack((ref, meas))
                ref_idx, meas_idx = config.refChan, config.measChan  # only used to set 1/2 below

            # roll into analysis buffer (shape always = (buffer_len, 2))
            if L >= buffer_len:
                analysis_buffer[:] = chunk2[-buffer_len:]
                carry = hop_size
            else:
                analysis_buffer = np.roll(analysis_buffer, -L, axis=0)
                analysis_buffer[-L:, :] = chunk2
                carry += L

            if carry >= hop_size:
                # Make a shallow copy of config with ref/meas forced to 1/2 for analysis buffer
                try:
                    cfg = config.copy()  # pydantic BaseModel
                except Exception:
                    cfg = config
                setattr(cfg, "refChan", 1)
                setattr(cfg, "measChan", 2)

                tf_data, spl_data, _delay_ms = dsp.compute_metrics(analysis_buffer, cfg)

                now = time.monotonic()
                if now - last_send >= send_interval:
                    status = dsp.delay_status()
                    applied = status["applied_ms"]
                    frame = FrameMessage(
                        type="frame",
                        tf=tf_data,
                        spl=spl_data,
                        delay_ms=applied,
                        latency_ms=float(in_stream.latency)*1000.0 if hasattr(in_stream, "latency") else 0.0,
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
            if in_stream:
                in_stream.stop()
                in_stream.close()
            if out_stream:
                out_stream.stop()
                out_stream.close()
        except Exception as e:
            print(f"Error closing streams: {e}")
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
            capture_task = None
        connected_clients.remove(ws)

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

import asyncio
import json
import ssl
import pathlib
import time
import gc
from typing import Set
from collections import deque
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
        dsp.clear_dsp_caches()  # Ensure clean start
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
    num_channels = max(config.refChan, config.measChan)

    # Dynamic buffer pool with better management
    initial_pool_size = 16  # Increased from 8
    max_pool_size = 32  # Cap maximum pool growth
    pool = deque([np.empty((1024, num_channels), dtype=np.float32) for _ in range(initial_pool_size)])
    pool_miss_count = 0
    last_gc_time = time.monotonic()
    gc_interval = 30.0  # Run GC hints every 30 seconds

    def audio_callback(indata, frames, time_info, status):
        # called on driver thread; never block here
        nonlocal pool_miss_count
        if status:
            print(f"Audio callback status: {status}")
        
        buf = None
        try:
            buf = pool.popleft()
            # PortAudio reuses its buffers; copy into our reusable buffer
            np.copyto(buf, indata, casting='no')
        except IndexError:
            # pool exhausted - track misses
            pool_miss_count += 1
            # Create new buffer only if under max size
            if len(pool) < max_pool_size:
                buf = indata.copy() if indata.dtype == np.float32 else indata.astype(np.float32, copy=True)
            else:
                # Pool at max, drop this frame to prevent unbounded growth
                return

        try:
            loop.call_soon_threadsafe(aq.put_nowait, buf)
        except Exception:
            # queue full -> drop; always return buffer to pool
            if buf is not None:
                try:
                    pool.append(buf)
                except Exception:
                    pass

    stream = None
    try:
        fs = int(config.sampleRate)
        nperseg = int(config.nfft)
        max_delay_ms = int(getattr(config, "maxDelayMs", 300))
        max_lag_samples = int(np.ceil(fs * max_delay_ms / 1000.0))

        buffer_len = nperseg + 2*max_lag_samples + int(0.75*nperseg)
        noverlap = int(0.75 * nperseg)
        hop_size = nperseg - noverlap

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

            # Process blocks one at a time to avoid memory spikes
            # Limit how many we drain at once
            max_drain = 4
            blocks_to_process = [block]
            drain_count = 0
            while drain_count < max_drain:
                try:
                    blocks_to_process.append(aq.get_nowait())
                    drain_count += 1
                except asyncio.QueueEmpty:
                    break

            # roll each block into the analysis buffer without concatenating
            for b in blocks_to_process:
                Lb = b.shape[0]
                if Lb >= buffer_len:
                    analysis_buffer[...] = b[-buffer_len:, :]
                    carry = hop_size  # force analysis
                elif Lb > 0:
                    analysis_buffer[:-Lb, :] = analysis_buffer[Lb:, :]
                    analysis_buffer[-Lb:, :] = b
                    carry += Lb
                
                # Always return buffer to pool
                if len(pool) < max_pool_size:
                    try:
                        pool.append(b)
                    except Exception:
                        pass
                # If pool is full, let GC collect the buffer

            # Periodic GC hint and pool health check
            now = time.monotonic()
            if now - last_gc_time > gc_interval:
                gc.collect(0)  # Collect only generation 0 (fast)
                last_gc_time = now
                # Log pool health if we've had misses
                if pool_miss_count > 0:
                    print(f"Buffer pool health: {len(pool)} buffers, {pool_miss_count} misses since last check")
                    pool_miss_count = 0

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
                        delay_ms=applied,              # show applied, not local variable
                        latency_ms=float(stream.latency)*1000.0 if hasattr(stream, "latency") else 0.0,
                        ts=int(time.time() * 1000),
                        sampleRate=fs,
                        delay_mode=status["mode"],
                        applied_delay_ms=applied,
                    )
                    await ws.send(frame.model_dump_json())
                    last_send = now
                carry -= hop_size

            await asyncio.sleep(0)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        print(f"Error during capture: {e}")
        await send_error(ws, f"Capture failed: {e}")
    finally:
        # Clean up buffer pool and DSP caches
        pool.clear()
        dsp.clear_dsp_caches()

        # Force comprehensive garbage collection
        gc.collect()
        gc.collect(1)  # Also collect generation 1
        gc.collect(2)  # And generation 2

        try:
            if stream is not None:
                stream.stop()
                stream.close()
        except Exception:
            pass
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

    async with websockets.serve(
        handler, host, port, ssl=ssl_context, 
        max_size=8*1024*1024, max_queue=2, compression=None
    ):
        print(f"Secure WebSocket server started at wss://{host}:{port}")
        await asyncio.Future()

import asyncio
import json
import ssl
import pathlib
import time
from typing import Set
import websockets
from websockets.server import WebSocketServerProtocol
import numpy as np

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
            type="hello_ack", agent="capture-agent-py/0.1.0", originAllowed=True
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
        config = CaptureConfig(**message.dict())
        capture_task = asyncio.create_task(run_capture(ws, config))

    elif message.type == "stop":
        if capture_task and not capture_task.done():
            capture_task.cancel()
            capture_task = None

async def run_capture(ws: WebSocketServerProtocol, config: CaptureConfig):
    """The main audio capture and processing loop."""
    queue = asyncio.Queue(maxsize=100)  # Buffer up to 100 audio blocks

    def audio_callback(indata, frames, time, status):
        if status:
            print(f"Audio callback status: {status}")
        try:
            queue.put_nowait(indata.copy())
        except asyncio.QueueFull:
            print("Warning: Python processing queue is full; dropping audio.")

    try:
        # --- Set up analysis buffer ---
        nperseg = config.nfft
        noverlap = int(0.75 * nperseg)
        hop_size = nperseg - noverlap
        
        num_channels = max(config.refChan, config.measChan)
        analysis_buffer = np.zeros((nperseg, num_channels), dtype=np.float32)
        
        # --- Start stream ---
        stream = sd.InputStream(
            device=int(config.deviceId),
            samplerate=config.sampleRate,
            blocksize=hop_size,
            channels=num_channels,
            callback=audio_callback,
        )
        stream.start()
        print("Audio stream started.")

        # --- Processing loop ---
        while True:
            block = await queue.get()
            
            # Roll in new data
            analysis_buffer = np.roll(analysis_buffer, -block.shape[0], axis=0)
            analysis_buffer[-block.shape[0]:, :] = block

            # Process the full buffer
            tf_data, spl_data, delay_ms = dsp.compute_metrics(analysis_buffer, config)
            
            frame = FrameMessage(
                type="frame",
                tf=tf_data,
                spl=spl_data,
                delay_ms=delay_ms,
                latency_ms=stream.latency * 1000,
                ts=int(time.time() * 1000),
            )
            await ws.send(json.dumps(frame.dict()))
            await asyncio.sleep(0) # Yield control
                
    except asyncio.CancelledError:
        print("Capture stopped by client.")
    except Exception as e:
        print(f"Error during capture: {e}")
        await send_error(ws, f"Capture failed: {e}")
    finally:
        stopped_msg = StoppedMessage(type="stopped")
        await ws.send(json.dumps(stopped_msg.dict()))
        print("Capture finished.")

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
    cert_path = pathlib.Path(__file__).parent.parent / "localhost.pem"
    key_path = pathlib.Path(__file__).parent.parent / "localhost-key.pem"

    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(cert_path, key_path)

    async with websockets.serve(handler, host, port, ssl=ssl_context):
        print(f"Secure WebSocket server started at wss://{host}:{port}")
        await asyncio.Future()

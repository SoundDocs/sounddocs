import asyncio
import json
import time
from typing import Set
import websockets
from websockets.server import WebSocketServerProtocol

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
# A set of currently connected WebSocket clients
connected_clients: Set[WebSocketServerProtocol] = set()
# A task for the current audio capture loop, if any
capture_task = None

ALLOWED_ORIGINS = ["https://sounddocs.org", "http://localhost:5173"]

async def process_message(ws: WebSocketServerProtocol, message_data: dict):
    """Parses and routes incoming messages."""
    global capture_task

    try:
        # Use Pydantic for validation
        incoming = IncomingMessage(message=message_data)
        message = incoming.message
    except Exception as e:
        await send_error(ws, f"Invalid message format: {e}")
        return

    if message.type == "hello":
        # The 'hello' is implicitly handled by the origin check in the handler
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
        # The run_capture task will send the 'stopped' message on cancellation
    
    # 'calibrate' message is not handled in this MVP

async def run_capture(ws: WebSocketServerProtocol, config: CaptureConfig):
    """The main audio capture and processing loop."""
    try:
        with audio.Stream(config) as stream:
            for block in stream.blocks():
                tf_data, spl_data = dsp.compute_metrics(block, config)
                
                frame = FrameMessage(
                    type="frame",
                    tf=tf_data,
                    spl=spl_data,
                    latency_ms=stream.stream.latency * 1000,
                    ts=int(time.time() * 1000),
                )
                await ws.send(json.dumps(frame.dict()))
                # Yield control to the event loop briefly
                await asyncio.sleep(0)
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
    """Sends a formatted error message to the client."""
    error_msg = ErrorMessage(type="error", message=error_message)
    await ws.send(json.dumps(error_msg.dict()))

async def handler(ws: WebSocketServerProtocol, path: str):
    """Handles a new WebSocket connection."""
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
        # If this client was running a capture, stop it
        global capture_task
        if capture_task and not capture_task.done():
            capture_task.cancel()
            capture_task = None
        connected_clients.remove(ws)

async def start_server(host="127.0.0.1", port=9469):
    """Starts the WebSocket server."""
    async with websockets.serve(handler, host, port):
        print(f"WebSocket server started at ws://{host}:{port}")
        await asyncio.Future()  # Run forever

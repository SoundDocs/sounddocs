import asyncio
import json
import ssl
import pathlib
import time
import gc
from typing import Set, Optional
from collections import deque
import websockets
from websockets.exceptions import ConnectionClosed
from websockets import protocol
import numpy as np
import sounddevice as sd

from . import __version__
from . import audio
from . import dsp
from .signal_generator import SignalGenerator, SignalType, GeneratorConfig as GenConfig
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
    UpdateGeneratorMessage,
    SignalGeneratorConfig,
)

# --- State Management ---
# Fix 4: Use weakref.WeakSet for automatic cleanup of disconnected clients
import weakref
connected_clients: weakref.WeakSet = weakref.WeakSet()
capture_task = None
signal_generator = None
generator_config = None

ALLOWED_ORIGINS = ["https://sounddocs.org", "https://beta.sounddocs.org", "http://localhost:5173", "https://localhost:5173"]

async def process_message(ws, message_data: dict):
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
        # Config received, proceed with capture setup
        capture_task = asyncio.create_task(run_capture(ws, config))
        # Add error handler for the task to prevent "Task exception was never retrieved" warnings
        def task_done_callback(task):
            try:
                task.result()  # This will raise any exception that occurred
            except asyncio.CancelledError:
                pass  # Normal cancellation, ignore
            except Exception as e:
                print(f"Capture task error: {e}")
        capture_task.add_done_callback(task_done_callback)

    elif message.type == "stop":
        if capture_task and not capture_task.done():
            capture_task.cancel()
            # Wait for task to actually finish
            try:
                await capture_task
            except asyncio.CancelledError:
                pass  # Expected when task is cancelled
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

    elif message.type == "update_generator":
        global signal_generator, generator_config
        generator_config = message.config
        if generator_config.enabled:
            # Create or update signal generator
            gen_config = GenConfig(
                signal_type=SignalType(generator_config.signalType),
                sample_rate=48000,  # Will be updated when capture starts
                output_channels=generator_config.outputChannels,
                frequency=generator_config.frequency,
                start_freq=generator_config.startFreq,
                end_freq=generator_config.endFreq,
                sweep_duration=generator_config.sweepDuration,
                amplitude=generator_config.amplitude
            )
            signal_generator = SignalGenerator(gen_config)
        else:
            signal_generator = None
        await ws.send(json.dumps({"type": "generator_updated", "enabled": generator_config.enabled if generator_config else False}))

async def run_capture(ws, config: CaptureConfig):
    global signal_generator
    loop = asyncio.get_running_loop()
    aq: asyncio.Queue[np.ndarray] = asyncio.Queue(maxsize=128)  # Increased from 32 to prevent frame drops
    num_channels = max(config.refChan, config.measChan)

    # Initialize signal generator if configured
    use_generator = False
    if config.generator and config.generator.enabled:
        # Initialize signal generator with config
        gen_config = GenConfig(
            signal_type=SignalType(config.generator.signalType),
            sample_rate=config.sampleRate,
            output_channels=config.generator.outputChannels,
            frequency=config.generator.frequency,
            start_freq=config.generator.startFreq,
            end_freq=config.generator.endFreq,
            sweep_duration=config.generator.sweepDuration,
            amplitude=config.generator.amplitude
        )
        signal_generator = SignalGenerator(gen_config)
        use_generator = True
        pass  # Generator initialized
    else:
        pass  # Generator not enabled

    # Get device info to determine capabilities early
    device_info = sd.query_devices(int(config.deviceId))
    out_channels = device_info.get('max_output_channels', 0)
    in_channels = device_info.get('max_input_channels', 0)

    # Add dropped frame tracking
    dropped_frames = 0
    last_drop_log_time = time.monotonic()
    drop_log_interval = 30.0  # Log dropped frames every 30 seconds

    # Dynamic buffer pool with better management
    initial_pool_size = 16  # Increased from 8
    max_pool_size = 32  # Cap maximum pool growth
    blocksize = 4096 if (use_generator and out_channels > 0) else 1024  # Match stream blocksize
    pool = deque([np.empty((blocksize, num_channels), dtype=np.float32) for _ in range(initial_pool_size)])
    pool_miss_count = 0
    last_gc_time = time.monotonic()
    gc_interval = 30.0  # Run GC hints every 30 seconds

    # Buffer for generated signal if using loopback
    generated_signal_buffer = None

    def audio_callback(indata, frames, _time_info, status):
        # called on driver thread; never block here
        nonlocal pool_miss_count, dropped_frames, generated_signal_buffer
        if status:
            pass  # Audio callback status tracked

        buf = None
        # Fix 1: Ensure buffers are always returned to pool, even when frames are dropped
        buf = None
        try:
            try:
                buf = pool.popleft()
                # PortAudio reuses its buffers; copy into our reusable buffer
                np.copyto(buf, indata, casting='no')

                # If using loopback, inject generated signal to reference channel
                if config.useLoopback and generated_signal_buffer is not None and len(generated_signal_buffer) == frames:
                    # Replace reference channel with generated signal
                    ref_idx = config.refChan - 1  # Convert to 0-indexed
                    if ref_idx < buf.shape[1]:
                        buf[:, ref_idx] = generated_signal_buffer

            except IndexError:
                # pool exhausted - track misses
                pool_miss_count += 1
                # Create new buffer only if under max size
                if len(pool) < max_pool_size:
                    buf = indata.copy() if indata.dtype == np.float32 else indata.astype(np.float32, copy=True)

                    # Apply loopback even to newly created buffer
                    if config.useLoopback and generated_signal_buffer is not None and len(generated_signal_buffer) == frames:
                        ref_idx = config.refChan - 1
                        if ref_idx < buf.shape[1]:
                            buf[:, ref_idx] = generated_signal_buffer
                else:
                    # Pool at max, drop this frame to prevent unbounded growth
                    dropped_frames += 1
                    return

            # Try to queue the buffer
            loop.call_soon_threadsafe(aq.put_nowait, buf)
        except Exception:
            # queue full -> drop; always return buffer to pool
            dropped_frames += 1
            if buf is not None and len(pool) < max_pool_size:
                try:
                    pool.append(buf)
                except Exception:
                    pass  # If pool append fails, let GC handle it
        finally:
            # Critical fix: For buffers created during pool exhaustion that fail to queue,
            # ensure they're returned to pool if there's space
            pass  # Buffer management handled in except block

    # Full-duplex callback for both input and output (macOS compatible)
    duplex_callback_count = [0]
    output_underrun_count = [0]

    def duplex_callback(indata, outdata, frames, _time_info, status):
        nonlocal generated_signal_buffer, pool_miss_count, dropped_frames
        duplex_callback_count[0] += 1

        if duplex_callback_count[0] == 1:
            pass  # First callback initialized

        if status:
            status_str = str(status).lower()
            # Track output underruns specifically
            if "output underflow" in status_str:
                output_underrun_count[0] += 1
                if output_underrun_count[0] % 100 == 0:  # Log every 100th underrun
                    pass  # Underruns tracked
            # Only log serious issues, not underflows which are common at startup
            elif "underflow" not in status_str or duplex_callback_count[0] <= 2:
                pass  # Status tracked

        # Handle output (signal generation) first - CRITICAL for low latency
        generated_signal = None
        try:
            if use_generator and signal_generator:
                # Generate signal directly into output buffer for minimum latency
                generated_signal = signal_generator.generate_block(frames, outdata.shape[1])

                # Ensure signal is the right shape and type
                if generated_signal.shape[0] == frames and generated_signal.shape[1] == outdata.shape[1]:
                    # Use faster memory copy
                    outdata[:] = generated_signal
                else:
                    pass  # Shape mismatch handled
                    outdata.fill(0)

                if duplex_callback_count[0] == 1:
                    pass  # First signal generated

                # Store for loopback if needed
                if config.useLoopback:
                    # Extract just the generated signal (not multichannel) for loopback
                    # Use the first active output channel's signal
                    if config.generator.outputChannels:
                        ch_idx = config.generator.outputChannels[0] - 1 if config.generator.outputChannels else 0
                    else:
                        ch_idx = 0

                    if ch_idx < generated_signal.shape[1]:
                        generated_signal_buffer = generated_signal[:, ch_idx].copy()
                    else:
                        generated_signal_buffer = generated_signal[:, 0].copy()
            else:
                outdata.fill(0)
        except Exception as e:
            pass  # Output error handled
            outdata.fill(0)

        # Handle input (capture) processing
        buf = None
        try:
            try:
                buf = pool.popleft()
                # PortAudio reuses its buffers; copy into our reusable buffer
                np.copyto(buf, indata, casting='no')

                # If using loopback, inject generated signal to reference channel
                if config.useLoopback and generated_signal_buffer is not None and len(generated_signal_buffer) == frames:
                    # Replace reference channel with generated signal
                    ref_idx = config.refChan - 1  # Convert to 0-indexed
                    if ref_idx < buf.shape[1]:
                        buf[:, ref_idx] = generated_signal_buffer

            except IndexError:
                # pool exhausted - track misses
                pool_miss_count += 1
                # Create new buffer only if under max size
                if len(pool) < max_pool_size:
                    buf = indata.copy() if indata.dtype == np.float32 else indata.astype(np.float32, copy=True)

                    # Apply loopback even to newly created buffer
                    if config.useLoopback and generated_signal_buffer is not None and len(generated_signal_buffer) == frames:
                        ref_idx = config.refChan - 1
                        if ref_idx < buf.shape[1]:
                            buf[:, ref_idx] = generated_signal_buffer
                else:
                    # Pool at max, drop this frame to prevent unbounded growth
                    dropped_frames += 1
                    return

            # Try to queue the buffer
            loop.call_soon_threadsafe(aq.put_nowait, buf)
        except Exception:
            # queue full -> drop; always return buffer to pool
            dropped_frames += 1
            if buf is not None and len(pool) < max_pool_size:
                try:
                    pool.append(buf)
                except Exception:
                    pass  # If pool append fails, let GC handle it
        finally:
            # Critical fix: For buffers created during pool exhaustion that fail to queue,
            # ensure they're returned to pool if there's space
            pass  # Buffer management handled in except block

    stream = None
    try:
        fs = int(config.sampleRate)
        nperseg = int(config.nfft)
        max_delay_ms = int(getattr(config, "maxDelayMs", 2000))
        max_lag_samples = int(np.ceil(fs * max_delay_ms / 1000.0))

        buffer_len = nperseg + 2*max_lag_samples + int(0.75*nperseg)
        noverlap = int(0.75 * nperseg)
        hop_size = nperseg - noverlap

        analysis_buffer = np.zeros((buffer_len, num_channels), dtype=np.float32)
        carry = 0  # how many new samples since last analysis
        last_send = 0.0
        target_fps = 20.0  # UI update rate
        send_interval = 1.0 / target_fps

        # Device channels: input={in_channels}, output={out_channels}

        # Create stream based on whether we need output (signal generation)
        if use_generator and out_channels > 0:
            # Use full-duplex stream for macOS compatibility
            # Creating full-duplex stream
            try:
                # Increase blocksize and latency for stable playback
                blocksize = 4096  # Even larger block size for maximum stability
                stream = sd.Stream(
                    device=int(config.deviceId),
                    samplerate=config.sampleRate,
                    blocksize=blocksize,
                    channels=(num_channels, out_channels),  # (input_channels, output_channels)
                    dtype="float32",
                    callback=duplex_callback,
                    latency=("high", "high"),  # Higher latency for both input and output for stability
                    prime_output_buffers_using_stream_callback=True,  # Pre-fill output buffers
                    dither_off=True  # Disable dithering for cleaner signal
                )
                stream.start()
                pass  # Stream started
            except Exception as e:
                # Error starting full-duplex stream, falling back to input-only
                stream = sd.InputStream(
                    device=int(config.deviceId),
                    samplerate=config.sampleRate,
                    blocksize=1024,
                    channels=num_channels,
                    dtype="float32",
                    callback=audio_callback,
                    latency="high",
                )
                stream.start()
                use_generator = False  # Disable generator since we can't output
        else:
            # Input-only stream when no signal generation needed
            # Creating input-only stream
            stream = sd.InputStream(
                device=int(config.deviceId),
                samplerate=config.sampleRate,
                blocksize=1024,
                channels=num_channels,
                dtype="float32",
                callback=audio_callback,
                latency="high",
            )
            stream.start()
            if use_generator:
                pass  # Generator unavailable for input-only device

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
                    pass  # Pool health tracked
                    pool_miss_count = 0

            # Log dropped frames periodically
            if dropped_frames > 0 and (now - last_drop_log_time > drop_log_interval or dropped_frames % 1000 == 0):
                pass  # Frame drops tracked
                last_drop_log_time = now

            # run analysis only when we've advanced by one hop
            if carry >= hop_size:
                tf_data, spl_data, delay_ms = dsp.compute_metrics(analysis_buffer, config)
                now = time.monotonic()
                if now - last_send >= send_interval:
                    status = dsp.delay_status()
                    applied = status["applied_ms"]

                    # Check if WebSocket is still open before sending
                    if ws.state == protocol.State.OPEN:
                        try:
                            frame = FrameMessage(
                                type="frame",
                                tf=tf_data,
                                spl=spl_data,
                                delay_ms=applied,              # show applied, not local variable
                                latency_ms=float(stream.latency[0] if isinstance(stream.latency, tuple) else stream.latency)*1000.0 if hasattr(stream, "latency") else 0.0,
                                ts=int(time.time() * 1000),
                                sampleRate=fs,
                                delay_mode=status["mode"],
                                applied_delay_ms=applied,
                            )
                            await ws.send(frame.model_dump_json())
                            last_send = now
                        except websockets.exceptions.ConnectionClosed:
                            pass  # Connection closed during send
                            break  # Exit the capture loop
                    else:
                        # WebSocket not open, stopping
                        break
                carry -= hop_size

            await asyncio.sleep(0)
    except asyncio.CancelledError:
        pass  # Task cancelled
    except Exception as e:
        print(f"Error during capture: {e}")
        # Only send error if connection is still open
        if ws.state == protocol.State.OPEN:
            try:
                await send_error(ws, f"Capture failed: {e}")
            except websockets.exceptions.ConnectionClosed:
                pass  # Connection already closed, can't send error
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

        # Only send stopped message if connection is still open
        if ws.state == protocol.State.OPEN:
            try:
                await ws.send(json.dumps(StoppedMessage(type="stopped").dict()))
            except websockets.exceptions.ConnectionClosed:
                pass  # Connection closed, can't send stopped message

        # Log final dropped frames count if any
        if dropped_frames > 0:
            pass  # Capture completed

async def send_error(ws, error_message: str):
    error_msg = ErrorMessage(type="error", message=error_message)
    await ws.send(json.dumps(error_msg.dict()))

async def handler(ws):
    # In websockets v15+, the ws object is a ServerConnection
    # Headers are accessed via ws.request.headers
    origin = ws.request.headers.get("Origin") if hasattr(ws, 'request') else None

    # Allow connections without Origin header (local/direct connections)
    # or from allowed origins (browser connections)
    if origin is None:
        pass  # Local connection
    elif origin in ALLOWED_ORIGINS:
        pass  # Allowed origin
    else:
        print(f"Connection rejected from disallowed origin: {origin}")
        return
    # Fix 4: Proper WebSocket client cleanup with try-finally blocks
    try:
        connected_clients.add(ws)
        async for message in ws:
            try:
                message_data = json.loads(message)
                await process_message(ws, message_data)
            except json.JSONDecodeError:
                await send_error(ws, "Invalid JSON received.")
            except Exception as e:
                await send_error(ws, f"An unexpected error occurred: {e}")
    except websockets.exceptions.ConnectionClosed:
        pass  # Client disconnected
    except Exception as e:
        print(f"Unexpected error in WebSocket handler: {e}")
    finally:
        # Ensure cleanup happens in all error paths
        global capture_task
        if capture_task and not capture_task.done():
            capture_task.cancel()
            # Wait for task to actually finish
            try:
                await capture_task
            except asyncio.CancelledError:
                pass  # Expected when task is cancelled
            capture_task = None
        # WeakSet automatically removes disconnected clients, but we ensure removal
        try:
            connected_clients.discard(ws)  # Use discard to avoid KeyError
        except Exception:
            pass  # WeakSet may have already removed it

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

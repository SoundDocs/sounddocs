import sounddevice as sd
import numpy as np
from typing import List, Dict, Any, Generator
from .schema import Device, CaptureConfig

def list_devices() -> List[Device]:
    """Queries sounddevice for available audio devices."""
    devices = sd.query_devices()
    device_list = []
    for i, d in enumerate(devices):
        # We only care about input devices
        if d['max_input_channels'] > 0:
            device_list.append(
                Device(
                    id=str(i),
                    name=d['name'],
                    inputs=d['max_input_channels'],
                    outputs=d['max_output_channels'],
                )
            )
    return device_list

class Stream:
    """A wrapper around sounddevice.InputStream for audio capture."""

    def __init__(self, config: CaptureConfig):
        self.config = config
        self.stream = sd.InputStream(
            device=int(self.config.deviceId),
            samplerate=self.config.sampleRate,
            blocksize=self.config.blockSize,
            channels=max(self.config.refChan, self.config.measChan), # Ensure we capture up to the highest channel needed
        )

    def __enter__(self):
        self.stream.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stream.stop()
        self.stream.close()

    def blocks(self) -> Generator[np.ndarray, None, None]:
        """Yields blocks of audio data as numpy arrays."""
        while True:
            # The `read` method returns a tuple (data, overflowed_boolean)
            data, overflowed = self.stream.read(self.config.blockSize)
            if overflowed:
                pass  # Buffer overflow tracked
            yield data

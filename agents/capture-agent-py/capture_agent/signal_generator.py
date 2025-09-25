import numpy as np
try:
    import colorednoise as cn
    COLOREDNOISE_AVAILABLE = True
except ImportError:
    print("WARNING: colorednoise not installed. Colored noise generation will not work.")
    COLOREDNOISE_AVAILABLE = False
from typing import Optional, List
from dataclasses import dataclass
from enum import Enum

class SignalType(Enum):
    SINE = "sine"
    WHITE_NOISE = "white"
    PINK_NOISE = "pink"
    BROWN_NOISE = "brown"
    BLUE_NOISE = "blue"
    VIOLET_NOISE = "violet"
    SINE_SWEEP = "sine_sweep"

@dataclass
class GeneratorConfig:
    signal_type: SignalType
    sample_rate: int = 48000
    output_channels: List[int] = None  # Which channels to output to, None = all
    # Sine specific
    frequency: float = 1000.0  # Hz
    # Sine sweep specific
    start_freq: float = 20.0  # Hz
    end_freq: float = 20000.0  # Hz
    sweep_duration: float = 1.0  # seconds
    # Noise specific
    noise_color: Optional[float] = None  # Beta parameter for colorednoise
    # General
    amplitude: float = 0.5  # 0.0 to 1.0

class SignalGenerator:
    """Generates various test signals for audio measurement."""

    def __init__(self, config: GeneratorConfig):
        self.config = config
        self.sample_rate = config.sample_rate
        self.phase = 0.0  # For sine wave continuity
        self.sweep_phase = 0.0  # For sweep continuity
        self.sweep_start_time = 0.0
        self.current_time = 0.0
        self._initialized = False

        # Map noise types to beta values for colorednoise
        self.noise_beta_map = {
            SignalType.WHITE_NOISE: 0,     # 1/f^0
            SignalType.PINK_NOISE: 1,      # 1/f^1
            SignalType.BROWN_NOISE: 2,     # 1/f^2
            SignalType.BLUE_NOISE: -1,     # f^1
            SignalType.VIOLET_NOISE: -2,   # f^2
        }

        # Pre-generated noise table for smooth playback
        self._noise_table = None
        self._noise_len = 0
        self._noise_pos = 0
        self._xfade_len = 2048  # ~43 ms @48kHz for smooth crossfade
        self._xfade_in = None
        self._xfade_out = None

        # Pre-generate noise table if needed
        if self.config.signal_type in self.noise_beta_map:
            self._prepare_colored_noise_table(seconds=60)  # 60s loop, efficient at runtime

        # Pre-generate a small block to initialize the generator
        self._initialize_generator()

    def _prepare_colored_noise_table(self, seconds: int = 60):
        """Build a long colored-noise table once, not in the callback."""
        N = int(self.sample_rate * seconds)
        beta = self.noise_beta_map.get(self.config.signal_type, 0)

        if self.config.signal_type == SignalType.BROWN_NOISE:
            # Brown: leaky integrator to avoid drift
            white = np.random.randn(N).astype(np.float32)
            # Leaky integration (approx 1/f^2 without unbounded DC)
            alpha = 0.9995
            y = np.empty_like(white)
            acc = 0.0
            for i in range(N):
                acc = alpha * acc + (1.0 - alpha) * white[i]
                y[i] = acc
            x = y
        else:
            if COLOREDNOISE_AVAILABLE and beta != 0:
                x = cn.powerlaw_psd_gaussian(beta, N).astype(np.float32)
            else:
                x = np.random.randn(N).astype(np.float32)

        # Normalize once (no per-block pumping)
        rms = np.sqrt(np.mean(x**2))
        if rms > 1e-12:
            x = x / rms * 0.5  # Scale to reasonable level

        self._noise_table = x
        self._noise_len = N
        self._noise_pos = 0

        # Hann crossfade windows for seamless loop
        L = min(self._xfade_len, max(64, N // 64))
        w = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(2 * L) / (2 * L - 1))
        self._xfade_in = w[:L].astype(np.float32)
        self._xfade_out = w[L:].astype(np.float32)
        self._xfade_len = L

    def generate_block(self, block_size: int, num_channels: int) -> np.ndarray:
        """Generate a block of signal data.

        Args:
            block_size: Number of samples per channel
            num_channels: Total number of channels to generate

        Returns:
            numpy array of shape (block_size, num_channels)
        """
        # Create output array
        output = np.zeros((block_size, num_channels), dtype=np.float32)

        # Generate the signal
        if self.config.signal_type == SignalType.SINE:
            signal = self._generate_sine(block_size)
        elif self.config.signal_type == SignalType.SINE_SWEEP:
            signal = self._generate_sine_sweep(block_size)
        elif self.config.signal_type in self.noise_beta_map:
            signal = self._generate_colored_noise(block_size)
        else:
            pass  # Unknown signal type, returning zeros
            signal = np.zeros(block_size, dtype=np.float32)

        # Apply amplitude scaling
        signal *= self.config.amplitude

        # Debug: Check if signal has content
        if np.max(np.abs(signal)) == 0:
            pass  # Signal is silent but this may be intentional

        # Route to specified channels
        channels = self.config.output_channels
        if channels is None:
            # Output to all channels
            for ch in range(num_channels):
                output[:, ch] = signal
        else:
            # Output only to specified channels (1-indexed)
            for ch in channels:
                if 1 <= ch <= num_channels:
                    output[:, ch - 1] = signal

        return output

    def _generate_sine(self, block_size: int) -> np.ndarray:
        """Generate a sine wave signal."""
        t = np.arange(block_size) / self.sample_rate
        signal = np.sin(2 * np.pi * self.config.frequency * t + self.phase)

        # Update phase for continuity
        self.phase += 2 * np.pi * self.config.frequency * block_size / self.sample_rate
        self.phase = np.fmod(self.phase, 2 * np.pi)  # Keep phase within 0-2π

        return signal.astype(np.float32)

    def _generate_sine_sweep(self, block_size: int) -> np.ndarray:
        """Generate a logarithmic sine sweep signal."""
        t = np.arange(block_size) / self.sample_rate

        # Calculate sweep parameters
        duration = self.config.sweep_duration
        f0 = self.config.start_freq
        f1 = self.config.end_freq

        # Create time array relative to sweep start
        sweep_times = t + self.current_time

        # Reset sweep when we reach the end
        sweep_times = np.fmod(sweep_times, duration)

        # Logarithmic frequency sweep
        # f(t) = f0 * (f1/f0)^(t/T)
        k = np.log(f1 / f0) / duration
        frequencies = f0 * np.exp(k * sweep_times)

        # Generate swept sine using phase accumulation for continuity
        signal = np.zeros(block_size, dtype=np.float32)
        for i in range(block_size):
            signal[i] = np.sin(self.sweep_phase)
            # Update phase based on instantaneous frequency
            self.sweep_phase += 2 * np.pi * frequencies[i] / self.sample_rate

            # Reset phase when sweep restarts
            if i > 0 and sweep_times[i] < sweep_times[i-1]:
                self.sweep_phase = 0.0

        # Keep phase within bounds
        self.sweep_phase = np.fmod(self.sweep_phase, 2 * np.pi)

        # Update current time
        self.current_time += block_size / self.sample_rate
        if self.current_time >= duration:
            self.current_time = np.fmod(self.current_time, duration)

        return signal

    def _generate_colored_noise(self, block_size: int) -> np.ndarray:
        """Read from pre-generated noise table with seamless looping."""
        if self._noise_table is None or self._noise_len == 0:
            # Fallback (shouldn't happen): one-time build
            self._prepare_colored_noise_table(seconds=60)

        p = self._noise_pos
        N = self._noise_len
        L = self._xfade_len

        if p + block_size <= N:
            # Simple case: read straight from table
            out = self._noise_table[p:p + block_size].copy()
            p += block_size
            if p == N:
                p = 0  # Wrap to beginning
        else:
            # Wrap case: need to read from end and beginning
            n1 = N - p  # Samples from end
            n2 = block_size - n1  # Samples from beginning
            out = np.empty(block_size, dtype=np.float32)
            out[:n1] = self._noise_table[p:]
            out[n1:] = self._noise_table[:n2]

            # Apply crossfade at the loop seam for click-free playback
            if n1 >= L and n2 >= L:
                # Crossfade last L samples of part1 with first L samples of part2
                fade_out_portion = self._noise_table[N - L:N] * self._xfade_out
                fade_in_portion = self._noise_table[:L] * self._xfade_in
                # The crossfade happens at the boundary
                crossfaded = fade_out_portion + fade_in_portion
                # Replace the boundary region with crossfaded version
                if n1 >= L:
                    out[n1 - L:n1] = crossfaded
                else:
                    # Handle edge case where n1 < L
                    out[:n1] = crossfaded[-n1:]

            p = n2  # New position after wrap

        self._noise_pos = p

        # NO per-block normalization (that was causing pumping/choppiness)
        # The table is already normalized, just return it
        return out

    def _initialize_generator(self):
        """Pre-initialize the generator by generating a small block."""
        if not self._initialized:
            # Generate a small block to warm up the generator
            # This ensures the first real callback doesn't generate silence
            _ = self.generate_block(64, 2)
            self._initialized = True
            pass  # Generator initialized

    def reset(self):
        """Reset generator state (phases, etc)."""
        self.phase = 0.0
        self.sweep_phase = 0.0
        self.current_time = 0.0
        self.sweep_start_time = 0.0
        self._noise_pos = 0  # Reset noise table position
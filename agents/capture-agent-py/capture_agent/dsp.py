import numpy as np
from scipy.signal import welch
from .schema import CaptureConfig, TFData, SPLData

# Pre-compute windows to avoid recalculation
_windows = {}

def get_window(name, N):
    if (name, N) not in _windows:
        if name == 'hann':
            _windows[(name, N)] = np.hanning(N)
        else:
            # Default to hanning if an unsupported window is requested
            _windows[(name, N)] = np.hanning(N)
    return _windows[(name, N)]

def find_delay_ms(ref_chan: np.ndarray, meas_chan: np.ndarray, fs: int) -> float:
    """
    Estimates the time delay between two signals using GCC-PHAT.
    """
    n = len(ref_chan)
    # FFT of the signals
    ref_fft = np.fft.rfft(ref_chan, n=n)
    meas_fft = np.fft.rfft(meas_chan, n=n)
    
    # Cross-power spectrum
    R = ref_fft * np.conj(meas_fft)
    
    # PHAT weighting
    R_phat = R / (np.abs(R) + 1e-10) # Add epsilon to avoid division by zero
    
    # Inverse FFT to get cross-correlation
    cross_corr = np.fft.irfft(R_phat, n=n)
    
    # Find the peak of the cross-correlation
    delta_n = np.argmax(cross_corr)
    
    # Handle negative delays
    if delta_n > n // 2:
        delta_n -= n
        
    # Convert sample delay to milliseconds
    delay_ms = (delta_n / fs) * 1000
    
    return delay_ms

def compute_metrics(block: np.ndarray, config: CaptureConfig) -> tuple[TFData, SPLData, float]:
    """
    Computes Transfer Function, SPL, and Delay metrics from a block of audio data.
    """
    # Ensure block is 2D
    if block.ndim == 1:
        block = block[:, np.newaxis]

    # Extract reference and measurement channels
    # Note: channel indices are 1-based from the UI
    ref_chan = block[:, config.refChan - 1]
    meas_chan = block[:, config.measChan - 1]

    # --- Transfer Function Calculation ---
    window = get_window(config.window, config.nfft)
    
    # Cross-power spectral density
    freqs, Pxy = welch(
        ref_chan, meas_chan, fs=config.sampleRate, window=window, nperseg=config.nfft, scaling='density'
    )
    # Power spectral density of the reference channel
    _, Pxx = welch(
        x=ref_chan, fs=config.sampleRate, window=window, nperseg=config.nfft, scaling='density'
    )
    # Power spectral density of the measurement channel
    _, Pyy = welch(
        x=meas_chan, fs=config.sampleRate, window=window, nperseg=config.nfft, scaling='density'
    )

    # Avoid division by zero
    Pxx[Pxx == 0] = 1e-10
    Pyy[Pyy == 0] = 1e-10

    # Transfer function H = Pxy / Pxx
    H = Pxy / Pxx
    
    mag_db = 20 * np.log10(np.abs(H))
    phase_deg = np.angle(H, deg=True)

    # Coherence γ² = |Pxy|² / (Pxx * Pyy)
    coh = (np.abs(Pxy)**2) / (Pxx * Pyy)

    tf_data = TFData(
        freqs=freqs.tolist(),
        mag_db=mag_db.tolist(),
        phase_deg=phase_deg.tolist(),
        coh=coh.tolist(),
    )

    # --- SPL Calculation ---
    # Simple RMS-based SPL calculation (Z-weighted)
    # A proper implementation would involve A/C weighting filters
    rms = np.sqrt(np.mean(meas_chan**2))
    
    # Avoid log of zero
    if rms == 0:
        rms = 1e-10
        
    # This is dBFS. Calibration will be applied on the client-side for now.
    dbfs = 20 * np.log10(rms)

    # Placeholder for Leq. A true Leq requires integration over time.
    # For now, we'll treat each block's SPL as an instantaneous Leq.
    spl_data = SPLData(
        Leq=dbfs, # This is not a true Leq, but a block-by-block dBFS value
        LZ=dbfs,  # Z-weighting (linear) is equivalent to no weighting
    )

    # --- Delay Calculation ---
    # Use a smaller, centered portion of the block for delay calculation to save computation
    # and focus on the most relevant part of the impulse response.
    delay_window_size = min(len(ref_chan), 4096)
    start = (len(ref_chan) - delay_window_size) // 2
    end = start + delay_window_size
    delay_ms = find_delay_ms(ref_chan[start:end], meas_chan[start:end], config.sampleRate)

    return tf_data, spl_data, delay_ms

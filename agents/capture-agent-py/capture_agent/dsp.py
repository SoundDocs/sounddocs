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

def compute_metrics(block: np.ndarray, config: CaptureConfig) -> tuple[TFData, SPLData]:
    """
    Computes Transfer Function and SPL metrics from a block of audio data.
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
        ref_chan, fs=config.sampleRate, window=window, nperseg=config.nfft, scaling='density'
    )
    # Power spectral density of the measurement channel
    _, Pyy = welch(
        meas_chan, fs=config.sampleRate, window=window, nperseg=config.nfft, scaling='density'
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

    return tf_data, spl_data

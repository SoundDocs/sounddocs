import numpy as np
from scipy.signal import welch, csd, coherence
from .schema import CaptureConfig, TFData, SPLData
from collections import deque

# Pre-compute windows to avoid recalculation
_windows = {}

def reset_dsp_state():
    """Resets all global DSP state."""
    pass

def get_window(name, N):
    if (name, N) not in _windows:
        if name == 'hann':
            _windows[(name, N)] = np.hanning(N)
        elif name == 'kaiser':
            _windows[(name, N)] = np.kaiser(N, beta=14)
        elif name == 'blackman':
            _windows[(name, N)] = np.blackman(N)
        else:
            _windows[(name, N)] = np.hanning(N)
    return _windows[(name, N)]

def find_delay_ms(ref_chan: np.ndarray, meas_chan: np.ndarray, fs: int) -> float:
    n = len(ref_chan)
    ref_fft = np.fft.rfft(ref_chan, n=n)
    meas_fft = np.fft.rfft(meas_chan, n=n)
    R = np.conj(ref_fft) * meas_fft
    R_phat = R / (np.abs(R) + 1e-10)
    cross_corr = np.fft.irfft(R_phat, n=n)
    delta_n = np.argmax(cross_corr)

    if delta_n > 0 and delta_n < n - 1:
        y1, y2, y3 = cross_corr[delta_n - 1], cross_corr[delta_n], cross_corr[delta_n + 1]
        offset = (y1 - y3) / (2 * (y1 - 2 * y2 + y3))
        delta_n_fine = delta_n + offset
    else:
        delta_n_fine = float(delta_n)

    if delta_n_fine > n / 2:
        delta_n_fine -= n
        
    return (delta_n_fine / fs) * 1000

def compute_metrics(block: np.ndarray, config: CaptureConfig) -> tuple[TFData, SPLData, float]:
    if block.ndim == 1:
        block = block[:, np.newaxis]

    x = block[:, config.refChan - 1].astype(np.float64, copy=False)   # ref/input
    y = block[:, config.measChan - 1].astype(np.float64, copy=False)  # meas/output

    fs = float(config.sampleRate)
    nperseg = int(min(config.nfft, x.size, y.size))
    nperseg = max(256, nperseg)
    noverlap = int(0.75 * nperseg)
    if noverlap >= nperseg:
        noverlap = nperseg // 2
    window = get_window("hann", nperseg)

    # --- Find delay on a stable centered window (as you already do) ---
    delay_window_size = min(x.size, 32768)
    start = (x.size - delay_window_size) // 2
    end = start + delay_window_size
    delay_ms = find_delay_ms(x[start:end], y[start:end], config.sampleRate)
    tau = delay_ms / 1000.0  # seconds (meas lags ref by +tau)

    # --- Spectra (note the order: csd(y, x)) ---
    freqs, Pyx = csd(
        y, x, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )
    _, Pxx = welch(
        x, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )
    _, Pyy = welch(
        y, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )

    eps = 1e-20
    Pxx = np.maximum(Pxx, eps)
    Pyy = np.maximum(Pyy, eps)

    # --- Apply delay to the cross-spectrum (phase de-rotation) ---
    # If meas (y) is late by +tau, remove e^{-jωτ} by multiplying e^{+jωτ}
    rot = np.exp(1j * 2 * np.pi * freqs * tau)
    Pyx_aligned = Pyx * rot

    # Transfer function and coherence
    H = Pyx_aligned / Pxx
    mag_db = 20.0 * np.log10(np.abs(H) + eps)
    phase_deg = np.angle(H, deg=True)

    # Coherence (rotation doesn’t change magnitude, so either Pyx or Pyx_aligned is fine)
    coh = (np.abs(Pyx) ** 2) / (Pxx * Pyy + eps)
    coh = np.clip(coh, 0.0, 1.0)

    tf_data = TFData(
        freqs=freqs.tolist(),
        mag_db=mag_db.tolist(),
        phase_deg=phase_deg.tolist(),
        coh=coh.tolist(),
    )

    rms = float(np.sqrt(np.mean(y**2))) or eps
    dbfs = 20.0 * np.log10(rms)
    spl_data = SPLData(Leq=dbfs, LZ=dbfs)

    return tf_data, spl_data, delay_ms

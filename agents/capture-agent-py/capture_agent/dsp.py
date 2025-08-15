import numpy as np
from scipy.signal import welch, csd
from .schema import CaptureConfig, TFData, SPLData

_windows = {}

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

def find_delay_ms(ref_chan: np.ndarray, meas_chan: np.ndarray, fs: int, max_ms: float | None = None) -> float:
    """
    Linear (zero-padded) GCC-PHAT delay. Positive => meas lags ref by +delay.
    """
    x = ref_chan.astype(np.float64, copy=False)
    y = meas_chan.astype(np.float64, copy=False)
    n = min(len(x), len(y))
    if n < 2:
        return 0.0

    # FFT size >= 2n-1 for linear correlation
    N = 1 << int(np.ceil(np.log2(2*n - 1)))

    X = np.fft.rfft(x, n=N)
    Y = np.fft.rfft(y, n=N)
    R = np.conj(X) * Y
    R /= (np.abs(R) + 1e-15)  # PHAT

    cc = np.fft.irfft(R, n=N)

    # keep only the valid linear part (length 2n-1), map to lags [-(n-1) .. +(n-1)]
    cc_lin = np.concatenate((cc[-(n-1):], cc[:n]))
    lags = np.arange(-(n-1), n, dtype=np.int64)

    # optional search limit
    if max_ms is not None:
        max_lag = int(round(max_ms * fs / 1000.0))
        half = min(max_lag, n-1)
        center = n-1
        sl = slice(center - half, center + half + 1)
        cc_seg = cc_lin[sl]
        lags_seg = lags[sl]
    else:
        cc_seg = cc_lin
        lags_seg = lags

    k = int(np.argmax(cc_seg))
    # sub-sample parabolic refinement
    if 0 < k < len(cc_seg) - 1:
        y0, y1, y2 = cc_seg[k-1], cc_seg[k], cc_seg[k+1]
        denom = (y0 - 2*y1 + y2)
        d = 0.0 if abs(denom) < 1e-20 else 0.5 * (y0 - y2) / denom
    else:
        d = 0.0

    lag_samples = lags_seg[k] + d
    return (lag_samples / fs) * 1000.0

def _align_by_integer_delay(x, y, delay_ms, fs):
    """Advance y by the integer number of samples implied by +delay (y lags)."""
    D = delay_ms * fs / 1000.0
    D_int = int(np.round(D))  # keep the fractional remainder small
    frac = D - D_int          # in samples, range about [-0.5, 0.5)

    if D_int > 0:
        # y is late -> advance y
        y2 = y[D_int:]
        x2 = x[:len(y2)]
    elif D_int < 0:
        # y is early -> delay y (or advance x)
        x2 = x[-D_int:]
        y2 = y[:len(x2)]
    else:
        x2, y2 = x, y

    # guard: if alignment trimmed everything
    L = min(len(x2), len(y2))
    if L <= 0:
        return x[:0], y[:0], 0.0  # empty, no fractional rot
    return x2[:L], y2[:L], frac   # return small fractional remainder

def compute_metrics(block: np.ndarray, config: CaptureConfig) -> tuple[TFData, SPLData, float]:
    if block.ndim == 1:
        block = block[:, np.newaxis]

    x = block[:, config.refChan - 1].astype(np.float64, copy=False)   # ref/input
    y = block[:, config.measChan - 1].astype(np.float64, copy=False)  # meas/output
    fs = float(config.sampleRate)

    # --- Find delay on a stable centered window ---
    MAX_DELAY_MS = getattr(config, "maxDelayMs", 300.0)
    delay_ms = find_delay_ms(x, y, config.sampleRate, max_ms=MAX_DELAY_MS)
    tau = delay_ms / 1000.0  # seconds (meas lags ref by +tau)

    # --- ALIGN BY INTEGER DELAY BEFORE PSD/CSD ---
    x_al, y_al, frac_samples = _align_by_integer_delay(x, y, delay_ms, fs)

    # choose stable Welch params; accumulate upstream so nperseg == config.nfft
    nperseg = int(min(config.nfft, x_al.size, y_al.size))
    nperseg = max(256, nperseg)
    noverlap = int(0.75 * nperseg)
    if noverlap >= nperseg:
        noverlap = nperseg // 2
    window = get_window("hann", nperseg)

    # Spectral densities on ALIGNED signals
    freqs, Pyx = csd(
        y_al, x_al, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )
    _, Pxx = welch(
        x_al, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )
    _, Pyy = welch(
        y_al, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )

    eps = 1e-20
    Pxx = np.maximum(Pxx, eps)
    Pyy = np.maximum(Pyy, eps)

    # --- Optional: remove tiny fractional remainder with frequency rotation ---
    if abs(frac_samples) > 1e-6:
        tau_frac = frac_samples / fs  # seconds
        Pyx *= np.exp(1j * 2 * np.pi * freqs * tau_frac)

    # TF & coherence
    H = Pyx / Pxx
    mag_db   = 20.0 * np.log10(np.abs(H) + eps)
    phase_deg = np.angle(H, deg=True)
    coh = (np.abs(Pyx) ** 2) / (Pxx * Pyy + eps)
    coh = np.clip(coh, 0.0, 1.0)

    tf_data = TFData(
        freqs=freqs.tolist(),
        mag_db=mag_db.tolist(),
        phase_deg=phase_deg.tolist(),
        coh=coh.tolist(),
    )

    # SPL on measured channel (aligned y has same power as original)
    rms = float(np.sqrt(np.mean(y_al**2))) or eps
    dbfs = 20.0 * np.log10(rms)
    spl_data = SPLData(Leq=dbfs, LZ=dbfs)

    return tf_data, spl_data, delay_ms

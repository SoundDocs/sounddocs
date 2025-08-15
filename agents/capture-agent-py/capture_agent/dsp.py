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

def _align_by_integer_delay_pad(x: np.ndarray, y: np.ndarray, delay_ms: float, fs: float):
    """
    Shift y by integer samples with zero-padding so x,y keep the SAME length.
    Positive delay => y lags => shift y LEFT by D_int.
    Returns: y_shifted, frac_samples, D_int, usable_len
    """
    D = delay_ms * fs / 1000.0
    D_int = int(np.round(D))          # integer samples
    frac = D - D_int                  # fractional remainder (in samples)

    y_shift = np.zeros_like(y)
    N = y.size

    if D_int > 0:
        # y late: advance y (shift left)
        if D_int < N:
            y_shift[:N - D_int] = y[D_int:]
        # else: all zeros; no overlap
    elif D_int < 0:
        # y early: delay y (shift right)
        s = -D_int
        if s < N:
            y_shift[s:] = y[:N - s]
        # else: all zeros; no overlap
    else:
        y_shift[:] = y

    usable_len = max(0, N - abs(D_int))
    return y_shift, frac, D_int, usable_len

MIN_SAMPLES_FOR_ANALYSIS = 64  # bump if you want smoother plots

def _choose_nperseg(target_n: int, usable_len: int) -> int:
    if usable_len >= target_n:
        return target_n
    # largest power of two ≤ usable_len
    p = int(np.floor(np.log2(max(usable_len, 1))))
    n = 1 << p
    return max(32, n)  # absolute floor

def compute_metrics(block: np.ndarray, config: CaptureConfig) -> tuple[TFData, SPLData, float]:
    if block.ndim == 1:
        block = block[:, np.newaxis]

    x = block[:, config.refChan - 1].astype(np.float64, copy=False)
    y = block[:, config.measChan - 1].astype(np.float64, copy=False)
    fs = float(config.sampleRate)

    # Delay (linear GCC-PHAT you already implemented)
    MAX_DELAY_MS = getattr(config, "maxDelayMs", 300.0)
    delay_ms = find_delay_ms(x, y, config.sampleRate, max_ms=MAX_DELAY_MS)

    # Integer align with zero-padding (preserve length) + fractional remainder
    y_al, frac_samples, D_int, usable_len = _align_by_integer_delay_pad(x, y, delay_ms, fs)

    # Bail out early if not enough overlap to analyze
    if usable_len < MIN_SAMPLES_FOR_ANALYSIS:
        tf_data = TFData(freqs=[], mag_db=[], phase_deg=[], coh=[])
        rms = float(np.sqrt(np.mean(y**2))) if y.size else 1e-20
        dbfs = 20.0 * np.log10(max(rms, 1e-20))
        spl_data = SPLData(Leq=dbfs, LZ=dbfs)
        return tf_data, spl_data, delay_ms

    # nperseg / noverlap from usable overlap
    target_n = int(config.nfft)
    nperseg = _choose_nperseg(target_n, usable_len)
    noverlap = min(int(0.75 * nperseg), nperseg - 1)
    window = get_window("hann", nperseg)

    # Spectra (x unchanged length; y_al is zero-padded shift)
    freqs, Pyx = csd(
        y_al, x, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )
    _, Pxx = welch(
        x, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )
    _, Pyy = welch(
        y_al, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )

    eps = 1e-20
    Pxx = np.maximum(Pxx, eps)
    Pyy = np.maximum(Pyy, eps)

    # Remove tiny fractional remainder with freq rotation
    if abs(frac_samples) > 1e-6:
        tau_frac = frac_samples / fs
        Pyx *= np.exp(1j * 2 * np.pi * freqs * tau_frac)

    H = Pyx / Pxx
    mag_db = 20.0 * np.log10(np.abs(H) + eps)
    phase_deg = np.angle(H, deg=True)
    coh = (np.abs(Pyx) ** 2) / (Pxx * Pyy + eps)
    coh = np.clip(coh, 0.0, 1.0)

    tf_data = TFData(
        freqs=freqs.tolist(),
        mag_db=mag_db.tolist(),
        phase_deg=phase_deg.tolist(),
        coh=coh.tolist(),
    )

    rms = float(np.sqrt(np.mean(y_al**2))) or eps
    dbfs = 20.0 * np.log10(rms)
    spl_data = SPLData(Leq=dbfs, LZ=dbfs)

    return tf_data, spl_data, delay_ms

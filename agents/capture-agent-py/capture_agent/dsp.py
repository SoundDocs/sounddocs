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

# ---- Delay state ----
_delay = {
    "mode": "auto",         # "auto" | "frozen" | "manual"
    "ema_ms": None,         # smoothed auto delay
    "frozen_ms": 0.0,       # value latched when freezing
    "manual_ms": 0.0,       # operator-set delay
    "alpha": 0.9,           # EMA factor
    "last_raw_ms": None,    # optional: for UI visibility
}

def reset_dsp_state():
    _delay.update({"mode":"auto","ema_ms":None,"frozen_ms":0.0,"manual_ms":0.0,"last_raw_ms":None})

def delay_freeze(enable: bool):
    if enable:
        # If we have an EMA use it, otherwise freeze at zero until first valid frame
        if _delay["ema_ms"] is not None:
            _delay["frozen_ms"] = float(_delay["ema_ms"])
        _delay["mode"] = "frozen"
    else:
        _delay["mode"] = "auto"

def delay_set_manual(ms: float | None):
    if ms is None:
        _delay["mode"] = "auto"
    else:
        _delay["manual_ms"] = float(ms)
        _delay["mode"] = "manual"

def _delay_pick_applied(x: np.ndarray, y: np.ndarray, fs: float, max_ms: float) -> tuple[float, float | None]:
    """
    Returns (applied_delay_ms, raw_measured_ms_or_None).
    Skips GCC-PHAT when frozen/manual to save CPU and to keep the value fixed.
    """
    mode = _delay["mode"]
    if mode == "auto":
        raw = find_delay_ms(x, y, fs, max_ms=max_ms)
        _delay["last_raw_ms"] = raw
        ema = _delay["ema_ms"]
        alpha = _delay["alpha"]
        ema = raw if ema is None else alpha*ema + (1.0-alpha)*raw
        _delay["ema_ms"] = ema
        return float(ema), float(raw)
    elif mode == "frozen":
        raw = None  # not updated
        # If we somehow froze before any EMA existed, fall back to 0.0
        applied = _delay["frozen_ms"] if _delay["ema_ms"] is not None else 0.0
        return float(applied), raw
    else:  # "manual"
        raw = None
        return float(_delay["manual_ms"]), raw

def delay_status() -> dict:
    return {
        "mode": _delay["mode"],
        "applied_ms": (
            _delay["ema_ms"] if _delay["mode"]=="auto" else
            _delay["frozen_ms"] if _delay["mode"]=="frozen" else
            _delay["manual_ms"]
        ) or 0.0,
        "raw_ms": _delay["last_raw_ms"],
    }

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

def _choose_nperseg_with_min_segments(usable_len: int, target_n: int, min_segments: int = 4):
    # Start at target; drop by /2 until we can fit >= min_segments
    n = min(target_n, usable_len)
    while n >= 32:
        no = max(1, int(0.75 * n))
        hop = n - no
        segs = 1 + (usable_len - n) // hop if usable_len >= n else 0
        if segs >= min_segments:
            return n, min(no, n-1)
        n //= 2
    return 32, 24  # very small fallback

def compute_metrics(block: np.ndarray, config: CaptureConfig) -> tuple[TFData, SPLData, float]:
    if block.ndim == 1:
        block = block[:, np.newaxis]

    x = block[:, config.refChan - 1].astype(np.float64, copy=False)
    y = block[:, config.measChan - 1].astype(np.float64, copy=False)
    fs = float(config.sampleRate)

    # Delay (linear GCC-PHAT you already implemented)
    MAX_DELAY_MS = getattr(config, "maxDelayMs", 300.0)
    delay_ms, _ = _delay_pick_applied(x, y, fs, max_ms=MAX_DELAY_MS)

    # Integer align with zero-padding (preserve length) + fractional remainder
    y_al, frac_samples, D_int, _ = _align_by_integer_delay_pad(x, y, delay_ms, fs)

    # derive the fully overlapped indices (exclude zeros)
    N = x.size
    if D_int >= 0:
        start = 0
        end   = N - D_int
    else:
        start = -D_int
        end   = N

    x_eff = x[start:end]
    y_eff = y_al[start:end]
    usable_len = max(0, end - start)

    # Bail out early if not enough overlap to analyze
    if usable_len < MIN_SAMPLES_FOR_ANALYSIS:
        tf_data = TFData(freqs=[], mag_db=[], phase_deg=[], coh=[])
        rms = float(np.sqrt(np.mean(y**2))) if y.size else 1e-20
        dbfs = 20.0 * np.log10(max(rms, 1e-20))
        spl_data = SPLData(Leq=dbfs, LZ=dbfs)
        return tf_data, spl_data, delay_ms

    # nperseg / noverlap from usable overlap
    target_n = int(config.nfft)
    nperseg, noverlap = _choose_nperseg_with_min_segments(usable_len, target_n, min_segments=4)
    window = get_window("hann", nperseg)

    # Spectra on effective (non-zero-padded) signal slices
    freqs, Pyx = csd(
        y_eff, x_eff, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )
    _, Pxx = welch(
        x_eff, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
        detrend='constant', return_onesided=True, scaling='density'
    )
    _, Pyy = welch(
        y_eff, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
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
    ir = np.fft.irfft(H, n=nperseg)

    tf_data = TFData(
        freqs=freqs.tolist(),
        mag_db=mag_db.tolist(),
        phase_deg=phase_deg.tolist(),
        coh=coh.tolist(),
        ir=ir.tolist(),
    )

    rms = float(np.sqrt(np.mean(y_eff**2))) or eps
    dbfs = 20.0 * np.log10(rms)
    spl_data = SPLData(Leq=dbfs, LZ=dbfs)

    return tf_data, spl_data, delay_ms

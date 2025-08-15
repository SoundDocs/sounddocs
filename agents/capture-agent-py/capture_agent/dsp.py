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

def find_delay_ms(ref_chan: np.ndarray, meas_chan: np.ndarray, fs: int) -> float:
    n = len(ref_chan)
    ref_fft = np.fft.rfft(ref_chan, n=n)
    meas_fft = np.fft.rfft(meas_chan, n=n)
    R = np.conj(ref_fft) * meas_fft
    R_phat = R / (np.abs(R) + 1e-10)
    cross_corr = np.fft.irfft(R_phat, n=n)
    delta_n = np.argmax(cross_corr)

    if 0 < delta_n < n - 1:
        y1, y2, y3 = cross_corr[delta_n - 1], cross_corr[delta_n], cross_corr[delta_n + 1]
        offset = (y1 - y3) / (2 * (y1 - 2*y2 + y3))
        delta_n_fine = delta_n + offset
    else:
        delta_n_fine = float(delta_n)

    if delta_n_fine > n / 2:
        delta_n_fine -= n
    return (delta_n_fine / fs) * 1000.0  # +ms means meas (y) lags ref (x)

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
    delay_window_size = min(x.size, 32768)
    start = (x.size - delay_window_size) // 2
    end = start + delay_window_size
    delay_ms = find_delay_ms(x[start:end], y[start:end], config.sampleRate)
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

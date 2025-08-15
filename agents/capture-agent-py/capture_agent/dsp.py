import numpy as np
from scipy.signal import welch, csd, butter, lfilter
from .schema import CaptureConfig, TFData, SPLData

# Pre-compute windows to avoid recalculation
_windows = {}
_filters = {}

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

def get_lpf(freq, fs):
    key = (freq, fs)
    if key not in _filters:
        nyquist = 0.5 * fs
        normal_cutoff = freq / nyquist
        b, a = butter(2, normal_cutoff, btype='low', analog=False)
        _filters[key] = (b, a)
    return _filters[key]

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
    ref_chan = block[:, config.refChan - 1]
    meas_chan = block[:, config.measChan - 1]
    nperseg = int(min(config.nfft, ref_chan.size, meas_chan.size))
    window = get_window(config.window, nperseg)

    freqs, Pxy = csd(
        ref_chan, meas_chan, fs=float(config.sampleRate), window=window, nperseg=nperseg, scaling='density'
    )
    _, Pxx = welch(
        ref_chan, fs=float(config.sampleRate), window=window, nperseg=nperseg, scaling='density'
    )
    _, Pyy = welch(
        meas_chan, fs=float(config.sampleRate), window=window, nperseg=nperseg, scaling='density'
    )

    Pxx[Pxx == 0] = 1e-10
    Pyy[Pyy == 0] = 1e-10

    H = Pxy / Pxx
    mag_db = 20 * np.log10(np.abs(H))
    phase_deg = np.angle(H, deg=True)
    coh = (np.abs(Pxy)**2) / (Pxx * Pyy)

    if config.lpfMode == 'lpf' and config.lpfFreq > 0:
        b, a = get_lpf(config.lpfFreq, config.sampleRate)
        mag_db = lfilter(b, a, mag_db)
        phase_deg = lfilter(b, a, np.unwrap(np.deg2rad(phase_deg)))
        phase_deg = np.rad2deg(phase_deg)
        coh = lfilter(b, a, coh)

    tf_data = TFData(
        freqs=freqs.tolist(),
        mag_db=mag_db.tolist(),
        phase_deg=phase_deg.tolist(),
        coh=coh.tolist(),
    )

    rms = float(np.sqrt(np.mean(meas_chan**2))) or 1e-10
    dbfs = 20 * np.log10(rms)
    spl_data = SPLData(Leq=dbfs, LZ=dbfs)

    delay_window_size = min(ref_chan.size, 4096)
    start = (ref_chan.size - delay_window_size) // 2
    end = start + delay_window_size
    delay_ms = find_delay_ms(ref_chan[start:end], meas_chan[start:end], config.sampleRate)

    return tf_data, spl_data, delay_ms

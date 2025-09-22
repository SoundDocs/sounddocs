import numpy as np
from scipy.signal import welch, csd
try:
    import pyfftw
    import pyfftw.interfaces.numpy_fft as fftw
    _PYFFTW_AVAILABLE = True
except ImportError:
    _PYFFTW_AVAILABLE = False
    import scipy.fft as fftw
from collections import OrderedDict
from functools import wraps
import weakref
import gc
import time
try:
    import psutil
    import os
    _MEMORY_MONITORING_AVAILABLE = True
except ImportError:
    _MEMORY_MONITORING_AVAILABLE = False
from .schema import CaptureConfig, TFData, SPLData

_windows = OrderedDict()
_MAX_WINDOWS = 16  # Reduced cap for better memory control

def get_window(name, N):
    key = (name, int(N))
    w = _windows.get(key)
    if w is None:
        if name == 'hann':
            w = np.hanning(N)
        elif name == 'kaiser':
            w = np.kaiser(N, beta=14)
        elif name == 'blackman':
            w = np.blackman(N)
        else:
            w = np.hanning(N)
        _windows[key] = w
        _windows.move_to_end(key, last=True)
        if len(_windows) > _MAX_WINDOWS:
            _windows.popitem(last=False)  # evict least-recently-used
    else:
        _windows.move_to_end(key, last=True)
    return w

# Add cache clearing function
def log_memory_usage():
    """Log current memory usage if psutil is available."""
    if not _MEMORY_MONITORING_AVAILABLE:
        return

    try:
        process = psutil.Process(os.getpid())
        memory_info = process.memory_info()
        memory_mb = memory_info.rss / 1024 / 1024
        print(f"DSP Memory: {memory_mb:.1f} MB, Work arrays: {len(_work_arrays)}")
    except Exception as e:
        print(f"Memory monitoring error: {e}")

def clear_dsp_caches():
    """Clear DSP caches to free memory.

    Enhanced with proper cleanup of all memory-tracking structures.
    """
    global _windows, _work_arrays, _work_array_access_times, _work_array_memory_sizes, _fft_plans
    _windows.clear()
    _hann_cached.cache_clear()
    _taper_for_M.cache_clear()
    # Clear work arrays and memory tracking
    _work_arrays.clear()
    _work_array_access_times.clear()
    _work_array_memory_sizes.clear()  # Fix 2: Clear memory size tracking
    # Clear FFT plans with proper cleanup
    for plan_data in _fft_plans.values():
        if plan_data:
            plan, in_arr, out_arr, _ = plan_data
            del plan
            del in_arr
            del out_arr
    _fft_plans.clear()
    gc.collect()
    log_memory_usage()

# Fix 2: Memory-aware cache for DSP work arrays
_work_arrays = {}
_work_array_access_times = {}
_work_array_memory_sizes = {}  # Track memory usage per array
MAX_WORK_ARRAYS = 16
MAX_WORK_ARRAY_MEMORY = 100 * 1024 * 1024  # 100MB limit for work array cache
_cleanup_counter = 0
CLEANUP_INTERVAL = 100  # Every 100 frames

# Fix 3: FFT plan lifecycle management with memory threshold
_fft_plans = {}
MAX_FFT_PLANS = 8
MAX_FFT_PLAN_MEMORY = 50 * 1024 * 1024  # 50MB limit for FFT plans
_fft_plan_cleanup_counter = 0
FFT_CLEANUP_INTERVAL = 50  # Cleanup FFT plans every 50 calls

def get_work_array(key: str, shape: tuple, dtype=np.float64) -> np.ndarray:
    """Get a reusable work array with memory-aware limits and tracking.

    Fix 2: Implements memory-aware caching that tracks array.nbytes and evicts
    based on total memory usage, prioritizing largest arrays for eviction.
    """
    global _work_arrays, _work_array_access_times, _work_array_memory_sizes

    # Include dtype in cache key to prevent type mismatches
    cache_key = (key, shape, dtype)

    # Calculate memory size for new array
    array_nbytes = np.prod(shape) * np.dtype(dtype).itemsize

    # Check if we need this array and if it would exceed memory limit
    if cache_key not in _work_arrays:
        current_memory = sum(_work_array_memory_sizes.values())

        # Evict arrays if we exceed memory limit
        while current_memory + array_nbytes > MAX_WORK_ARRAY_MEMORY and _work_arrays:
            # Sort by memory size (largest first) and then by access time
            evict_candidates = sorted(
                _work_array_memory_sizes.keys(),
                key=lambda k: (-_work_array_memory_sizes[k], _work_array_access_times.get(k, 0))
            )

            # Evict largest/oldest arrays until we have space
            for evict_key in evict_candidates:
                if evict_key != cache_key:  # Don't evict what we're trying to create
                    evicted_size = _work_array_memory_sizes.pop(evict_key, 0)
                    _work_arrays.pop(evict_key, None)
                    _work_array_access_times.pop(evict_key, None)
                    current_memory -= evicted_size
                    if current_memory + array_nbytes <= MAX_WORK_ARRAY_MEMORY:
                        break

            # If still not enough space, clear more aggressively
            if current_memory + array_nbytes > MAX_WORK_ARRAY_MEMORY:
                # Keep only the smallest essential arrays
                break

    if cache_key not in _work_arrays:
        _work_arrays[cache_key] = np.empty(shape, dtype=dtype)
        _work_array_memory_sizes[cache_key] = array_nbytes

    _work_array_access_times[cache_key] = time.time()
    return _work_arrays[cache_key]


def cleanup_fft_plans(force: bool = False):
    """Clean up FFT plans based on memory usage and age.

    Fix 3: Implements proper lifecycle management for FFT plans with
    memory thresholds and periodic cleanup.
    """
    global _fft_plans, _fft_plan_cleanup_counter

    if not _fft_plans:
        return

    # Calculate total memory used by FFT plans
    total_memory = 0
    plan_memory = {}
    for key, (plan, in_arr, out_arr, last_access) in _fft_plans.items():
        memory = in_arr.nbytes + out_arr.nbytes
        plan_memory[key] = memory
        total_memory += memory

    # Clean up if over memory limit or forced
    if force or total_memory > MAX_FFT_PLAN_MEMORY:
        # Sort by last access time (oldest first)
        sorted_plans = sorted(_fft_plans.keys(),
                            key=lambda k: _fft_plans[k][3])

        # Remove oldest plans until under memory limit
        while total_memory > MAX_FFT_PLAN_MEMORY * 0.75 and sorted_plans:
            key_to_remove = sorted_plans.pop(0)
            removed_memory = plan_memory.get(key_to_remove, 0)

            # Properly clean up the plan and its arrays
            plan_data = _fft_plans.pop(key_to_remove, None)
            if plan_data:
                plan, in_arr, out_arr, _ = plan_data
                # PyFFTW plans hold references to arrays; break these
                del plan
                del in_arr
                del out_arr
                total_memory -= removed_memory

        # Force garbage collection after cleanup
        gc.collect()

def get_fft_plan(n: int, direction: str = 'forward', dtype=np.float64):
    """Get a cached FFT plan along with its IO arrays.

    Fix 3: Enhanced with memory-aware caching and periodic cleanup.
    Uses weak references where possible and implements proper cleanup.
    """
    global _fft_plan_cleanup_counter

    if not _PYFFTW_AVAILABLE:
        return (None, None, None)

    direction = direction.lower()
    if direction not in ('forward', 'inverse', 'backward'):
        raise ValueError(f"Invalid FFT direction: {direction}")

    # Periodic cleanup
    _fft_plan_cleanup_counter += 1
    if _fft_plan_cleanup_counter >= FFT_CLEANUP_INTERVAL:
        _fft_plan_cleanup_counter = 0
        cleanup_fft_plans()

    # For rfft/irfft we require real dtype input and complex output (and vice versa)
    if direction in ('forward',):
        if not np.issubdtype(dtype, np.floating):
            raise TypeError(f"Forward FFT expects real input dtype, got {dtype}")
    else:
        # inverse/backward expects complex input and real output; we fix in_arr dtype below
        if not np.issubdtype(dtype, np.floating):
            raise TypeError(f"Inverse FFT expects real output dtype, got {dtype}")

    plan_key = (n, 'forward' if direction == 'forward' else 'inverse', dtype)

    if plan_key not in _fft_plans:
        # Check memory before creating new plan
        new_plan_memory = n * np.dtype(dtype).itemsize
        if direction == 'forward':
            new_plan_memory += (n // 2 + 1) * np.dtype(np.complex128).itemsize
        else:
            new_plan_memory += (n // 2 + 1) * np.dtype(np.complex128).itemsize + n * np.dtype(dtype).itemsize

        # Ensure we have space
        current_memory = sum(p[1].nbytes + p[2].nbytes for p in _fft_plans.values())
        if current_memory + new_plan_memory > MAX_FFT_PLAN_MEMORY:
            cleanup_fft_plans(force=True)

        if len(_fft_plans) >= MAX_FFT_PLANS:
            oldest_key = min(_fft_plans.keys(), key=lambda k: _fft_plans[k][3])
            old_plan = _fft_plans.pop(oldest_key, None)
            if old_plan:
                # Properly clean up old plan
                del old_plan[0]  # plan
                del old_plan[1]  # in_arr
                del old_plan[2]  # out_arr

        if direction == 'forward':
            in_arr = pyfftw.empty_aligned(n, dtype=dtype)
            out_arr = pyfftw.empty_aligned(n // 2 + 1, dtype=np.complex128)
            plan = pyfftw.FFTW(in_arr, out_arr, direction='FFTW_FORWARD', flags=('FFTW_MEASURE',))
        else:
            in_arr = pyfftw.empty_aligned(n // 2 + 1, dtype=np.complex128)
            out_arr = pyfftw.empty_aligned(n, dtype=dtype)
            plan = pyfftw.FFTW(in_arr, out_arr, direction='FFTW_BACKWARD', flags=('FFTW_MEASURE',))

        _fft_plans[plan_key] = (plan, in_arr, out_arr, time.time())

    plan, in_arr, out_arr, _ = _fft_plans[plan_key]
    _fft_plans[plan_key] = (plan, in_arr, out_arr, time.time())
    return plan, in_arr, out_arr

def find_delay_ms(ref_chan: np.ndarray, meas_chan: np.ndarray, fs: int, max_ms: float | None = None) -> float:
    """
    Linear (zero-padded) GCC-PHAT delay. Positive => meas lags ref by +delay.
    """
    x = ref_chan.astype(np.float64, copy=False)
    y = meas_chan.astype(np.float64, copy=False)
    n = min(len(x), len(y))
    if n < 2:
        return 0.0

    if max_ms is not None:
        # Optional: keep FFT size from thrashing
        n = min(n, int(1.25 * fs * max_ms / 1000.0))

    # FFT size >= 2n-1 for linear correlation
    N = 1 << int(np.ceil(np.log2(2*n - 1)))

    # Use reusable FFT work arrays
    fft_size = N // 2 + 1  # rfft output size
    X = get_work_array('fft_X', (fft_size,), dtype=np.complex128)
    Y = get_work_array('fft_Y', (fft_size,), dtype=np.complex128)

    # Use pyFFTW for optimal performance with preallocated arrays
    if _PYFFTW_AVAILABLE:
        # Ensure inputs match planned length N (zero-pad or truncate)
        xN = get_work_array('xN', (N,), dtype=x.dtype)
        yN = get_work_array('yN', (N,), dtype=y.dtype)
        xN.fill(0); yN.fill(0)
        ncopy = min(len(x), N)
        xN[:ncopy] = x[:ncopy]
        yN[:ncopy] = y[:ncopy]

        plan, in_arr, out_arr = get_fft_plan(N, 'forward', xN.dtype)
        if plan is None:
            X[:] = fftw.rfft(xN, n=N)
            Y[:] = fftw.rfft(yN, n=N)
        else:
            try:
                # Process x
                in_arr[:] = xN
                plan()
                X[:] = out_arr.copy()  # copy to avoid later overwrite
                # Process y
                in_arr[:] = yN
                plan()
                Y[:] = out_arr.copy()  # copy to avoid later overwrite
            except Exception:
                X[:] = fftw.rfft(xN, n=N)
                Y[:] = fftw.rfft(yN, n=N)
    else:
        # Fallback to scipy.fft
        X[:] = fftw.rfft(xN, n=N)
        Y[:] = fftw.rfft(yN, n=N)
    R = np.conj(X) * Y
    R /= (np.abs(R) + 1e-15)  # PHAT

    # Use work array for irfft
    cc = get_work_array('cc', (N,), dtype=np.float64)

    # Use pyFFTW for optimal performance with preallocated arrays
    if _PYFFTW_AVAILABLE:
        plan, in_arr, out_arr = get_fft_plan(N, 'inverse', np.float64)
        if plan is None:
            cc[:] = fftw.irfft(R, n=N)
        else:
            try:
                in_arr[:] = R
                plan()
                # out_arr should be length N; copy to avoid later overwrites
                cc[:len(out_arr)] = out_arr
                if len(out_arr) < N:
                    cc[len(out_arr):] = 0.0
            except Exception:
                cc[:] = fftw.irfft(R, n=N)
    else:
        # Fallback to scipy.fft
        cc[:] = fftw.irfft(R, n=N)

    # keep only the valid linear part (length 2n-1), map to lags [-(n-1) .. +(n-1)]
    # Use work array instead of np.concatenate
    cc_lin = get_work_array('cc_lin', (2*n-1,), dtype=np.float64)
    cc_lin[:n-1] = cc[-(n-1):]
    cc_lin[n-1:] = cc[:n]
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
    # Clear caches when resetting state
    clear_dsp_caches()

def delay_freeze(enable: bool, applied_ms: float | None = None):
    if enable:
        # Prefer explicit value, else the last applied auto/manual value.
        if applied_ms is not None:
            ms = float(applied_ms)
        elif _delay["mode"] == "manual":
            ms = float(_delay["manual_ms"])
        elif _delay["ema_ms"] is not None:
            ms = float(_delay["ema_ms"])
        else:
            # no estimate yet; stay in auto until we have one
            _delay["mode"] = "auto"
            return
        _delay["frozen_ms"] = ms
        _delay["ema_ms"] = ms    # keep everything consistent
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
        return float(_delay["frozen_ms"]), raw
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

    # Use work array instead of np.zeros_like
    y_shift = get_work_array('y_shift', y.shape, dtype=y.dtype)
    y_shift.fill(0)  # Fill with zeros (more efficient than np.copyto)
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

def _log_band_edges(freqs: np.ndarray, frac: int = 6) -> tuple[np.ndarray, np.ndarray]:
    """For each bin i, return [i0[i], i1[i]) index edges spanning ±(1/2*1/frac) octaves."""
    f = freqs.copy()
    valid = f > 0
    L = np.log(f[valid])
    dln = 0.5 * (np.log(2.0) / float(frac))  # half-bandwidth in natural log
    lo = L - dln
    hi = L + dln
    i0 = np.searchsorted(L, lo, side="left")
    i1 = np.searchsorted(L, hi, side="right")
    # Map back to full-length arrays (keep zeros for f<=0; we won't use them)
    I0 = np.zeros_like(f, dtype=np.int32)
    I1 = np.zeros_like(f, dtype=np.int32)
    I0[valid] = i0
    I1[valid] = i1
    return I0, I1, valid

# Fix 5: Memory-aware cache decorator implementation
class MemoryAwareLRUCache:
    """Memory-aware LRU cache that tracks memory usage and evicts based on memory limits.

    This custom cache decorator tracks the memory footprint of cached items and
    ensures the total cache size doesn't exceed the specified memory limit.
    """

    def __init__(self, max_memory_mb=10, max_items=32):
        self.max_memory = max_memory_mb * 1024 * 1024  # Convert to bytes
        self.max_items = max_items
        self.cache = OrderedDict()
        self.memory_usage = {}
        self.total_memory = 0

    def __call__(self, func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Create cache key from function arguments
            key = (args, tuple(sorted(kwargs.items())))

            # Check if in cache
            if key in self.cache:
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                return self.cache[key]

            # Compute result
            result = func(*args, **kwargs)

            # Calculate memory size for numpy arrays
            if isinstance(result, np.ndarray):
                result_memory = result.nbytes
            else:
                # Estimate memory for non-array objects
                result_memory = 1024  # Conservative estimate

            # Check if we need to evict items
            while (self.total_memory + result_memory > self.max_memory or
                   len(self.cache) >= self.max_items) and self.cache:
                # Evict least recently used
                evict_key = next(iter(self.cache))
                evicted = self.cache.pop(evict_key)
                evicted_memory = self.memory_usage.pop(evict_key, 0)
                self.total_memory -= evicted_memory

            # Add to cache
            self.cache[key] = result
            self.memory_usage[key] = result_memory
            self.total_memory += result_memory

            return result

        def cache_clear():
            """Clear the cache and reset memory tracking."""
            wrapper.__self__.cache.clear()
            wrapper.__self__.memory_usage.clear()
            wrapper.__self__.total_memory = 0

        # Attach instance to wrapper for access to cache_clear
        wrapper.__self__ = self
        wrapper.cache_clear = cache_clear
        return wrapper

# Create memory-aware cache instances
_hann_cache_instance = MemoryAwareLRUCache(max_memory_mb=5, max_items=32)
_taper_cache_instance = MemoryAwareLRUCache(max_memory_mb=5, max_items=16)

@_hann_cache_instance
def _hann_cached(M: int) -> np.ndarray:
    """Cached Hann window generation with memory-aware eviction."""
    if M <= 1:
        return np.ones(max(M,1))
    n = np.arange(M)
    return 0.5 - 0.5*np.cos(2*np.pi*n/(M-1))

def smooth_constQ_tf_and_coh(
    freqs: np.ndarray,
    Pxx: np.ndarray,
    Pyy: np.ndarray,
    Pxy: np.ndarray,
    frac: int = 6,
    coh_weight_pow: float = 1.0,
    min_bins: int = 3,
    eps: float = 1e-20,
) -> tuple[np.ndarray, np.ndarray]:
    """
    1/frac-octave smoothing on log-f for TF and coherence.
    Returns (Hs, coh_s) where Hs is complex and coh_s is real in [0,1].
    """
    I0, I1, valid = _log_band_edges(freqs, frac=frac)

    # raw coherence (unsmoothed) -> optional weights
    coh0 = (np.abs(Pxy)**2) / (np.maximum(Pxx, eps)*np.maximum(Pyy, eps) + eps)
    coh0 = np.clip(coh0, 0.0, 1.0)

    Hs = np.zeros_like(Pxy, dtype=np.complex128)
    coh_s = np.zeros_like(coh0, dtype=np.float64)

    # Work only on positive-freq bins
    fpos_idx = np.flatnonzero(valid)
    for k, i in enumerate(fpos_idx):
        a, b = int(I0[i]), int(I1[i])
        # guardrail at very small windows
        if b - a < min_bins:
            a = max(0, k - min_bins//2)
            b = min(len(fpos_idx), a + min_bins)
            seg_idx = fpos_idx[a:b]
        else:
            # map (a:b) in the compressed valid-index space to real indices
            seg_idx = fpos_idx[a:b]

        M = seg_idx.size
        w = _hann_cached(M)
        if coh_weight_pow > 0:
            w = w * (coh0[seg_idx] ** coh_weight_pow)
        wsum = float(np.sum(w)) + eps

        Pxx_b = np.sum(Pxx[seg_idx] * w) / wsum
        Pyy_b = np.sum(Pyy[seg_idx] * w) / wsum
        Pxy_b = np.sum(Pxy[seg_idx] * w) / wsum

        Hs[i] = Pxy_b / (Pxx_b + eps)
        coh_s[i] = (np.abs(Pxy_b)**2) / (Pxx_b*Pyy_b + eps)

    # Clamp coherence to [0,1] and copy DC/Nyquist safely
    coh_s = np.clip(coh_s, 0.0, 1.0)
    Hs[~valid] = Hs[valid][0] if np.any(valid) else 0.0
    return Hs, coh_s

@_taper_cache_instance
def _taper_for_M(M: int) -> np.ndarray:
    """Cached taper generation with memory-aware eviction."""
    fade = max(8, M // 64)
    t = np.ones(M, dtype=np.float64)
    t[:fade] = np.linspace(0, 1, fade)
    t[-fade:] = np.linspace(1, 0, fade)
    return t

def compute_metrics(block: np.ndarray, config: CaptureConfig) -> tuple[TFData, SPLData, float]:
    global _cleanup_counter
    if block.ndim == 1:
        block = block[:, np.newaxis]

    # Use views instead of copies where possible
    x = block[:, config.refChan - 1]
    y = block[:, config.measChan - 1]
    
    # Only convert to float64 if necessary
    if x.dtype != np.float64:
        x = x.astype(np.float64, copy=False)
    if y.dtype != np.float64:
        y = y.astype(np.float64, copy=False)
    
    fs = float(config.sampleRate)

    # Delay (linear GCC-PHAT you already implemented)
    MAX_DELAY_MS = getattr(config, "maxDelayMs", 500.0)
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
        tf_data = TFData(freqs=[], mag_db=[], phase_deg=[], coh=[], ir=[])
        rms = float(np.sqrt(np.mean(y**2))) if y.size else 1e-20
        dbfs = 20.0 * np.log10(max(rms, 1e-20))
        spl_data = SPLData(Leq=dbfs, LZ=dbfs)
        return tf_data, spl_data, delay_ms

    # nperseg / noverlap from usable overlap
    target_n = int(config.nfft)
    nperseg, noverlap = _choose_nperseg_with_min_segments(usable_len, target_n, min_segments=4)
    window = get_window("hann", nperseg)

    # Spectra on effective (non-zero-padded) signal slices
    freqs, Pxy = csd(
        x_eff, y_eff, fs=fs, window=window, nperseg=nperseg, noverlap=noverlap,
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

    # Remove tiny fractional remainder with freq rotation BEFORE smoothing
    if abs(frac_samples) > 1e-6:
        tau_frac = frac_samples / fs
        Pxy *= np.exp(1j * 2 * np.pi * freqs * tau_frac)

    # ---- 1/6-octave smoothing (no UI; fixed) ----
    Hs, coh_s = smooth_constQ_tf_and_coh(
        freqs=freqs,
        Pxx=Pxx, Pyy=Pyy, Pxy=Pxy,
        frac=6,                # <- fixed 1/6 octave
        coh_weight_pow=1.0,    # modest coherence weighting
        min_bins=3, eps=eps,
    )

    # Smoothed display values
    mag_db = 20.0 * np.log10(np.abs(Hs) + eps)
    phase_deg = np.angle(Hs, deg=True)
    coh = coh_s

    # Impulse response from SMOOTHED H (use in-place operations)
    M = len(freqs)
    n_ir = 2 * (M - 1)
    
    # Get reusable work arrays
    H_ir = get_work_array('H_ir', (M,), dtype=np.complex128)
    ir = get_work_array('ir', (n_ir,), dtype=np.float64)
    
    # Copy Hs to work array
    H_ir[:] = Hs
    H_ir[0] = H_ir[0].real + 0j
    if M > 1:
        H_ir[-1] = H_ir[-1].real + 0j
    
    # Apply taper in-place
    H_ir *= _taper_for_M(M)
    
    # Compute irfft into pre-allocated array
    ir = np.fft.irfft(H_ir, n=n_ir)
    ir_plot = np.roll(ir, n_ir // 2)

    tf_data = TFData(
        freqs=freqs.tolist(),
        mag_db=mag_db.tolist(),
        phase_deg=phase_deg.tolist(),
        coh=coh.tolist(),
        ir=ir_plot.tolist(),
    )

    rms = float(np.sqrt(np.mean(y_eff**2))) or eps
    dbfs = 20.0 * np.log10(rms)
    spl_data = SPLData(Leq=dbfs, LZ=dbfs)
    
    # Periodic cleanup instead of random GC
    _cleanup_counter += 1
    if _cleanup_counter >= CLEANUP_INTERVAL:
        _cleanup_counter = 0
        # Clear unused work arrays
        current_keys = set(_work_arrays.keys())
        if len(current_keys) > MAX_WORK_ARRAYS // 2:
            # Keep only most recently used
            recent_keys = sorted(_work_array_access_times.keys(),
                               key=lambda k: _work_array_access_times[k],
                               reverse=True)[:MAX_WORK_ARRAYS // 2]
            for key in current_keys - set(recent_keys):
                _work_arrays.pop(key, None)
                _work_array_access_times.pop(key, None)

        gc.collect(0)  # Fast generation 0 collection
        log_memory_usage()  # Log memory usage during cleanup

    return tf_data, spl_data, delay_ms

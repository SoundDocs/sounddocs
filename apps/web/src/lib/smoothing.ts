// src/lib/smoothing.ts
// Fractional-octave smoothing on a log-frequency axis.
// Two modes:
//  - "mag": boxcar average in POWER domain, output mag only (dB)
//  - "complex": boxcar average of the COMPLEX TF, outputs mag+phase consistently

export type SmoothMode = "mag" | "complex";

export function fracOctaveSmooth(
  freqs: number[],
  mag_db: number[],
  phase_deg: number[] | null,
  bandsPerOctave: number, // e.g., 24 -> ~1/24th octave
  mode: SmoothMode = "complex",
): { mag_db: number[]; phase_deg?: number[] } {
  if (!bandsPerOctave || bandsPerOctave <= 0 || !freqs?.length) {
    return { mag_db: mag_db.slice(), ...(phase_deg ? { phase_deg: phase_deg.slice() } : {}) };
  }

  const n = freqs.length;
  const logf = new Float64Array(n);
  for (let i = 0; i < n; i++) logf[i] = Math.log(freqs[i]);

  // half-window in natural log units for 1/b octave:
  const half =
    (Math.log(2) / (2 * bandsPerOctave)) >>> 0
      ? Math.log(2) / (2 * bandsPerOctave)
      : Math.log(2) / (2 * bandsPerOctave);
  // guard tiny freqs
  if (!isFinite(half) || half <= 0) {
    return { mag_db: mag_db.slice(), ...(phase_deg ? { phase_deg: phase_deg.slice() } : {}) };
  }

  if (mode === "mag" || !phase_deg) {
    // Power-domain boxcar in log-f: smooth magnitude only
    // Convert dB -> power ratio, slide a variable-width window with two pointers
    const pow = new Float64Array(n);
    for (let i = 0; i < n; i++) pow[i] = Math.pow(10, mag_db[i] / 10); // dB SPL-like power

    const outMag = new Float64Array(n);
    let l = 0,
      r = 0;
    let sumPow = 0;

    for (let i = 0; i < n; i++) {
      const center = logf[i];
      const lo = center - half;
      const hi = center + half;

      while (r < n && logf[r] <= hi) {
        sumPow += pow[r];
        r++;
      }
      while (l < n && logf[l] < lo) {
        sumPow -= pow[l];
        l++;
      }

      const count = Math.max(1, r - l);
      const meanPow = sumPow / count;
      outMag[i] = 10 * Math.log10(Math.max(meanPow, 1e-30));
    }
    return { mag_db: Array.from(outMag) };
  }

  // Complex vector average: keep mag/phase coherent
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const lin = Math.pow(10, mag_db[i] / 20);
    const ph = (phase_deg[i] * Math.PI) / 180;
    re[i] = lin * Math.cos(ph);
    im[i] = lin * Math.sin(ph);
  }

  const outMag = new Float64Array(n);
  const outPh = new Float64Array(n);
  let l = 0,
    r = 0;
  let sumRe = 0,
    sumIm = 0;

  for (let i = 0; i < n; i++) {
    const center = logf[i];
    const lo = center - half;
    const hi = center + half;

    while (r < n && logf[r] <= hi) {
      sumRe += re[r];
      sumIm += im[r];
      r++;
    }
    while (l < n && logf[l] < lo) {
      sumRe -= re[l];
      sumIm -= im[l];
      l++;
    }

    const count = Math.max(1, r - l);
    const meanRe = sumRe / count;
    const meanIm = sumIm / count;
    const magLin = Math.hypot(meanRe, meanIm);
    outMag[i] = 20 * Math.log10(Math.max(magLin, 1e-15));
    outPh[i] = (Math.atan2(meanIm, meanRe) * 180) / Math.PI;
  }

  // Wrap to [-180, 180]
  for (let i = 0; i < n; i++) {
    let p = outPh[i];
    p = ((((p + 180) % 360) + 360) % 360) - 180;
    outPh[i] = p;
  }

  return { mag_db: Array.from(outMag), phase_deg: Array.from(outPh) };
}

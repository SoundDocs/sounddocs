import { TFData } from "@sounddocs/analyzer-protocol";

export type FilterType = "peaking" | "low_shelf" | "high_shelf" | "high_pass" | "low_pass";

export interface ParametricEqFilter {
  id: string;
  type: FilterType;
  freq: number;
  gain: number;
  q: number;
  slope?: 12 | 24 | 48;
  isEnabled: boolean;
}

export interface CodaHumanFilter {
  id: string;
  type: "coda_human";
  gain: number;
  isEnabled: boolean;
}

export interface DAndBCplFilter {
  id: string;
  type: "dandb_cpl";
  value: number;
  isEnabled: boolean;
}

export interface DAndBHfcFilter {
  id: string;
  type: "dandb_hfc";
  value: "HFC1" | "HFC2";
  isEnabled: boolean;
}

export interface JblAscFilter {
  id: string;
  type: "jbl_asc";
  gain: number;
  isEnabled: boolean;
}

export interface JblHfThrowFilter {
  id: string;
  type: "jbl_hf_throw";
  gain: number;
  isEnabled: boolean;
}

export interface LAcousticsAirCompFilter {
  id: string;
  type: "lacoustics_air_comp";
  gain: number;
  isEnabled: boolean;
}

export interface CodaLowBoostFilter {
  id: string;
  type: "coda_low_boost";
  gain: number;
  isEnabled: boolean;
}

export interface CodaSubsonicFilter {
  id: string;
  type: "coda_subsonic";
  gain: number;
  isEnabled: boolean;
}

export interface CodaHfShelfFilter {
  id: string;
  type: "coda_hf_shelf";
  gain: number;
  isEnabled: boolean;
}

export type EqSetting =
  | ParametricEqFilter
  | CodaHumanFilter
  | DAndBCplFilter
  | DAndBHfcFilter
  | JblAscFilter
  | JblHfThrowFilter
  | LAcousticsAirCompFilter
  | CodaLowBoostFilter
  | CodaSubsonicFilter
  | CodaHfShelfFilter;

function getFilterParams(setting: EqSetting): ParametricEqFilter | null {
  if (
    setting.type === "peaking" ||
    setting.type === "low_shelf" ||
    setting.type === "high_shelf" ||
    setting.type === "low_pass" ||
    setting.type === "high_pass"
  ) {
    return setting;
  }

  switch (setting.type) {
    case "coda_human":
      return {
        ...setting,
        type: "peaking",
        freq: 3000,
        q: 1.0,
      };
    case "dandb_cpl":
      return {
        id: setting.id,
        type: "low_shelf",
        freq: 1000, // you can slide this lower as value increases if desired
        gain: setting.value, // +/- dB
        q: 0.707, // shelf “softness” (used only if you later map Q->S)
        isEnabled: setting.isEnabled,
      };
    case "dandb_hfc":
      return {
        id: setting.id,
        type: "high_shelf",
        freq: 4000, // Approximation
        gain: setting.value === "HFC1" ? 3 : 6, // Approximation
        q: 0.707,
        isEnabled: setting.isEnabled,
      };
    case "jbl_asc":
      return {
        id: setting.id,
        type: "low_shelf",
        freq: 200, // Approximation
        gain: setting.gain,
        q: 0.707,
        isEnabled: setting.isEnabled,
      };
    case "jbl_hf_throw":
      return {
        id: setting.id,
        type: "high_shelf",
        freq: 4000, // Approximation
        gain: setting.gain,
        q: 0.707,
        isEnabled: setting.isEnabled,
      };
    case "lacoustics_air_comp":
      return {
        id: setting.id,
        type: "high_shelf",
        freq: 4000, // Approximation
        gain: setting.gain,
        q: 0.707,
        isEnabled: setting.isEnabled,
      };
    case "coda_low_boost":
      return {
        id: setting.id,
        type: "low_shelf",
        freq: 160,
        gain: setting.gain,
        q: 0.7,
        isEnabled: setting.isEnabled,
      };
    case "coda_subsonic":
      return {
        id: setting.id,
        type: "low_shelf",
        freq: 40,
        gain: setting.gain,
        q: 0.7,
        isEnabled: setting.isEnabled,
      };
    case "coda_hf_shelf":
      return {
        id: setting.id,
        type: "high_shelf",
        freq: 4500,
        gain: setting.gain,
        q: 0.7,
        isEnabled: setting.isEnabled,
      };
    default:
      return null;
  }
}

// ---- RBJ biquad coefficients + complex evaluation ----

type Biquad = { b0: number; b1: number; b2: number; a0: number; a1: number; a2: number };

function biquadCoeffs(filter: ParametricEqFilter, fs: number): Biquad {
  const { type, freq, gain, q } = filter;

  // RBJ cookbook variables
  const A = Math.pow(10, gain / 40); // use /40 for shelving & peaking
  const w0 = 2 * Math.PI * (freq / fs);
  const cosw0 = Math.cos(w0);
  const sinw0 = Math.sin(w0);
  const Q = Math.max(1e-6, q || 0.707); // guard rails

  let a0: number, a1: number, a2: number, b0: number, b1: number, b2: number;

  if (type === "peaking") {
    const alpha = sinw0 / (2 * Q);
    b0 = 1 + alpha * A;
    b1 = -2 * cosw0;
    b2 = 1 - alpha * A;
    a0 = 1 + alpha / A;
    a1 = -2 * cosw0;
    a2 = 1 - alpha / A;
  } else if (type === "low_shelf") {
    // Use shelf slope S = 1 (gentle). If you want to map Q -> S later, you can.
    const S = 1;
    const alpha = (sinw0 / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
    const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;

    b0 = A * (A + 1 - (A - 1) * cosw0 + twoSqrtAAlpha);
    b1 = 2 * A * (A - 1 - (A + 1) * cosw0);
    b2 = A * (A + 1 - (A - 1) * cosw0 - twoSqrtAAlpha);
    a0 = A + 1 + (A - 1) * cosw0 + twoSqrtAAlpha;
    a1 = -2 * (A - 1 + (A + 1) * cosw0);
    a2 = A + 1 + (A - 1) * cosw0 - twoSqrtAAlpha;
  } else if (type === "high_shelf") {
    const S = 1;
    const alpha = (sinw0 / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);
    const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;

    b0 = A * (A + 1 + (A - 1) * cosw0 + twoSqrtAAlpha);
    b1 = -2 * A * (A - 1 + (A + 1) * cosw0);
    b2 = A * (A + 1 + (A - 1) * cosw0 - twoSqrtAAlpha);
    a0 = A + 1 - (A - 1) * cosw0 + twoSqrtAAlpha;
    a1 = 2 * (A - 1 - (A + 1) * cosw0);
    a2 = A + 1 - (A - 1) * cosw0 - twoSqrtAAlpha;
  } else if (type === "low_pass") {
    const alpha = sinw0 / (2 * Q);
    b0 = (1 - cosw0) / 2;
    b1 = 1 - cosw0;
    b2 = (1 - cosw0) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cosw0;
    a2 = 1 - alpha;
  } else if (type === "high_pass") {
    const alpha = sinw0 / (2 * Q);
    b0 = (1 + cosw0) / 2;
    b1 = -(1 + cosw0);
    b2 = (1 + cosw0) / 2;
    a0 = 1 + alpha;
    a1 = -2 * cosw0;
    a2 = 1 - alpha;
  } else {
    // Neutral (shouldn't hit)
    b0 = 1;
    b1 = 0;
    b2 = 0;
    a0 = 1;
    a1 = 0;
    a2 = 0;
  }

  // Normalize so a0 = 1
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a0: 1, a1: a1 / a0, a2: a2 / a0 };
}

function applyBiquad(freqs: number[], sampleRate: number, filter: ParametricEqFilter): number[] {
  const { b0, b1, b2, a0, a1, a2 } = biquadCoeffs(filter, sampleRate);

  return freqs.map((f) => {
    const w = 2 * Math.PI * (f / sampleRate);
    const cosw = Math.cos(w);
    const sinw = Math.sin(w);
    const cos2w = Math.cos(2 * w);
    const sin2w = Math.sin(2 * w);

    // Evaluate H(e^jw) = (b0 + b1 z^-1 + b2 z^-2) / (a0 + a1 z^-1 + a2 z^-2), z^-1 = e^-jw
    const numRe = b0 + b1 * cosw + b2 * cos2w;
    const numIm = -(b1 * sinw + b2 * sin2w);
    const denRe = a0 + a1 * cosw + a2 * cos2w;
    const denIm = -(a1 * sinw + a2 * sin2w);

    const numMag2 = numRe * numRe + numIm * numIm;
    const denMag2 = denRe * denRe + denIm * denIm;
    const mag = Math.sqrt(numMag2 / Math.max(denMag2, 1e-24));

    return 20 * Math.log10(Math.max(mag, 1e-12));
  });
}

/**
 * Applies all EQ settings to a measurement's magnitude data.
 * @param magDb - The original magnitude data in dB.
 * @param freqs - The array of frequencies.
 * @param sampleRate - The sample rate of the measurement.
 * @param eqSettings - The array of EQ settings to apply.
 * @returns The new magnitude data in dB.
 */
export function applyEq(
  magDb: number[],
  freqs: number[],
  sampleRate: number,
  eqSettings: EqSetting[],
): number[] {
  if (!eqSettings || eqSettings.length === 0) {
    return magDb;
  }

  const totalEqResponse = new Array(freqs.length).fill(0);

  eqSettings.forEach((setting) => {
    if (!setting.isEnabled) return;
    const filterParams = getFilterParams(setting);
    if (!filterParams) return;

    // Determine cascade sections
    let sections = 1;
    if (filterParams.type === "high_pass" || filterParams.type === "low_pass") {
      // Base section is 12 dB/oct (2nd order RBJ)
      const uiSlope = filterParams.slope ?? 12; // 12|24|48
      sections = Math.max(1, Math.round(uiSlope / 12));
    }

    // Compute once, then scale in dB
    const resp = applyBiquad(freqs, sampleRate, filterParams);
    for (let i = 0; i < totalEqResponse.length; i++) {
      totalEqResponse[i] += resp[i] * sections;
    }
  });

  return magDb.map((val, i) => val + totalEqResponse[i]);
}

// ---- Complex Math for Trace Averaging ----

/**
 * Unwraps phase to remove discontinuities of ±180° (±π radians).
 * This ensures continuous phase for complex arithmetic operations.
 */
function unwrapPhase(phaseDeg: number[]): number[] {
  const unwrapped = [...phaseDeg];
  const threshold = 180.0; // degrees

  for (let i = 1; i < unwrapped.length; i++) {
    const diff = unwrapped[i] - unwrapped[i - 1];
    if (diff > threshold) {
      unwrapped[i] -= 360.0;
    } else if (diff < -threshold) {
      unwrapped[i] += 360.0;
    }
  }

  return unwrapped;
}

/**
 * Converts magnitude (dB) and phase (degrees) to a complex number.
 * Uses better numerical precision handling.
 */
function dbToComplex(magDb: number, phaseDeg: number): { re: number; im: number } {
  // Handle very small magnitudes to avoid numerical issues
  if (magDb < -200) {
    return { re: 0, im: 0 };
  }

  const magLinear = Math.pow(10, magDb / 20);
  const phaseRad = phaseDeg * (Math.PI / 180);

  // Use more precise trigonometric functions
  const re = magLinear * Math.cos(phaseRad);
  const im = magLinear * Math.sin(phaseRad);

  return { re, im };
}

/**
 * Converts a complex number back to magnitude (dB) and phase (degrees).
 * Uses improved numerical precision and handles edge cases.
 */
function complexToDb(re: number, im: number): { magDb: number; phaseDeg: number } {
  const magSquared = re * re + im * im;

  // Handle very small magnitudes
  if (magSquared < 1e-24) {
    return { magDb: -200, phaseDeg: 0 };
  }

  const magLinear = Math.sqrt(magSquared);
  const magDb = 20 * Math.log10(magLinear);

  // Handle phase calculation more robustly
  let phaseRad = Math.atan2(im, re);
  if (!isFinite(phaseRad)) {
    phaseRad = 0;
  }

  const phaseDeg = phaseRad * (180 / Math.PI);

  return { magDb, phaseDeg };
}

/**
 * Calculates the combined coherence for multiple measurements.
 * Coherence represents measurement quality/confidence.
 * For derived measurements, we use the minimum coherence (most conservative approach).
 */
function calculateCombinedCoherence(coherences: number[]): number {
  if (coherences.length === 0) return 0;
  if (coherences.length === 1) return coherences[0];

  // For multiple measurements, use the minimum coherence as it's the most conservative
  // This represents the weakest link in the measurement chain
  return Math.min(...coherences);
}

/**
 * Validates that all sources have compatible frequency arrays and sample rates.
 */
function validateSourceCompatibility(sources: TFData[]): boolean {
  if (sources.length < 2) return true;

  const firstSource = sources[0];
  const firstFreqs = firstSource.freqs;
  const tolerance = 1e-6; // Frequency tolerance in Hz

  for (let i = 1; i < sources.length; i++) {
    const source = sources[i];

    // Check frequency array length
    if (source.freqs.length !== firstFreqs.length) {
      console.error(`Source ${i} has different number of frequency bins`);
      return false;
    }

    // Check frequency values are approximately equal
    for (let j = 0; j < firstFreqs.length; j++) {
      if (Math.abs(source.freqs[j] - firstFreqs[j]) > tolerance) {
        console.error(`Source ${i} has incompatible frequency at bin ${j}`);
        return false;
      }
    }
  }

  return true;
}

export function calculateMathTrace(
  sources: TFData[],
  operation: "average" | "sum" | "subtract",
): TFData {
  if (!sources || sources.length === 0) {
    console.warn("calculateMathTrace called with no sources.");
    return { freqs: [], mag_db: [], phase_deg: [], coh: [], ir: [] };
  }

  // Validate source compatibility
  if (!validateSourceCompatibility(sources)) {
    console.error("Sources are not compatible for math operations.");
    return { freqs: [], mag_db: [], phase_deg: [], coh: [], ir: [] };
  }

  const firstSource = sources[0];
  const numBins = firstSource.freqs.length;
  const freqs = firstSource.freqs;

  // Validate operation requirements
  if (operation === "subtract" && sources.length !== 2) {
    console.error("Subtraction requires exactly two sources.");
    return { freqs: [], mag_db: [], phase_deg: [], coh: [], ir: [] };
  }

  // Pre-process phases for all sources to handle unwrapping
  const processedSources = sources.map((source) => ({
    ...source,
    phase_deg: unwrapPhase(source.phase_deg),
  }));

  const newMagDb = new Array(numBins);
  const newPhaseDeg = new Array(numBins);
  const newCoh = new Array(numBins);

  for (let i = 0; i < numBins; i++) {
    let finalRe = 0;
    let finalIm = 0;
    const coherences: number[] = [];

    if (operation === "subtract") {
      // Subtraction: source[0] - source[1]
      const s1 = dbToComplex(processedSources[0].mag_db[i], processedSources[0].phase_deg[i]);
      const s2 = dbToComplex(processedSources[1].mag_db[i], processedSources[1].phase_deg[i]);

      finalRe = s1.re - s2.re;
      finalIm = s1.im - s2.im;

      // For subtraction, coherence is more complex but we use the worse of the two
      coherences.push(processedSources[0].coh[i] || 0);
      coherences.push(processedSources[1].coh[i] || 0);
    } else {
      // Sum or average operation
      let sumRe = 0;
      let sumIm = 0;

      for (const source of processedSources) {
        const complex = dbToComplex(source.mag_db[i], source.phase_deg[i]);
        sumRe += complex.re;
        sumIm += complex.im;
        coherences.push(source.coh[i] || 0);
      }

      if (operation === "average") {
        // Coherence-weighted averaging for improved quality
        let totalWeight = 0;
        let weightedMagSum = 0;
        let weightedPhaseSum = 0;
        let validMeasurements = 0;

        // Calculate weights and weighted sums for each source
        processedSources.forEach((source) => {
          // Get coherence value, use minimum weight for poor measurements
          const coherence = Math.max(source.coh[i] || 0, 0.1); // Minimum weight of 0.1
          const weight = coherence;

          // Convert magnitude to linear scale for weighted geometric mean
          const magLinear = Math.pow(10, source.mag_db[i] / 20);

          // Handle zero/negative magnitudes
          if (magLinear > 0) {
            // For geometric mean, we sum log(magnitude) * weight
            weightedMagSum += Math.log(magLinear) * weight;
            totalWeight += weight;
            validMeasurements++;
          }

          // Weighted phase sum (arithmetic mean for phase)
          weightedPhaseSum += source.phase_deg[i] * weight;
        });

        if (totalWeight > 0 && validMeasurements > 0) {
          // Calculate weighted geometric mean for magnitude
          const weightedGeoMeanMag = Math.exp(weightedMagSum / totalWeight);
          const geoMeanMagDb = 20 * Math.log10(Math.max(weightedGeoMeanMag, 1e-12));

          // Calculate weighted arithmetic mean for phase
          const avgPhase = weightedPhaseSum / totalWeight;

          // Convert back to complex number
          const avgMagLinear = Math.pow(10, geoMeanMagDb / 20);
          finalRe = avgMagLinear * Math.cos((avgPhase * Math.PI) / 180);
          finalIm = avgMagLinear * Math.sin((avgPhase * Math.PI) / 180);
        } else {
          // Fallback to simple average if no valid weights
          const magnitudes = processedSources.map((s) => Math.pow(10, s.mag_db[i] / 20));
          const validMagnitudes = magnitudes.filter((m) => m > 0);
          if (validMagnitudes.length > 0) {
            const product = validMagnitudes.reduce((acc, mag) => acc * mag, 1);
            const geoMeanMag = Math.pow(product, 1 / validMagnitudes.length);
            const geoMeanMagDb = 20 * Math.log10(Math.max(geoMeanMag, 1e-12));

            const phases = processedSources.map((s) => s.phase_deg[i]);
            const avgPhase = phases.reduce((sum, phase) => sum + phase, 0) / sources.length;

            const avgMagLinear = Math.pow(10, geoMeanMagDb / 20);
            finalRe = avgMagLinear * Math.cos((avgPhase * Math.PI) / 180);
            finalIm = avgMagLinear * Math.sin((avgPhase * Math.PI) / 180);
          } else {
            // All magnitudes are zero/invalid
            finalRe = 0;
            finalIm = 0;
          }
        }
      } else {
        // Sum operation (unchanged)
        finalRe = sumRe;
        finalIm = sumIm;
      }
    }

    // Calculate combined coherence - use weighted approach for average operation
    if (operation === "average") {
      // For weighted average, use the weighted average of coherence values
      let weightedCohSum = 0;
      let cohWeightSum = 0;

      processedSources.forEach((source) => {
        const coherence = Math.max(source.coh[i] || 0, 0.1);
        const weight = coherence;
        weightedCohSum += (source.coh[i] || 0) * weight;
        cohWeightSum += weight;
      });

      newCoh[i] = cohWeightSum > 0 ? weightedCohSum / cohWeightSum : 0;
    } else {
      // For other operations, use the conservative approach
      newCoh[i] = calculateCombinedCoherence(coherences);
    }

    // Convert back to magnitude and phase
    const { magDb, phaseDeg } = complexToDb(finalRe, finalIm);
    newMagDb[i] = magDb;
    newPhaseDeg[i] = phaseDeg;
  }

  // Re-wrap phase to standard range (-180 to 180 degrees) for display
  const wrappedPhase = newPhaseDeg.map((phase) => {
    while (phase > 180) phase -= 360;
    while (phase <= -180) phase += 360;
    return phase;
  });

  return {
    freqs,
    mag_db: newMagDb,
    phase_deg: wrappedPhase,
    coh: newCoh,
    ir: [], // Impulse response not calculated for math traces
  };
}

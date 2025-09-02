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

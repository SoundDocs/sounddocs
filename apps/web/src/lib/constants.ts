import { Resolution } from "./types";

export const FIELD_TYPES = {
  // Input Fields
  INPUT_DEVICE: "input_device",
  INPUT_CONN_ANALOG_SNAKE_TYPE: "input_connection_analog_snake_type",
  INPUT_CONN_DIGITAL_SNAKE_TYPE: "input_connection_digital_snake_type",
  INPUT_CONN_NETWORK_TYPE: "input_connection_network_type",
  INPUT_CONN_CONSOLE_TYPE: "input_connection_console_type",

  // Output Fields
  OUTPUT_SRC_CONSOLE_TYPE: "output_source_console_type",
  OUTPUT_SRC_ANALOG_SNAKE_TYPE: "output_source_analog_snake_type",
  OUTPUT_SRC_DIGITAL_SNAKE_TYPE: "output_source_digital_snake_type",
  OUTPUT_SRC_NETWORK_TYPE: "output_source_network_type",
  OUTPUT_DESTINATION_TYPE: "output_destination_type",
  OUTPUT_DESTINATION_GEAR: "output_destination_gear",
};
export const ASPECT_RATIOS = [
  { value: "16:9", label: "16:9" },
  { value: "16:10", label: "16:10" },
  { value: "4:3", label: "4:3" },
  { value: "3:2", label: "3:2" },
  { value: "3:1", label: "3:1" },
  { value: "1:1", label: "1:1" },
];

export const RESOLUTIONS: Resolution[] = [
  // 16:9
  { value: "1280x720", label: "1280 x 720 (HD)", width: 1280, height: 720, aspectRatio: "16:9" },
  {
    value: "1920x1080",
    label: "1920 x 1080 (FHD)",
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
  },
  {
    value: "2560x1440",
    label: "2560 x 1440 (QHD)",
    width: 2560,
    height: 1440,
    aspectRatio: "16:9",
  },
  {
    value: "3840x2160",
    label: "3840 x 2160 (4K UHD)",
    width: 3840,
    height: 2160,
    aspectRatio: "16:9",
  },
  // 16:10
  { value: "1280x800", label: "1280 x 800", width: 1280, height: 800, aspectRatio: "16:10" },
  { value: "1920x1200", label: "1920 x 1200", width: 1920, height: 1200, aspectRatio: "16:10" },
  { value: "2560x1600", label: "2560 x 1600", width: 2560, height: 1600, aspectRatio: "16:10" },
  // 4:3
  { value: "1024x768", label: "1024 x 768", width: 1024, height: 768, aspectRatio: "4:3" },
  { value: "1600x1200", label: "1600 x 1200", width: 1600, height: 1200, aspectRatio: "4:3" },
  { value: "2048x1536", label: "2048 x 1536", width: 2048, height: 1536, aspectRatio: "4:3" },
  // 3:2
  { value: "1440x960", label: "1440 x 960", width: 1440, height: 960, aspectRatio: "3:2" },
  { value: "2160x1440", label: "2160 x 1440", width: 2160, height: 1440, aspectRatio: "3:2" },
  // 3:1
  { value: "2880x960", label: "2880 x 960", width: 2880, height: 960, aspectRatio: "3:1" },
  { value: "3840x1280", label: "3840 x 1280", width: 3840, height: 1280, aspectRatio: "3:1" },
  // 1:1
  { value: "1080x1080", label: "1080 x 1080", width: 1080, height: 1080, aspectRatio: "1:1" },
  { value: "2048x2048", label: "2048 x 2048", width: 2048, height: 2048, aspectRatio: "1:1" },
  // 9:16
  { value: "720x1280", label: "720 x 1280", width: 720, height: 1280, aspectRatio: "9:16" },
  { value: "1080x1920", label: "1080 x 1920", width: 1080, height: 1920, aspectRatio: "9:16" },
];

export const TRACE_COLORS = [
  "#FF6384",
  "#36A2EB",
  "#FFCE56",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#8C564B",
  "#E377C2",
  "#7F7F7F",
  "#BCBD22",
  "#17BECF",
  "#AEC7E8",
  "#FFBB78",
  "#98DF8A",
  "#FF9896",
];

// --- Target curve utils (drop-in replacement) ---
type Filter =
  | { type: "peak"; f: number; gain: number; q: number }
  | { type: "highshelf"; f: number; gain: number; s: number } // shelf "S" (not Q)
  | { type: "lpf1"; f: number }; // true 6 dB/oct

type Biquad = { b0: number; b1: number; b2: number; a0: number; a1: number; a2: number };

// magnitude of biquad at frequency f (Hz), fs (Hz)
function biquadMagDbAt(f: number, fs: number, c: Biquad): number {
  const w = 2 * Math.PI * (f / fs);
  const cw = Math.cos(w);
  const sw = Math.sin(w);
  const c2 = Math.cos(2 * w);
  const s2 = Math.sin(2 * w);

  // numerator: b0 + b1 z^-1 + b2 z^-2 with z^-1 = cos(w) - j sin(w)
  const numRe = c.b0 + c.b1 * cw + c.b2 * c2;
  const numIm = -(c.b1 * sw + c.b2 * s2);
  const denRe = c.a0 + c.a1 * cw + c.a2 * c2;
  const denIm = -(c.a1 * sw + c.a2 * s2);

  const num2 = numRe * numRe + numIm * numIm;
  const den2 = denRe * denRe + denIm * denIm;
  const mag = Math.sqrt(num2 / den2);
  return 20 * Math.log10(mag);
}

function designPeaking(f0: number, gainDb: number, Q: number, fs: number): Biquad {
  const A = Math.pow(10, gainDb / 40);
  const w0 = 2 * Math.PI * (f0 / fs);
  const alpha = Math.sin(w0) / (2 * Q);
  const cosw = Math.cos(w0);

  let b0 = 1 + alpha * A;
  let b1 = -2 * cosw;
  let b2 = 1 - alpha * A;
  let a0 = 1 + alpha / A;
  let a1 = -2 * cosw;
  let a2 = 1 - alpha / A;

  // normalize a0 = 1
  b0 /= a0;
  b1 /= a0;
  b2 /= a0;
  a1 /= a0;
  a2 /= a0;
  a0 = 1;
  return { b0, b1, b2, a0, a1, a2 };
}

function designHighShelf(f0: number, gainDb: number, S: number, fs: number): Biquad {
  // RBJ high-shelf with shelf slope S (not Q)
  const A = Math.pow(10, gainDb / 40);
  const w0 = 2 * Math.PI * (f0 / fs);
  const cosw = Math.cos(w0);
  const sinw = Math.sin(w0);
  const alpha = (sinw / 2) * Math.sqrt((A + 1 / A) * (1 / S - 1) + 2);

  let b0 = A * (A + 1 + (A - 1) * cosw + 2 * Math.sqrt(A) * alpha);
  let b1 = -2 * A * (A - 1 + (A + 1) * cosw);
  let b2 = A * (A + 1 + (A - 1) * cosw - 2 * Math.sqrt(A) * alpha);
  let a0 = A + 1 - (A - 1) * cosw + 2 * Math.sqrt(A) * alpha;
  let a1 = 2 * (A - 1 - (A + 1) * cosw);
  let a2 = A + 1 - (A - 1) * cosw - 2 * Math.sqrt(A) * alpha;

  // normalize a0 = 1
  b0 /= a0;
  b1 /= a0;
  b2 /= a0;
  a1 /= a0;
  a2 /= a0;
  a0 = 1;
  return { b0, b1, b2, a0, a1, a2 };
}

function designLPF1(f0: number, fs: number): Biquad {
  // 1st-order (6 dB/oct) bilinear-transform RC low-pass
  const K = Math.tan(Math.PI * (f0 / fs));
  const norm = 1 / (1 + K);
  const b0 = K * norm;
  const b1 = K * norm;
  const b2 = 0;
  const a0 = 1;
  const a1 = (1 - K) * norm - 1; // convert to H(z)= (b0+b1 z^-1)/(1 + a1 z^-1 + a2 z^-2)
  // Wait: the standard difference eq is y = b0 x + b1 x[n-1] - a1' y[n-1] with a1'=(K-1)/(1+K).
  // For transfer denominator 1 + a1 z^-1 we need a1 = (K - 1) / (1 + K).
  const a1_den = (K - 1) / (1 + K);
  return { b0, b1, b2, a0: 1, a1: a1_den, a2: 0 };
}

// Build your “Custom” cascade once
function buildCustomCascade(fs: number): Biquad[] {
  return [
    designPeaking(54, +13, 0.43, fs),
    // treat given "q: 0.30" as shelf slope S=0.30 (RBJ)
    designHighShelf(670, -2.5, 0.3, fs),
    designLPF1(18100, fs),
  ];
}

// Evaluate any curve at arbitrary frequency
type Curve = { name: string; evalDb: (f: number, fs: number) => number };

export const TARGET_CURVES: Record<string, Curve> = {
  flat: {
    name: "Flat",
    evalDb: () => 0,
  },
  "x-curve": {
    name: "X-Curve",
    evalDb: (f: number) => (f <= 2000 ? 0 : -3 * Math.log2(f / 2000)),
  },
  custom: {
    name: "SoundDocs Curve",
    evalDb: (() => {
      let biquads: Biquad[] | null = null;
      return (f: number, fs: number) => {
        if (!biquads) biquads = buildCustomCascade(fs);
        // cascade magnitudes in linear, then convert to dB
        const db = biquads.reduce((accDb, bq) => accDb + biquadMagDbAt(f, fs, bq), 0);
        return db;
      };
    })(),
  },
};

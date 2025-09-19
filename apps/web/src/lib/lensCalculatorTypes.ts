// Types for the Projection Lens Calculator

export interface Projector {
  id: string;
  manufacturer: string;
  series: string;
  model: string;
  brightness_ansi: number;
  brightness_center: number;
  native_resolution: string;
  technology_type: string;
  lens_mount_system: string;
  specifications: Record<string, unknown>;
}

export interface Lens {
  id: string;
  manufacturer: string;
  model: string;
  part_number?: string;
  throw_ratio_min: number;
  throw_ratio_max: number;
  lens_type: string;
  zoom_type: string;
  motorized: boolean;
  lens_shift_v_max?: number;
  lens_shift_h_max?: number;
  optical_features: Record<string, unknown>;
}

export interface ProjectorLensCompatibility {
  id: string;
  projector_id: string;
  lens_id: string;
  compatibility_notes?: string;
  performance_limitations?: string;
}

export interface ScreenData {
  width: number;
  height: number;
  diagonal?: number;
  shape: "rectangle" | "circle" | "rhombus" | "oval" | "custom";
  aspectRatio: string;
  gain?: number; // Screen gain for brightness calculations
  customVertices?: Array<{ x: number; y: number }>;
}

export type ScreenUnit = "inches" | "ft" | "m" | "mm";

export interface ScreenDimensions {
  width: number;
  height: number;
  unit: ScreenUnit;
}

export interface ProjectorRequirements {
  brightness?: number;
  resolution?: string;
  technology?: string[];
  manufacturer?: string[];
}

export interface InstallationConstraints {
  minDistance?: number;
  maxDistance?: number;
  mountingType?: "ceiling" | "floor" | "rear";
  lensShiftRequired?: boolean;
  requiredVShiftPct?: number; // Required vertical shift percentage
  requiredHShiftPct?: number; // Required horizontal shift percentage
  environment?: "indoor" | "outdoor";
}

export interface CalculationResult {
  compatibleLenses: Array<{
    lens: Lens;
    throwDistance: number;
    imageWidth: number;
    imageHeight: number;
    brightness: number;
    score: number;
  }>;
  warnings: string[];
  recommendations: string[];
}

export interface EnhancedCalculationResult {
  compatibleLenses: Array<{
    lens: Lens;
    throwDistance: number;
    imageWidth: number;
    imageHeight: number;
    brightness: number;
    score: number;
    scoringBreakdown?: any; // Will be ScoringBreakdown from lensScoring.ts
    targetThrowRatio: number;
    zoomPosition: number;
    compatibility: "excellent" | "good" | "acceptable" | "poor" | "incompatible";
  }>;
  warnings: string[];
  recommendations: string[];
  scoringProfile: string;
  totalLensesEvaluated: number;
  scoringInsights: {
    averageScore: number;
    bestCategory: string;
    commonIssues: string[];
    recommendations: string[];
  };
}

export interface LensCalculation {
  id: string;
  user_id: string;
  calculation_name: string;
  screen_data: ScreenData;
  projector_requirements: ProjectorRequirements;
  installation_constraints: InstallationConstraints;
  calculation_results: CalculationResult;
  created_at: string;
  last_edited: string;
}

// Calculation functions
export function calculateThrowDistance(imageWidth: number, throwRatio: number): number {
  return imageWidth * throwRatio;
}

export function calculateImageSize(
  diagonal: number,
  aspectRatioW: number,
  aspectRatioH: number,
): { width: number; height: number } {
  const ratio = aspectRatioW / aspectRatioH;
  const height = diagonal / Math.sqrt(1 + ratio * ratio);
  const width = height * ratio;
  return { width, height };
}

export function calculateBrightness(lumens: number, screenArea: number, gain: number): number {
  return (lumens * gain) / screenArea;
}

export function calculateScreenArea(
  width: number,
  height: number,
  shape: string = "rectangle",
): number {
  switch (shape) {
    case "circle": {
      // Use width as diameter
      const radius = width / 2;
      return Math.PI * radius * radius;
    }
    case "rhombus": {
      // Area = (diagonal1 * diagonal2) / 2, using width and height as diagonals
      return (width * height) / 2;
    }
    case "oval": {
      // Area = π * a * b, where a and b are semi-major and semi-minor axes
      return Math.PI * (width / 2) * (height / 2);
    }
    case "rectangle":
    default:
      return width * height;
  }
}

export function calculateDiagonal(width: number, height: number): number {
  return Math.sqrt(width * width + height * height);
}

// Unit conversion functions
export function convertToInches(value: number, unit: ScreenUnit): number {
  switch (unit) {
    case "inches":
      return value;
    case "ft":
      return value * 12;
    case "m":
      return value * 39.3701;
    case "mm":
      return value / 25.4;
    default:
      return value;
  }
}

export function convertFromInches(value: number, unit: ScreenUnit): number {
  switch (unit) {
    case "inches":
      return value;
    case "ft":
      return value / 12;
    case "m":
      return value / 39.3701;
    case "mm":
      return value * 25.4;
    default:
      return value;
  }
}

export function getUnitLabel(unit: ScreenUnit): string {
  switch (unit) {
    case "inches":
      return "inches";
    case "ft":
      return "feet";
    case "m":
      return "meters";
    case "mm":
      return "millimeters";
    default:
      return unit;
  }
}

// Validation functions
export function validateThrowRatio(
  distance: number,
  imageWidth: number,
  minRatio: number,
  maxRatio: number,
): boolean {
  const actualRatio = distance / imageWidth;
  return actualRatio >= minRatio && actualRatio <= maxRatio;
}

export function validateBrightness(
  requiredLumens: number,
  projectorLumens: number,
  tolerance: number = 0.1,
): boolean {
  return projectorLumens >= requiredLumens * (1 - tolerance);
}

// Common aspect ratios
export const ASPECT_RATIOS = [
  { label: "16:9 (HD/4K)", width: 16, height: 9 },
  { label: "16:10 (WUXGA)", width: 16, height: 10 },
  { label: "4:3 (XGA)", width: 4, height: 3 },
  { label: "1.85:1 (Cinema)", width: 1.85, height: 1 },
  { label: "2.39:1 (Scope)", width: 2.39, height: 1 },
  { label: "1:1 (Square)", width: 1, height: 1 },
  { label: "Custom", width: 0, height: 0 },
];

// Common screen sizes
export const SCREEN_SIZES = [
  // Small Event Screens (audiences up to 100)
  { label: '80" Diagonal', diagonal: 80 },
  { label: '90" Diagonal', diagonal: 90 },
  { label: '100" Diagonal', diagonal: 100 },
  { label: '110" Diagonal', diagonal: 110 },
  { label: '120" Diagonal', diagonal: 120 },

  // Medium Event Screens (audiences 100-250)
  { label: '135" Diagonal', diagonal: 135 },
  { label: '150" Diagonal', diagonal: 150 },
  { label: '180" Diagonal', diagonal: 180 },
  { label: '200" Diagonal', diagonal: 200 },

  // Large Event Screens (audiences 250+)
  { label: '250" Diagonal', diagonal: 250 },
  { label: '300" Diagonal', diagonal: 300 },

  // Common Width-Based Sizes (event industry standard)
  { label: "6' Wide Screen", width: 72 },
  { label: "8' Wide Screen", width: 96 },
  { label: "10' Wide Screen", width: 120 },
  { label: "12' Wide Screen", width: 144 },
  { label: "16' Wide Screen", width: 192 },
  { label: "20' Wide Screen", width: 240 },
  { label: "24' Wide Screen", width: 288 },
  { label: "30' Wide Screen", width: 360 },

  // Trade Show Display Standards
  { label: "10'x10' Booth Screen", width: 120 },
  { label: "10'x20' Booth Screen", width: 240 },
  { label: "20'x20' Booth Screen", width: 240 },

  // Large Venue Screens
  { label: "40' Wide Screen", width: 480 },
  { label: "50' Wide Screen", width: 600 },
  { label: "60' Wide Screen", width: 720 },
];

// Manufacturer list
export const MANUFACTURERS = [
  "Barco",
  "Christie",
  "Panasonic",
  "Epson",
  "Sony",
  "NEC/Sharp",
  "Digital Projection",
  "Optoma",
  "BenQ",
  "Canon",
  "JVC",
  "Vivitek",
];

// Resolution options
export const RESOLUTIONS = [
  "4K (4096x2160)",
  "UHD (3840x2160)",
  "WUXGA (1920x1200)",
  "1080p (1920x1080)",
  "WXGA (1280x800)",
  "XGA (1024x768)",
  "SXGA+ (1400x1050)",
];

// Technology types
export const TECHNOLOGY_TYPES = [
  "Laser Phosphor",
  "RGB Laser",
  "Xenon Lamp",
  "Mercury/UHP Lamp",
  "3LCD",
  "DLP",
  "SXRD",
  "D-ILA",
  "LCOS",
];

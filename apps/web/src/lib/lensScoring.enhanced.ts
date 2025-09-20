/**
 * Enhanced Lens Scoring Algorithm with Advanced Use-Case Support
 * Extends the existing Phase E scoring system with additional use cases,
 * improved brightness calculations, and enhanced UST handling
 */

import type { Lens, InstallationConstraints, ScreenData } from "./lensCalculatorTypes";
import { isSpecialUSTLens, validateUSTCompatibility } from "./ustCalculations";
import { validateManufacturerCompatibility } from "./manufacturerNormalization";

// =============================================================================
// ENHANCED SCORING CONFIGURATION
// =============================================================================

export interface EnhancedScoringWeights {
  throwRatio: number;
  zoomPosition: number;
  brightness: number;
  lensShift: number;
  ergonomics: number;
  specialFeatures: number;
  ustHandling: number; // New: UST-specific scoring
  manufacturerMatch: number; // New: Cross-manufacturer penalties
  environmentalSuitability: number; // New: Environment-specific factors
}

export interface EnhancedScoringProfile {
  name: string;
  description: string;
  targetFootLamberts: number;
  brightnessRange: {
    minimum: number;
    optimal: number;
    maximum: number;
  };
  weights: EnhancedScoringWeights;
  penalties: {
    zoomEdgePenalty: number;
    shiftLimitPenalty: number;
    brightnessShortfall: number;
    brightnessOverage: number;
    ustOffsetPenalty: number;
    crossManufacturerPenalty: number; // New
    environmentalMismatch: number; // New
    installationComplexity: number; // New
  };
  bonuses: {
    motorizedBonus: number;
    standardLensBonus: number;
    midRangeBonus: number;
    ustOptimizedBonus: number; // New
    environmentalSuitability: number; // New
    futureProofing: number; // New: 2024+ models
  };
  environmentalFactors: {
    indoorOptimal: boolean;
    outdoorCapable: boolean;
    temperatureRange: { min: number; max: number }; // Celsius
    humidityTolerance: number; // percentage
    dustResistance: "low" | "medium" | "high";
  };
}

// Enhanced scoring profiles with additional use cases
export const ENHANCED_SCORING_PROFILES: Record<string, EnhancedScoringProfile> = {
  cinema: {
    name: "Cinema & Theater",
    description: "Optimized for cinema, theater, and critical viewing environments",
    targetFootLamberts: 14,
    brightnessRange: { minimum: 12, optimal: 16, maximum: 22 },
    weights: {
      throwRatio: 0.25,
      zoomPosition: 0.15,
      brightness: 0.3,
      lensShift: 0.15,
      ergonomics: 0.05,
      specialFeatures: 0.05,
      ustHandling: 0.03,
      manufacturerMatch: 0.015,
      environmentalSuitability: 0.005,
    },
    penalties: {
      zoomEdgePenalty: 15,
      shiftLimitPenalty: 25,
      brightnessShortfall: 4.0,
      brightnessOverage: 1.5,
      ustOffsetPenalty: 60,
      crossManufacturerPenalty: 30,
      environmentalMismatch: 20,
      installationComplexity: 10,
    },
    bonuses: {
      motorizedBonus: 8,
      standardLensBonus: 12,
      midRangeBonus: 6,
      ustOptimizedBonus: 15,
      environmentalSuitability: 5,
      futureProofing: 3,
    },
    environmentalFactors: {
      indoorOptimal: true,
      outdoorCapable: false,
      temperatureRange: { min: 18, max: 24 },
      humidityTolerance: 60,
      dustResistance: "medium",
    },
  },

  presentation: {
    name: "Presentation & Conference",
    description: "Balanced for conference rooms, classrooms, and general presentations",
    targetFootLamberts: 30,
    brightnessRange: { minimum: 25, optimal: 35, maximum: 50 },
    weights: {
      throwRatio: 0.2,
      zoomPosition: 0.12,
      brightness: 0.25,
      lensShift: 0.25,
      ergonomics: 0.12,
      specialFeatures: 0.03,
      ustHandling: 0.02,
      manufacturerMatch: 0.005,
      environmentalSuitability: 0.005,
    },
    penalties: {
      zoomEdgePenalty: 12,
      shiftLimitPenalty: 20,
      brightnessShortfall: 2.5,
      brightnessOverage: 0.8,
      ustOffsetPenalty: 45,
      crossManufacturerPenalty: 15,
      environmentalMismatch: 10,
      installationComplexity: 15,
    },
    bonuses: {
      motorizedBonus: 12,
      standardLensBonus: 8,
      midRangeBonus: 4,
      ustOptimizedBonus: 10,
      environmentalSuitability: 3,
      futureProofing: 2,
    },
    environmentalFactors: {
      indoorOptimal: true,
      outdoorCapable: false,
      temperatureRange: { min: 16, max: 28 },
      humidityTolerance: 70,
      dustResistance: "medium",
    },
  },

  bright_venue: {
    name: "Bright Venue & Trade Show",
    description: "High brightness for trade shows, retail, and bright environments",
    targetFootLamberts: 50,
    brightnessRange: { minimum: 40, optimal: 60, maximum: 100 },
    weights: {
      throwRatio: 0.15,
      zoomPosition: 0.08,
      brightness: 0.4,
      lensShift: 0.2,
      ergonomics: 0.1,
      specialFeatures: 0.04,
      ustHandling: 0.02,
      manufacturerMatch: 0.005,
      environmentalSuitability: 0.005,
    },
    penalties: {
      zoomEdgePenalty: 10,
      shiftLimitPenalty: 15,
      brightnessShortfall: 5.0,
      brightnessOverage: 0.3,
      ustOffsetPenalty: 35,
      crossManufacturerPenalty: 10,
      environmentalMismatch: 15,
      installationComplexity: 20,
    },
    bonuses: {
      motorizedBonus: 15,
      standardLensBonus: 5,
      midRangeBonus: 2,
      ustOptimizedBonus: 8,
      environmentalSuitability: 5,
      futureProofing: 4,
    },
    environmentalFactors: {
      indoorOptimal: true,
      outdoorCapable: true,
      temperatureRange: { min: 10, max: 35 },
      humidityTolerance: 80,
      dustResistance: "high",
    },
  },

  outdoor: {
    name: "Outdoor & Stadium",
    description: "Ultra-high brightness for outdoor events and large venues",
    targetFootLamberts: 80,
    brightnessRange: { minimum: 60, optimal: 100, maximum: 200 },
    weights: {
      throwRatio: 0.12,
      zoomPosition: 0.06,
      brightness: 0.5,
      lensShift: 0.15,
      ergonomics: 0.1,
      specialFeatures: 0.04,
      ustHandling: 0.01,
      manufacturerMatch: 0.01,
      environmentalSuitability: 0.01,
    },
    penalties: {
      zoomEdgePenalty: 8,
      shiftLimitPenalty: 10,
      brightnessShortfall: 6.0,
      brightnessOverage: 0.2,
      ustOffsetPenalty: 25,
      crossManufacturerPenalty: 5,
      environmentalMismatch: 25,
      installationComplexity: 30,
    },
    bonuses: {
      motorizedBonus: 20,
      standardLensBonus: 3,
      midRangeBonus: 1,
      ustOptimizedBonus: 5,
      environmentalSuitability: 10,
      futureProofing: 5,
    },
    environmentalFactors: {
      indoorOptimal: false,
      outdoorCapable: true,
      temperatureRange: { min: -10, max: 45 },
      humidityTolerance: 95,
      dustResistance: "high",
    },
  },

  mapping: {
    name: "Projection Mapping",
    description: "Optimized for architectural projection mapping and art installations",
    targetFootLamberts: 25,
    brightnessRange: { minimum: 15, optimal: 30, maximum: 60 },
    weights: {
      throwRatio: 0.18,
      zoomPosition: 0.12,
      brightness: 0.2,
      lensShift: 0.3,
      ergonomics: 0.08,
      specialFeatures: 0.08,
      ustHandling: 0.03,
      manufacturerMatch: 0.005,
      environmentalSuitability: 0.005,
    },
    penalties: {
      zoomEdgePenalty: 18,
      shiftLimitPenalty: 30,
      brightnessShortfall: 3.0,
      brightnessOverage: 1.0,
      ustOffsetPenalty: 70,
      crossManufacturerPenalty: 20,
      environmentalMismatch: 30,
      installationComplexity: 5,
    },
    bonuses: {
      motorizedBonus: 25,
      standardLensBonus: 8,
      midRangeBonus: 6,
      ustOptimizedBonus: 20,
      environmentalSuitability: 8,
      futureProofing: 4,
    },
    environmentalFactors: {
      indoorOptimal: true,
      outdoorCapable: true,
      temperatureRange: { min: 0, max: 40 },
      humidityTolerance: 85,
      dustResistance: "medium",
    },
  },

  museum: {
    name: "Museum & Gallery",
    description: "Optimized for museums, galleries, and sensitive lighting environments",
    targetFootLamberts: 18,
    brightnessRange: { minimum: 12, optimal: 20, maximum: 30 },
    weights: {
      throwRatio: 0.22,
      zoomPosition: 0.15,
      brightness: 0.25,
      lensShift: 0.2,
      ergonomics: 0.08,
      specialFeatures: 0.06,
      ustHandling: 0.03,
      manufacturerMatch: 0.005,
      environmentalSuitability: 0.005,
    },
    penalties: {
      zoomEdgePenalty: 20,
      shiftLimitPenalty: 25,
      brightnessShortfall: 3.5,
      brightnessOverage: 2.0,
      ustOffsetPenalty: 50,
      crossManufacturerPenalty: 25,
      environmentalMismatch: 15,
      installationComplexity: 8,
    },
    bonuses: {
      motorizedBonus: 15,
      standardLensBonus: 10,
      midRangeBonus: 8,
      ustOptimizedBonus: 12,
      environmentalSuitability: 6,
      futureProofing: 3,
    },
    environmentalFactors: {
      indoorOptimal: true,
      outdoorCapable: false,
      temperatureRange: { min: 20, max: 24 },
      humidityTolerance: 50,
      dustResistance: "high",
    },
  },

  simulation: {
    name: "Simulation & Training",
    description:
      "Optimized for flight simulators, training environments, and immersive experiences",
    targetFootLamberts: 40,
    brightnessRange: { minimum: 30, optimal: 45, maximum: 70 },
    weights: {
      throwRatio: 0.2,
      zoomPosition: 0.1,
      brightness: 0.28,
      lensShift: 0.25,
      ergonomics: 0.1,
      specialFeatures: 0.05,
      ustHandling: 0.015,
      manufacturerMatch: 0.002,
      environmentalSuitability: 0.003,
    },
    penalties: {
      zoomEdgePenalty: 15,
      shiftLimitPenalty: 20,
      brightnessShortfall: 4.0,
      brightnessOverage: 1.0,
      ustOffsetPenalty: 40,
      crossManufacturerPenalty: 8,
      environmentalMismatch: 12,
      installationComplexity: 12,
    },
    bonuses: {
      motorizedBonus: 18,
      standardLensBonus: 6,
      midRangeBonus: 4,
      ustOptimizedBonus: 8,
      environmentalSuitability: 4,
      futureProofing: 5,
    },
    environmentalFactors: {
      indoorOptimal: true,
      outdoorCapable: false,
      temperatureRange: { min: 18, max: 26 },
      humidityTolerance: 65,
      dustResistance: "medium",
    },
  },
};

// =============================================================================
// ENHANCED SCORING CONTEXT
// =============================================================================

export interface EnhancedScoringContext {
  useCase: keyof typeof ENHANCED_SCORING_PROFILES;
  screenData: ScreenData;
  projectorLumens: number;
  projectorManufacturer: string;
  installationConstraints: InstallationConstraints;
  lens: Lens;
  targetThrowRatio: number;
  environmentalConditions?: {
    indoor: boolean;
    temperature?: number; // Celsius
    humidity?: number; // percentage
    dustLevel?: "low" | "medium" | "high";
  };
  projectRequirements?: {
    longTermInstallation: boolean;
    criticalApplication: boolean;
    budgetSensitive: boolean;
  };
}

export interface EnhancedScoringResult {
  totalScore: number;
  confidence: number;
  compatibility: "excellent" | "good" | "acceptable" | "poor" | "incompatible";
  breakdown: {
    throwRatio: { score: number; details: string };
    zoomPosition: { score: number; position: number; details: string };
    brightness: { score: number; actualFL: number; targetFL: number; adequacy: string };
    lensShift: { score: number; utilization: number; feasible: boolean; details: string };
    ergonomics: { score: number; features: string[]; details: string };
    specialFeatures: { score: number; considerations: string[] };
    ustHandling: {
      score: number;
      classification: { isUST: boolean; type?: string; confidence: number };
      warnings: string[];
    };
    manufacturerMatch: { score: number; crossManufacturer: boolean; warnings: string[] };
    environmentalSuitability: { score: number; factors: string[] };
  };
  warnings: string[];
  recommendations: string[];
  installationGuidance: string[];
}

// =============================================================================
// ENHANCED SCORING ALGORITHM
// =============================================================================

/**
 * Enhanced lens scoring with comprehensive use-case optimization
 */
export function scoreLensEnhanced(context: EnhancedScoringContext): EnhancedScoringResult {
  const profile = ENHANCED_SCORING_PROFILES[context.useCase];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const installationGuidance: string[] = [];

  // 1. Throw Ratio & Zoom Position Scoring
  const throwRatioResult = scoreThrowRatioEnhanced(context, profile);

  // 2. Brightness Analysis with ANSI/Center conversion
  const brightnessResult = scoreBrightnessEnhanced(context, profile);

  // 3. Lens Shift with Elliptical Model
  const lensShiftResult = scoreLensShiftEnhanced(context, profile);

  // 4. Ergonomics & Features
  const ergonomicsResult = scoreErgonomicsEnhanced(context.lens, profile);

  // 5. Special Features Analysis
  const specialFeaturesResult = scoreSpecialFeaturesEnhanced(context.lens, profile);

  // 6. UST Handling (New)
  const ustResult = scoreUSTHandlingEnhanced(context, profile);

  // 7. Manufacturer Compatibility (New)
  const manufacturerResult = scoreManufacturerCompatibility(
    context.projectorManufacturer,
    context.lens.manufacturer,
    profile,
  );

  // 8. Environmental Suitability (New)
  const environmentalResult = scoreEnvironmentalSuitability(context, profile);

  // Collect all warnings and recommendations
  warnings.push(...throwRatioResult.warnings);
  warnings.push(...brightnessResult.warnings);
  warnings.push(...lensShiftResult.warnings);
  warnings.push(...ustResult.warnings);
  warnings.push(...manufacturerResult.warnings);
  warnings.push(...environmentalResult.warnings);

  recommendations.push(...throwRatioResult.recommendations);
  recommendations.push(...brightnessResult.recommendations);
  recommendations.push(...lensShiftResult.recommendations);

  // Calculate weighted total score
  const componentScores = {
    throwRatio: throwRatioResult.score * profile.weights.throwRatio,
    zoomPosition: throwRatioResult.zoomScore * profile.weights.zoomPosition,
    brightness: brightnessResult.score * profile.weights.brightness,
    lensShift: lensShiftResult.score * profile.weights.lensShift,
    ergonomics: ergonomicsResult.score * profile.weights.ergonomics,
    specialFeatures: specialFeaturesResult.score * profile.weights.specialFeatures,
    ustHandling: ustResult.score * profile.weights.ustHandling,
    manufacturerMatch: manufacturerResult.score * profile.weights.manufacturerMatch,
    environmentalSuitability: environmentalResult.score * profile.weights.environmentalSuitability,
  };

  const totalScore = Object.values(componentScores).reduce((sum, score) => sum + score, 0);

  // Determine compatibility level
  let compatibility: EnhancedScoringResult["compatibility"];
  let confidence = 1.0;

  if (totalScore >= 90) {
    compatibility = "excellent";
  } else if (totalScore >= 75) {
    compatibility = "good";
  } else if (totalScore >= 60) {
    compatibility = "acceptable";
  } else if (totalScore >= 40) {
    compatibility = "poor";
    confidence = 0.7;
  } else {
    compatibility = "incompatible";
    confidence = 0.3;
  }

  // Adjust confidence based on manufacturer match
  if (manufacturerResult.crossManufacturer) {
    confidence *= 0.8;
  }

  // Add installation guidance
  if (ustResult.classification.isUST) {
    installationGuidance.push(...generateUSTInstallationGuidance(context.lens));
  } else {
    installationGuidance.push(...generateStandardInstallationGuidance(context, profile));
  }

  return {
    totalScore: Math.min(100, Math.max(0, totalScore)),
    confidence,
    compatibility,
    breakdown: {
      throwRatio: {
        score: componentScores.throwRatio,
        details: throwRatioResult.details,
      },
      zoomPosition: {
        score: componentScores.zoomPosition,
        position: throwRatioResult.zoomPosition,
        details: `Operating at ${(throwRatioResult.zoomPosition * 100).toFixed(1)}% of zoom range`,
      },
      brightness: {
        score: componentScores.brightness,
        actualFL: brightnessResult.actualFL,
        targetFL: profile.targetFootLamberts,
        adequacy: brightnessResult.adequacy,
      },
      lensShift: {
        score: componentScores.lensShift,
        utilization: lensShiftResult.utilization,
        feasible: lensShiftResult.feasible,
        details: lensShiftResult.details,
      },
      ergonomics: {
        score: componentScores.ergonomics,
        features: ergonomicsResult.features,
        details: ergonomicsResult.details,
      },
      specialFeatures: {
        score: componentScores.specialFeatures,
        considerations: specialFeaturesResult.considerations,
      },
      ustHandling: {
        score: componentScores.ustHandling,
        classification: ustResult.classification,
        warnings: ustResult.warnings,
      },
      manufacturerMatch: {
        score: componentScores.manufacturerMatch,
        crossManufacturer: manufacturerResult.crossManufacturer,
        warnings: manufacturerResult.warnings,
      },
      environmentalSuitability: {
        score: componentScores.environmentalSuitability,
        factors: environmentalResult.factors,
      },
    },
    warnings: Array.from(new Set(warnings)), // Remove duplicates
    recommendations: Array.from(new Set(recommendations)),
    installationGuidance,
  };
}

// =============================================================================
// ENHANCED SCORING COMPONENT FUNCTIONS
// =============================================================================

function scoreThrowRatioEnhanced(
  context: EnhancedScoringContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _profile: EnhancedScoringProfile,
): {
  score: number;
  zoomScore: number;
  zoomPosition: number;
  warnings: string[];
  recommendations: string[];
  details: string;
} {
  const { lens, targetThrowRatio } = context;
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Hard validation
  if (targetThrowRatio < lens.throw_ratio_min || targetThrowRatio > lens.throw_ratio_max) {
    return {
      score: 0,
      zoomScore: 0,
      zoomPosition: 0,
      warnings: [`Required ratio ${targetThrowRatio.toFixed(2)}:1 outside lens range`],
      recommendations: ["Consider different lens or adjust installation distance"],
      details: "Incompatible throw ratio",
    };
  }

  // Calculate zoom position
  const zoomRange = lens.throw_ratio_max - lens.throw_ratio_min;
  const zoomPosition =
    zoomRange > 0.01 ? (targetThrowRatio - lens.throw_ratio_min) / zoomRange : 0.5;

  let score = 100;
  let zoomScore = 100;

  // Zoom sweet spot analysis
  if (zoomPosition < 0.15) {
    zoomScore = 40;
    warnings.push("Operating near wide zoom limit - reduced sharpness possible");
    recommendations.push("Consider shorter throw lens if available");
  } else if (zoomPosition < 0.3) {
    zoomScore = 70;
  } else if (zoomPosition > 0.85) {
    zoomScore = 40;
    warnings.push("Operating near tele zoom limit - reduced brightness possible");
    recommendations.push("Consider longer throw lens if available");
  } else if (zoomPosition > 0.7) {
    zoomScore = 70;
  }

  // Use case specific preferences
  if (context.useCase === "cinema" && targetThrowRatio < 1.2) {
    score -= 15; // Cinema prefers longer throws for better uniformity
  } else if (context.useCase === "mapping" && targetThrowRatio > 3.0) {
    score -= 20; // Mapping prefers shorter throws for flexibility
  }

  return {
    score,
    zoomScore,
    zoomPosition,
    warnings,
    recommendations,
    details: `Throw ratio ${targetThrowRatio.toFixed(2)}:1, zoom at ${(zoomPosition * 100).toFixed(1)}%`,
  };
}

function scoreBrightnessEnhanced(
  context: EnhancedScoringContext,
  profile: EnhancedScoringProfile,
): {
  score: number;
  actualFL: number;
  adequacy: string;
  warnings: string[];
  recommendations: string[];
} {
  const screenAreaFt2 = context.screenData.width * context.screenData.height;
  const screenGain = context.screenData.gain || 1.0;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Add input validation before brightness calculation
  if (screenAreaFt2 <= 0) {
    warnings.push("Invalid screen dimensions (non-positive area) for brightness calculation");
    return {
      score: 0,
      actualFL: 0,
      adequacy: "insufficient",
      warnings,
      recommendations,
    };
  }

  if (!context.projectorLumens || context.projectorLumens <= 0) {
    warnings.push("Invalid projector lumens value");
    return {
      score: 0,
      actualFL: 0,
      adequacy: "insufficient",
      warnings,
      recommendations,
    };
  }

  // Industry-standard brightness calculation:
  // 1. Convert ANSI to center lumens (ANSI is typically 90% of center)
  const centerLumens = context.projectorLumens / 0.9;
  // 2. Apply formula: Foot-Lamberts = (Center Lumens × Screen Gain) / Screen Area (ft²)
  const actualFL = (centerLumens * screenGain) / screenAreaFt2;

  const { minimum, optimal, maximum } = profile.brightnessRange;

  let score = 100;
  let adequacy = "optimal";

  if (actualFL < minimum) {
    const deficit = (minimum - actualFL) / minimum;
    if (deficit > 0.5) {
      score = 0;
      adequacy = "insufficient";
      warnings.push(
        `Brightness critically low: ${actualFL.toFixed(1)} fL (minimum: ${minimum} fL)`,
      );
      recommendations.push("Consider higher brightness projector or smaller screen");
    } else {
      score = 30 + 40 * (actualFL / minimum);
      adequacy = "low";
      warnings.push(`Brightness below recommended minimum`);
    }
  } else if (actualFL > maximum) {
    const excess = (actualFL - maximum) / maximum;
    if (excess > 1.0) {
      score = 50;
      adequacy = "excessive";
      warnings.push(`Excessive brightness may cause eye strain`);
      recommendations.push("Consider ND filter or eco mode operation");
    } else {
      score = 100 - 20 * excess;
      adequacy = "high";
    }
  } else if (actualFL >= optimal * 0.9 && actualFL <= optimal * 1.2) {
    adequacy = "excellent";
  }

  return {
    score,
    actualFL,
    adequacy,
    warnings,
    recommendations,
  };
}

function scoreLensShiftEnhanced(
  context: EnhancedScoringContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _profile: EnhancedScoringProfile,
): {
  score: number;
  utilization: number;
  feasible: boolean;
  warnings: string[];
  recommendations: string[];
  details: string;
} {
  const vReq = context.installationConstraints.requiredVShiftPct || 0;
  const hReq = context.installationConstraints.requiredHShiftPct || 0;
  const vMax = context.lens.lens_shift_v_max || 0;
  const hMax = context.lens.lens_shift_h_max || 0;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  // No shift required
  if (vReq === 0 && hReq === 0) {
    return {
      score: 100,
      utilization: 0,
      feasible: true,
      warnings: [],
      recommendations: [],
      details: "No lens shift required",
    };
  }

  // Check feasibility using elliptical model
  const vNorm = vMax ? (vReq / vMax) ** 2 : 0;
  const hNorm = hMax ? (hReq / hMax) ** 2 : 0;
  const ellipseFactor = vNorm + hNorm;
  const feasible = ellipseFactor <= 1.0;

  if (!feasible) {
    warnings.push("Required shift exceeds lens capability (elliptical constraint)");
    recommendations.push("Consider repositioning projector or using different lens");
    return {
      score: 0,
      utilization: 1,
      feasible: false,
      warnings,
      recommendations,
      details: "Shift requirements not feasible",
    };
  }

  const utilization = Math.sqrt(ellipseFactor);
  let score = 100;

  if (utilization > 0.8) {
    score = 40;
    warnings.push("Operating near shift limits - installation precision critical");
    recommendations.push("Consider repositioning projector for better alignment");
  } else if (utilization > 0.6) {
    score = 70;
  }

  // Apply corner reduction penalty for high combined shifts
  if (vReq > vMax * 0.7 && hReq > hMax * 0.7) {
    score *= 0.7;
    warnings.push("Combined shift reduces available range");
  }

  return {
    score,
    utilization,
    feasible: true,
    warnings,
    recommendations,
    details: `Shift utilization: ${(utilization * 100).toFixed(1)}% of elliptical limit`,
  };
}

function scoreErgonomicsEnhanced(
  lens: Lens,
  profile: EnhancedScoringProfile,
): {
  score: number;
  features: string[];
  details: string;
} {
  let score = 0;
  const features: string[] = [];

  // Motorized features
  if (lens.motorized) {
    score += profile.bonuses.motorizedBonus;
    features.push("Motorized zoom/focus");
  }

  // Lens shift capability
  if ((lens.lens_shift_v_max || 0) > 0 || (lens.lens_shift_h_max || 0) > 0) {
    score += 5;
    features.push("Lens shift capability");
  }

  // High-quality shift ranges
  if ((lens.lens_shift_v_max || 0) > 50) {
    score += 5;
    features.push("Extensive vertical shift");
  }
  if ((lens.lens_shift_h_max || 0) > 30) {
    score += 5;
    features.push("Extensive horizontal shift");
  }

  // Lens type preferences
  if (lens.lens_type === "Standard") {
    score += profile.bonuses.standardLensBonus;
    features.push("Standard lens type");
  }

  // Zoom capability
  if (lens.zoom_type === "Zoom") {
    score += 8;
    features.push("Zoom lens flexibility");
  }

  return {
    score: Math.min(100, score),
    features,
    details: features.length > 0 ? features.join(", ") : "Basic lens features",
  };
}

function scoreSpecialFeaturesEnhanced(
  lens: Lens,
  profile: EnhancedScoringProfile,
): {
  score: number;
  considerations: string[];
} {
  let score = 0;
  const considerations: string[] = [];

  // High-performance features
  if (lens.optical_features?.high_contrast) {
    score += 10;
    considerations.push("High contrast optics");
  }

  if (lens.optical_features?.ultra_wide_angle) {
    score += 5;
    considerations.push("Ultra-wide angle capability");
  }

  if (lens.optical_features?.cinema_grade) {
    score += 15;
    considerations.push("Cinema-grade optics");
  }

  // Future-proofing bonus for newer models
  if (lens.optical_features?.year && parseInt(lens.optical_features.year as string) >= 2024) {
    score += profile.bonuses.futureProofing;
    considerations.push("Latest generation technology");
  }

  return {
    score: Math.min(100, score),
    considerations,
  };
}

function scoreUSTHandlingEnhanced(
  context: EnhancedScoringContext,
  profile: EnhancedScoringProfile,
): {
  score: number;
  classification: { isUST: boolean; type?: string; confidence: number };
  warnings: string[];
} {
  const ustClassification = isSpecialUSTLens(context.lens);
  const warnings: string[] = [];
  let score = 100;

  if (!ustClassification.isUST) {
    return { score: 100, classification: ustClassification, warnings: [] };
  }

  // Validate UST compatibility
  const ustCompatibility = validateUSTCompatibility(
    context.lens,
    context.installationConstraints,
    context.screenData.height * 12, // Convert to inches
  );

  if (!ustCompatibility.compatible) {
    score = 0;
    warnings.push(...ustCompatibility.warnings);
  } else {
    score = ustCompatibility.confidence * 100;
    warnings.push(...ustCompatibility.warnings);

    // Bonus for use cases that benefit from UST
    if (context.useCase === "mapping" || context.useCase === "museum") {
      score += profile.bonuses.ustOptimizedBonus;
    }
  }

  return {
    score: Math.min(100, score),
    classification: ustClassification,
    warnings,
  };
}

function scoreManufacturerCompatibility(
  projectorMfg: string,
  lensMfg: string,
  profile: EnhancedScoringProfile,
): {
  score: number;
  crossManufacturer: boolean;
  warnings: string[];
} {
  const compatibility = validateManufacturerCompatibility(projectorMfg, lensMfg);

  if (!compatibility.compatible) {
    return {
      score: 100 - profile.penalties.crossManufacturerPenalty,
      crossManufacturer: true,
      warnings: compatibility.warnings,
    };
  }

  return {
    score: 100 * compatibility.confidence,
    crossManufacturer: compatibility.crossManufacturer,
    warnings: compatibility.warnings,
  };
}

function scoreEnvironmentalSuitability(
  context: EnhancedScoringContext,
  profile: EnhancedScoringProfile,
): {
  score: number;
  factors: string[];
  warnings: string[];
} {
  let score = 100;
  const factors: string[] = [];
  const warnings: string[] = [];

  const envConditions = context.environmentalConditions;
  const envFactors = profile.environmentalFactors;

  if (envConditions) {
    // Indoor/outdoor suitability
    if (envConditions.indoor && !envFactors.indoorOptimal) {
      score -= profile.penalties.environmentalMismatch;
      warnings.push("Lens not optimized for indoor use");
    } else if (!envConditions.indoor && !envFactors.outdoorCapable) {
      score -= profile.penalties.environmentalMismatch * 2;
      warnings.push("Lens not suitable for outdoor use");
    }

    // Temperature compatibility
    if (envConditions.temperature) {
      if (
        envConditions.temperature < envFactors.temperatureRange.min ||
        envConditions.temperature > envFactors.temperatureRange.max
      ) {
        score -= profile.penalties.environmentalMismatch;
        warnings.push("Operating temperature outside lens specifications");
      }
    }

    // Add positive factors
    if (envConditions.indoor && envFactors.indoorOptimal) {
      factors.push("Indoor optimized");
    }
    if (!envConditions.indoor && envFactors.outdoorCapable) {
      factors.push("Outdoor capable");
    }
  }

  return {
    score: Math.max(0, score),
    factors,
    warnings,
  };
}

// Helper functions for installation guidance
function generateUSTInstallationGuidance(lens: Lens): string[] {
  const guidance = [
    "UST Installation Requirements:",
    "• Verify screen flatness within ±2mm tolerance",
    "• Use precision mounting hardware",
    "• Follow manufacturer distance specifications exactly",
    "• Minimize projector vibration",
  ];

  const ustClass = isSpecialUSTLens(lens);
  if (ustClass.type === "zero_offset") {
    guidance.push("• CRITICAL: No vertical positioning tolerance");
    guidance.push("• Professional installation strongly recommended");
  }

  return guidance;
}

function generateStandardInstallationGuidance(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: EnhancedScoringContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _profile: EnhancedScoringProfile,
): string[] {
  return [
    "Standard Installation Guidelines:",
    "• Allow for lens shift adjustments during installation",
    "• Verify throw distance calculations before mounting",
    "• Plan for ambient light control",
    "• Consider screen gain for brightness optimization",
  ];
}

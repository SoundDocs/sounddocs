/**
 * Phase E: Comprehensive Lens Scoring Algorithm
 *
 * This module provides a complete rewrite of the lens scoring system with:
 * - Proper throw ratio validation and zoom positioning
 * - Realistic shift feasibility with comfort margins
 * - Foot-Lambert brightness targets by use case
 * - UST zero-offset handling
 * - Motorized lens bonuses
 * - Detailed scoring breakdown and reporting
 */

import type { Lens, InstallationConstraints } from "./lensCalculatorTypes";

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

export interface ScoringWeights {
  throwRatio: number; // Weight for throw ratio compatibility (0-1)
  zoomPosition: number; // Weight for zoom sweet-spot positioning (0-1)
  brightness: number; // Weight for brightness adequacy (0-1)
  lensShift: number; // Weight for lens shift feasibility (0-1)
  ergonomics: number; // Weight for ergonomic features (0-1)
  specialFeatures: number; // Weight for special considerations (0-1)
}

export interface ScoringProfile {
  name: string;
  description: string;
  targetFootLamberts: number;
  weights: ScoringWeights;
  penalties: {
    zoomEdgePenalty: number; // Penalty for extreme zoom positions
    shiftLimitPenalty: number; // Penalty multiplier for high shift utilization
    brightnessShortfall: number; // Penalty per fL below target
    brightnessOverage: number; // Penalty multiplier for excessive brightness
    ustOffsetPenalty: number; // Penalty for UST with vertical offset
  };
  bonuses: {
    motorizedBonus: number; // Bonus for motorized features
    standardLensBonus: number; // Bonus for standard lens types
    midRangeBonus: number; // Bonus for mid-range throw ratios
  };
}

// Predefined scoring profiles for different use cases
export const SCORING_PROFILES: Record<string, ScoringProfile> = {
  cinema: {
    name: "Cinema",
    description: "Optimized for cinema and critical viewing environments",
    targetFootLamberts: 14,
    weights: {
      throwRatio: 0.3,
      zoomPosition: 0.2,
      brightness: 0.25,
      lensShift: 0.15,
      ergonomics: 0.05,
      specialFeatures: 0.05,
    },
    penalties: {
      zoomEdgePenalty: 15,
      shiftLimitPenalty: 25,
      brightnessShortfall: 3.0,
      brightnessOverage: 1.0,
      ustOffsetPenalty: 60,
    },
    bonuses: {
      motorizedBonus: 8,
      standardLensBonus: 10,
      midRangeBonus: 5,
    },
  },
  presentation: {
    name: "Presentation",
    description: "Balanced for conference rooms and general presentations",
    targetFootLamberts: 30,
    weights: {
      throwRatio: 0.25,
      zoomPosition: 0.15,
      brightness: 0.2,
      lensShift: 0.2,
      ergonomics: 0.15,
      specialFeatures: 0.05,
    },
    penalties: {
      zoomEdgePenalty: 12,
      shiftLimitPenalty: 20,
      brightnessShortfall: 2.0,
      brightnessOverage: 0.5,
      ustOffsetPenalty: 50,
    },
    bonuses: {
      motorizedBonus: 10,
      standardLensBonus: 5,
      midRangeBonus: 3,
    },
  },
  brightVenue: {
    name: "Bright Venue",
    description: "High brightness for trade shows and bright environments",
    targetFootLamberts: 50,
    weights: {
      throwRatio: 0.2,
      zoomPosition: 0.1,
      brightness: 0.35,
      lensShift: 0.15,
      ergonomics: 0.15,
      specialFeatures: 0.05,
    },
    penalties: {
      zoomEdgePenalty: 10,
      shiftLimitPenalty: 15,
      brightnessShortfall: 4.0,
      brightnessOverage: 0.3,
      ustOffsetPenalty: 40,
    },
    bonuses: {
      motorizedBonus: 12,
      standardLensBonus: 3,
      midRangeBonus: 2,
    },
  },
  outdoor: {
    name: "Outdoor",
    description: "Ultra-high brightness for outdoor events",
    targetFootLamberts: 80,
    weights: {
      throwRatio: 0.15,
      zoomPosition: 0.1,
      brightness: 0.45,
      lensShift: 0.1,
      ergonomics: 0.15,
      specialFeatures: 0.05,
    },
    penalties: {
      zoomEdgePenalty: 8,
      shiftLimitPenalty: 10,
      brightnessShortfall: 5.0,
      brightnessOverage: 0.2,
      ustOffsetPenalty: 30,
    },
    bonuses: {
      motorizedBonus: 15,
      standardLensBonus: 2,
      midRangeBonus: 1,
    },
  },
};

// =============================================================================
// SCORING BREAKDOWN INTERFACE
// =============================================================================

export interface ScoringBreakdown {
  totalScore: number;
  maxPossibleScore: number;
  compatibility: "excellent" | "good" | "acceptable" | "poor" | "incompatible";

  components: {
    throwRatio: {
      score: number;
      maxScore: number;
      details: string;
      valid: boolean;
    };
    zoomPosition: {
      score: number;
      maxScore: number;
      position: number; // 0-1 within zoom range
      details: string;
    };
    brightness: {
      score: number;
      maxScore: number;
      actualFL: number;
      targetFL: number;
      adequacy: "excellent" | "good" | "adequate" | "insufficient" | "excessive";
      details: string;
    };
    lensShift: {
      score: number;
      maxScore: number;
      utilization: number; // 0-1 elliptical utilization
      feasible: boolean;
      details: string;
    };
    ergonomics: {
      score: number;
      maxScore: number;
      features: string[];
      details: string;
    };
    specialFeatures: {
      score: number;
      maxScore: number;
      considerations: string[];
      details: string;
    };
  };

  warnings: string[];
  recommendations: string[];
}

// =============================================================================
// CORE SCORING FUNCTIONS
// =============================================================================

/**
 * Calculate foot-Lamberts from projector lumens, screen area, and gain
 */
export function calculateFootLamberts(lumens: number, screenAreaFt2: number, gain: number): number {
  return (lumens * gain) / Math.max(screenAreaFt2, 0.1);
}

/**
 * Check if lens shift requirements are feasible using elliptical model
 */
export function isShiftFeasible(
  requiredVPct: number,
  requiredHPct: number,
  maxVPct: number,
  maxHPct: number,
): boolean {
  if (!maxVPct && !maxHPct) return requiredVPct === 0 && requiredHPct === 0;

  const vNorm = maxVPct ? (requiredVPct / maxVPct) ** 2 : 0;
  const hNorm = maxHPct ? (requiredHPct / maxHPct) ** 2 : 0;

  return vNorm + hNorm <= 1.0;
}

/**
 * Calculate elliptical shift utilization (0-1)
 */
export function calculateShiftUtilization(
  requiredVPct: number,
  requiredHPct: number,
  maxVPct: number,
  maxHPct: number,
): number {
  if (!maxVPct && !maxHPct) return 0;

  const vNorm = maxVPct ? (requiredVPct / maxVPct) ** 2 : 0;
  const hNorm = maxHPct ? (requiredHPct / maxHPct) ** 2 : 0;

  return Math.min(1.0, Math.sqrt(vNorm + hNorm));
}

/**
 * Detect UST lenses with zero offset capability
 */
export function isUSTZeroOffset(lens: Lens): boolean {
  return (
    lens.optical_features?.zero_offset === true ||
    (lens.lens_type === "UST" && lens.throw_ratio_max < 0.5)
  );
}

/**
 * Calculate zoom position within lens range (0-1)
 */
export function calculateZoomPosition(
  targetRatio: number,
  minRatio: number,
  maxRatio: number,
): number {
  if (maxRatio <= minRatio) return 0.5; // Fixed lens
  return (targetRatio - minRatio) / (maxRatio - minRatio);
}

// =============================================================================
// INDIVIDUAL SCORING COMPONENTS
// =============================================================================

/**
 * Score throw ratio compatibility and positioning
 */
function scoreThrowRatio(
  targetRatio: number,
  lens: Lens,
  profile: ScoringProfile,
): { score: number; valid: boolean; details: string; position: number } {
  const baseScore = 100;

  // Hard validation - lens must support the required throw ratio
  if (targetRatio < lens.throw_ratio_min || targetRatio > lens.throw_ratio_max) {
    return {
      score: 0,
      valid: false,
      details: `Required ratio ${targetRatio.toFixed(2)}:1 outside lens range ${lens.throw_ratio_min.toFixed(2)}-${lens.throw_ratio_max.toFixed(2)}:1`,
      position: 0,
    };
  }

  // Calculate zoom position
  const position = calculateZoomPosition(targetRatio, lens.throw_ratio_min, lens.throw_ratio_max);
  let score = baseScore;

  // Prefer middle zoom range (sweet spot)
  if (position < 0.15 || position > 0.85) {
    score -= profile.penalties.zoomEdgePenalty;
  } else if (position >= 0.3 && position <= 0.7) {
    score += profile.bonuses.midRangeBonus;
  }

  // Bonus for standard throw ratios (avoid extremes)
  if (targetRatio >= 1.0 && targetRatio <= 3.0) {
    score += profile.bonuses.standardLensBonus * 0.5;
  }

  return {
    score: Math.max(0, score),
    valid: true,
    details: `Zoom at ${(position * 100).toFixed(1)}% of range`,
    position,
  };
}

/**
 * Score brightness adequacy for use case
 */
function scoreBrightness(
  actualFL: number,
  profile: ScoringProfile,
): { score: number; adequacy: string; details: string } {
  const baseScore = 100;
  const targetFL = profile.targetFootLamberts;
  let score = baseScore;
  let adequacy: string;

  if (actualFL < targetFL * 0.8) {
    // Significantly under target
    const shortage = targetFL - actualFL;
    score -= shortage * profile.penalties.brightnessShortfall;
    adequacy = actualFL < targetFL * 0.5 ? "insufficient" : "adequate";
  } else if (actualFL > targetFL * 2.5) {
    // Excessive brightness
    const excess = actualFL - targetFL;
    score -= excess * profile.penalties.brightnessOverage;
    adequacy = "excessive";
  } else if (actualFL >= targetFL * 0.9 && actualFL <= targetFL * 1.5) {
    // Excellent range
    adequacy = "excellent";
  } else {
    // Good range
    adequacy = "good";
  }

  return {
    score: Math.max(0, score),
    adequacy,
    details: `${actualFL.toFixed(1)} fL (target: ${targetFL} fL, ${adequacy})`,
  };
}

/**
 * Score lens shift feasibility and comfort
 */
function scoreLensShift(
  requiredVPct: number,
  requiredHPct: number,
  lens: Lens,
  profile: ScoringProfile,
): { score: number; feasible: boolean; utilization: number; details: string } {
  const baseScore = 100;
  const maxV = lens.lens_shift_v_max || 0;
  const maxH = lens.lens_shift_h_max || 0;

  // Check if any shift is required
  if (requiredVPct === 0 && requiredHPct === 0) {
    return {
      score: baseScore,
      feasible: true,
      utilization: 0,
      details: "No lens shift required",
    };
  }

  // Check feasibility
  const feasible = isShiftFeasible(requiredVPct, requiredHPct, maxV, maxH);
  if (!feasible) {
    return {
      score: 0,
      feasible: false,
      utilization: 1,
      details: `Required shift (V:±${requiredVPct}%, H:±${requiredHPct}%) exceeds lens capability (V:±${maxV}%, H:±${maxH}%)`,
    };
  }

  // Calculate utilization and apply comfort penalty
  const utilization = calculateShiftUtilization(requiredVPct, requiredHPct, maxV, maxH);
  const comfortPenalty = utilization * profile.penalties.shiftLimitPenalty;

  return {
    score: Math.max(0, baseScore - comfortPenalty),
    feasible: true,
    utilization,
    details: `Shift utilization: ${(utilization * 100).toFixed(1)}% of elliptical limit`,
  };
}

/**
 * Score ergonomic features and usability
 */
function scoreErgonomics(
  lens: Lens,
  profile: ScoringProfile,
): { score: number; features: string[]; details: string } {
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

  // High-quality lens shift ranges
  if ((lens.lens_shift_v_max || 0) > 50) {
    score += 3;
    features.push("Extensive vertical shift");
  }
  if ((lens.lens_shift_h_max || 0) > 30) {
    score += 3;
    features.push("Extensive horizontal shift");
  }

  // Lens type preferences
  if (lens.lens_type === "Standard") {
    score += profile.bonuses.standardLensBonus;
    features.push("Standard lens type");
  }

  // Zoom vs fixed lens
  if (lens.zoom_type === "Zoom") {
    score += 5;
    features.push("Zoom lens flexibility");
  }

  return {
    score,
    features,
    details: features.length > 0 ? features.join(", ") : "Basic lens features",
  };
}

/**
 * Score special features and considerations
 */
function scoreSpecialFeatures(
  lens: Lens,
  requiredVPct: number,
  profile: ScoringProfile,
): { score: number; considerations: string[]; details: string } {
  let score = 0;
  const considerations: string[] = [];

  // UST zero-offset handling
  if (isUSTZeroOffset(lens)) {
    if (requiredVPct === 0) {
      score += 5;
      considerations.push("UST zero-offset (suitable for no vertical offset)");
    } else {
      score -= profile.penalties.ustOffsetPenalty;
      considerations.push("UST zero-offset (incompatible with vertical offset requirement)");
    }
  }

  // High-performance features
  if (lens.optical_features?.high_contrast) {
    score += 8;
    considerations.push("High contrast optics");
  }

  if (lens.optical_features?.ultra_wide_angle) {
    score += 3;
    considerations.push("Ultra-wide angle capability");
  }

  // Professional features
  if (lens.optical_features?.cinema_grade) {
    score += 10;
    considerations.push("Cinema-grade optics");
  }

  return {
    score,
    considerations,
    details: considerations.length > 0 ? considerations.join(", ") : "Standard optical features",
  };
}

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

/**
 * Comprehensive lens scoring algorithm with detailed breakdown
 */
export function scoreLensComprehensive(
  lens: Lens,
  targetRatio: number,
  actualFL: number,
  constraints: InstallationConstraints,
  profileName: string = "presentation",
): ScoringBreakdown {
  const profile = SCORING_PROFILES[profileName] || SCORING_PROFILES.presentation;
  const requiredVPct = constraints.requiredVShiftPct || 0;
  const requiredHPct = constraints.requiredHShiftPct || 0;

  // Calculate individual component scores
  const throwRatioResult = scoreThrowRatio(targetRatio, lens, profile);
  const brightnessResult = scoreBrightness(actualFL, profile);
  const lensShiftResult = scoreLensShift(requiredVPct, requiredHPct, lens, profile);
  const ergonomicsResult = scoreErgonomics(lens, profile);
  const specialFeaturesResult = scoreSpecialFeatures(lens, requiredVPct, profile);

  // Handle hard failures
  if (!throwRatioResult.valid || !lensShiftResult.feasible) {
    return {
      totalScore: 0,
      maxPossibleScore: 100,
      compatibility: "incompatible",
      components: {
        throwRatio: {
          score: throwRatioResult.score,
          maxScore: 100,
          details: throwRatioResult.details,
          valid: throwRatioResult.valid,
        },
        zoomPosition: {
          score: 0,
          maxScore: 100,
          position: throwRatioResult.position,
          details: "N/A - lens incompatible",
        },
        brightness: {
          score: brightnessResult.score,
          maxScore: 100,
          actualFL,
          targetFL: profile.targetFootLamberts,
          adequacy: brightnessResult.adequacy as any,
          details: brightnessResult.details,
        },
        lensShift: {
          score: lensShiftResult.score,
          maxScore: 100,
          utilization: lensShiftResult.utilization,
          feasible: lensShiftResult.feasible,
          details: lensShiftResult.details,
        },
        ergonomics: {
          score: ergonomicsResult.score,
          maxScore: 100,
          features: ergonomicsResult.features,
          details: ergonomicsResult.details,
        },
        specialFeatures: {
          score: specialFeaturesResult.score,
          maxScore: 100,
          considerations: specialFeaturesResult.considerations,
          details: specialFeaturesResult.details,
        },
      },
      warnings: [
        !throwRatioResult.valid ? "Lens cannot achieve required throw ratio" : "",
        !lensShiftResult.feasible ? "Lens cannot provide required shift range" : "",
      ].filter(Boolean),
      recommendations: ["Consider different lens or adjust installation constraints"],
    };
  }

  // Calculate weighted total score
  const componentScores = {
    throwRatio: throwRatioResult.score * profile.weights.throwRatio,
    zoomPosition: throwRatioResult.score * profile.weights.zoomPosition, // Same as throw ratio for positioning
    brightness: brightnessResult.score * profile.weights.brightness,
    lensShift: lensShiftResult.score * profile.weights.lensShift,
    ergonomics: ergonomicsResult.score * profile.weights.ergonomics,
    specialFeatures: specialFeaturesResult.score * profile.weights.specialFeatures,
  };

  const totalScore = Object.values(componentScores).reduce((sum, score) => sum + score, 0);

  // Determine compatibility level
  let compatibility: ScoringBreakdown["compatibility"];
  if (totalScore >= 90) compatibility = "excellent";
  else if (totalScore >= 75) compatibility = "good";
  else if (totalScore >= 60) compatibility = "acceptable";
  else compatibility = "poor";

  // Generate warnings and recommendations
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (brightnessResult.adequacy === "insufficient") {
    warnings.push("Screen brightness may be insufficient for intended use");
    recommendations.push("Consider higher brightness projector or smaller screen");
  }

  if (brightnessResult.adequacy === "excessive") {
    warnings.push("Screen brightness significantly exceeds requirements");
    recommendations.push("Consider ND filter or lower brightness projector");
  }

  if (lensShiftResult.utilization > 0.8) {
    warnings.push("Lens shift near maximum capability");
    recommendations.push("Consider repositioning projector for better alignment");
  }

  if (throwRatioResult.position < 0.2 || throwRatioResult.position > 0.8) {
    warnings.push("Lens operating near zoom limits");
    recommendations.push("Consider lens with better throw ratio match");
  }

  return {
    totalScore,
    maxPossibleScore: 100,
    compatibility,
    components: {
      throwRatio: {
        score: componentScores.throwRatio,
        maxScore: 100 * profile.weights.throwRatio,
        details: throwRatioResult.details,
        valid: throwRatioResult.valid,
      },
      zoomPosition: {
        score: componentScores.zoomPosition,
        maxScore: 100 * profile.weights.zoomPosition,
        position: throwRatioResult.position,
        details: `Operating at ${(throwRatioResult.position * 100).toFixed(1)}% of zoom range`,
      },
      brightness: {
        score: componentScores.brightness,
        maxScore: 100 * profile.weights.brightness,
        actualFL,
        targetFL: profile.targetFootLamberts,
        adequacy: brightnessResult.adequacy as any,
        details: brightnessResult.details,
      },
      lensShift: {
        score: componentScores.lensShift,
        maxScore: 100 * profile.weights.lensShift,
        utilization: lensShiftResult.utilization,
        feasible: lensShiftResult.feasible,
        details: lensShiftResult.details,
      },
      ergonomics: {
        score: componentScores.ergonomics,
        maxScore: 100 * profile.weights.ergonomics,
        features: ergonomicsResult.features,
        details: ergonomicsResult.details,
      },
      specialFeatures: {
        score: componentScores.specialFeatures,
        maxScore: 100 * profile.weights.specialFeatures,
        considerations: specialFeaturesResult.considerations,
        details: specialFeaturesResult.details,
      },
    },
    warnings,
    recommendations,
  };
}

/**
 * Simple scoring function for backward compatibility
 */
export function scoreLensSimple(
  lens: Lens,
  targetRatio: number,
  actualFL: number,
  constraints: InstallationConstraints,
  profileName: string = "presentation",
): number {
  const breakdown = scoreLensComprehensive(lens, targetRatio, actualFL, constraints, profileName);
  return breakdown.totalScore;
}

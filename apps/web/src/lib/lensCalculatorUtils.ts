import { supabase } from "./supabase";
import type {
  Projector,
  Lens,
  LensCalculation,
  ScreenData,
  InstallationConstraints,
  CalculationResult,
} from "./lensCalculatorTypes";
import { scoreLensComprehensive, calculateFootLamberts, SCORING_PROFILES } from "./lensScoring";

// Enhanced calculation result interface
interface EnhancedCalculationResult extends CalculationResult {
  scoringProfile: string;
  totalLensesEvaluated: number;
  scoringInsights: {
    averageScore: number;
    bestCategory: string;
    commonIssues: string[];
    recommendations: string[];
  };
}

// Helper function for case-insensitive manufacturer comparison
export function manufacturersMatch(manufacturer1: string, manufacturer2: string): boolean {
  return manufacturer1.toLowerCase().trim() === manufacturer2.toLowerCase().trim();
}

// Fetch all projectors from database
export async function fetchProjectors(filters?: {
  manufacturer?: string;
  resolution?: string;
  minBrightness?: number;
}): Promise<Projector[]> {
  let query = supabase.from("projector_database").select("*");

  if (filters?.manufacturer) {
    // Use case-insensitive manufacturer comparison
    query = query.filter("manufacturer", "ilike", filters.manufacturer);
  }
  if (filters?.resolution) {
    query = query.eq("native_resolution", filters.resolution);
  }
  if (filters?.minBrightness) {
    query = query.gte("brightness_ansi", filters.minBrightness);
  }

  const { data, error } = await query.order("manufacturer").order("model");

  if (error) {
    console.error("Error fetching projectors:", error);
    return [];
  }

  return data || [];
}

// Fetch compatible lenses for a projector
export async function fetchCompatibleLenses(projectorId: string): Promise<Lens[]> {
  const { data, error } = await supabase
    .from("projector_lens_compatibility")
    .select(
      `
      lens_id,
      lens_database (*)
    `,
    )
    .eq("projector_id", projectorId);

  if (error) {
    console.error("Error fetching compatible lenses:", error);
    return [];
  }

  // Type the response data
  const typedData = data as Array<{
    lens_id: string;
    lens_database: Lens;
  }> | null;

  return typedData?.map((item) => item.lens_database).filter(Boolean) || [];
}

// Fetch lenses by mount family (fallback when compatibility matrix is empty)
export async function fetchLensesByMountFamily(projector: Projector): Promise<Lens[]> {
  // Get the mount family for this projector using the mapping function
  const { data, error } = await supabase.rpc("map_projector_mount_to_lens_family", {
    mount_system: projector.lens_mount_system,
  });

  if (error || !data || data === "OTHER") {
    console.log("No mount family mapping found for", projector.lens_mount_system);
    return [];
  }

  const mountFamily = data;

  // Fetch lenses with matching mount family (case-insensitive manufacturer)
  const { data: lensData, error: lensError } = await supabase
    .from("lens_database")
    .select("*")
    .eq("mount_family", mountFamily)
    .filter("manufacturer", "ilike", projector.manufacturer)
    .order("throw_ratio_min");

  if (lensError) {
    console.error("Error fetching lenses by mount family:", lensError);
    return [];
  }

  return lensData || [];
}

// Fetch lenses by throw ratio range
export async function fetchLensesByThrowRatio(minRatio: number, maxRatio: number): Promise<Lens[]> {
  const { data, error } = await supabase
    .from("lens_database")
    .select("*")
    .lte("throw_ratio_min", maxRatio)
    .gte("throw_ratio_max", minRatio)
    .order("throw_ratio_min");

  if (error) {
    console.error("Error fetching lenses by throw ratio:", error);
    return [];
  }

  return data || [];
}

// Save a lens calculation
export async function saveLensCalculation(
  calculation: Omit<LensCalculation, "id" | "created_at" | "last_edited">,
): Promise<string | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    console.error("User not authenticated");
    return null;
  }

  const { data, error } = await supabase
    .from("lens_calculations")
    .insert({
      user_id: userData.user.id,
      calculation_name: calculation.calculation_name,
      screen_data: calculation.screen_data,
      projector_requirements: calculation.projector_requirements,
      installation_constraints: calculation.installation_constraints,
      calculation_results: calculation.calculation_results,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving calculation:", error);
    return null;
  }

  return data?.id || null;
}

// Update an existing lens calculation
export async function updateLensCalculation(
  id: string,
  updates: Partial<Omit<LensCalculation, "id" | "user_id" | "created_at">>,
): Promise<boolean> {
  const { error } = await supabase
    .from("lens_calculations")
    .update({
      ...updates,
      last_edited: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating calculation:", error);
    return false;
  }

  return true;
}

// Fetch user's lens calculations
export async function fetchUserCalculations(): Promise<LensCalculation[]> {
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    console.error("User not authenticated");
    return [];
  }

  const { data, error } = await supabase
    .from("lens_calculations")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("last_edited", { ascending: false });

  if (error) {
    console.error("Error fetching calculations:", error);
    return [];
  }

  return data || [];
}

// Delete a lens calculation
export async function deleteLensCalculation(id: string): Promise<boolean> {
  const { error } = await supabase.from("lens_calculations").delete().eq("id", id);

  if (error) {
    console.error("Error deleting calculation:", error);
    return false;
  }

  return true;
}

// Helper functions for improved lens calculations

// Foot-Lamberts calculation
export function footLamberts(lumens: number, areaFt2: number, gain: number): number {
  return (lumens * gain) / areaFt2;
}

// Required lumens for target foot-Lamberts
export function requiredLumens(targetFL: number, areaFt2: number, gain: number): number {
  return (targetFL * areaFt2) / Math.max(gain, 0.1);
}

// Get target foot-Lamberts by use case
export function getTargetFootLamberts(
  useCase: "cinema" | "presentation" | "bright_venue" | "outdoor" = "presentation",
): number {
  switch (useCase) {
    case "cinema":
      return 14; // Cinema standard (12-16 fL)
    case "presentation":
      return 30; // Conference rooms, classrooms
    case "bright_venue":
      return 50; // Trade shows, retail
    case "outdoor":
      return 80; // Outdoor events
    default:
      return 30;
  }
}

// Check if lens shift is feasible using ellipse approximation
export function shiftOK(vReq: number, hReq: number, vMax: number = 0, hMax: number = 0): boolean {
  if (!vMax && !hMax) return false;

  // Use ellipse equation: (v/vMax)² + (h/hMax)² ≤ 1
  const vv = vMax ? (vReq / vMax) ** 2 : 0;
  const hh = hMax ? (hReq / hMax) ** 2 : 0;
  return vv + hh <= 1.0;
}

// Calculate elliptical shift utilization (0-1)
export function getShiftUtilization(
  vReq: number,
  hReq: number,
  vMax: number = 0,
  hMax: number = 0,
): number {
  if (!vMax && !hMax) return 0;

  const vv = vMax ? (vReq / vMax) ** 2 : 0;
  const hh = hMax ? (hReq / hMax) ** 2 : 0;
  return Math.min(1.0, Math.sqrt(vv + hh));
}

// Check if lens is UST with zero offset
export function isUSTZeroOffset(lens: Lens): boolean {
  return (
    lens.optical_features?.zero_offset === true ||
    (lens.lens_type === "UST" && lens.throw_ratio_max < 0.5)
  );
}

// Legacy scoring function - kept for backward compatibility
// Use scoreLensComprehensive from lensScoring.ts for new implementations
export function scoreLens({
  ratio,
  lens,
  install,
  targetFL,
  actualFL,
  distance,
  screenWidth,
}: {
  ratio: number;
  lens: Lens;
  install: InstallationConstraints;
  targetFL: number;
  actualFL: number;
  distance?: number;
  screenWidth: number;
}): number {
  let score = 100;

  // 1) Hard fail if throw ratio is out of range
  if (ratio < lens.throw_ratio_min || ratio > lens.throw_ratio_max) {
    return -Infinity;
  }

  // 2) Zoom sweet spot penalty - prefer middle 30-70% of zoom range
  const zoomPosition =
    (ratio - lens.throw_ratio_min) / (lens.throw_ratio_max - lens.throw_ratio_min);
  if (zoomPosition < 0.15 || zoomPosition > 0.85) {
    score -= 12;
  }

  // 3) Distance preference - penalize if far from installation constraints
  if (distance && install.minDistance && install.maxDistance) {
    const throwDistance = screenWidth * ratio;
    const targetDistance = (install.minDistance + install.maxDistance) / 2;
    const distanceError = Math.abs(throwDistance - targetDistance);
    const maxError = Math.abs(install.maxDistance - install.minDistance) / 2;

    if (maxError > 0) {
      score -= Math.min(15, Math.round(10 * (distanceError / maxError)));
    }
  }

  // 4) Lens shift feasibility + comfort margin
  const vReq = install.requiredVShiftPct ?? 0;
  const hReq = install.requiredHShiftPct ?? 0;

  if (vReq !== 0 || hReq !== 0) {
    if (!shiftOK(vReq, hReq, lens.lens_shift_v_max ?? 0, lens.lens_shift_h_max ?? 0)) {
      return -Infinity; // Hard fail if shift requirements can't be met
    }

    // Penalty for being close to shift limits
    const shiftUtil = getShiftUtilization(
      vReq,
      hReq,
      lens.lens_shift_v_max ?? 0,
      lens.lens_shift_h_max ?? 0,
    );
    score -= Math.round(20 * shiftUtil);
  }

  // 5) Brightness fitness - hit target without huge overage
  if (actualFL < targetFL) {
    const shortage = targetFL - actualFL;
    score -= Math.min(40, Math.round(shortage)); // Under-target hurts a lot
  } else {
    const overage = actualFL - targetFL;
    score -= Math.min(15, Math.round(overage / 2)); // Mild penalty for big overkill
  }

  // 6) UST zero-offset rule - exclude if vertical shift is required
  if (isUSTZeroOffset(lens) && vReq !== 0) {
    score -= 50;
  }

  // 7) Ergonomics bonuses
  if (lens.motorized) score += 5;

  // 8) Lens type preferences
  if (lens.lens_type === "Standard") {
    score += 5;
  } else if (lens.lens_type === "UST" && vReq === 0) {
    score += 2; // UST is good when no offset needed
  }

  return score;
}

// Calculate compatible lenses based on requirements (Phase C - Enhanced)
export function calculateCompatibleLenses(
  screenData: ScreenData,
  installationConstraints: InstallationConstraints,
  availableLenses: Lens[],
  projectorLumens: number, // Remove default - require actual brightness
  useCase: "cinema" | "presentation" | "bright_venue" | "outdoor" = "presentation",
): CalculationResult {
  const compatibleLenses = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Validate required inputs
  if (!projectorLumens || projectorLumens <= 0) {
    warnings.push("Invalid projector brightness specified.");
    return { compatibleLenses: [], warnings, recommendations };
  }

  // Calculate screen area in square feet
  const screenAreaFt2 = screenData.width * screenData.height; // Already in feet from input
  const screenGain = screenData.gain || 1.0;

  // Get target brightness for use case
  const targetFL = getTargetFootLamberts(useCase);
  const actualFL = footLamberts(projectorLumens, screenAreaFt2, screenGain);

  // Calculate required throw ratios based on distance constraints
  const minThrowRatio = installationConstraints.minDistance
    ? installationConstraints.minDistance / screenData.width
    : 0;
  const maxThrowRatio = installationConstraints.maxDistance
    ? installationConstraints.maxDistance / screenData.width
    : 100;

  // Filter and score lenses
  for (const lens of availableLenses) {
    // Check if lens throw ratio overlaps with requirements
    if (lens.throw_ratio_max < minThrowRatio || lens.throw_ratio_min > maxThrowRatio) {
      continue;
    }

    // Calculate optimal throw ratio within lens range and installation constraints
    const constrainedMinRatio = Math.max(lens.throw_ratio_min, minThrowRatio);
    const constrainedMaxRatio = Math.min(lens.throw_ratio_max, maxThrowRatio);

    if (constrainedMinRatio > constrainedMaxRatio) {
      continue; // No valid overlap
    }

    // Use middle of the constrained range as optimal
    const optimalRatio = (constrainedMinRatio + constrainedMaxRatio) / 2;
    const throwDistance = screenData.width * optimalRatio;

    // Score the lens using enhanced algorithm
    const score = scoreLens({
      ratio: optimalRatio,
      lens,
      install: installationConstraints,
      targetFL,
      actualFL,
      distance: throwDistance,
      screenWidth: screenData.width,
    });

    // Skip lenses that failed hard constraints
    if (score === -Infinity) {
      continue;
    }

    compatibleLenses.push({
      lens,
      throwDistance,
      imageWidth: screenData.width,
      imageHeight: screenData.height,
      brightness: actualFL,
      score,
    });
  }

  // Sort by score (highest first)
  compatibleLenses.sort((a, b) => b.score - a.score);

  // Generate warnings and recommendations
  if (compatibleLenses.length === 0) {
    warnings.push("No compatible lenses found for the specified requirements.");

    if (availableLenses.length === 0) {
      recommendations.push("No lenses found in compatibility matrix. Try mount family fallback.");
    } else {
      recommendations.push(
        "Consider adjusting installation distance constraints or lens shift requirements.",
      );
    }
  } else if (compatibleLenses.length < 3) {
    warnings.push("Limited lens options available.");
  }

  // Brightness analysis
  if (actualFL < targetFL * 0.8) {
    warnings.push(
      `Screen brightness (${actualFL.toFixed(1)} fL) is below recommended ${targetFL} fL for ${useCase} use.`,
    );
    recommendations.push("Consider using a higher brightness projector or smaller screen.");
  } else if (actualFL > targetFL * 2) {
    warnings.push(
      `Screen brightness (${actualFL.toFixed(1)} fL) is much higher than needed for ${useCase} use.`,
    );
    recommendations.push(
      "Consider using a lower brightness projector, larger screen, or ND filter.",
    );
  }

  // Lens shift analysis
  if (installationConstraints.requiredVShiftPct || installationConstraints.requiredHShiftPct) {
    const withAdequateShift = compatibleLenses.filter((cl) => {
      const vReq = installationConstraints.requiredVShiftPct ?? 0;
      const hReq = installationConstraints.requiredHShiftPct ?? 0;
      return shiftOK(vReq, hReq, cl.lens.lens_shift_v_max ?? 0, cl.lens.lens_shift_h_max ?? 0);
    });

    if (withAdequateShift.length === 0) {
      warnings.push("No lenses found with required lens shift capabilities.");
      recommendations.push("Consider reducing lens shift requirements or repositioning projector.");
    }
  }

  // UST special warnings
  const ustLenses = compatibleLenses.filter((cl) => isUSTZeroOffset(cl.lens));
  if (ustLenses.length > 0 && (installationConstraints.requiredVShiftPct ?? 0) !== 0) {
    warnings.push("UST lenses with zero offset cannot provide vertical shift adjustment.");
  }

  return {
    compatibleLenses: compatibleLenses.slice(0, 10), // Return top 10
    warnings,
    recommendations,
  };
}

// Enhanced lens calculation with comprehensive scoring (Phase E)
export function calculateCompatibleLensesEnhanced(
  screenData: ScreenData,
  installationConstraints: InstallationConstraints,
  availableLenses: Lens[],
  projectorLumens: number,
  useCase: keyof typeof SCORING_PROFILES = "presentation",
  includeDetailedBreakdown: boolean = false,
): EnhancedCalculationResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const compatibleLenses = [];

  // Validate required inputs
  if (!projectorLumens || projectorLumens <= 0) {
    warnings.push("Invalid projector brightness specified.");
    return {
      compatibleLenses: [],
      warnings,
      recommendations,
      scoringProfile: useCase,
      totalLensesEvaluated: 0,
      scoringInsights: {
        averageScore: 0,
        bestCategory: "none",
        commonIssues: ["No valid projector brightness"],
        recommendations: ["Specify valid projector brightness"],
      },
    };
  }

  // Calculate screen area in square feet and brightness
  const screenAreaFt2 = screenData.width * screenData.height;
  const screenGain = screenData.gain || 1.0;
  const actualFL = calculateFootLamberts(projectorLumens, screenAreaFt2, screenGain);

  // Calculate required throw ratios based on distance constraints
  const minThrowRatio = installationConstraints.minDistance
    ? installationConstraints.minDistance / screenData.width
    : 0;
  const maxThrowRatio = installationConstraints.maxDistance
    ? installationConstraints.maxDistance / screenData.width
    : 100;

  // Track scoring statistics
  const scores: number[] = [];
  const issues: string[] = [];
  const categoryScores: Record<string, number[]> = {
    throwRatio: [],
    brightness: [],
    lensShift: [],
    ergonomics: [],
  };

  // Evaluate each lens with comprehensive scoring
  for (const lens of availableLenses) {
    // Check if lens throw ratio overlaps with requirements
    if (lens.throw_ratio_max < minThrowRatio || lens.throw_ratio_min > maxThrowRatio) {
      continue;
    }

    // Calculate optimal throw ratio within lens range and installation constraints
    const constrainedMinRatio = Math.max(lens.throw_ratio_min, minThrowRatio);
    const constrainedMaxRatio = Math.min(lens.throw_ratio_max, maxThrowRatio);

    if (constrainedMinRatio > constrainedMaxRatio) {
      continue; // No valid overlap
    }

    // Use middle of the constrained range as optimal
    const targetThrowRatio = (constrainedMinRatio + constrainedMaxRatio) / 2;
    const throwDistance = screenData.width * targetThrowRatio;

    // Calculate zoom position
    const zoomPosition =
      lens.throw_ratio_max > lens.throw_ratio_min
        ? (targetThrowRatio - lens.throw_ratio_min) / (lens.throw_ratio_max - lens.throw_ratio_min)
        : 0.5;

    // Get comprehensive scoring breakdown
    const scoringBreakdown = scoreLensComprehensive(
      lens,
      targetThrowRatio,
      actualFL,
      installationConstraints,
      useCase,
    );

    // Skip lenses that are completely incompatible
    if (scoringBreakdown.compatibility === "incompatible") {
      issues.push(`${lens.model}: ${scoringBreakdown.warnings.join(", ")}`);
      continue;
    }

    // Track category scores for insights
    categoryScores.throwRatio.push(scoringBreakdown.components.throwRatio.score);
    categoryScores.brightness.push(scoringBreakdown.components.brightness.score);
    categoryScores.lensShift.push(scoringBreakdown.components.lensShift.score);
    categoryScores.ergonomics.push(scoringBreakdown.components.ergonomics.score);

    scores.push(scoringBreakdown.totalScore);

    // Collect warnings from scoring
    warnings.push(...scoringBreakdown.warnings);
    recommendations.push(...scoringBreakdown.recommendations);

    compatibleLenses.push({
      lens,
      throwDistance,
      imageWidth: screenData.width,
      imageHeight: screenData.height,
      brightness: actualFL,
      score: scoringBreakdown.totalScore,
      scoringBreakdown: includeDetailedBreakdown ? scoringBreakdown : undefined,
      targetThrowRatio,
      zoomPosition,
      compatibility: scoringBreakdown.compatibility,
    });
  }

  // Sort by score (highest first)
  compatibleLenses.sort((a, b) => b.score - a.score);

  // Generate scoring insights
  const averageScore =
    scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;

  // Find best performing category
  let bestCategory = "none";
  let bestCategoryScore = 0;
  for (const [category, categoryScoreList] of Object.entries(categoryScores)) {
    if (categoryScoreList.length > 0) {
      const avgCategoryScore =
        categoryScoreList.reduce((sum, score) => sum + score, 0) / categoryScoreList.length;
      if (avgCategoryScore > bestCategoryScore) {
        bestCategoryScore = avgCategoryScore;
        bestCategory = category;
      }
    }
  }

  // Generate common issues and recommendations
  const commonIssues: string[] = [];
  const insightRecommendations: string[] = [];

  if (compatibleLenses.length === 0) {
    commonIssues.push("No compatible lenses found");
    insightRecommendations.push(
      "Consider adjusting installation constraints or choosing different projector",
    );
  } else {
    const lowScoreLenses = compatibleLenses.filter((cl) => cl.score < 60).length;
    if (lowScoreLenses > compatibleLenses.length * 0.5) {
      commonIssues.push("Many lenses have low compatibility scores");
    }

    if (averageScore < 70) {
      insightRecommendations.push("Consider different projector placement or lens mount system");
    }

    // Category-specific insights
    if (categoryScores.brightness.length > 0) {
      const avgBrightnessScore =
        categoryScores.brightness.reduce((sum, score) => sum + score, 0) /
        categoryScores.brightness.length;
      if (avgBrightnessScore < 60) {
        commonIssues.push("Brightness challenges across multiple lenses");
        insightRecommendations.push("Consider higher brightness projector or smaller screen");
      }
    }

    if (categoryScores.lensShift.length > 0) {
      const avgShiftScore =
        categoryScores.lensShift.reduce((sum, score) => sum + score, 0) /
        categoryScores.lensShift.length;
      if (avgShiftScore < 60) {
        commonIssues.push("Lens shift limitations across multiple options");
        insightRecommendations.push("Consider repositioning projector for better alignment");
      }
    }
  }

  // Global analysis and recommendations
  const profile = SCORING_PROFILES[useCase];
  if (actualFL < profile.targetFootLamberts * 0.8) {
    warnings.push(
      `Screen brightness (${actualFL.toFixed(1)} fL) below recommended ${profile.targetFootLamberts} fL for ${profile.name} use`,
    );
    recommendations.push("Consider higher brightness projector or smaller screen");
  } else if (actualFL > profile.targetFootLamberts * 2) {
    warnings.push(
      `Screen brightness (${actualFL.toFixed(1)} fL) significantly exceeds ${profile.name} requirements`,
    );
    recommendations.push("Consider ND filter or lower brightness projector");
  }

  return {
    compatibleLenses: compatibleLenses.slice(0, 10), // Return top 10
    warnings: Array.from(new Set(warnings)), // Remove duplicates
    recommendations: Array.from(new Set(recommendations)),
    scoringProfile: useCase,
    totalLensesEvaluated: availableLenses.length,
    scoringInsights: {
      averageScore,
      bestCategory,
      commonIssues,
      recommendations: insightRecommendations,
    },
  };
}

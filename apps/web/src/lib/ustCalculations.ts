/**
 * Comprehensive UST (Ultra Short Throw) Calculations and Zero-Offset Handling
 * Handles special requirements for UST projectors including zero-offset,
 * negative-offset, and mirror-based optical systems
 */

import type { Lens, InstallationConstraints } from "./lensCalculatorTypes";

export interface USTConfiguration {
  lensType: "zero_offset" | "negative_offset" | "mirror_based" | "standard_ust";
  screenHeight: number; // in inches
  screenWidth: number; // in inches
  aspectRatio: string;
  projectorModel?: string;
  mountingType?: "ceiling" | "floor" | "table";
}

export interface USTMountingResult {
  mountingHeight: number; // offset from screen bottom in inches
  horizontalDistance: number; // distance from screen in inches
  criticalTolerance: number; // positioning tolerance in mm
  installationNotes: string[];
  restrictions: string[];
  barrelDistortion: number; // percentage
  keyStoneCorrection: {
    required: boolean;
    maxCorrection: number; // degrees
    qualityImpact: "none" | "minimal" | "moderate" | "significant";
  };
}

export interface USTClassification {
  isUST: boolean;
  type: "zero_offset" | "negative_offset" | "mirror_based" | "standard_ust" | "standard";
  restrictions: string[];
  specialRequirements: string[];
  shiftCapability: {
    vertical: boolean;
    horizontal: boolean;
    limitations: string[];
  };
}

/**
 * Calculate UST mounting requirements based on lens type and screen configuration
 */
export function calculateUSTMounting(config: USTConfiguration): USTMountingResult {
  const notes: string[] = [];
  const restrictions: string[] = [];
  let mountingHeight = 0;
  let horizontalDistance = 0;
  let criticalTolerance = 2; // mm
  let barrelDistortion = 0;

  switch (config.lensType) {
    case "zero_offset":
      // Projector optical center aligned with screen bottom
      mountingHeight = 0;
      horizontalDistance = config.screenWidth * 0.35; // Typical UST throw ratio
      criticalTolerance = 1; // More critical
      barrelDistortion = calculateBarrelDistortion(config.screenWidth, horizontalDistance);

      notes.push("Mount projector with lens centerline at screen bottom edge");
      notes.push("No vertical offset capability - positioning critical");
      notes.push("Screen must be perfectly flat (±2mm tolerance)");

      restrictions.push("No vertical lens shift available");
      restrictions.push("Projector must be precisely at screen bottom");
      restrictions.push("Any vertical misalignment will cause image distortion");
      break;

    case "negative_offset":
      // Projector below screen (Epson ELPLX series style)
      mountingHeight = -config.screenHeight * 0.1;
      horizontalDistance = config.screenWidth * 0.28;
      criticalTolerance = 1.5;
      barrelDistortion = calculateBarrelDistortion(config.screenWidth, horizontalDistance);

      notes.push("Projector mounts below screen bottom");
      notes.push("Built-in negative offset compensates for low position");
      notes.push("Optimized for ceiling-mounted installations");

      restrictions.push("Designed for below-screen mounting only");
      restrictions.push("Limited upward adjustment capability");
      break;

    case "mirror_based": {
      // L-shaped optical path (some UST models)
      const mirrorHeight = config.screenHeight * 0.3;
      mountingHeight = -mirrorHeight;
      horizontalDistance = config.screenWidth * 0.4;
      criticalTolerance = 0.5; // Ultra-critical
      barrelDistortion = calculateBarrelDistortion(config.screenWidth, horizontalDistance);

      notes.push("Mirror-based UST requires precise angular alignment");
      notes.push(`Mirror assembly adds ${mirrorHeight.toFixed(0)}mm to projector height`);
      notes.push("Professional installation and calibration required");

      restrictions.push("Requires mirror assembly alignment");
      restrictions.push("Not field-serviceable");
      restrictions.push("Vibration sensitivity extremely high");
      break;
    }

    case "standard_ust":
      // Standard UST with some shift capability
      mountingHeight = config.screenHeight * 0.05; // Slight offset capability
      horizontalDistance = config.screenWidth * 0.4;
      criticalTolerance = 3;
      barrelDistortion = calculateBarrelDistortion(config.screenWidth, horizontalDistance);

      notes.push("Standard UST with limited shift capability");
      notes.push("Some vertical adjustment possible");
      break;
  }

  // Calculate keystone correction requirements
  const keyStoneCorrection = calculateKeyStoneRequirements(
    config,
    mountingHeight,
    horizontalDistance,
  );

  // Add general UST notes
  notes.push("Screen flatness tolerance: ±2mm across entire surface");
  notes.push("Ambient light rejection screen strongly recommended");
  notes.push("5x more sensitive to distance changes than standard throw");
  notes.push("Room acoustics: hard surfaces may cause audio reflection issues");

  // Add installation-specific warnings
  if (barrelDistortion > 2) {
    notes.push(`Warning: ${barrelDistortion.toFixed(1)}% barrel distortion expected at edges`);
    restrictions.push("Edge focus correction may be required");
  }

  if (criticalTolerance < 2) {
    restrictions.push("Professional installation strongly recommended");
    restrictions.push("Micro-adjustment mounting hardware required");
  }

  return {
    mountingHeight,
    horizontalDistance,
    criticalTolerance,
    installationNotes: notes,
    restrictions,
    barrelDistortion,
    keyStoneCorrection,
  };
}

/**
 * Calculate barrel distortion for UST lenses
 */
function calculateBarrelDistortion(screenWidth: number, distance: number): number {
  const throwRatio = distance / screenWidth;

  if (throwRatio < 0.25) {
    return 3.5; // Extreme UST
  } else if (throwRatio < 0.35) {
    return 2.0; // Standard UST
  } else if (throwRatio < 0.5) {
    return 1.0; // Short throw
  }
  return 0.5; // Minimal distortion
}

/**
 * Calculate keystone correction requirements
 */
function calculateKeyStoneRequirements(
  config: USTConfiguration,
  mountingHeight: number,
  horizontalDistance: number,
): USTMountingResult["keyStoneCorrection"] {
  // Prevent division by zero and handle edge cases in angle calculation
  const epsilon = 1e-6;
  const ratio =
    Math.abs(horizontalDistance) < epsilon
      ? Number.POSITIVE_INFINITY
      : mountingHeight / horizontalDistance;
  const projectionAngle = Math.atan(Math.max(-1e6, Math.min(1e6, ratio))) * (180 / Math.PI);
  const maxCorrection = Number.isFinite(projectionAngle) ? Math.abs(projectionAngle) : 90;

  let required = false;
  let qualityImpact: "none" | "minimal" | "moderate" | "significant" = "none";

  if (maxCorrection > 0.5) {
    required = true;
    if (maxCorrection > 5) {
      qualityImpact = "significant";
    } else if (maxCorrection > 2) {
      qualityImpact = "moderate";
    } else {
      qualityImpact = "minimal";
    }
  }

  return {
    required,
    maxCorrection,
    qualityImpact,
  };
}

/**
 * Detect and classify UST lenses with special handling requirements
 */
export function isSpecialUSTLens(lens: Lens): USTClassification {
  const restrictions: string[] = [];
  const specialRequirements: string[] = [];

  // Check if UST based on throw ratio
  if (lens.throw_ratio_max >= 0.5) {
    return {
      isUST: false,
      type: "standard",
      restrictions: [],
      specialRequirements: [],
      shiftCapability: {
        vertical: (lens.lens_shift_v_max || 0) > 0,
        horizontal: (lens.lens_shift_h_max || 0) > 0,
        limitations: [],
      },
    };
  }

  // Determine UST type from optical features and manufacturer patterns
  let ustType: USTClassification["type"] = "standard_ust";
  const shiftLimitations: string[] = [];

  // Check for zero-offset indicators
  if (
    lens.optical_features?.zero_offset === true ||
    (lens.manufacturer === "Epson" && lens.model.includes("ELPLX")) ||
    (lens.manufacturer === "Barco" && lens.throw_ratio_max < 0.38)
  ) {
    ustType = "zero_offset";
    restrictions.push("No vertical lens shift available");
    restrictions.push("Projector must be precisely at screen bottom");
    restrictions.push("Any vertical misalignment causes image distortion");
    shiftLimitations.push("Zero vertical shift capability");

    specialRequirements.push("Micro-positioning mounting hardware required");
    specialRequirements.push("Professional installation recommended");
  } else if (
    lens.optical_features?.negative_offset === true ||
    (lens.manufacturer === "Epson" && lens.model.includes("Zero Offset"))
  ) {
    ustType = "negative_offset";
    restrictions.push("Designed for below-screen mounting only");
    restrictions.push("Limited upward adjustment capability");
    shiftLimitations.push("Negative offset design limits positioning");
  } else if (lens.optical_features?.mirror_lens === true) {
    ustType = "mirror_based";
    restrictions.push("Requires mirror assembly alignment");
    restrictions.push("Not field-serviceable");
    restrictions.push("Extremely vibration sensitive");
    shiftLimitations.push("Mirror system constrains all adjustments");

    specialRequirements.push("Specialized installation training required");
    specialRequirements.push("Vibration isolation mounting mandatory");
  }

  // Add manufacturer-specific quirks
  if (lens.manufacturer === "Epson" && lens.model.includes("ELPLX")) {
    restrictions.push("Epson zero-offset design - no shift capability");
    specialRequirements.push("Epson-certified installation required");
  } else if (lens.manufacturer === "Barco" && lens.throw_ratio_max < 0.38) {
    restrictions.push("Barco UST requires EN54 safety compliance for public spaces");
    specialRequirements.push("Fire safety system integration may be required");
  } else if (lens.manufacturer === "Christie" && lens.throw_ratio_max < 0.4) {
    restrictions.push("Christie UST optimized for specific screen materials");
    specialRequirements.push("Screen material compatibility verification required");
  }

  // Add general UST requirements
  specialRequirements.push("Ambient light rejection screen recommended");
  specialRequirements.push("Screen flatness tolerance: ±2mm");
  specialRequirements.push("5x distance sensitivity vs standard throw");

  return {
    isUST: true,
    type: ustType,
    restrictions,
    specialRequirements,
    shiftCapability: {
      vertical: ustType !== "zero_offset" && (lens.lens_shift_v_max || 0) > 0,
      horizontal: (lens.lens_shift_h_max || 0) > 0,
      limitations: shiftLimitations,
    },
  };
}

/**
 * Validate UST lens compatibility with installation constraints
 */
export function validateUSTCompatibility(
  lens: Lens,
  constraints: InstallationConstraints,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _screenHeight: number,
): {
  compatible: boolean;
  confidence: number;
  warnings: string[];
  requirements: string[];
} {
  const warnings: string[] = [];
  const requirements: string[] = [];

  const ustClassification = isSpecialUSTLens(lens);

  if (!ustClassification.isUST) {
    return {
      compatible: true,
      confidence: 1.0,
      warnings: [],
      requirements: [],
    };
  }

  let compatible = true;
  let confidence = 1.0;

  // Check vertical shift requirements
  const requiredVShift = constraints.requiredVShiftPct || 0;
  if (requiredVShift !== 0 && ustClassification.type === "zero_offset") {
    compatible = false;
    confidence = 0;
    warnings.push("Zero-offset UST lens cannot provide required vertical shift");
  } else if (requiredVShift > 0 && ustClassification.type === "negative_offset") {
    confidence *= 0.7;
    warnings.push("Negative-offset UST has limited upward adjustment");
  }

  // Check mounting type compatibility
  if (constraints.mountingType === "ceiling" && ustClassification.type === "negative_offset") {
    confidence *= 0.8;
    warnings.push("Negative-offset UST suboptimal for ceiling mounting");
  }

  // Add UST-specific requirements
  requirements.push(...ustClassification.specialRequirements);

  if (ustClassification.type === "zero_offset") {
    requirements.push("Precision mounting hardware (±1mm tolerance)");
    requirements.push("Professional installation and alignment");
  }

  if (ustClassification.type === "mirror_based") {
    requirements.push("Vibration isolation mounting system");
    requirements.push("Environmental stability (±2°C temperature)");
  }

  // Distance sensitivity warnings
  if (lens.throw_ratio_max < 0.3) {
    warnings.push("Extreme UST: 1mm distance change = 3mm image size change");
    requirements.push("Micro-adjustment mounting hardware");
  }

  return {
    compatible,
    confidence,
    warnings,
    requirements,
  };
}

/**
 * Calculate optimal UST installation parameters
 */
export function calculateOptimalUSTInstallation(
  lens: Lens,
  screenWidth: number,
  screenHeight: number,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _constraints?: InstallationConstraints,
): {
  optimalDistance: number;
  mountingHeight: number;
  tolerances: {
    distance: number; // ±mm
    height: number; // ±mm
    angle: number; // ±degrees
  };
  installationPlan: string[];
} {
  const ustClassification = isSpecialUSTLens(lens);
  const throwRatio = (lens.throw_ratio_min + lens.throw_ratio_max) / 2;
  const optimalDistance = screenWidth * throwRatio;

  let mountingHeight = 0;
  const tolerances = {
    distance: 5, // mm
    height: 5, // mm
    angle: 0.5, // degrees
  };

  if (ustClassification.type === "zero_offset") {
    mountingHeight = 0;
    tolerances.distance = 1;
    tolerances.height = 1;
    tolerances.angle = 0.1;
  } else if (ustClassification.type === "negative_offset") {
    mountingHeight = -screenHeight * 0.1;
    tolerances.distance = 2;
    tolerances.height = 2;
    tolerances.angle = 0.2;
  } else if (ustClassification.type === "mirror_based") {
    mountingHeight = -screenHeight * 0.3;
    tolerances.distance = 0.5;
    tolerances.height = 0.5;
    tolerances.angle = 0.05;
  }

  const installationPlan = [
    "1. Verify screen flatness within ±2mm tolerance",
    "2. Install precision mounting hardware with micro-adjustments",
    `3. Position projector ${optimalDistance.toFixed(1)}" from screen`,
    `4. Align optical center ${mountingHeight >= 0 ? "at" : "below"} screen bottom`,
    "5. Perform fine distance adjustment for edge focus",
    "6. Verify image geometry and apply minimal keystone if needed",
    "7. Secure all mounting hardware and verify stability",
  ];

  if (ustClassification.type === "zero_offset") {
    installationPlan.splice(
      4,
      0,
      "4a. CRITICAL: No vertical adjustment available - position must be exact",
    );
  }

  if (ustClassification.type === "mirror_based") {
    installationPlan.splice(5, 0, "5a. Align mirror assembly to manufacturer specifications");
    installationPlan.push("8. Verify mirror alignment and optical path integrity");
  }

  return {
    optimalDistance,
    mountingHeight,
    tolerances,
    installationPlan,
  };
}

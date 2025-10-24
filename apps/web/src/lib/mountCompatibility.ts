/**
 * Mount Compatibility Validation System
 * Comprehensive validation of projector and lens mount compatibility,
 * including cross-manufacturer support and adapter requirements
 */

import { normalizeManufacturer } from "./manufacturerNormalization";

export interface MountCompatibilityResult {
  compatible: boolean;
  requiresAdapter: boolean;
  adapterPartNumber?: string;
  adapterCost?: number; // USD
  confidenceLevel: "native" | "adapted" | "uncertain" | "incompatible";
  warnings: string[];
  limitations: string[];
  installationNotes: string[];
}

export interface AdapterInformation {
  partNumber: string;
  manufacturer: string;
  cost: number; // USD
  availability: "standard" | "special_order" | "discontinued";
  limitations: string[];
  installationComplexity: "simple" | "moderate" | "complex";
  performanceImpact: {
    opticalQuality: "none" | "minimal" | "moderate" | "significant";
    lensShiftReduction: number; // percentage
    focusAccuracy: "unchanged" | "reduced" | "significantly_reduced";
    motorizedFunctionality: "full" | "limited" | "manual_only";
  };
}

// Comprehensive mount compatibility matrix
const MOUNT_COMPATIBILITY_MATRIX: Record<
  string,
  Record<
    string,
    {
      confidence: "native" | "adapted" | "uncertain";
      requiresAdapter: boolean;
      adapterPart?: string;
      adapterInfo?: AdapterInformation;
      notes?: string;
      limitations?: string[];
    }
  >
> = {
  // Barco Mount Systems
  "TLD+": {
    "TLD+": {
      confidence: "native",
      requiresAdapter: false,
    },
    TLD: {
      confidence: "adapted",
      requiresAdapter: true,
      adapterPart: "R9801410",
      adapterInfo: {
        partNumber: "R9801410",
        manufacturer: "Barco",
        cost: 450,
        availability: "standard",
        limitations: ["Manual focus only", "No lens memory"],
        installationComplexity: "simple",
        performanceImpact: {
          opticalQuality: "minimal",
          lensShiftReduction: 0,
          focusAccuracy: "reduced",
          motorizedFunctionality: "manual_only",
        },
      },
      notes: "TLD to TLD+ adapter required for legacy lenses",
    },
    "XLD+": {
      confidence: "uncertain",
      requiresAdapter: true,
      notes: "Cross-platform compatibility not officially supported",
    },
  },

  TLD: {
    TLD: {
      confidence: "native",
      requiresAdapter: false,
    },
    "TLD+": {
      confidence: "adapted",
      requiresAdapter: true,
      adapterPart: "R9801411",
      notes: "Requires TLD+ to TLD adapter (limited availability)",
    },
  },

  "XLD+": {
    "XLD+": {
      confidence: "native",
      requiresAdapter: false,
    },
    XLD: {
      confidence: "adapted",
      requiresAdapter: true,
      adapterPart: "R9801247",
      adapterInfo: {
        partNumber: "R9801247",
        manufacturer: "Barco",
        cost: 650,
        availability: "special_order",
        limitations: ["Reduced shift range", "Manual calibration required"],
        installationComplexity: "moderate",
        performanceImpact: {
          opticalQuality: "minimal",
          lensShiftReduction: 25,
          focusAccuracy: "unchanged",
          motorizedFunctionality: "limited",
        },
      },
      notes: "XLD to XLD+ adapter with performance limitations",
    },
  },

  GLD: {
    GLD: {
      confidence: "native",
      requiresAdapter: false,
    },
    G: {
      confidence: "adapted",
      requiresAdapter: true,
      adapterPart: "R9801750",
      notes: "G-series lens adapter for GLD mount",
    },
  },

  G: {
    G: {
      confidence: "native",
      requiresAdapter: false,
    },
  },

  ILD: {
    ILD: {
      confidence: "native",
      requiresAdapter: false,
    },
  },

  // Christie Mount Systems
  ILS: {
    ILS: {
      confidence: "native",
      requiresAdapter: false,
    },
    ILS1: {
      confidence: "native",
      requiresAdapter: false,
      notes: "ILS1 is subset of ILS system",
    },
    CT: {
      confidence: "adapted",
      requiresAdapter: true,
      adapterPart: "108-499101-01",
      adapterInfo: {
        partNumber: "108-499101-01",
        manufacturer: "Christie",
        cost: 750,
        availability: "standard",
        limitations: ["No automatic lens recognition", "Manual calibration required"],
        installationComplexity: "moderate",
        performanceImpact: {
          opticalQuality: "minimal",
          lensShiftReduction: 0,
          focusAccuracy: "reduced",
          motorizedFunctionality: "manual_only",
        },
      },
      notes: "Legacy CT lens requires ILS adapter kit",
    },
  },

  CT: {
    CT: {
      confidence: "native",
      requiresAdapter: false,
    },
    ILS: {
      confidence: "adapted",
      requiresAdapter: true,
      adapterPart: "108-499102-01",
      notes: "ILS to CT adapter (limited functionality)",
    },
  },

  Manual: {
    Manual: {
      confidence: "native",
      requiresAdapter: false,
    },
  },

  // Panasonic Mount Systems
  "ET-D75LE": {
    "ET-D75LE": {
      confidence: "native",
      requiresAdapter: false,
    },
    "ET-D3LE": {
      confidence: "native",
      requiresAdapter: false,
      notes: "Cross-compatible within ET-D series",
    },
  },

  "ET-D3LE": {
    "ET-D3LE": {
      confidence: "native",
      requiresAdapter: false,
    },
    "ET-D75LE": {
      confidence: "native",
      requiresAdapter: false,
      notes: "Cross-compatible within ET-D series",
    },
    "ET-D3Q": {
      confidence: "uncertain",
      requiresAdapter: false,
      notes: "May work but not officially supported",
    },
  },

  "ET-D3Q": {
    "ET-D3Q": {
      confidence: "native",
      requiresAdapter: false,
    },
  },

  "ET-DLE": {
    "ET-DLE": {
      confidence: "native",
      requiresAdapter: false,
    },
  },

  "ET-C1": {
    "ET-C1": {
      confidence: "native",
      requiresAdapter: false,
    },
  },

  "ET-EM": {
    "ET-EM": {
      confidence: "native",
      requiresAdapter: false,
    },
  },

  // Epson Mount Systems
  ELPL: {
    ELPL: {
      confidence: "native",
      requiresAdapter: false,
    },
  },

  // Sony Mount Systems
  VPLL: {
    VPLL: {
      confidence: "native",
      requiresAdapter: false,
    },
  },

  // NEC/Sharp Mount Systems
  NP: {
    NP: {
      confidence: "native",
      requiresAdapter: false,
    },
    XP: {
      confidence: "native",
      requiresAdapter: false,
      notes: "XP series compatible with NP mount",
    },
  },

  XP: {
    XP: {
      confidence: "native",
      requiresAdapter: false,
    },
    NP: {
      confidence: "native",
      requiresAdapter: false,
      notes: "Cross-compatible post-merger",
    },
  },

  // Digital Projection Mount Systems
  Standard: {
    Standard: {
      confidence: "native",
      requiresAdapter: false,
    },
    "High Brightness": {
      confidence: "adapted",
      requiresAdapter: true,
      notes: "May require high-brightness mount adapter",
    },
  },

  "High Brightness": {
    "High Brightness": {
      confidence: "native",
      requiresAdapter: false,
    },
    Standard: {
      confidence: "uncertain",
      requiresAdapter: false,
      notes: "Standard lens on HB projector - verify compatibility",
    },
  },
};

// Legacy mount mapping for older projectors
const LEGACY_MOUNT_MAPPING: Record<string, string[]> = {
  TLD: ["CLM", "FLM", "RLM"],
  XLD: ["XLM", "HDQ"],
  ILS: ["J-Series", "Mirage"],
  CT: ["Roadster", "Boxer"],
  "ET-D3LE": ["PT-RZ", "PT-RQ", "PT-DZ"],
  NP: ["PX", "PA", "PH"],
};

/**
 * Check mount compatibility between projector and lens
 */
export function checkMountCompatibility(
  projectorMount: string,
  lensMount: string,
  projectorMfg: string,
  lensMfg: string,
): MountCompatibilityResult {
  const result: MountCompatibilityResult = {
    compatible: false,
    requiresAdapter: false,
    confidenceLevel: "incompatible",
    warnings: [],
    limitations: [],
    installationNotes: [],
  };

  // Normalize manufacturers
  const normalizedProjMfg = normalizeManufacturer(projectorMfg);
  const normalizedLensMfg = normalizeManufacturer(lensMfg);

  // Cross-manufacturer compatibility check
  if (normalizedProjMfg.canonical !== normalizedLensMfg.canonical) {
    result.warnings.push("Cross-manufacturer lens use voids warranty");
    result.warnings.push("Optical performance not guaranteed");
    result.limitations.push("No technical support from manufacturer");
    result.limitations.push("May require custom mounting solutions");

    // Special case: some cross-manufacturer compatibility exists
    if (
      isKnownCrossCompatibility(
        normalizedProjMfg.canonical || "",
        normalizedLensMfg.canonical || "",
      )
    ) {
      result.compatible = true;
      result.confidenceLevel = "uncertain";
      result.warnings.push("Limited cross-manufacturer compatibility");
    }

    return result;
  }

  // Check native compatibility
  const nativeCompatibility = MOUNT_COMPATIBILITY_MATRIX[projectorMount]?.[lensMount];

  if (nativeCompatibility) {
    result.compatible = true;
    result.confidenceLevel = nativeCompatibility.confidence;
    result.requiresAdapter = nativeCompatibility.requiresAdapter;
    result.adapterPartNumber = nativeCompatibility.adapterPart;

    if (nativeCompatibility.adapterInfo) {
      result.adapterCost = nativeCompatibility.adapterInfo.cost;
      result.limitations.push(...nativeCompatibility.adapterInfo.limitations);

      // Add adapter-specific warnings
      if (nativeCompatibility.adapterInfo.availability === "special_order") {
        result.warnings.push("Adapter requires special order - extended lead time");
      } else if (nativeCompatibility.adapterInfo.availability === "discontinued") {
        result.warnings.push("Adapter discontinued - limited availability");
        result.confidenceLevel = "uncertain";
      }

      // Add performance impact warnings
      const perfImpact = nativeCompatibility.adapterInfo.performanceImpact;
      if (perfImpact.opticalQuality !== "none") {
        result.warnings.push(`Adapter may impact optical quality: ${perfImpact.opticalQuality}`);
      }
      if (perfImpact.lensShiftReduction > 0) {
        result.warnings.push(`Lens shift range reduced by ${perfImpact.lensShiftReduction}%`);
      }
      if (perfImpact.motorizedFunctionality !== "full") {
        result.warnings.push(`Motorized functions: ${perfImpact.motorizedFunctionality}`);
      }
    }

    if (nativeCompatibility.notes) {
      result.installationNotes.push(nativeCompatibility.notes);
    }

    if (nativeCompatibility.limitations) {
      result.limitations.push(...nativeCompatibility.limitations);
    }

    return result;
  }

  // Check for legacy mount compatibility
  const legacyCompatibility = checkLegacyMountCompatibility(projectorMount, lensMount);
  if (legacyCompatibility.compatible) {
    result.compatible = true;
    result.confidenceLevel = "uncertain";
    result.warnings.push("Legacy mount compatibility - verify with manufacturer");
    result.installationNotes.push(legacyCompatibility.notes);
    return result;
  }

  // Check for known adapter solutions
  const adapterSolution = findAdapterSolution(projectorMount, lensMount);
  if (adapterSolution) {
    result.compatible = true;
    result.requiresAdapter = true;
    result.adapterPartNumber = adapterSolution.partNumber;
    result.adapterCost = adapterSolution.cost;
    result.confidenceLevel = "adapted";
    result.warnings.push(`Requires adapter: ${adapterSolution.partNumber}`);
    result.limitations.push(...adapterSolution.limitations);
    return result;
  }

  // Final check - mount family compatibility
  if (getMountFamily(projectorMount) === getMountFamily(lensMount)) {
    result.compatible = true;
    result.confidenceLevel = "uncertain";
    result.warnings.push("Mount family match - compatibility likely but not verified");
    result.installationNotes.push("Professional installation recommended");
  }

  return result;
}

/**
 * Check for known cross-manufacturer compatibility
 */
function isKnownCrossCompatibility(projectorMfg: string, lensMfg: string): boolean {
  const knownCompatibilities = [
    // Some industrial projectors accept standard C-mount lenses
    { projector: "Digital Projection", lens: "Generic" },
    // Post-acquisition compatibility
    { projector: "NEC/Sharp", lens: "Sharp" },
    { projector: "Sharp", lens: "NEC/Sharp" },
  ];

  return knownCompatibilities.some(
    (compat) =>
      (compat.projector === projectorMfg && compat.lens === lensMfg) ||
      (compat.projector === lensMfg && compat.lens === projectorMfg),
  );
}

/**
 * Check legacy mount compatibility
 */
function checkLegacyMountCompatibility(
  projectorMount: string,
  lensMount: string,
): {
  compatible: boolean;
  notes: string;
} {
  for (const [modernMount, legacyMounts] of Object.entries(LEGACY_MOUNT_MAPPING)) {
    if (
      (modernMount === projectorMount && legacyMounts.includes(lensMount)) ||
      (modernMount === lensMount && legacyMounts.includes(projectorMount))
    ) {
      return {
        compatible: true,
        notes: `Legacy compatibility: ${lensMount} lens may work with ${projectorMount} mount`,
      };
    }
  }

  return { compatible: false, notes: "" };
}

/**
 * Find adapter solutions for incompatible mounts
 */
function findAdapterSolution(
  projMount: string,
  lensMount: string,
): {
  partNumber: string;
  cost: number;
  limitations: string[];
} | null {
  const ADAPTER_DATABASE = [
    {
      from: "TLD",
      to: "TLD+",
      partNumber: "R9801410",
      cost: 450,
      limitations: ["Manual focus only", "No lens memory"],
    },
    {
      from: "CT",
      to: "ILS",
      partNumber: "108-499101-01",
      cost: 750,
      limitations: ["No automatic lens recognition", "Manual calibration required"],
    },
    {
      from: "XLD",
      to: "XLD+",
      partNumber: "R9801247",
      cost: 650,
      limitations: ["Reduced shift range", "Manual calibration required"],
    },
    {
      from: "Manual",
      to: "ILS",
      partNumber: "108-499103-01",
      cost: 550,
      limitations: ["Motorized functions not available", "Manual operation only"],
    },
  ];

  return (
    ADAPTER_DATABASE.find(
      (adapter) =>
        (adapter.from === lensMount && adapter.to === projMount) ||
        (adapter.from === projMount && adapter.to === lensMount),
    ) || null
  );
}

/**
 * Get mount family for broader compatibility checking
 */
function getMountFamily(mount: string): string {
  const mountFamilies: Record<string, string> = {
    "TLD+": "Barco_TLD",
    TLD: "Barco_TLD",
    "XLD+": "Barco_XLD",
    XLD: "Barco_XLD",
    GLD: "Barco_G",
    G: "Barco_G",
    ILD: "Barco_ILD",

    ILS: "Christie_ILS",
    ILS1: "Christie_ILS",
    CT: "Christie_Legacy",
    Manual: "Christie_Manual",

    "ET-D75LE": "Panasonic_ETD",
    "ET-D3LE": "Panasonic_ETD",
    "ET-D3Q": "Panasonic_ETD",
    "ET-DLE": "Panasonic_DLE",
    "ET-C1": "Panasonic_C1",
    "ET-EM": "Panasonic_EM",

    ELPL: "Epson_ELPL",
    VPLL: "Sony_VPLL",
    NP: "NEC_Standard",
    XP: "NEC_Standard",

    Standard: "DP_Standard",
    "High Brightness": "DP_HB",
  };

  return mountFamilies[mount] || "Unknown";
}

/**
 * Get detailed mount information for a specific mount system
 */
export function getMountInformation(mount: string): {
  family: string;
  features: string[];
  capabilities: string[];
  limitations: string[];
  compatibleSeries: string[];
} {
  const mountInfo: Record<
    string,
    {
      family: string;
      features: string[];
      capabilities: string[];
      limitations: string[];
      compatibleSeries: string[];
    }
  > = {
    "TLD+": {
      family: "Barco TLD+",
      features: ["Motorized zoom/focus", "Lens memory", "Auto-calibration"],
      capabilities: ["Full lens shift", "Precision positioning", "Remote control"],
      limitations: ["Barco projectors only"],
      compatibleSeries: ["UDX", "UDM", "HDX", "HDF"],
    },
    ILS: {
      family: "Christie ILS",
      features: ["Intelligent lens detection", "Motorized controls", "Lens memory"],
      capabilities: ["Auto-calibration", "Preset positions", "Remote operation"],
      limitations: ["Christie projectors only", "Requires ILS-compatible lenses"],
      compatibleSeries: ["M Series", "Crimson", "J Series"],
    },
    "ET-D3LE": {
      family: "Panasonic ET-D3LE",
      features: ["Wide lens range", "Motorized operation", "High shift capability"],
      capabilities: ["0.39:1 to 7.94:1 throw range", "Extensive shift range"],
      limitations: ["Panasonic 3-chip DLP only"],
      compatibleSeries: ["PT-RQ", "PT-RZ", "PT-RS"],
    },
  };

  return (
    mountInfo[mount] || {
      family: "Unknown",
      features: [],
      capabilities: [],
      limitations: ["Compatibility unknown"],
      compatibleSeries: [],
    }
  );
}

/**
 * Validate mount compatibility with detailed analysis
 */
export function validateMountCompatibilityDetailed(
  projectorMount: string,
  lensMount: string,
  projectorMfg: string,
  lensMfg: string,
  projectorModel?: string,
  lensModel?: string,
): {
  compatibility: MountCompatibilityResult;
  mountInfo: {
    projector: {
      family: string;
      features: string[];
      capabilities: string[];
      limitations: string[];
      compatibleSeries: string[];
    };
    lens: {
      family: string;
      features: string[];
      capabilities: string[];
      limitations: string[];
      compatibleSeries: string[];
    };
  };
  recommendations: string[];
  alternativeOptions: string[];
} {
  const compatibility = checkMountCompatibility(projectorMount, lensMount, projectorMfg, lensMfg);
  const projectorMountInfo = getMountInformation(projectorMount);
  const lensMountInfo = getMountInformation(lensMount);

  const recommendations: string[] = [];
  const alternativeOptions: string[] = [];

  // Generate recommendations based on compatibility result
  if (!compatibility.compatible) {
    recommendations.push("Consider lenses with compatible mount system");
    recommendations.push("Verify manufacturer specifications before purchase");

    alternativeOptions.push(`Look for ${projectorMount} mount lenses from ${projectorMfg}`);
    alternativeOptions.push("Consider different projector model with broader lens compatibility");
  } else if (compatibility.requiresAdapter) {
    recommendations.push("Factor adapter cost into project budget");
    recommendations.push("Allow extra time for adapter installation");
    recommendations.push("Test adapter compatibility before final installation");

    if (compatibility.adapterCost) {
      recommendations.push(`Budget additional $${compatibility.adapterCost} for adapter`);
    }
  } else {
    recommendations.push("Native compatibility ensures optimal performance");
    recommendations.push("Standard installation procedures apply");
  }

  // Add model-specific recommendations if available
  if (projectorModel && lensModel) {
    if (projectorModel.includes("2024") || lensModel.includes("2024")) {
      recommendations.push("Latest generation equipment - verify firmware compatibility");
    }
  }

  return {
    compatibility,
    mountInfo: {
      projector: projectorMountInfo,
      lens: lensMountInfo,
    },
    recommendations,
    alternativeOptions,
  };
}

/**
 * Enhanced Manufacturer Normalization System
 * Handles manufacturer name variations, regional differences, and fuzzy matching
 * for improved projector/lens compatibility matching
 */

export interface ManufacturerMapping {
  canonical: string;
  aliases: string[];
  regionalVariations: string[];
  acquisitions?: {
    acquiredBy?: string;
    date?: string;
    legacyName?: string;
  };
}

export const MANUFACTURER_ALIASES: Record<string, string[]> = {
  Barco: [
    "barco",
    "barco inc",
    "barco nv",
    "barco digital",
    "barco systems",
    "barco projection systems",
    "barco cinema",
    "barco entertainment",
  ],
  Christie: [
    "christie",
    "christie digital",
    "christie digital systems",
    "cds",
    "christie digital systems usa",
    "christie digital inc",
    "christie corporation",
  ],
  Panasonic: [
    "panasonic",
    "panasonic connect",
    "panasonic corporation",
    "pana",
    "matsushita",
    "panasonic professional",
    "panasonic business",
    "panasonic visual systems",
    "panasonic projector",
  ],
  Epson: [
    "epson",
    "seiko epson",
    "epson america",
    "epson corporation",
    "epson professional",
    "epson projector",
    "seiko epson corporation",
  ],
  Sony: [
    "sony",
    "sony corporation",
    "sony professional",
    "sony electronics",
    "sony visual products",
    "sony cinema",
    "sony digital cinema",
  ],
  "NEC/Sharp": [
    "nec",
    "sharp",
    "sharp nec",
    "sharp nec display solutions",
    "nec display",
    "nec corporation",
    "sharp corporation",
    "nec display solutions",
    "sharp visual solutions",
    "sharp electronics",
  ],
  "Digital Projection": [
    "digital projection",
    "dp",
    "dpi",
    "digitalprojection",
    "digital projection international",
    "digital projection ltd",
    "digital projection inc",
  ],
  Optoma: [
    "optoma",
    "optoma technology",
    "optoma corporation",
    "optoma inc",
    "optoma usa",
    "optoma projector",
  ],
  BenQ: [
    "benq",
    "benq america",
    "benq corporation",
    "benq projector",
    "benq usa",
    "benq international",
  ],
  Canon: [
    "canon",
    "canon inc",
    "canon usa",
    "canon corporation",
    "canon imaging",
    "canon professional",
    "canon realis",
  ],
  JVC: [
    "jvc",
    "jvc professional",
    "jvckenwood",
    "victor company",
    "jvc usa",
    "jvc corporation",
    "jvc projector",
  ],
  Vivitek: [
    "vivitek",
    "delta",
    "vivitek corporation",
    "vivitek projector",
    "vivitek usa",
    "delta electronics",
  ],
};

export const REGIONAL_MODEL_EQUIVALENTS: Record<string, Record<string, string[]>> = {
  Epson: {
    // US: [EU, Asia, Australia]
    "Pro L30000UNL": ["EB-L30000U", "EB-L30000", "EB-L30000U"],
    "Pro L25000U": ["EB-L25000U", "EB-L25000", "EB-L25000U"],
    "Pro L20000U": ["EB-L20000U", "EB-L20000", "EB-L20002U"],
    "Pro L12000Q": ["EB-L12000Q", "EB-L12000QNL", "EB-12000Q"],
    "PowerLite L735U": ["EB-L735U", "EB-L730U", "EB-L735U"],
  },
  Panasonic: {
    // Global: [US suffix variants]
    "PT-RZ21K": ["PT-RZ21KU", "PT-RZ21KE", "PT-RZ21KJ"],
    "PT-RQ35K": ["PT-RQ35KU", "PT-RQ35KE", "PT-RQ35KC"],
    "PT-MZ16K": ["PT-MZ16KL", "PT-MZ16KLE", "PT-MZ16KLU"],
  },
  JVC: {
    // Consumer: [Professional]
    "DLA-NZ9": ["DLA-RS4100", "DLA-RS4100E", "DLA-RS4100K"],
    "DLA-NZ8": ["DLA-RS3100", "DLA-RS3100E", "DLA-RS3100K"],
    "DLA-NZ7": ["DLA-RS2100", "DLA-RS2100E", "DLA-RS2100K"],
  },
};

export const ACQUISITION_MAPPINGS: Record<string, ManufacturerMapping> = {
  Sharp: {
    canonical: "NEC/Sharp",
    aliases: ["sharp", "sharp nec", "sharp electronics"],
    regionalVariations: ["sharp corporation", "sharp visual solutions"],
    acquisitions: {
      acquiredBy: "NEC",
      date: "2023",
      legacyName: "Sharp Visual Solutions",
    },
  },
  "Projection Design": {
    canonical: "Barco",
    aliases: ["projection design", "projectiondesign"],
    regionalVariations: ["projection design as", "pd"],
    acquisitions: {
      acquiredBy: "Barco",
      date: "2014",
      legacyName: "Projection Design AS",
    },
  },
};

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Calculate similarity score between two strings (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Find best fuzzy match for manufacturer name
 */
function findBestFuzzyMatch(
  input: string,
  aliases: Record<string, string[]>,
): {
  manufacturer: string;
  score: number;
  matchType: "exact" | "alias" | "fuzzy";
} {
  let bestMatch = { manufacturer: "", score: 0, matchType: "fuzzy" as const };

  for (const [canonical, aliasList] of Object.entries(aliases)) {
    for (const alias of aliasList) {
      // Check for exact match
      if (input === alias) {
        return { manufacturer: canonical, score: 1.0, matchType: "exact" };
      }

      // Check for alias match
      if (input.includes(alias) || alias.includes(input)) {
        const score = Math.max(input.length, alias.length) / Math.min(input.length, alias.length);
        if (score > bestMatch.score) {
          bestMatch = { manufacturer: canonical, score, matchType: "alias" };
        }
      }

      // Fuzzy matching
      const similarity = calculateSimilarity(input, alias);
      if (similarity > bestMatch.score) {
        bestMatch = { manufacturer: canonical, score: similarity, matchType: "fuzzy" };
      }
    }
  }

  return bestMatch;
}

/**
 * Normalize manufacturer name with enhanced matching
 */
export function normalizeManufacturer(input: string): {
  canonical: string | null;
  confidence: number;
  matchType: "exact" | "alias" | "fuzzy" | "acquisition";
  originalInput: string;
} {
  if (!input) {
    return {
      canonical: null,
      confidence: 0,
      matchType: "exact",
      originalInput: input,
    };
  }

  const normalized = input
    .toLowerCase()
    .trim()
    .replace(/[.,\-_]/g, " ")
    .replace(/\s+/g, " ");

  // Check exact matches first
  for (const [canonical, aliases] of Object.entries(MANUFACTURER_ALIASES)) {
    if (aliases.includes(normalized)) {
      return {
        canonical,
        confidence: 1.0,
        matchType: "exact",
        originalInput: input,
      };
    }
  }

  // Check acquisition mappings
  for (const [, mapping] of Object.entries(ACQUISITION_MAPPINGS)) {
    if (mapping.aliases.includes(normalized) || mapping.regionalVariations.includes(normalized)) {
      return {
        canonical: mapping.canonical,
        confidence: 0.95,
        matchType: "acquisition",
        originalInput: input,
      };
    }
  }

  // Fuzzy matching with minimum threshold
  const bestMatch = findBestFuzzyMatch(normalized, MANUFACTURER_ALIASES);
  if (bestMatch.score > 0.8) {
    return {
      canonical: bestMatch.manufacturer,
      confidence: bestMatch.score,
      matchType: bestMatch.matchType,
      originalInput: input,
    };
  }

  return {
    canonical: null,
    confidence: 0,
    matchType: "fuzzy",
    originalInput: input,
  };
}

/**
 * Find equivalent models across regions
 */
export function findEquivalentModels(model: string, manufacturer: string): string[] {
  const mfgEquivalents = REGIONAL_MODEL_EQUIVALENTS[manufacturer];
  if (!mfgEquivalents) return [model];

  // Check if this model is a key
  if (mfgEquivalents[model]) {
    return [model, ...mfgEquivalents[model]];
  }

  // Check if this model is in any values
  for (const [key, values] of Object.entries(mfgEquivalents)) {
    if (values.includes(model)) {
      return [key, ...values];
    }
  }

  return [model];
}

/**
 * Normalize model name for database queries
 */
export function normalizeModelName(model: string): string {
  return model
    .replace(/[UEJ]$/, "") // Remove U, E, J suffixes
    .replace(/NL$/, "") // Remove NL suffix
    .replace(/-P$/, "") // Remove -P suffix
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .toUpperCase();
}

/**
 * Enhanced manufacturer comparison that handles all variations
 */
export function manufacturersMatch(manufacturer1: string, manufacturer2: string): boolean {
  const norm1 = normalizeManufacturer(manufacturer1);
  const norm2 = normalizeManufacturer(manufacturer2);

  if (!norm1.canonical || !norm2.canonical) {
    return false;
  }

  // Direct canonical match
  if (norm1.canonical === norm2.canonical) {
    return true;
  }

  // Check if either maps to the other via acquisitions
  const acq1 = Object.values(ACQUISITION_MAPPINGS).find(
    (mapping) => mapping.canonical === norm1.canonical,
  );
  const acq2 = Object.values(ACQUISITION_MAPPINGS).find(
    (mapping) => mapping.canonical === norm2.canonical,
  );

  if (acq1 && acq1.canonical === norm2.canonical) return true;
  if (acq2 && acq2.canonical === norm1.canonical) return true;

  return false;
}

/**
 * Get manufacturer variants for database queries
 */
export function getManufacturerVariants(manufacturer: string): string[] {
  const normalized = normalizeManufacturer(manufacturer);
  if (!normalized.canonical) return [manufacturer];

  const variants = new Set([manufacturer, normalized.canonical]);

  // Add all aliases
  const aliases = MANUFACTURER_ALIASES[normalized.canonical];
  if (aliases) {
    aliases.forEach((alias) => variants.add(alias));
  }

  // Add regional equivalents
  const equivalents = findEquivalentModels(manufacturer, normalized.canonical);
  equivalents.forEach((equiv) => variants.add(equiv));

  return Array.from(variants);
}

/**
 * Validate manufacturer compatibility for lens/projector matching
 */
export function validateManufacturerCompatibility(
  projectorMfg: string,
  lensMfg: string,
): {
  compatible: boolean;
  confidence: number;
  warnings: string[];
  crossManufacturer: boolean;
} {
  const warnings: string[] = [];

  // Normalize both manufacturers
  const projNorm = normalizeManufacturer(projectorMfg);
  const lensNorm = normalizeManufacturer(lensMfg);

  if (!projNorm.canonical || !lensNorm.canonical) {
    warnings.push("Unable to normalize manufacturer names");
    return {
      compatible: false,
      confidence: 0,
      warnings,
      crossManufacturer: false,
    };
  }

  const isMatch = manufacturersMatch(projectorMfg, lensMfg);
  const confidence = Math.min(projNorm.confidence, lensNorm.confidence);

  if (!isMatch) {
    warnings.push("Cross-manufacturer lens use voids warranty");
    warnings.push("Optical performance not guaranteed");
    return {
      compatible: false,
      confidence,
      warnings,
      crossManufacturer: true,
    };
  }

  // Add confidence warnings for fuzzy matches
  if (confidence < 0.95) {
    warnings.push(`Manufacturer match confidence: ${(confidence * 100).toFixed(1)}%`);
  }

  return {
    compatible: true,
    confidence,
    warnings,
    crossManufacturer: false,
  };
}

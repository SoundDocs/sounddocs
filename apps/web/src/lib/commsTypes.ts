// Comms Planner Type Definitions
import { CommsBeltpackProps } from "../components/comms-planner/CommsBeltpack";

export interface CommsPlan {
  id: string;
  name: string;
  userId?: string;
  venueGeometry: VenueGeometry;
  zones: Zone[];
  transceivers: Transceiver[];
  beltpacks: CommsBeltpackProps[];
  baseStation?: BaseStation;
  switches: NetworkSwitch[];
  interopConfigs: InteropConfig[];
  roles: Role[];
  channels: Channel[];
  createdAt?: Date;
  lastEdited?: Date;
}

export interface VenueGeometry {
  width: number; // in feet
  height: number; // in feet
  shape: "rectangle" | "polygon";
  vertices?: { x: number; y: number }[];
  heightProfile?: number; // ceiling height in feet
}

export interface BaseStation {
  id: string;
  systemType: SystemType;
  model: SystemModel;
  label: string;
  x: number;
  y: number;
  z: number;
}

export interface Zone {
  id: string;
  name: string;
  polygon: { x: number; y: number }[];
  bpTarget: number; // target beltpack count
  band: RFBand;
  color: string;
}

export type RFBand = "1.9GHz" | "2.4GHz" | "5GHz";
export type SystemType = "FSII" | "FSII-Base" | "Edge" | "Bolero" | "Arcadia" | "ODIN";
export type SystemModel =
  | "FSII_E1_19"
  | "FSII_IP_19"
  | "FSII_24"
  | "FSII_BASE_19"
  | "FSII_BASE_24"
  | "EDGE_5G"
  | "BOLERO_19"
  | "BOLERO_24";
export type TransceiverModel =
  | "FSII-TCVR-19"
  | "FSII-TCVR-24"
  | "FSII-TCVR-IP-19"
  | "Edge-TCVR"
  | "Bolero-ANT"
  | "NSA-002A";

export interface Transceiver {
  id: string;
  zoneId: string;
  systemType: SystemType;
  model: SystemModel; // NEW: mandatory model field
  x: number; // position in feet
  y: number;
  z: number; // height in feet
  label: string;
  band: RFBand; // computed from model, editable only with override
  channels?: ChannelSet;
  dfsEnabled?: boolean;
  poeClass: 0 | 1 | 2 | 3 | 4; // computed from model
  coverageRadius: number; // ft, computed from model; allow override with flag
  currentBeltpacks?: number;
  maxBeltpacks?: number; // computed from model
  overrideFlags?: { band?: boolean; coverage?: boolean; maxBeltpacks?: boolean };
}

export interface ChannelSet {
  primary: number;
  secondary?: number;
  backup?: number; // for DFS
  frequency?: string;
}

export interface NetworkSwitch {
  id: string;
  name: string;
  poeBudgetWatts: number;
  ports: SwitchPort[];
  uplinks: string[];
  currentLoad?: number;
}

export interface SwitchPort {
  id: string;
  portNumber: number;
  poeClass: number;
  deviceRef?: string; // reference to transceiver ID
  powerDraw?: number; // in watts
}

export interface InteropConfig {
  id: string;
  systemType: "Arcadia" | "ODIN" | "Bolero";
  danteports?: DantePort[];
  omneoSettings?: OmneoSettings;
  nsaConfig?: NSAConfig;
}

export interface DantePort {
  id: string;
  portNumber: number;
  label: string;
  subscription?: string;
  aes67Enabled: boolean;
}

export interface OmneoSettings {
  glitchFreeMode: boolean;
  rstpEnabled: boolean;
  qosProfile: string;
  multicastAddresses: string[];
}

export interface NSAConfig {
  aes67Enabled: boolean;
  analogPorts: number; // up to 6
  gpioConfig: any;
  multicastAddress?: string;
}

export interface Role {
  id: string;
  name: string;
  keys: string[];
  channels: string[];
  priority: number;
}

export interface Channel {
  id: string;
  name: string;
  type: "partyline" | "matrix" | "ifb" | "pgm";
  frequency?: string;
}

// Spec-backed placement rules
export const PLACEMENT_RULES = {
  FSII: {
    targetHeight: 9,
    coLocateMinFt: 3,
    recommendBPPeak: "3–4 BP per antenna in practice",
  },
  Edge: {
    targetHeight: 9,
    coLocateMinFt: 20, // ~6–8 m
    channelSeparationHint: "Use channels ≥6–8 apart for adjacent cells",
  },
  Bolero: {
    targetHeight: 9,
    coLocateMinFt: 10,
  },
} as const;

// Manufacturer-specific coverage specifications
export const COVERAGE_SPECS = {
  FSII: {
    "1.9GHz": 30, // feet
    "2.4GHz": 25, // feet
  },
  Edge: {
    "5GHz": 40, // feet with optimal placement
  },
  Bolero: {
    coverage: 50, // feet
  },
  Arcadia: 0, // wired
  ODIN: 0, // wired
};

// Updated coverage radius function using model defaults
export function getCoverageRadius(
  systemType: SystemType,
  _band?: RFBand,
  model?: SystemModel,
): number {
  if (model) return MODEL_DEFAULTS[model].coverageRadiusFt;
  if (systemType === "Edge") return MODEL_DEFAULTS.EDGE_5G.coverageRadiusFt;
  if (systemType === "Bolero") return MODEL_DEFAULTS.BOLERO_19.coverageRadiusFt;
  return MODEL_DEFAULTS.FSII_E1_19.coverageRadiusFt;
}

// PoE Class Power Draw (watts)
export const POE_CLASSES = {
  0: 15.4,
  1: 4.0,
  2: 7.0,
  3: 15.4,
  4: 30.0,
};

// Region-specific 5 GHz pools (US)
export const FREQUENCY_BANDS = {
  "5GHz": {
    nonDFS: [36, 40, 44, 48, 149, 153, 157, 161, 165], // US
    dfs: [52, 56, 60, 64, 100, 104, 108, 112, 116, 120, 124, 128, 132, 136, 140, 144],
  },
} as const;

// Model defaults distilled from specs
export const MODEL_DEFAULTS: Record<
  SystemModel,
  {
    band: RFBand;
    poeClass: 0 | 1 | 2 | 3 | 4;
    maxBeltpacks: number; // per transceiver/antenna
    coverageRadiusFt: number; // conservative indoor radius (halved for safety)
    placement: { minHeightFt?: number; targetHeightFt?: number; coLocateMinFt?: number };
  }
> = {
  FSII_E1_19: {
    band: "1.9GHz",
    poeClass: 0,
    maxBeltpacks: 5,
    coverageRadiusFt: 150,
    placement: { targetHeightFt: 9, coLocateMinFt: 3 },
  },
  FSII_IP_19: {
    band: "1.9GHz",
    poeClass: 3,
    maxBeltpacks: 10,
    coverageRadiusFt: 150,
    placement: { targetHeightFt: 9, coLocateMinFt: 3 },
  },
  FSII_24: {
    band: "2.4GHz",
    poeClass: 0,
    maxBeltpacks: 4,
    coverageRadiusFt: 125,
    placement: { targetHeightFt: 9, coLocateMinFt: 3 },
  },
  FSII_BASE_19: {
    band: "1.9GHz",
    poeClass: 0,
    maxBeltpacks: 0,
    coverageRadiusFt: 0,
    placement: { targetHeightFt: 9, coLocateMinFt: 0 },
  },
  FSII_BASE_24: {
    band: "2.4GHz",
    poeClass: 0,
    maxBeltpacks: 0,
    coverageRadiusFt: 0,
    placement: { targetHeightFt: 9, coLocateMinFt: 0 },
  },
  EDGE_5G: {
    band: "5GHz",
    poeClass: 3,
    maxBeltpacks: 10,
    coverageRadiusFt: 125,
    placement: { targetHeightFt: 9, coLocateMinFt: 20 },
  },
  BOLERO_19: {
    band: "1.9GHz",
    poeClass: 3,
    maxBeltpacks: 10,
    coverageRadiusFt: 165, // diameter ~200 m → radius ~328 ft, halved to 164 ft
    placement: { targetHeightFt: 9, coLocateMinFt: 10 },
  },
  BOLERO_24: {
    band: "2.4GHz",
    poeClass: 3,
    maxBeltpacks: 8,
    coverageRadiusFt: 150,
    placement: { targetHeightFt: 9, coLocateMinFt: 10 },
  },
};

// Translate legacy SystemType + (optional) model string → defaults
export function defaultsFor(model: SystemModel) {
  return MODEL_DEFAULTS[model];
}

// Helper functions for capacity planning
export function calculateRequiredAntennas(
  beltpackCount: number,
  systemType: SystemType = "FSII",
): number {
  // Use model-based defaults for capacity planning
  let maxBeltpacks = 5; // default
  if (systemType === "Edge") maxBeltpacks = MODEL_DEFAULTS.EDGE_5G.maxBeltpacks;
  else if (systemType === "Bolero") maxBeltpacks = MODEL_DEFAULTS.BOLERO_19.maxBeltpacks;
  else if (systemType === "FSII") maxBeltpacks = MODEL_DEFAULTS.FSII_E1_19.maxBeltpacks;

  const required = Math.ceil(beltpackCount / maxBeltpacks);
  return Math.max(2, required); // minimum 2 for diversity/roaming
}

export function validatePlacement(txs: Transceiver[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const byZone = new Map<string, Transceiver[]>();
  txs.forEach((t) => {
    byZone.set(t.zoneId, [...(byZone.get(t.zoneId) || []), t]);
  });

  for (const t of txs) {
    const d = defaultsFor(t.model);
    if (Math.abs((t.z ?? 0) - (d.placement.targetHeightFt ?? 9)) > 4) {
      results.push({
        id: t.id,
        type: "warning",
        message: `Mount ≈${d.placement.targetHeightFt} ft (now ${t.z} ft) for best LOS.`,
      });
    }
    for (const o of txs) {
      if (o.id === t.id) continue;
      const dist = Math.hypot(t.x - o.x, t.y - o.y);
      const min = Math.min(
        d.placement.coLocateMinFt ?? 0,
        defaultsFor(o.model).placement.coLocateMinFt ?? 0,
      );
      if (min && dist < min) {
        results.push({
          id: t.id,
          type: "warning",
          message: `Too close to ${o.label}. Keep ≥${min} ft when co-locating.`,
        });
      }
    }
    if ((t.currentBeltpacks ?? 0) > MODEL_DEFAULTS[t.model].maxBeltpacks) {
      results.push({
        id: t.id,
        type: "error",
        message: `Over capacity: ${t.currentBeltpacks}/${MODEL_DEFAULTS[t.model].maxBeltpacks} BP.`,
      });
    }
  }

  // Roam overlap: ensure every beltpack position sees ≥2 cells (optional: sample grid or reuse your heatmap sampling)
  return results;
}

export interface ValidationResult {
  id: string;
  type: "error" | "warning" | "info";
  message: string;
}

export function calculatePoELoad(transceivers: Transceiver[]): number {
  return transceivers.reduce((total, t) => {
    const poeClass = t.poeClass ?? 3; // default to Class 3
    return total + POE_CLASSES[poeClass as keyof typeof POE_CLASSES];
  }, 0);
}

// Channel validation for beltpack assignments
export function validateBeltpackChannels(beltpacks: CommsBeltpackProps[]): ValidationResult[] {
  const results: ValidationResult[] = [];
  const assignments = new Map<string, string[]>(); // assignment -> beltpack IDs

  beltpacks.forEach((bp) => {
    if (bp.channelAssignments) {
      bp.channelAssignments.forEach((ca) => {
        if (!assignments.has(ca.assignment)) {
          assignments.set(ca.assignment, []);
        }
        assignments.get(ca.assignment)!.push(bp.id);
      });
    }
  });

  // Check for duplicate assignments across different beltpacks
  assignments.forEach((beltpackIds, assignment) => {
    if (beltpackIds.length > 1) {
      beltpackIds.forEach((bpId) => {
        results.push({
          id: bpId,
          type: "warning",
          message: `Channel assignment "${assignment}" is used by multiple beltpacks (${beltpackIds.length} total)`,
        });
      });
    }
  });

  return results;
}

// Enhanced channel allocator for Edge with spacing rules
export function allocateEdgeChannels(
  txs: Transceiver[],
  dfsEnabled: boolean,
): Map<string, { primary: number; backup?: number }> {
  const nonDFS = FREQUENCY_BANDS["5GHz"].nonDFS.slice();
  const dfs = FREQUENCY_BANDS["5GHz"].dfs.slice();
  const pool = dfsEnabled ? [...nonDFS, ...dfs] : nonDFS;

  // Build adjacency list: cells within 1.2× (r1+r2) considered neighbors
  const neighbors = new Map<string, string[]>();
  txs.forEach((a) => {
    const near: string[] = [];
    txs.forEach((b) => {
      if (a.id === b.id) return;
      const dx = a.x - b.x,
        dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      const thresh = 1.2 * ((a.coverageRadius ?? 250) + (b.coverageRadius ?? 250));
      if (dist < thresh) near.push(b.id);
    });
    neighbors.set(a.id, near);
  });

  // Greedy coloring with separation constraint
  const assignment = new Map<string, { primary: number; backup?: number }>();
  const sep = 6; // "6–8 apart" heuristic
  function ok(chan: number, nbrs: string[]) {
    return nbrs.every((n) => {
      const ass = assignment.get(n);
      if (!ass) return true;
      return Math.abs(ass.primary - chan) >= sep;
    });
  }

  // Order high-degree first
  const ordered = [...txs].sort(
    (a, b) => neighbors.get(b.id)!.length - neighbors.get(a.id)!.length,
  );
  for (const t of ordered) {
    let chosen = pool.find((c) => ok(c, neighbors.get(t.id)!));
    if (!chosen && dfsEnabled) chosen = dfs.find((c) => ok(c, neighbors.get(t.id)!));
    if (!chosen) chosen = nonDFS[0]; // last resort
    assignment.set(t.id, { primary: chosen });
  }
  return assignment;
}

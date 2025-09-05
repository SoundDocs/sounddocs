import { supabase } from "./supabase";
import { useCommsPlannerStore } from "../stores/commsPlannerStore";
import { CommsElementProps } from "../components/comms-planner/CommsElement";
import { CommsBeltpackProps } from "../components/comms-planner/CommsBeltpack";
import { Zone, MODEL_DEFAULTS } from "./commsTypes";

type CommsPlanPayload = {
  id?: string;
  name: string;
  venue_geometry: { width: number; height: number };
  zones: Zone[];
  dfs_enabled: boolean;
  poe_budget_total: number;
};

type BeltpackPayload = Omit<CommsBeltpackProps, "signalStrength" | "online" | "assignedTo"> & {
  plan_id: string;
};

export const getCommsPlan = async (planId: string) => {
  const { data: planData, error: planError } = await supabase
    .from("comms_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (planError) throw new Error(planError.message);

  const { data: transceiverData, error: transceiverError } = await supabase
    .from("comms_transceivers")
    .select("*")
    .eq("plan_id", planId);

  if (transceiverError) throw new Error(transceiverError.message);

  const { data: beltpackData, error: beltpackError } = await supabase
    .from("comms_beltpacks")
    .select("*")
    .eq("plan_id", planId);

  if (beltpackError) throw new Error(beltpackError.message);

  const elements = (transceiverData || []).map((el) => {
    const modelDefaults = MODEL_DEFAULTS[el.model as keyof typeof MODEL_DEFAULTS];
    return {
      ...el,
      systemType: el.system_type,
      channels: el.channel_set,
      // Derive values from model, with database overrides
      band: el.band || modelDefaults?.band || "1.9GHz",
      poeClass: el.poe_class ?? modelDefaults?.poeClass ?? 3,
      coverageRadius: el.coverage_radius ?? modelDefaults?.coverageRadiusFt ?? 150,
      maxBeltpacks: modelDefaults?.maxBeltpacks ?? 5,
    };
  });

  const beltpacks = beltpackData || [];

  return { ...planData, elements, beltpacks };
};

export const saveCommsPlan = async (planId: string | null) => {
  const state = useCommsPlannerStore.getState();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("User not authenticated");

  const planPayload: CommsPlanPayload = {
    name: state.planName,
    venue_geometry: { width: state.venueWidth, height: state.venueHeight },
    zones: state.zones,
    dfs_enabled: state.dfsEnabled,
    poe_budget_total: state.poeBudget,
  };

  let currentPlanId = planId;

  if (currentPlanId && currentPlanId !== "new") {
    // Update existing plan
    const { error } = await supabase
      .from("comms_plans")
      .update({ ...planPayload, last_edited: new Date().toISOString() })
      .eq("id", currentPlanId);
    if (error) throw new Error(`Error updating plan: ${error.message}`);
  } else {
    // Create new plan
    const { data, error } = await supabase
      .from("comms_plans")
      .insert({ ...planPayload, user_id: user.id })
      .select("id")
      .single();
    if (error) throw new Error(`Error creating plan: ${error.message}`);
    currentPlanId = data.id;
  }

  if (!currentPlanId) throw new Error("Failed to get plan ID");

  // Upsert transceivers
  const transceiversPayload = state.elements.map((el) => {
    const modelDefaults = MODEL_DEFAULTS[el.model as keyof typeof MODEL_DEFAULTS];
    return {
      id: el.id,
      plan_id: currentPlanId!,
      system_type: el.systemType,
      model: el.model,
      x: el.x,
      y: el.y,
      z: el.z,
      label: el.label,
      band: el.band, // Keep existing band value for now
      channel_set: el.channels,
      dfs_enabled: el.dfsEnabled,
      // Derive from model defaults instead of storing UI values
      poe_class: modelDefaults?.poeClass ?? 3,
      coverage_radius: modelDefaults?.coverageRadiusFt ?? 150,
    };
  });

  const { error: deleteTransceiversError } = await supabase
    .from("comms_transceivers")
    .delete()
    .eq("plan_id", currentPlanId);
  if (deleteTransceiversError)
    throw new Error(`Error clearing old transceivers: ${deleteTransceiversError.message}`);

  if (transceiversPayload.length > 0) {
    const { error: insertTransceiversError } = await supabase
      .from("comms_transceivers")
      .insert(transceiversPayload);
    if (insertTransceiversError)
      throw new Error(`Error inserting transceivers: ${insertTransceiversError.message}`);
  }

  // Upsert beltpacks
  const beltpacksPayload: BeltpackPayload[] = state.beltpacks.map((bp) => ({
    id: bp.id,
    plan_id: currentPlanId!,
    label: bp.label,
    x: bp.x,
    y: bp.y,
    batteryLevel: bp.batteryLevel,
    transceiverRef: bp.transceiverRef,
  }));

  const { error: deleteBeltpacksError } = await supabase
    .from("comms_beltpacks")
    .delete()
    .eq("plan_id", currentPlanId);
  if (deleteBeltpacksError)
    throw new Error(`Error clearing old beltpacks: ${deleteBeltpacksError.message}`);

  if (beltpacksPayload.length > 0) {
    const { error: insertBeltpacksError } = await supabase
      .from("comms_beltpacks")
      .insert(beltpacksPayload);
    if (insertBeltpacksError)
      throw new Error(`Error inserting beltpacks: ${insertBeltpacksError.message}`);
  }

  return currentPlanId;
};

// Helper function to download blob as file
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Export channel table as CSV
export const exportChannelTable = (elements: CommsElementProps[]) => {
  const rows = [["Label", "Model", "Band", "Primary", "Backup", "Zone"]];
  elements
    .filter((e) => e.systemType === "Edge")
    .forEach((e) =>
      rows.push([
        e.label,
        e.model || "EDGE_5G",
        e.band || "5GHz",
        String(e.channels?.primary ?? ""),
        String(e.channels?.backup ?? ""),
        e.zoneId || "",
      ]),
    );
  const csv = rows.map((r) => r.join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv" }), "edge-channel-plan.csv");
};

// Export PoE budget per switch
export const exportPoEBudget = (elements: CommsElementProps[]) => {
  const rows = [["Switch", "Device", "PoE Class", "Power Draw (W)", "Total Power (W)"]];

  // Group by logical switches (simplified - in real implementation would use switch topology)
  const devicesBySwitch: { [key: string]: CommsElementProps[] } = {};
  elements.forEach((el) => {
    const switchName = `Switch ${Math.floor(elements.indexOf(el) / 8) + 1}`; // Simple grouping
    if (!devicesBySwitch[switchName]) devicesBySwitch[switchName] = [];
    devicesBySwitch[switchName].push(el);
  });

  Object.entries(devicesBySwitch).forEach(([switchName, devices]) => {
    rows.push([switchName, "", "", "", ""]); // Switch header
    let switchTotal = 0;
    devices.forEach((device) => {
      const poeClass = device.poeClass || MODEL_DEFAULTS[device.model || "FSII_E1_19"].poeClass;
      const powerDraw = [15.4, 4.0, 7.0, 15.4, 30.0][poeClass] || 15.4;
      switchTotal += powerDraw;
      rows.push(["", device.label, `Class ${poeClass}`, powerDraw.toString(), ""]);
    });
    // Update total row
    const totalRowIndex = rows.length - devices.length;
    rows[totalRowIndex][4] = switchTotal.toString();
  });

  const csv = rows.map((r) => r.join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv" }), "poe-budget.csv");
};

// Export deployment checklist
export const exportDeploymentChecklist = (elements: CommsElementProps[]) => {
  const rows = [
    [
      "Device",
      "Model",
      "Mount Height (ft)",
      "Target Height (ft)",
      "PoE Class",
      "Max Beltpacks",
      "Coverage Radius (ft)",
      "Cable Run Est. (ft)",
    ],
  ];

  elements.forEach((el) => {
    const model = el.model || "FSII_E1_19";
    const defaults = MODEL_DEFAULTS[model];
    const cableRun = Math.sqrt(el.x ** 2 + el.y ** 2); // Simple estimate from origin

    rows.push([
      el.label,
      model,
      el.z?.toString() || "8",
      defaults.placement.targetHeightFt?.toString() || "9",
      `Class ${el.poeClass || defaults.poeClass}`,
      defaults.maxBeltpacks.toString(),
      (el.coverageRadius || defaults.coverageRadiusFt).toString(),
      Math.round(cableRun).toString(),
    ]);
  });

  const csv = rows.map((r) => r.join(",")).join("\n");
  downloadBlob(new Blob([csv], { type: "text/csv" }), "deployment-checklist.csv");
};

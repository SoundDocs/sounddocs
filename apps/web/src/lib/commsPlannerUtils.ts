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

// Helper function to get existing IDs from server for a specific table and plan
const getExistingIds = async (tableName: string, planId: string): Promise<string[]> => {
  const { data, error } = await supabase.from(tableName).select("id").eq("plan_id", planId);

  if (error) throw new Error(`Error fetching ${tableName} IDs: ${error.message}`);
  return (data || []).map((item) => item.id);
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

  // Safe upsert for transceivers with diff-based deletes
  const transceiversPayload = state.elements.map((el) => {
    const modelDefaults = MODEL_DEFAULTS[el.model as keyof typeof MODEL_DEFAULTS];
    const poeClass = el.poeClass ?? modelDefaults?.poeClass ?? 3;
    const coverageRadius = el.coverageRadius ?? modelDefaults?.coverageRadiusFt ?? 150;
    return {
      id: el.id,
      plan_id: currentPlanId!,
      system_type: el.systemType,
      model: el.model,
      x: el.x,
      y: el.y,
      z: el.z,
      label: el.label,
      band: el.band,
      channel_set: el.channels,
      dfs_enabled: el.dfsEnabled,
      poe_class: poeClass,
      coverage_radius: coverageRadius,
    };
  });

  // Get existing transceiver IDs from server
  const serverTransceiverIds = await getExistingIds("comms_transceivers", currentPlanId);
  const clientTransceiverIds = new Set(transceiversPayload.map((t) => t.id));

  // Upsert transceivers (insert new, update existing)
  if (transceiversPayload.length > 0) {
    const { error: upsertTransceiversError } = await supabase
      .from("comms_transceivers")
      .upsert(transceiversPayload, { onConflict: "id" });
    if (upsertTransceiversError)
      throw new Error(`Error upserting transceivers: ${upsertTransceiversError.message}`);
  }

  // Delete transceivers that were removed in the UI
  const transceiversToDelete = serverTransceiverIds.filter((id) => !clientTransceiverIds.has(id));
  if (transceiversToDelete.length > 0) {
    const { error: deleteTransceiversError } = await supabase
      .from("comms_transceivers")
      .delete()
      .in("id", transceiversToDelete);
    if (deleteTransceiversError)
      throw new Error(`Error deleting removed transceivers: ${deleteTransceiversError.message}`);
  }

  // Safe upsert for beltpacks with diff-based deletes
  const beltpacksPayload: BeltpackPayload[] = state.beltpacks.map((bp) => ({
    id: bp.id,
    plan_id: currentPlanId!,
    label: bp.label,
    x: bp.x,
    y: bp.y,
    batteryLevel: bp.batteryLevel,
    transceiverRef: bp.transceiverRef,
  }));

  // Get existing beltpack IDs from server
  const serverBeltpackIds = await getExistingIds("comms_beltpacks", currentPlanId);
  const clientBeltpackIds = new Set(beltpacksPayload.map((bp) => bp.id));

  // Upsert beltpacks (insert new, update existing)
  if (beltpacksPayload.length > 0) {
    const { error: upsertBeltpacksError } = await supabase
      .from("comms_beltpacks")
      .upsert(beltpacksPayload, { onConflict: "id" });
    if (upsertBeltpacksError)
      throw new Error(`Error upserting beltpacks: ${upsertBeltpacksError.message}`);
  }

  // Delete beltpacks that were removed in the UI
  const beltpacksToDelete = serverBeltpackIds.filter((id) => !clientBeltpackIds.has(id));
  if (beltpacksToDelete.length > 0) {
    const { error: deleteBeltpacksError } = await supabase
      .from("comms_beltpacks")
      .delete()
      .in("id", beltpacksToDelete);
    if (deleteBeltpacksError)
      throw new Error(`Error deleting removed beltpacks: ${deleteBeltpacksError.message}`);
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

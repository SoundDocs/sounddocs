import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  ArrowLeft,
  Save,
  Loader,
  AlertTriangle,
  CheckCircle,
  Users,
  AlertCircle,
  Download,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CommsCanvas from "../components/comms-planner/CommsCanvas";
import CommsToolbar from "../components/comms-planner/CommsToolbar";
import CommsProperties from "../components/comms-planner/CommsProperties";
import { useCommsPlannerStore } from "../stores/commsPlannerStore";
import { CommsElementProps } from "../components/comms-planner/CommsElement";
import { CommsBeltpackProps } from "../components/comms-planner/CommsBeltpack";
import CommsPlanExport from "../components/CommsPlanExport";
import PrintCommsPlanExport from "../components/PrintCommsPlanExport";
import ExportModal from "../components/ExportModal";
import { CommsPlan } from "../lib/commsTypes";
import { v4 as uuidv4 } from "uuid";
import {
  getSharedResource,
  updateSharedResource,
  getShareUrl,
  SharedLink,
} from "../lib/shareUtils";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCollaboration } from "@/hooks/useCollaboration";
import { usePresence } from "@/hooks/usePresence";
import { CollaborationToolbar } from "@/components/CollaborationToolbar";
import { DocumentHistory } from "@/components/History/DocumentHistory";
import { ConflictResolution } from "@/components/ConflictResolution";
import type { DocumentConflict, VersionHistory } from "@/types/collaboration";
import {
  SystemType,
  SystemModel,
  RFBand,
  validatePlacement,
  calculatePoELoad,
  allocateEdgeChannels,
  getCoverageRadius,
  MODEL_DEFAULTS,
  defaultsFor,
  Transceiver,
  ValidationResult,
} from "../lib/commsTypes";
import { saveCommsPlan, getCommsPlan } from "../lib/commsPlannerUtils";

const CommsPlannerEditor = () => {
  const { id, shareCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [currentShareLink, setCurrentShareLink] = useState<SharedLink | null>(null);

  // Collaboration state
  const [showHistory, setShowHistory] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflict, setConflict] = useState<DocumentConflict | null>(null);

  // Version history state
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // For unauthenticated shared edit users, generate a temporary ID
  const [anonymousUserId] = useState(() => `anonymous-${uuidv4()}`);
  const effectiveUserId = user?.id || (isSharedEdit ? anonymousUserId : "");
  const effectiveUserEmail = user?.email || (isSharedEdit ? `${anonymousUserId}@shared` : "");
  const effectiveUserName = user?.user_metadata?.name || (isSharedEdit ? "Anonymous User" : "");
  const {
    planName,
    elements,
    beltpacks,
    zones,
    venueWidth,
    venueHeight,
    dfsEnabled,
    poeBudget,
    setPlanName,
    setElements,
    addElement,
    updateElement,
    removeElement,
    setBeltpacks,
    updateBeltpack,
    removeBeltpack,
    setZones,
    setVenueWidth,
    setVenueHeight,
    setDfsEnabled,
    setPoeBudget,
    reset,
  } = useCommsPlannerStore();
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [totalPoELoad, setTotalPoELoad] = useState(0);
  const isInitialMount = useRef(true);

  // Get actual document ID from store (for collaboration)
  const [documentId, setDocumentId] = useState<string | null>(null);

  // Enable collaboration for existing documents (including edit-mode shared links)
  // For shared links, id will be undefined, so we check documentId instead
  // For edit-mode shared links, allow collaboration even without authentication
  const collaborationEnabled =
    (id ? id !== "new" : true) && // Allow if no id param (shared link) or if id !== "new"
    (!isSharedEdit || currentShareLink?.link_type === "edit") &&
    !!documentId &&
    (!!user || (isSharedEdit && currentShareLink?.link_type === "edit")); // Allow unauthenticated for edit-mode shared links

  // Debug: Log collaboration status
  useEffect(() => {
    const status = {
      collaborationEnabled,
      id,
      idCheck: id ? id !== "new" : true,
      isNew: id === "new",
      isSharedEdit,
      currentShareLinkType: currentShareLink?.link_type,
      shareEditCheck: !isSharedEdit || currentShareLink?.link_type === "edit",
      hasDocumentId: !!documentId,
      hasUser: !!user,
      userId: user?.id,
      documentId,
    };
    console.log("[CommsPlannerEditor] Collaboration status:");
    console.log(JSON.stringify(status, null, 2));
  }, [collaborationEnabled, id, isSharedEdit, currentShareLink, documentId, user]);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [currentExportCommsPlan, setCurrentExportCommsPlan] = useState<CommsPlan | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);

  // Venue settings
  const [showGrid, setShowGrid] = useState(true);
  const [showCoverage, setShowCoverage] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [fitMode, setFitMode] = useState<"fit" | "fill">("fit");

  // Auto-save hook - Create a document data object for auto-save
  const documentData = documentId
    ? {
        id: documentId,
        name: planName,
        venue_geometry: {
          width: venueWidth,
          height: venueHeight,
        },
        zones,
        elements: elements.map((el) => ({
          ...el,
          system_type: el.systemType,
          channel_set: el.channels,
        })),
        beltpacks,
        dfs_enabled: dfsEnabled,
        poe_budget_total: poeBudget,
      }
    : null;

  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
  } = useAutoSave({
    documentId: documentId || "",
    documentType: "comms_planners",
    userId: effectiveUserId,
    data: documentData,
    enabled: collaborationEnabled,
    debounceMs: 1500,
    onBeforeSave: async (data) => {
      // Validate data before saving
      if (!data.name || data.name.trim() === "") {
        return false;
      }
      return true;
    },
  });

  // Collaboration hook
  const {
    activeUsers,
    broadcast,
    status: connectionStatus,
  } = useCollaboration({
    documentId: documentId || "",
    documentType: "comms_planners",
    userId: effectiveUserId,
    userEmail: effectiveUserEmail,
    userName: effectiveUserName,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      if (payload.type === "field_update" && payload.field) {
        // Handle field updates from remote users
        console.log("[CommsPlannerEditor] Remote field update:", payload.field, payload.value);
        // Update will be handled by database subscription
      }
    },
  });

  // Presence hook
  const { setEditingField } = usePresence({
    channel: null, // Will be set up when collaboration channels are ready
    userId: effectiveUserId,
  });

  // Real-time database subscription for syncing changes across users
  useEffect(() => {
    if (!collaborationEnabled || !documentId) {
      return;
    }

    console.log("[CommsPlannerEditor] Setting up real-time subscription for document:", documentId);

    const channel = supabase
      .channel(`comms_planner_db_${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "comms_planners",
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          console.log("[CommsPlannerEditor] Received database UPDATE event:", payload);
          // Update local state with the new data
          // IMPORTANT: Exclude metadata fields (version, last_edited, metadata) to prevent
          // triggering auto-save, which would create an infinite loop
          if (payload.new) {
            const { version, last_edited, metadata, ...userEditableFields } = payload.new as any;

            // Update store with new data
            if (userEditableFields.name) {
              setPlanName(userEditableFields.name);
            }
            if (userEditableFields.venue_geometry) {
              setVenueWidth(userEditableFields.venue_geometry.width);
              setVenueHeight(userEditableFields.venue_geometry.height);
            }
            if (userEditableFields.zones) {
              setZones(userEditableFields.zones);
            }
            if (userEditableFields.elements) {
              const loadedElements = userEditableFields.elements.map((el: any) => ({
                ...el,
                systemType: el.system_type,
                channels: el.channel_set,
              }));
              setElements(loadedElements);
            }
            if (userEditableFields.beltpacks) {
              setBeltpacks(userEditableFields.beltpacks);
            }
            if (typeof userEditableFields.dfs_enabled !== "undefined") {
              setDfsEnabled(userEditableFields.dfs_enabled);
            }
            if (typeof userEditableFields.poe_budget_total !== "undefined") {
              setPoeBudget(userEditableFields.poe_budget_total);
            }
          }
        },
      )
      .subscribe();

    return () => {
      console.log("[CommsPlannerEditor] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [
    collaborationEnabled,
    documentId,
    setPlanName,
    setVenueWidth,
    setVenueHeight,
    setZones,
    setElements,
    setBeltpacks,
    setDfsEnabled,
    setPoeBudget,
  ]);

  // Keyboard shortcut for manual save (Cmd/Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (collaborationEnabled) {
          forceSave();
        } else {
          handleSave(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collaborationEnabled, forceSave]);

  const getDefaultModel = (systemType: SystemType): SystemModel => {
    switch (systemType) {
      case "Edge":
        return "EDGE_5G";
      case "Bolero":
        return "BOLERO_19";
      case "FSII":
        return "FSII_E1_19"; // sensible default; user can toggle to FSII_IP_19
      case "FSII-Base":
        return "FSII_BASE_19";
      default:
        return "FSII_E1_19";
    }
  };

  const handleAddElement = (systemType: SystemType) => {
    const model = getDefaultModel(systemType);
    const d = defaultsFor(model);
    const centerXFt = venueWidth / 2 + elements.length * 5;
    const centerYFt = venueHeight / 2 + elements.length * 5;

    const newElement: CommsElementProps = {
      id: uuidv4(),
      systemType,
      model, // NEW
      label: `${systemType} ${elements.filter((e) => e.systemType === systemType).length + 1}`,
      x: centerXFt,
      y: centerYFt,
      z: d.placement.targetHeightFt ?? 9,
      band: d.band,
      coverageRadius: d.coverageRadiusFt,
      currentBeltpacks: 0,
      maxBeltpacks: d.maxBeltpacks, // NEW: show read-only in UI
      poeClass: d.poeClass,
    };
    addElement(newElement);
  };

  const handleAddBeltpack = () => {
    // Calculate initial position in feet at venue center with some offset
    const centerXFt = venueWidth / 2 + beltpacks.length * 3;
    const centerYFt = venueHeight / 2 + beltpacks.length * 3;

    const newBeltpack: CommsBeltpackProps = {
      id: uuidv4(),
      label: `BP ${beltpacks.length + 1}`,
      x: centerXFt,
      y: centerYFt,
      transceiverRef: undefined,
      signalStrength: 0,
      batteryLevel: 100,
      online: false,
    };

    // Add the beltpack and immediately run assignment logic
    const updatedBeltpacks = [...beltpacks, newBeltpack];
    const assignedBeltpacks = runAssignmentLogic(updatedBeltpacks, elements);
    setBeltpacks(assignedBeltpacks);
  };

  const runAssignmentLogic = useCallback(
    (
      currentBeltpacks: CommsBeltpackProps[],
      currentElements: CommsElementProps[],
    ): CommsBeltpackProps[] => {
      const transceivers = currentElements.filter(
        (el) => el.systemType === "FSII" || el.systemType === "Edge" || el.systemType === "Bolero",
      );

      // Calculate signal strength based on distance and path loss
      const calculateSignalStrength = (distance: number, coverageRadius: number): number => {
        if (distance > coverageRadius) return 0;
        // Simple inverse distance model with some attenuation
        const signal = Math.max(0, 100 * (1 - distance / coverageRadius));
        return Math.round(signal);
      };

      // Get best transceiver for a beltpack (prioritize signal strength)
      const getBestTransceiverForBeltpack = (
        bp: CommsBeltpackProps,
        availableTransceivers: CommsElementProps[],
      ) => {
        const candidates = availableTransceivers
          .map((t) => {
            const distance = Math.hypot(t.x - bp.x, t.y - bp.y);
            const coverageRadius =
              t.coverageRadius || getCoverageRadius(t.systemType, t.band, t.model);
            const signalStrength = calculateSignalStrength(distance, coverageRadius);
            return { transceiver: t, distance, signalStrength };
          })
          .filter((c) => c.signalStrength > 0) // Only consider transceivers with signal
          .sort((a, b) => b.signalStrength - a.signalStrength); // Best signal first

        return candidates[0] || null;
      };

      const assignments: { [beltpackId: string]: string | undefined } = {};
      const transceiverLoads: { [transceiverId: string]: string[] } = {};
      transceivers.forEach((t) => (transceiverLoads[t.id] = []));

      // Phase 1: Assign beltpacks to their best available transceiver
      currentBeltpacks.forEach((bp) => {
        const bestOption = getBestTransceiverForBeltpack(bp, transceivers);
        if (bestOption) {
          const maxCapacity = bestOption.transceiver.maxBeltpacks ?? 5;
          if (transceiverLoads[bestOption.transceiver.id].length < maxCapacity) {
            assignments[bp.id] = bestOption.transceiver.id;
            transceiverLoads[bestOption.transceiver.id].push(bp.id);
          }
        }
      });

      // Phase 2: Roaming - allow beltpacks to move to better options if transceivers become full
      const unassignedBeltpacks = currentBeltpacks.filter((bp) => !assignments[bp.id]);
      let hasChanges = true;
      let iterations = 0;

      while (hasChanges && iterations < 10) {
        // Prevent infinite loops
        hasChanges = false;
        iterations++;

        // Try to find better assignments for unassigned beltpacks
        for (const bp of [...unassignedBeltpacks]) {
          const bestOption = getBestTransceiverForBeltpack(bp, transceivers);
          if (bestOption) {
            const maxCapacity =
              bestOption.transceiver.maxBeltpacks ??
              MODEL_DEFAULTS[bestOption.transceiver.model!]?.maxBeltpacks ??
              5;
            if (transceiverLoads[bestOption.transceiver.id].length < maxCapacity) {
              assignments[bp.id] = bestOption.transceiver.id;
              transceiverLoads[bestOption.transceiver.id].push(bp.id);
              unassignedBeltpacks.splice(unassignedBeltpacks.indexOf(bp), 1);
              hasChanges = true;
              break;
            }
          }
        }

        // Try to displace lower-signal beltpacks to make room for higher-signal ones
        for (const transceiver of transceivers) {
          const maxCapacity = transceiver.maxBeltpacks ?? 5;
          const currentLoad = transceiverLoads[transceiver.id];

          if (currentLoad.length >= maxCapacity) {
            // Find the beltpack with the weakest signal to this transceiver
            let weakestBpId: string | null = null;
            let weakestSignal = 100;

            currentLoad.forEach((bpId) => {
              const bp = currentBeltpacks.find((b) => b.id === bpId);
              if (bp) {
                const distance = Math.hypot(transceiver.x - bp.x, transceiver.y - bp.y);
                const coverageRadius =
                  transceiver.coverageRadius ||
                  getCoverageRadius(transceiver.systemType, transceiver.band, transceiver.model);
                const signalStrength = calculateSignalStrength(distance, coverageRadius);
                if (signalStrength < weakestSignal) {
                  weakestSignal = signalStrength;
                  weakestBpId = bpId;
                }
              }
            });

            // Try to reassign the weakest beltpack to a better alternative
            if (weakestBpId) {
              const weakestBp = currentBeltpacks.find((b) => b.id === weakestBpId);
              if (weakestBp) {
                const altTransceivers = transceivers.filter((t) => t.id !== transceiver.id);
                const bestAlt = getBestTransceiverForBeltpack(weakestBp, altTransceivers);

                if (bestAlt && bestAlt.signalStrength > weakestSignal) {
                  const altMaxCapacity = bestAlt.transceiver.maxBeltpacks ?? 5;
                  if (transceiverLoads[bestAlt.transceiver.id].length < altMaxCapacity) {
                    // Move the beltpack to the better transceiver
                    transceiverLoads[transceiver.id] = currentLoad.filter(
                      (id) => id !== weakestBpId,
                    );
                    transceiverLoads[bestAlt.transceiver.id].push(weakestBpId);
                    assignments[weakestBpId] = bestAlt.transceiver.id;
                    hasChanges = true;
                  }
                }
              }
            }
          }
        }
      }

      // Final pass: calculate signal strengths and update beltpack status
      return currentBeltpacks.map((bp) => {
        const assignedTransceiverId = assignments[bp.id];
        if (assignedTransceiverId) {
          const transceiver = currentElements.find((el) => el.id === assignedTransceiverId);
          if (transceiver) {
            const distance = Math.hypot(transceiver.x - bp.x, transceiver.y - bp.y);
            const coverageRadius =
              transceiver.coverageRadius ||
              getCoverageRadius(transceiver.systemType, transceiver.band, transceiver.model);
            const signalStrength = calculateSignalStrength(distance, coverageRadius);

            return {
              ...bp,
              transceiverRef: assignedTransceiverId,
              signalStrength,
              online: signalStrength > 10, // Consider online if signal > 10%
            };
          }
        }
        return { ...bp, transceiverRef: undefined, signalStrength: 0, online: false };
      });
    },
    [],
  );

  const handleBeltpackDragStop = (beltpackId: string, xFt: number, yFt: number) => {
    const updatedBeltpacks = beltpacks.map((bp) =>
      bp.id === beltpackId ? { ...bp, x: xFt, y: yFt } : bp,
    );
    setBeltpacks(runAssignmentLogic(updatedBeltpacks, elements));
  };

  const handleElementDragStop = (elementId: string, xFt: number, yFt: number) => {
    updateElement(elementId, { x: xFt, y: yFt });
    const updatedElements = elements.map((el) =>
      el.id === elementId ? { ...el, x: xFt, y: yFt } : el,
    );
    setBeltpacks(runAssignmentLogic(beltpacks, updatedElements));
  };

  const handleDeleteElement = (id: string) => {
    const isElement = elements.some((el) => el.id === id);
    const isBeltpack = beltpacks.some((bp) => bp.id === id);

    if (isElement) {
      // Remove the element
      removeElement(id);
      // Detach any beltpacks referencing this transceiver
      const updatedBeltpacks = beltpacks.map((bp) =>
        bp.transceiverRef === id
          ? { ...bp, transceiverRef: undefined, signalStrength: 0, online: false }
          : bp,
      );
      setBeltpacks(updatedBeltpacks);
    } else if (isBeltpack) {
      removeBeltpack(id);
    }

    setSelectedElementId(null);
  };

  const handlePropertyChange = (elementId: string, property: string, value: unknown) => {
    // Check if it's a beltpack or element
    const beltpack = beltpacks.find((bp) => bp.id === elementId);

    if (beltpack) {
      // Handle beltpack property changes
      updateBeltpack(elementId, { [property]: value });
    } else {
      // Handle element property changes
      const element = elements.find((el) => el.id === elementId);
      if (element) {
        if (property === "band") {
          const newCoverageRadius = getCoverageRadius(element.systemType, value);
          updateElement(elementId, { band: value, coverageRadius: newCoverageRadius });
        } else if (property.includes(".")) {
          const [mainProp, subProp] = property.split(".");
          const currentValue = element[mainProp as keyof CommsElementProps];
          const updatedValue = {
            ...(typeof currentValue === "object" && currentValue !== null ? currentValue : {}),
            [subProp]: value,
          };
          updateElement(elementId, { [mainProp]: updatedValue });
        } else {
          updateElement(elementId, { [property]: value });
        }
      }
    }
  };

  // Validate placement whenever elements change
  useEffect(() => {
    const transceivers: Transceiver[] = elements.map((el) => ({
      id: el.id,
      zoneId: el.zoneId || "default",
      systemType: el.systemType,
      model: (el.model || "FSII_E1_19") as SystemModel,
      x: el.x,
      y: el.y,
      z: el.z || 8,
      label: el.label,
      band: (el.band || "1.9GHz") as RFBand,
      channels: el.channels,
      dfsEnabled: el.dfsEnabled,
      poeClass: el.poeClass || 3,
      coverageRadius: el.coverageRadius || 30,
      currentBeltpacks: el.currentBeltpacks,
    }));

    const results = validatePlacement(transceivers);
    setValidationResults(results);

    let updatedElements = elements.map((el) => ({
      ...el,
      validationErrors: results.filter((r) => r.id === el.id),
    }));

    if (elements.some((el) => el.systemType === "Edge")) {
      const channelMap = allocateEdgeChannels(transceivers, dfsEnabled);
      updatedElements = updatedElements.map((el) => ({
        ...el,
        channels: channelMap.get(el.id) || el.channels,
      }));
    }

    if (JSON.stringify(elements) !== JSON.stringify(updatedElements)) {
      setElements(updatedElements);
    }

    const load = calculatePoELoad(transceivers);
    setTotalPoELoad(load);
  }, [elements, dfsEnabled, setElements]);

  // Recalculate beltpack assignments and update transceiver beltpack counts
  useEffect(() => {
    const transceiverLoads: { [transceiverId: string]: number } = {};
    beltpacks.forEach((bp) => {
      if (bp.transceiverRef) {
        transceiverLoads[bp.transceiverRef] = (transceiverLoads[bp.transceiverRef] || 0) + 1;
      }
    });

    let changed = false;
    const updatedElements = elements.map((el) => {
      const newCount = transceiverLoads[el.id] || 0;
      if ((el.currentBeltpacks || 0) !== newCount) {
        changed = true;
        return { ...el, currentBeltpacks: newCount };
      }
      return el;
    });

    if (changed) {
      setElements(updatedElements);
    }
  }, [beltpacks, elements, setElements]);

  // Auto-assign beltpacks when transceivers are added or moved
  useEffect(() => {
    if (beltpacks.length > 0 && elements.length > 0) {
      const assignedBeltpacks = runAssignmentLogic(beltpacks, elements);
      // Only update if assignments have changed
      const hasChanges = assignedBeltpacks.some((newBp, index) => {
        const oldBp = beltpacks[index];
        return (
          oldBp &&
          (newBp.transceiverRef !== oldBp.transceiverRef ||
            newBp.signalStrength !== oldBp.signalStrength)
        );
      });

      if (hasChanges) {
        setBeltpacks(assignedBeltpacks);
      }
    }
  }, [elements, runAssignmentLogic, beltpacks, setBeltpacks]); // Re-run when elements change

  useEffect(() => {
    const loadPlan = async () => {
      setLoading(true);

      // Check if this is a shared edit path
      const currentPathIsSharedEdit = location.pathname.includes("/shared/comms-planner/edit/");
      console.log(
        `[CommsPlannerEditor] Path: ${location.pathname}, shareCode: ${shareCode}, currentPathIsSharedEdit: ${currentPathIsSharedEdit}`,
      );

      if (currentPathIsSharedEdit && shareCode) {
        // Load shared resource
        console.log(
          "[CommsPlannerEditor] Attempting to fetch SHARED resource with shareCode:",
          shareCode,
        );
        try {
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);

          console.log(
            "[CommsPlannerEditor] DEBUG: Fetched Shared Link Details:",
            JSON.stringify(fetchedShareLink, null, 2),
          );
          console.log(
            "[CommsPlannerEditor] DEBUG: Fetched Resource Details:",
            JSON.stringify(resource, null, 2),
          );

          if (fetchedShareLink.resource_type !== "comms_planner") {
            console.error(
              "[CommsPlannerEditor] Share code is for a different resource type:",
              fetchedShareLink.resource_type,
              "Expected: comms_planner",
            );
            navigate("/dashboard");
            setLoading(false);
            return;
          }

          if (fetchedShareLink.link_type !== "edit") {
            console.warn(
              `[CommsPlannerEditor] Link type is '${fetchedShareLink.link_type}', not 'edit'. Redirecting to view page.`,
            );
            window.location.href = getShareUrl(shareCode, "comms_planner", "view");
            return;
          }

          // Load the shared plan data
          setPlanName(resource.name || "Untitled Comms Plan");
          setDocumentId(resource.id);
          setVenueWidth(resource.venue_geometry?.width || 100);
          setVenueHeight(resource.venue_geometry?.height || 100);
          setZones(resource.zones || []);
          setDfsEnabled(resource.dfs_enabled || false);
          setPoeBudget(resource.poe_budget_total || 1000);

          const loadedElements = (resource.elements || []).map((el: any) => ({
            ...el,
            systemType: el.system_type,
            channels: el.channel_set,
          }));
          setElements(loadedElements);

          const loadedBeltpacks = resource.beltpacks || [];
          const hasExistingAssignments = loadedBeltpacks.some((bp: any) => bp.transceiverRef);
          if (hasExistingAssignments) {
            setBeltpacks(loadedBeltpacks);
          } else {
            setBeltpacks(runAssignmentLogic(loadedBeltpacks, loadedElements));
          }

          setCurrentShareLink(fetchedShareLink);
          setIsSharedEdit(true);
          console.log(
            "[CommsPlannerEditor] SHARED comms_planner resource loaded successfully for editing.",
          );
        } catch (error: any) {
          console.error(
            "[CommsPlannerEditor] Error fetching SHARED comms plan:",
            error.message,
            error,
          );
          navigate("/dashboard");
        } finally {
          setLoading(false);
        }
      } else if (id && id !== "new") {
        // Load owned resource
        if (!user) {
          navigate("/login");
          return;
        }

        try {
          const plan = await getCommsPlan(id);
          setPlanName(plan.name);
          setDocumentId(plan.id);
          setVenueWidth(plan.venue_geometry.width);
          setVenueHeight(plan.venue_geometry.height);
          setZones(plan.zones || []);
          setDfsEnabled(plan.dfs_enabled);
          setPoeBudget(plan.poe_budget_total);
          const loadedElements =
            plan.elements.map(
              (el: {
                id: string;
                system_type: SystemType;
                channel_set: string[];
                [key: string]: unknown;
              }) => ({
                ...el,
                systemType: el.system_type,
                channels: el.channel_set,
              }),
            ) || [];
          setElements(loadedElements);
          const loadedBeltpacks = plan.beltpacks || [];
          // Only run assignment logic if beltpacks don't already have assignments
          const hasExistingAssignments = loadedBeltpacks.some(
            (bp: { transceiverRef?: string }) => bp.transceiverRef,
          );
          if (hasExistingAssignments) {
            setBeltpacks(loadedBeltpacks);
          } else {
            setBeltpacks(runAssignmentLogic(loadedBeltpacks, loadedElements));
          }
          setIsSharedEdit(false);
        } catch (error) {
          console.error("Failed to load comms plan:", error);
          navigate("/all-comms-plans");
        } finally {
          setLoading(false);
        }
      } else if (id === "new") {
        // New document
        if (!user) {
          navigate("/login");
          return;
        }
        reset();
        setDocumentId(null);
        setIsSharedEdit(false);
        setLoading(false);
      } else {
        console.error("[CommsPlannerEditor] Invalid route state. No id, no shareCode, not 'new'.");
        navigate("/dashboard");
        setLoading(false);
      }
    };
    loadPlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, shareCode, navigate, location.pathname, user]);

  // Handle keyboard shortcuts for deleting elements
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.key === "Backspace" || event.key === "Delete") && selectedElementId) {
        const target = event.target as HTMLElement;
        // Prevent deleting when typing in an input
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          event.preventDefault();
          handleDeleteElement(selectedElementId);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElementId]);

  const handleSave = useCallback(
    async (isAutoSave = false) => {
      // For existing documents with collaboration enabled, use forceSave
      if (collaborationEnabled && !isAutoSave) {
        await forceSave();
        return;
      }

      if (!user && !isSharedEdit) {
        setSaveError("You must be logged in to save.");
        setTimeout(() => setSaveError(null), 5000);
        return;
      }

      setSaving(true);
      setSaveError(null);
      if (!isAutoSave) {
        setSaveSuccess(false);
      }
      try {
        if (isSharedEdit && shareCode) {
          // Save shared resource
          console.log("[CommsPlannerEditor] Saving SHARED comms plan with shareCode:", shareCode);
          const baseDataToSave = {
            name: planName,
            venue_geometry: {
              width: venueWidth,
              height: venueHeight,
            },
            zones,
            elements: elements.map((el) => ({
              ...el,
              system_type: el.systemType,
              channel_set: el.channels,
            })),
            beltpacks,
            dfs_enabled: dfsEnabled,
            poe_budget_total: poeBudget,
            last_edited: new Date().toISOString(),
          };
          await updateSharedResource(shareCode, "comms_planner", baseDataToSave);
        } else {
          // Save owned resource
          const planId = await saveCommsPlan(id ?? null);
          if (id === "new" && planId) {
            setDocumentId(planId);
            navigate(`/comms-planner/${planId}`, { replace: true });
          }
        }
        if (!isAutoSave) {
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } catch (error: unknown) {
        console.error("Failed to save comms plan:", error);
        setSaveError(
          `Error saving comms plan: ${error instanceof Error ? error.message : "Please try again."}`,
        );
        setTimeout(() => setSaveError(null), 5000);
      } finally {
        setSaving(false);
      }
    },
    [
      id,
      navigate,
      collaborationEnabled,
      forceSave,
      user,
      isSharedEdit,
      shareCode,
      planName,
      venueWidth,
      venueHeight,
      zones,
      elements,
      beltpacks,
      dfsEnabled,
      poeBudget,
    ],
  );

  /**
   * Fetch version history for the current document
   */
  const fetchVersionHistory = async () => {
    if (!documentId) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      // Query the comms_planner_history table
      const { data, error } = await supabase
        .from("comms_planner_history")
        .select(
          `
          id,
          version,
          changed_fields,
          created_at,
          created_by,
          save_type,
          content
        `,
        )
        .eq("comms_planner_id", documentId)
        .order("version", { ascending: false })
        .limit(50); // Limit to last 50 versions

      if (error) throw error;

      // Transform the data to match VersionHistory interface
      // We need to join with users table to get email
      const versionsWithUsers = await Promise.all(
        (data || []).map(async (version: any) => {
          let userEmail = "Unknown User";

          if (version.created_by) {
            try {
              const { data: userData } = await supabase
                .from("profiles")
                .select("email")
                .eq("id", version.created_by)
                .single();

              if (userData?.email) {
                userEmail = userData.email;
              }
            } catch (err) {
              console.warn("Could not fetch user email:", err);
            }
          }

          return {
            id: version.id,
            version: version.version,
            userEmail,
            createdAt: version.created_at,
            changedFields: version.changed_fields || [],
            description: `${version.save_type} save`,
          } as VersionHistory;
        }),
      );

      setVersionHistory(versionsWithUsers);
    } catch (error: any) {
      console.error("Error fetching version history:", error);
      setHistoryError(error.message || "Failed to load version history");
    } finally {
      setHistoryLoading(false);
    }
  };

  /**
   * Restore a previous version of the document
   */
  const handleRestoreVersion = async (versionId: string) => {
    if (!documentId) return;

    try {
      // Fetch the full content from the history table
      const { data: historyData, error: historyError } = await supabase
        .from("comms_planner_history")
        .select("content, version")
        .eq("id", versionId)
        .single();

      if (historyError) throw historyError;
      if (!historyData) throw new Error("Version not found");

      // Update the current document with the historical content
      const restoredContent = historyData.content as any;

      // Update in the database
      const { error: updateError } = await supabase
        .from("comms_planners")
        .update({
          ...restoredContent,
          last_edited: new Date().toISOString(),
        })
        .eq("id", documentId);

      if (updateError) throw updateError;

      // Update local state
      if (restoredContent.name) setPlanName(restoredContent.name);
      if (restoredContent.venue_geometry) {
        setVenueWidth(restoredContent.venue_geometry.width);
        setVenueHeight(restoredContent.venue_geometry.height);
      }
      if (restoredContent.zones) setZones(restoredContent.zones);
      if (restoredContent.elements) {
        const loadedElements = restoredContent.elements.map((el: any) => ({
          ...el,
          systemType: el.system_type,
          channels: el.channel_set,
        }));
        setElements(loadedElements);
      }
      if (restoredContent.beltpacks) setBeltpacks(restoredContent.beltpacks);
      if (typeof restoredContent.dfs_enabled !== "undefined")
        setDfsEnabled(restoredContent.dfs_enabled);
      if (typeof restoredContent.poe_budget_total !== "undefined")
        setPoeBudget(restoredContent.poe_budget_total);

      // Close the history modal
      setShowHistory(false);

      // Show success message
      alert(`Successfully restored version ${historyData.version}`);

      // Refresh history to show the restoration
      await fetchVersionHistory();
    } catch (error: any) {
      console.error("Error restoring version:", error);
      alert(`Failed to restore version: ${error.message}`);
    }
  };

  // Fetch version history when modal opens
  useEffect(() => {
    if (showHistory && documentId) {
      fetchVersionHistory();
    }
  }, [showHistory, documentId]);

  // Auto-save logic (only for new documents without collaboration)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Skip auto-save if collaboration is enabled (handled by useAutoSave hook)
    if (collaborationEnabled) {
      return;
    }

    if (loading || saving || !id || id === "new") {
      return;
    }

    const handler = setTimeout(() => {
      handleSave(true);
    }, 2000); // 2-second delay

    return () => {
      clearTimeout(handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    planName,
    elements,
    beltpacks,
    zones,
    venueWidth,
    venueHeight,
    dfsEnabled,
    poeBudget,
    id,
    loading,
    saving,
    collaborationEnabled,
  ]);

  const exportAsPdf = async (
    targetRef: React.RefObject<HTMLDivElement>,
    itemName: string,
    fileNameSuffix: string,
    backgroundColor: string,
    font: string,
  ) => {
    if (!targetRef.current) {
      console.error("Export component ref not ready.");
      setSaveError("Export component not ready. Please try again.");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    if (document.fonts && typeof document.fonts.ready === "function") {
      try {
        await document.fonts.ready;
      } catch (fontError) {
        console.warn("Error waiting for document fonts to be ready:", fontError);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        backgroundColor,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const styleGlobal = clonedDoc.createElement("style");
          styleGlobal.innerHTML = `* { font-family: ${font}, sans-serif !important; vertical-align: baseline !important; }`;
          clonedDoc.head.appendChild(styleGlobal);
          clonedDoc.body.style.fontFamily = `${font}, sans-serif`;
          Array.from(clonedDoc.querySelectorAll("*")).forEach((el) => {
            if ((el as HTMLElement).style) {
              (el as HTMLElement).style.fontFamily = `${font}, sans-serif`;
              (el as HTMLElement).style.verticalAlign = "baseline";
            }
          });
        },
        windowHeight: targetRef.current.scrollHeight,
        windowWidth: targetRef.current.offsetWidth,
        height: targetRef.current.scrollHeight,
        width: targetRef.current.offsetWidth,
        scrollX: 0,
        scrollY: 0,
        logging: false,
        // Only ignore elements you explicitly mark for export skipping.
        ignoreElements: (el) => el.classList?.contains("sd-export-ignore"),
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "l" : "p",
        unit: "px",
        format: [canvas.width, canvas.height],
        hotfixes: ["px_scaling"],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${itemName.replace(/\s+/g, "-").toLowerCase()}-${fileNameSuffix}.pdf`);
    } catch (error) {
      console.error(`Error exporting ${fileNameSuffix}:`, error);
      setSaveError(`Failed to export ${fileNameSuffix}. See console for details.`);
    }
  };

  const prepareAndExecuteExport = async (exportFormat: "color" | "print") => {
    setExporting(true);
    setShowExportModal(false);

    try {
      // Prepare comms plan data for export (include all elements for canvas)
      const commsPlanData = {
        id: id || "new",
        name: planName,
        venueGeometry: {
          width: venueWidth,
          height: venueHeight,
          shape: "rectangle" as const,
        },
        zones,
        transceivers: elements.map((el) => ({
          id: el.id,
          zoneId: "zone-1", // Default zone for now
          systemType: el.systemType,
          model: el.model,
          x: el.x,
          y: el.y,
          z: el.z,
          label: el.label,
          band: el.band,
          channels: el.channels,
          dfsEnabled: dfsEnabled,
          poeClass: el.poeClass,
          coverageRadius: el.coverageRadius,
          currentBeltpacks: el.currentBeltpacks,
          maxBeltpacks: el.maxBeltpacks,
          overrideFlags: el.overrideFlags,
        })),
        beltpacks: beltpacks.map((bp) => ({
          id: bp.id,
          label: bp.label,
          x: bp.x,
          y: bp.y,
          transceiverRef: bp.transceiverRef,
          selected: bp.selected,
          onClick: bp.onClick,
          onDragStop: bp.onDragStop,
          scale: bp.scale,
          signalStrength: bp.signalStrength,
          batteryLevel: bp.batteryLevel,
          online: bp.online,
          channelAssignments: bp.channelAssignments,
        })),
        switches: [],
        interopConfigs: [],
        roles: [],
        channels: [],
        createdAt: new Date(),
        lastEdited: new Date(),
      };

      if (exportFormat === "color") {
        setCurrentExportCommsPlan(commsPlanData as CommsPlan);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await exportAsPdf(exportRef, commsPlanData.name, "comms-plan-color", "#111827", "Inter");
      } else {
        // Print-friendly export using jsPDF directly
        const doc = new jsPDF("p", "pt", "letter");

        const addPageHeader = (doc: jsPDF, title: string) => {
          doc.setFontSize(24);
          doc.setFont("helvetica", "bold");
          doc.text("SoundDocs", 40, 50);
          doc.setFontSize(16);
          doc.setFont("helvetica", "normal");
          doc.text(title, 40, 75);
          doc.setDrawColor(221, 221, 221);
          doc.line(40, 85, doc.internal.pageSize.width - 40, 85);
        };

        const addPageFooter = (doc: jsPDF) => {
          const pageCount = doc.internal.pages.length;
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();

          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setDrawColor(221, 221, 221);
            doc.line(40, pageHeight - 35, pageWidth - 40, pageHeight - 35);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.setFont("helvetica", "bold");
            doc.text("SoundDocs", 40, pageHeight - 20);
            doc.setFont("helvetica", "normal");
            doc.text("| Professional Event Documentation", 95, pageHeight - 20);
            const pageNumText = `Page ${i} of ${pageCount}`;
            doc.text(pageNumText, pageWidth / 2, pageHeight - 20, { align: "center" });
            const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
            doc.text(dateStr, pageWidth - 40, pageHeight - 20, { align: "right" });
          }
        };

        addPageHeader(doc, commsPlanData.name);

        let lastY = 105;

        const createInfoBlock = (title: string, data: [string, string][]) => {
          if (!data.some((row) => row[1] && row[1] !== "N/A")) return;

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(title, 40, lastY);

          (
            doc as jsPDF & {
              autoTable?: (options: object) => void;
              lastAutoTable?: { finalY: number };
            }
          ).autoTable!({
            body: data,
            startY: lastY + 5,
            theme: "plain",
            styles: {
              font: "helvetica",
              fontSize: 9,
              cellPadding: { top: 2, right: 5, bottom: 2, left: 0 },
            },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 120 },
            },
            margin: { left: 40 },
          });
          lastY =
            (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 15;
        };

        const eventDetails: [string, string][] = [
          [
            "Venue Size:",
            `${commsPlanData.venueGeometry.width}' × ${commsPlanData.venueGeometry.height}'`,
          ],
          ["Zones:", `${commsPlanData.zones.length}`],
          ["Transceivers:", `${commsPlanData.transceivers.length}`],
          ["Beltpacks:", `${commsPlanData.beltpacks.length}`],
        ];
        createInfoBlock("Venue Overview", eventDetails);

        lastY += 15;

        if (commsPlanData.transceivers && commsPlanData.transceivers.length > 0) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Transceivers", 40, lastY);
          lastY += 20;

          const transceiversHead = [["Label", "Model", "Band", "Coverage", "Connected Beltpacks"]];
          const transceiversBody = commsPlanData.transceivers
            .filter((tx: Transceiver) => tx.systemType !== "FSII-Base")
            .map((tx: Transceiver) => {
              const connectedBeltpacks = commsPlanData.beltpacks.filter(
                (bp: { transceiverRef?: string }) => bp.transceiverRef === tx.id,
              );
              return [
                tx.label,
                tx.model,
                tx.band,
                `${tx.coverageRadius}' radius`,
                `${connectedBeltpacks.length} / ${tx.maxBeltpacks}`,
              ];
            });

          (
            doc as jsPDF & {
              autoTable?: (options: object) => void;
              lastAutoTable?: { finalY: number };
            }
          ).autoTable!({
            head: transceiversHead,
            body: transceiversBody,
            startY: lastY,
            theme: "grid",
            headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
            styles: {
              font: "helvetica",
              fontSize: 9,
              cellPadding: 5,
              lineColor: [221, 221, 221],
              lineWidth: 0.5,
            },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { left: 40, right: 40 },
          });
          lastY =
            (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable!.finalY + 30;
        }

        if (commsPlanData.beltpacks && commsPlanData.beltpacks.length > 0) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Beltpacks", 40, lastY);
          lastY += 20;

          const beltpacksHead = [["Label", "Connected To", "Channel Assignments"]];
          const beltpacksBody = commsPlanData.beltpacks.map(
            (bp: {
              id: string;
              label: string;
              transceiverRef?: string;
              channelAssignments?: Array<{ channel: string; assignment: string }>;
            }) => {
              const transceiver = commsPlanData.transceivers.find(
                (tx: Transceiver) => tx.id === bp.transceiverRef,
              );
              const assignments =
                bp.channelAssignments && bp.channelAssignments.length > 0
                  ? bp.channelAssignments.map((ca) => `${ca.channel}:${ca.assignment}`).join(", ")
                  : "No assignments";

              return [bp.label, transceiver ? transceiver.label : "Not Connected", assignments];
            },
          );

          (
            doc as jsPDF & {
              autoTable?: (options: object) => void;
              lastAutoTable?: { finalY: number };
            }
          ).autoTable!({
            head: beltpacksHead,
            body: beltpacksBody,
            startY: lastY,
            theme: "grid",
            headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
            styles: {
              font: "helvetica",
              fontSize: 9,
              cellPadding: 5,
              lineColor: [221, 221, 221],
              lineWidth: 0.5,
            },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { left: 40, right: 40 },
          });
        }

        addPageFooter(doc);
        doc.save(`${commsPlanData.name.replace(/\s+/g, "-").toLowerCase()}-comms-plan-print.pdf`);
      }
    } catch (err) {
      console.error("Error preparing comms plan export:", err);
      setSaveError("Failed to prepare comms plan for export.");
    } finally {
      setCurrentExportCommsPlan(null);
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />

      {/* Collaboration Toolbar (for existing documents) */}
      {collaborationEnabled && (
        <CollaborationToolbar
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt ? new Date(lastSavedAt) : undefined}
          saveError={autoSaveError || undefined}
          onRetry={forceSave}
          activeUsers={activeUsers}
          currentUserId={user?.id}
          connectionStatus={connectionStatus}
          onOpenHistory={() => setShowHistory(true)}
          showHistory={true}
          position="top-right"
        />
      )}

      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <button
              onClick={() => {
                const from = location.state?.from;
                navigate(from || "/all-comms-plans");
              }}
              className="mr-4 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              disabled={exporting}
              className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </button>
            {/* Manual Save button (only for new documents or shared edits without collaboration) */}
            {!collaborationEnabled && (
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error messages (for new documents or manual save errors) */}
        {!collaborationEnabled && saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        )}

        {!collaborationEnabled && saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start">
            <Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-400 text-sm">Comms plan saved successfully!</p>
          </div>
        )}

        {/* Status bar */}
        {/* Warnings */}
        {warnings.length > 0 && (
          <div
            className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg relative mb-4"
            role="alert"
          >
            <strong className="font-bold">Warning:</strong>
            <ul className="mt-2 list-disc list-inside">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
            <button
              onClick={() => setWarnings([])}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        {/* Status bar */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Transceivers:</span>
              <span className="text-white font-medium">
                {
                  elements.filter(
                    (e) =>
                      e.systemType !== "Arcadia" &&
                      e.systemType !== "ODIN" &&
                      e.systemType !== "FSII-Base",
                  ).length
                }
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400">PoE Load:</span>
              <span
                className={`font-medium ${
                  totalPoELoad > poeBudget
                    ? "text-red-400"
                    : totalPoELoad > poeBudget * 0.8
                      ? "text-yellow-400"
                      : "text-green-400"
                }`}
              >
                {totalPoELoad.toFixed(1)}W / {poeBudget}W
              </span>
            </div>
            {validationResults.length > 0 && (
              <div className="flex items-center gap-2">
                {validationResults.some((r) => r.type === "error") ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-red-400">
                      {validationResults.filter((r) => r.type === "error").length} errors
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-green-400">Valid placement</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={dfsEnabled}
                onChange={(e) => setDfsEnabled(e.target.checked)}
                className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-gray-300">Enable DFS (5GHz)</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <CommsCanvas
              elements={elements}
              beltpacks={beltpacks}
              zones={zones}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onElementDragStop={handleElementDragStop}
              onBeltpackDragStop={handleBeltpackDragStop}
              venueWidthFt={venueWidth}
              venueHeightFt={venueHeight}
              showGrid={showGrid}
              showCoverage={showCoverage}
              showHeatmap={showHeatmap}
              fitMode={fitMode}
            />
          </div>
          <div className="lg:col-span-1 space-y-4 overflow-y-auto" style={{ maxHeight: "70vh" }}>
            {/* Add Equipment - Most Important, Put First */}
            <CommsToolbar
              onAddElement={handleAddElement}
              fitMode={fitMode}
              onFitModeChange={setFitMode}
            />

            {/* Venue Configuration */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-3">Venue Size</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Width (ft)</label>
                  <input
                    type="number"
                    value={venueWidth || ""}
                    min={1}
                    max={5000}
                    onChange={(e) => setVenueWidth(parseInt(e.target.value, 10))}
                    className="block w-full bg-gray-700 border-gray-600 rounded text-white px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Depth (ft)</label>
                  <input
                    type="number"
                    value={venueHeight || ""}
                    min={1}
                    max={5000}
                    onChange={(e) => setVenueHeight(parseInt(e.target.value, 10))}
                    className="block w-full bg-gray-700 border-gray-600 rounded text-white px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-white mb-3">Display Options</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-indigo-600"
                  />
                  <span className="text-gray-300">Show Grid</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showCoverage}
                    onChange={(e) => setShowCoverage(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-indigo-600"
                  />
                  <span className="text-gray-300">Show Coverage</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showHeatmap}
                    onChange={(e) => setShowHeatmap(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-indigo-600"
                  />
                  <span className="text-gray-300">Coverage Heatmap</span>
                </label>
              </div>
            </div>

            {/* Beltpack Management */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-white">Beltpacks ({beltpacks.length})</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBeltpacks(runAssignmentLogic(beltpacks, elements))}
                    className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded"
                  >
                    Auto-Assign All
                  </button>
                  <button
                    onClick={handleAddBeltpack}
                    className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded"
                  >
                    <Users className="h-3 w-3 inline mr-1" />
                    Add BP
                  </button>
                </div>
              </div>
              {beltpacks.length > 0 && (
                <div className="text-xs text-gray-400">
                  Drag beltpacks to auto-assign, or click "Auto-Assign All"
                </div>
              )}
            </div>

            {/* Properties Panel - Shows when element or beltpack is selected */}
            {selectedElementId && (
              <CommsProperties
                selectedElement={
                  elements.find((el) => el.id === selectedElementId) ||
                  beltpacks.find((bp) => bp.id === selectedElementId) ||
                  null
                }
                onPropertyChange={handlePropertyChange}
                onDeleteElement={handleDeleteElement}
                dfsEnabled={dfsEnabled}
                beltpacks={beltpacks}
              />
            )}

            {/* Quick Stats */}
            <div className="bg-gray-800 p-3 rounded-lg text-xs text-gray-300">
              <div className="font-semibold text-white mb-2">Quick Stats</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Total Antennas:</span>
                  <span className="text-white">
                    {
                      elements.filter(
                        (e) =>
                          e.systemType !== "Arcadia" &&
                          e.systemType !== "ODIN" &&
                          e.systemType !== "FSII-Base",
                      ).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Max Capacity:</span>
                  <span className="text-white">
                    {elements
                      .filter(
                        (e) =>
                          e.systemType !== "Arcadia" &&
                          e.systemType !== "ODIN" &&
                          e.systemType !== "FSII-Base",
                      )
                      .reduce((sum, e) => {
                        const maxBeltpacks = e.model ? MODEL_DEFAULTS[e.model].maxBeltpacks : 5;
                        return sum + maxBeltpacks;
                      }, 0)}{" "}
                    BP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Active Beltpacks:</span>
                  <span className="text-white">{beltpacks.length}</span>
                </div>
                {zones.length > 0 && (
                  <div className="flex justify-between">
                    <span>Zones:</span>
                    <span className="text-white">{zones.length}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportColor={() => prepareAndExecuteExport("color")}
        onExportPrintFriendly={() => prepareAndExecuteExport("print")}
        title="Comms Plan"
        isExporting={exporting}
      />

      {/* Hidden Export Components */}
      {currentExportCommsPlan && (
        <>
          <CommsPlanExport ref={exportRef} commsPlan={currentExportCommsPlan} />
          <PrintCommsPlanExport ref={printExportRef} commsPlan={currentExportCommsPlan} />
        </>
      )}

      {/* Collaboration Modals */}
      {collaborationEnabled && (
        <>
          <DocumentHistory
            open={showHistory}
            onOpenChange={setShowHistory}
            versions={versionHistory}
            onRestore={handleRestoreVersion}
            loading={historyLoading}
            error={historyError || undefined}
          />

          <ConflictResolution
            open={showConflict}
            onOpenChange={setShowConflict}
            conflicts={conflict ? [conflict] : []}
            documentId={documentId || ""}
            onResolve={(resolution) => {
              // Handle conflict resolution
              console.log("Conflict resolved with strategy:", resolution);
              setShowConflict(false);
              setConflict(null);
            }}
          />
        </>
      )}

      <Footer />
    </div>
  );
};

export default CommsPlannerEditor;

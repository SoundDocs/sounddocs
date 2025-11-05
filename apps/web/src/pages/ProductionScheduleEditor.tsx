import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductionScheduleHeader from "../components/production-schedule/ProductionScheduleHeader";
import ProductionScheduleCrewKey, {
  CrewKeyItem,
} from "../components/production-schedule/ProductionScheduleCrewKey";
import ProductionScheduleLabor, {
  LaborScheduleItem,
} from "../components/production-schedule/ProductionScheduleLabor";
import ProductionScheduleDetail, {
  DetailedScheduleItem,
} from "../components/production-schedule/ProductionScheduleDetail";
import { Loader, ArrowLeft, Save, AlertCircle, Users, ListChecks } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import {
  getSharedResource,
  updateSharedResource,
  getShareUrl,
  SharedLink,
} from "../lib/shareUtils"; // Added SharedLink
import { ScheduleForExport } from "../lib/types";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCollaboration } from "@/hooks/useCollaboration";
import { usePresence } from "@/hooks/usePresence";
import { CollaborationToolbar } from "@/components/CollaborationToolbar";
import { DocumentHistory } from "@/components/History/DocumentHistory";
import { ConflictResolution } from "@/components/ConflictResolution";
import type { DocumentConflict, VersionHistory } from "@/types/collaboration";

const defaultColors = [
  "#EF4444",
  "#3B82F6",
  "#22C55E",
  "#EAB308",
  "#A855F7",
  "#EC4899",
  "#F97316",
  "#14B8A6",
  "#64748B",
  "#84CC16",
];

interface ProductionScheduleData {
  id?: string;
  user_id?: string; // Owner's user_id
  name: string;
  created_at?: string;
  last_edited?: string;
  show_name: string;
  job_number: string;
  facility_name: string;
  project_manager: string;
  production_manager: string;
  account_manager: string;
  set_datetime: string | null;
  strike_datetime: string | null;
  crew_key: CrewKeyItem[];
  labor_schedule_items: LaborScheduleItem[];
  detailed_schedule_items: DetailedScheduleItem[];
}

export const formatUTCToLocalDateTimeInputString = (utcIsoString: string | null): string => {
  if (!utcIsoString) return "";
  try {
    const date = new Date(utcIsoString);
    if (isNaN(date.getTime())) {
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(utcIsoString)) {
        return utcIsoString;
      }
      console.warn(`Invalid UTC ISO string for input formatting: ${utcIsoString}`);
      return "";
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  } catch (e) {
    console.error("Error formatting UTC to local datetime input string:", e);
    return "";
  }
};

const convertLocalInputToUTCISO = (localDateTimeString: string | null): string | null => {
  if (!localDateTimeString) return null;
  try {
    const localDate = new Date(localDateTimeString);
    if (isNaN(localDate.getTime())) {
      console.warn(`Invalid localDateTimeString for UTC conversion: ${localDateTimeString}`);
      return null;
    }
    return localDate.toISOString();
  } catch (e) {
    console.error("Error converting local input to UTC ISO:", e);
    return null;
  }
};

const parseUtcToLocalPartsForExportInfo = (utcIsoDateTimeStr: string | null | undefined) => {
  if (!utcIsoDateTimeStr) return { date: undefined, time: undefined };
  try {
    const d = new Date(utcIsoDateTimeStr);
    if (isNaN(d.getTime())) {
      console.warn(`Invalid UTC ISO string for export parsing: ${utcIsoDateTimeStr}`);
      return { date: utcIsoDateTimeStr, time: undefined };
    }

    const localDate = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
    const localTime = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

    return {
      date: localDate,
      time: localTime,
    };
  } catch (e) {
    console.error("Error parsing UTC date for export info:", e);
    return { date: utcIsoDateTimeStr, time: undefined };
  }
};

const ProductionScheduleEditor = () => {
  const { id, shareCode } = useParams(); // Get both id and shareCode
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<ProductionScheduleData | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
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

  // Local state for title input to prevent auto-save interference during typing
  const [localName, setLocalName] = useState<string>("");
  const localNameInitialized = useRef(false);

  // Enable collaboration for existing documents (including edit-mode shared links)
  // For shared links, id will be undefined, so we check schedule?.id instead
  // For edit-mode shared links, allow collaboration even without authentication
  const collaborationEnabled =
    (id ? id !== "new" : true) && // Allow if no id param (shared link) or if id !== "new"
    (!isSharedEdit || currentShareLink?.link_type === "edit") &&
    !!schedule?.id &&
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
      hasScheduleId: !!schedule?.id,
      hasUser: !!user,
      userId: user?.id,
      scheduleId: schedule?.id,
    };
    console.log("[ProductionScheduleEditor] Collaboration status:");
    console.log(JSON.stringify(status, null, 2));
  }, [collaborationEnabled, id, isSharedEdit, currentShareLink, schedule?.id, user]);

  // Auto-save hook
  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
  } = useAutoSave({
    documentId: schedule?.id || "",
    documentType: "production_schedules",
    userId: effectiveUserId,
    data: schedule,
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
    documentId: schedule?.id || "",
    documentType: "production_schedules",
    userId: effectiveUserId,
    userEmail: effectiveUserEmail,
    userName: effectiveUserName,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      // GUARD: Don't process remote updates if collaboration is disabled
      // This prevents input reversion on NEW documents where collaboration is off
      if (!collaborationEnabled) {
        console.log("[ProductionScheduleEditor] Ignoring remote update - collaboration disabled");
        return;
      }

      if (payload.type === "field_update" && payload.field) {
        // Handle name field separately to prevent input reversion
        if (payload.field === "name" && typeof payload.value === "string") {
          console.log(
            "[ProductionScheduleEditor] Updating localName from remote broadcast:",
            payload.value,
          );
          setLocalName(payload.value);
        } else {
          setSchedule((prev: any) => ({
            ...prev,
            [payload.field!]: payload.value,
          }));
        }
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
    if (!collaborationEnabled || !schedule?.id) {
      return;
    }

    console.log(
      "[ProductionScheduleEditor] Setting up real-time subscription for schedule:",
      schedule.id,
    );

    const channel = supabase
      .channel(`production_schedule_db_${schedule.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "production_schedules",
          filter: `id=eq.${schedule.id}`,
        },
        (payload) => {
          console.log("[ProductionScheduleEditor] Received database UPDATE event:", payload);
          // NOTE: We intentionally DO NOT update local state from database UPDATE events
          // because they include our own saves echoing back, which would overwrite user typing
          // Real-time collaboration updates happen via the broadcast channel in useCollaboration
          console.log(
            "[ProductionScheduleEditor] Ignoring database UPDATE to prevent input reversion",
          );
        },
      )
      .subscribe();

    return () => {
      console.log("[ProductionScheduleEditor] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [collaborationEnabled, schedule?.id]);

  // Sync local name with schedule when it loads
  useEffect(() => {
    if (schedule?.name && !localNameInitialized.current) {
      console.log(
        "[ProductionScheduleEditor] Initializing localName from schedule:",
        schedule.name,
      );
      setLocalName(schedule.name);
      localNameInitialized.current = true;
    }
  }, [schedule?.name]);

  // Debounced sync from local name to schedule state
  useEffect(() => {
    if (!localNameInitialized.current) return;

    const timer = setTimeout(() => {
      if (localName !== schedule?.name) {
        console.log("[ProductionScheduleEditor] Syncing localName to schedule:", {
          localName,
          previousName: schedule?.name,
        });
        setSchedule((prev: any) => ({
          ...prev,
          name: localName,
        }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [localName, schedule?.name]);

  // Keyboard shortcut for manual save (Cmd/Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        forceSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [forceSave]);

  useEffect(() => {
    const fetchUserAndSchedule = async () => {
      setLoading(true);
      if (!user && !shareCode) {
        console.error("User not authenticated");
        navigate("/login");
        return;
      }

      const currentPathIsSharedEdit = location.pathname.includes(
        "/shared/production-schedule/edit/",
      );
      console.log(
        `[ProdSchedEditor] Path: ${location.pathname}, shareCode: ${shareCode}, currentPathIsSharedEdit: ${currentPathIsSharedEdit}`,
      );

      if (currentPathIsSharedEdit && shareCode) {
        console.log(
          "[ProdSchedEditor] Attempting to fetch SHARED resource with shareCode:",
          shareCode,
        );
        try {
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);

          console.log(
            "[ProdSchedEditor] DEBUG: Fetched Shared Link Details:",
            JSON.stringify(fetchedShareLink, null, 2),
          );
          console.log(
            "[ProdSchedEditor] DEBUG: Fetched Resource Details:",
            JSON.stringify(resource, null, 2),
          );
          console.log(
            `[ProdSchedEditor] DEBUG: Checking conditions: fetchedShareLink.resource_type ('${fetchedShareLink.resource_type}') !== 'production_schedule'`,
          );
          console.log(
            `[ProdSchedEditor] DEBUG: Checking conditions: fetchedShareLink.link_type ('${fetchedShareLink.link_type}') !== "edit"`,
          );

          if (fetchedShareLink.resource_type !== "production_schedule") {
            console.error(
              "[ProdSchedEditor] Share code is for a different resource type:",
              fetchedShareLink.resource_type,
              "Expected: production_schedule",
            );
            navigate("/dashboard");
            setLoading(false);
            return;
          }

          if (fetchedShareLink.link_type !== "edit") {
            console.warn(
              `[ProdSchedEditor] Link type is '${fetchedShareLink.link_type}', not 'edit'. Redirecting to view page.`,
            );
            window.location.href = getShareUrl(shareCode, "production_schedule", "view");
            return;
          }

          const sharedScheduleData: ProductionScheduleData = {
            id: resource.id,
            user_id: resource.user_id,
            name: resource.name || "Untitled Shared Schedule",
            created_at: resource.created_at,
            last_edited: resource.last_edited,
            show_name: resource.show_name || "",
            job_number: resource.job_number || "",
            facility_name: resource.facility_name || "",
            project_manager: resource.project_manager || "",
            production_manager: resource.production_manager || "",
            account_manager: resource.account_manager || "",
            set_datetime: resource.set_datetime || null,
            strike_datetime: resource.strike_datetime || null,
            crew_key: resource.crew_key || [],
            labor_schedule_items: resource.labor_schedule_items || [],
            detailed_schedule_items: (resource.detailed_schedule_items || []).map((item: any) => ({
              ...item,
              assigned_crew_ids:
                item.assigned_crew_ids || (item.assigned_crew_id ? [item.assigned_crew_id] : []),
            })),
          };
          setSchedule(sharedScheduleData);
          setCurrentShareLink(fetchedShareLink);
          setIsSharedEdit(true);
          console.log(
            "[ProdSchedEditor] SHARED production_schedule resource loaded successfully for editing.",
          );
          console.log(
            "[ProdSchedEditor] Set currentShareLink:",
            fetchedShareLink,
            "Set isSharedEdit: true",
          );
        } catch (error: any) {
          console.error(
            "[ProdSchedEditor] Error fetching SHARED production schedule:",
            error.message,
            error,
          );
          navigate("/dashboard");
        } finally {
          setLoading(false);
        }
      } else if (id === "new") {
        if (!user) {
          navigate("/login");
          return;
        }
        const newSchedule: ProductionScheduleData = {
          name: "Untitled Production Schedule",
          show_name: "",
          job_number: "",
          facility_name: "",
          project_manager: "",
          production_manager: "",
          account_manager: "",
          set_datetime: null,
          strike_datetime: null,
          crew_key: [],
          labor_schedule_items: [],
          detailed_schedule_items: [],
          user_id: user.id,
          created_at: new Date().toISOString(),
        };
        setSchedule(newSchedule);
        setIsSharedEdit(false);
        setLoading(false);
      } else if (id) {
        if (!user) {
          navigate("/login");
          return;
        }
        try {
          const { data, error } = await supabase
            .from("production_schedules")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

          if (error) throw error;

          if (data) {
            setSchedule({
              ...data,
              set_datetime: data.set_datetime || null,
              strike_datetime: data.strike_datetime || null,
              crew_key: data.crew_key || [],
              labor_schedule_items: data.labor_schedule_items || [],
              detailed_schedule_items: (data.detailed_schedule_items || []).map((item: any) => ({
                ...item,
                assigned_crew_ids:
                  item.assigned_crew_ids || (item.assigned_crew_id ? [item.assigned_crew_id] : []),
              })),
            });
          } else {
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching production schedule:", error);
          navigate("/dashboard");
        } finally {
          setIsSharedEdit(false);
          setLoading(false);
        }
      } else {
        console.error("[ProdSchedEditor] Invalid route state. No id, no shareCode, not 'new'.");
        navigate("/dashboard");
        setLoading(false);
      }
    };

    fetchUserAndSchedule();
  }, [id, shareCode, navigate, location.pathname]);

  const handleHeaderFieldUpdate = (field: string, value: string) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        [field]: value || null,
      });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (schedule) {
      setSchedule({ ...schedule, name: e.target.value });
    }
  };

  const handleAddCrewKeyItem = () => {
    if (schedule) {
      const nextColorIndex = schedule.crew_key.length % defaultColors.length;
      const newItem: CrewKeyItem = {
        id: uuidv4(),
        name: "",
        color: defaultColors[nextColorIndex],
      };
      setSchedule({
        ...schedule,
        crew_key: [...schedule.crew_key, newItem],
      });
    }
  };

  const handleUpdateCrewKeyItem = (itemId: string, field: "name" | "color", value: string) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        crew_key: schedule.crew_key.map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item,
        ),
      });
    }
  };

  const handleDeleteCrewKeyItem = (itemId: string) => {
    if (schedule) {
      const updatedDetailedScheduleItems = schedule.detailed_schedule_items.map((detailItem) => ({
        ...detailItem,
        assigned_crew_ids: (detailItem.assigned_crew_ids || []).filter(
          (crewId) => crewId !== itemId,
        ),
      }));

      setSchedule({
        ...schedule,
        crew_key: schedule.crew_key.filter((item) => item.id !== itemId),
        detailed_schedule_items: updatedDetailedScheduleItems,
      });
    }
  };

  const handleUpdateLaborScheduleItems = (items: LaborScheduleItem[]) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        labor_schedule_items: items,
      });
    }
  };

  const handleUpdateDetailedScheduleItems = (items: DetailedScheduleItem[]) => {
    if (schedule) {
      setSchedule({
        ...schedule,
        detailed_schedule_items: items,
      });
    }
  };

  const handleSave = async () => {
    if (!schedule) return;

    // For existing documents with collaboration enabled, use forceSave
    if (collaborationEnabled) {
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
    setSaveSuccess(false);

    const sanitizedCrewKey = (schedule.crew_key || []).map((item) => ({
      id: item.id,
      name: item.name,
      color: item.color,
    }));

    const sanitizedLaborScheduleItems = (schedule.labor_schedule_items || []).map((item) => ({
      id: item.id,
      name: item.name,
      position: item.position,
      date: item.date,
      time_in: item.time_in,
      time_out: item.time_out,
      notes: item.notes,
    }));

    const sanitizedDetailedScheduleItems = (schedule.detailed_schedule_items || []).map((item) => ({
      id: item.id,
      date: item.date,
      start_time: item.start_time,
      end_time: item.end_time,
      activity: item.activity,
      notes: item.notes,
      assigned_crew_ids: item.assigned_crew_ids || [],
    }));

    const baseDataToSave = {
      name: schedule.name,
      show_name: schedule.show_name,
      job_number: schedule.job_number,
      facility_name: schedule.facility_name,
      project_manager: schedule.project_manager,
      production_manager: schedule.production_manager,
      account_manager: schedule.account_manager,
      set_datetime: convertLocalInputToUTCISO(schedule.set_datetime),
      strike_datetime: convertLocalInputToUTCISO(schedule.strike_datetime),
      last_edited: new Date().toISOString(),
      crew_key: sanitizedCrewKey,
      labor_schedule_items: sanitizedLaborScheduleItems,
      detailed_schedule_items: sanitizedDetailedScheduleItems,
    };

    try {
      let savedData;
      if (isSharedEdit && shareCode) {
        console.log(
          "[ProdSchedEditor] Saving SHARED production schedule with shareCode:",
          shareCode,
        );
        savedData = await updateSharedResource(shareCode, "production_schedule", baseDataToSave);
        if (savedData) {
          setSchedule({
            ...schedule,
            ...savedData,
            set_datetime: savedData.set_datetime || null,
            strike_datetime: savedData.strike_datetime || null,
          });
        }
      } else if (user) {
        const dataForOwnedSave: any = {
          ...baseDataToSave,
          user_id: user.id,
        };

        if (id === "new") {
          dataForOwnedSave.created_at = schedule.created_at || new Date().toISOString();
          const { data, error } = await supabase
            .from("production_schedules")
            .insert(dataForOwnedSave)
            .select()
            .single();
          if (error) throw error;
          savedData = data;
          if (data)
            navigate(`/production-schedule/${data.id}`, { state: { from: location.state?.from } });
        } else {
          const { data, error } = await supabase
            .from("production_schedules")
            .update(dataForOwnedSave)
            .eq("id", schedule.id as string)
            .eq("user_id", user.id)
            .select()
            .single();
          if (error) throw error;
          savedData = data;
        }
      } else {
        throw new Error("Cannot save: No user session and not a shared edit.");
      }

      if (savedData && !isSharedEdit) {
        const reloadedData: ProductionScheduleData = {
          ...savedData,
          set_datetime: savedData.set_datetime || null,
          strike_datetime: savedData.strike_datetime || null,
          crew_key: savedData.crew_key || [],
          labor_schedule_items: savedData.labor_schedule_items || [],
          detailed_schedule_items: (savedData.detailed_schedule_items || []).map((item: any) => ({
            ...item,
            assigned_crew_ids:
              item.assigned_crew_ids || (item.assigned_crew_id ? [item.assigned_crew_id] : []),
          })),
        };
        setSchedule(reloadedData);
      } else if (savedData && isSharedEdit) {
        setSchedule((prev) =>
          prev ? { ...prev, last_edited: savedData.last_edited || prev.last_edited } : null,
        );
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving production schedule:", error);
      setSaveError(`Error saving schedule: ${error.message || "Please try again."}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Fetch version history for the current document
   */
  const fetchVersionHistory = async () => {
    if (!schedule?.id) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      // Query the production_schedule_history table
      const { data, error } = await supabase
        .from("production_schedule_history")
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
        .eq("production_schedule_id", schedule.id)
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
    if (!schedule?.id) return;

    try {
      // Fetch the full content from the history table
      const { data: historyData, error: historyError } = await supabase
        .from("production_schedule_history")
        .select("content, version")
        .eq("id", versionId)
        .single();

      if (historyError) throw historyError;
      if (!historyData) throw new Error("Version not found");

      // Update the current document with the historical content
      const restoredContent = historyData.content as any;

      // Update in the database
      const { error: updateError } = await supabase
        .from("production_schedules")
        .update({
          ...restoredContent,
          last_edited: new Date().toISOString(),
        })
        .eq("id", schedule.id);

      if (updateError) throw updateError;

      // Update local state
      setSchedule({
        ...schedule,
        ...restoredContent,
      });

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
    if (showHistory && schedule?.id) {
      fetchVersionHistory();
    }
  }, [showHistory, schedule?.id]);

  if (loading || !schedule) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  const currentDetailedScheduleItems = schedule.detailed_schedule_items || [];
  const parsedSetDateTimeForExport = parseUtcToLocalPartsForExportInfo(schedule.set_datetime);

  const scheduleForExportProps: ScheduleForExport = {
    id: schedule.id || uuidv4(),
    name: schedule.name,
    created_at: schedule.created_at || new Date().toISOString(),
    last_edited: schedule.last_edited,
    info: {
      event_name: schedule.show_name,
      job_number: schedule.job_number,
      venue: schedule.facility_name,
      project_manager: schedule.project_manager,
      production_manager: schedule.production_manager,
      account_manager: schedule.account_manager,
      date: parsedSetDateTimeForExport.date,
      load_in: parsedSetDateTimeForExport.time,
      strike_datetime: schedule.strike_datetime,
      event_start: undefined,
      event_end: undefined,
      event_type: undefined,
      sound_check: undefined,
      room: undefined,
      address: undefined,
      client_artist: undefined,
      contact_name: undefined,
      contact_email: undefined,
      contact_phone: undefined,
      foh_engineer: undefined,
      monitor_engineer: undefined,
    },
    crew_key: schedule.crew_key || [],
    labor_schedule_items: schedule.labor_schedule_items || [],
    detailed_schedule_items: currentDetailedScheduleItems,
  };

  const handleBackNavigation = () => {
    const fromPath = location.state?.from as string | undefined;

    if (isSharedEdit && shareCode && currentShareLink) {
      navigate("/shared-with-me");
    } else if (fromPath) {
      navigate(fromPath);
    } else {
      if (id === "new") {
        navigate("/production");
      } else {
        navigate("/all-production-schedules");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header
        dashboard={!isSharedEdit}
        scheduleForExport={isSharedEdit ? undefined : scheduleForExportProps}
        scheduleType="production"
      />

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

      <main className="flex-grow container mx-auto px-4 py-6 md:py-12 mt-16 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
          <div className="flex items-center flex-grow min-w-0">
            <button
              onClick={handleBackNavigation}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-grow min-w-0">
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                placeholder="Enter schedule name"
              />
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {schedule.last_edited
                  ? `Last edited: ${new Date(schedule.last_edited).toLocaleString()}`
                  : `Created: ${new Date(schedule.created_at || Date.now()).toLocaleString()}`}
                {isSharedEdit && schedule.user_id && (
                  <span className="ml-2">
                    (Shared, Original Owner: ...{schedule.user_id.slice(-6)})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Manual Save button (only for new documents or shared edits) */}
          {!collaborationEnabled && (
            <div className="hidden md:flex items-center gap-2 sm:ml-auto flex-shrink-0">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg md:shadow-none"
              >
                {saving ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </button>
            </div>
          )}
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
            <p className="text-green-400 text-sm">Production schedule saved successfully!</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">Production Schedule Details</h2>
            <p className="text-gray-400 text-sm">Manage the core information for your event.</p>
          </div>
          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="md:min-w-[800px]">
              <ProductionScheduleHeader
                scheduleData={{
                  show_name: schedule.show_name,
                  job_number: schedule.job_number,
                  facility_name: schedule.facility_name,
                  project_manager: schedule.project_manager,
                  production_manager: schedule.production_manager,
                  account_manager: schedule.account_manager,
                  set_datetime: schedule.set_datetime,
                  strike_datetime: schedule.strike_datetime,
                }}
                updateField={handleHeaderFieldUpdate}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">Crew & Department Key</h2>
            <p className="text-gray-400 text-sm">
              Define crew types and assign colors for easy identification in the schedule.
            </p>
          </div>
          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="md:min-w-[600px]">
              <ProductionScheduleCrewKey
                crewKey={schedule.crew_key}
                onUpdateCrewKeyItem={handleUpdateCrewKeyItem}
                onAddCrewKeyItem={handleAddCrewKeyItem}
                onDeleteCrewKeyItem={handleDeleteCrewKeyItem}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <div className="flex items-center">
              <ListChecks className="h-6 w-6 mr-3 text-indigo-400" />
              <div>
                <h2 className="text-xl font-medium text-white">Detailed Production Schedule</h2>
                <p className="text-gray-400 text-sm">
                  Outline the event's timeline, activities, and assigned crew.
                </p>
              </div>
            </div>
          </div>
          <div className="p-0 md:p-2 lg:p-4 overflow-x-auto">
            <div className="md:min-w-[1000px]">
              <ProductionScheduleDetail
                detailedItems={schedule.detailed_schedule_items}
                onUpdateDetailedItems={handleUpdateDetailedScheduleItems}
                crewKey={schedule.crew_key}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-3 text-indigo-400" />
              <div>
                <h2 className="text-xl font-medium text-white">Labor Schedule</h2>
                <p className="text-gray-400 text-sm">
                  Manage labor assignments, call times, and positions.
                </p>
              </div>
            </div>
          </div>
          <div className="p-0 md:p-2 lg:p-4 overflow-x-auto">
            <div className="md:min-w-[900px]">
              <ProductionScheduleLabor
                laborItems={schedule.labor_schedule_items}
                onUpdateLaborItems={handleUpdateLaborScheduleItems}
                crewKey={schedule.crew_key}
              />
            </div>
          </div>
        </div>

        {/* Bottom Save button (only for new documents or shared edits) */}
        {!collaborationEnabled && (
          <div className="flex justify-center py-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg text-base"
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Saving Schedule...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Production Schedule
                </>
              )}
            </button>
          </div>
        )}
      </main>

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
            documentId={schedule?.id || ""}
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

export default ProductionScheduleEditor;

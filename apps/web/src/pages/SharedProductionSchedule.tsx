import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { getSharedResource, SharedLink, updateSharedResource } from "../lib/shareUtils";
import { useAuth } from "../lib/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductionScheduleExport from "../components/production-schedule/ProductionScheduleExport";
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
import { ScheduleForExport } from "../lib/types";
import {
  Loader,
  AlertTriangle,
  Share2,
  ArrowLeft,
  Save,
  AlertCircle,
  Users,
  ListChecks,
} from "lucide-react";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCollaboration } from "@/hooks/useCollaboration";
import { CollaborationToolbar } from "@/components/CollaborationToolbar";
import { DocumentHistory } from "@/components/History/DocumentHistory";
import { ConflictResolution } from "@/components/ConflictResolution";
import type { DocumentConflict, VersionHistory } from "@/types/collaboration";
import { v4 as uuidv4 } from "uuid";

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

// Raw data structure from Supabase for production_schedules
interface FullProductionScheduleData {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  user_id: string;
  show_name?: string;
  job_number?: string;
  facility_name?: string;
  project_manager?: string;
  production_manager?: string;
  account_manager?: string;
  set_datetime?: string | null;
  strike_datetime?: string | null;
  crew_key?: CrewKeyItem[];
  detailed_schedule_items?: DetailedScheduleItem[];
  labor_schedule_items?: LaborScheduleItem[];
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

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

const SharedProductionSchedule: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<FullProductionScheduleData | null>(null);
  const [shareLinkInfo, setShareLinkInfo] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Collaboration state
  const [showHistory, setShowHistory] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflict, setConflict] = useState<DocumentConflict | null>(null);
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Determine if we're in edit mode
  const isEditMode = shareLinkInfo?.link_type === "edit";

  console.log("[SharedProductionSchedule] Render - shareLinkInfo:", shareLinkInfo);
  console.log("[SharedProductionSchedule] Render - isEditMode:", isEditMode);
  console.log(
    "[SharedProductionSchedule] Render - user:",
    user ? `${user.email} (${user.id})` : "not authenticated",
  );

  // Require authentication for edit mode
  const requiresAuth = isEditMode;

  // Enable collaboration only for edit mode with authenticated user
  const collaborationEnabled = isEditMode && !!schedule?.id && !!user;

  // Auto-save hook (only for edit mode)
  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
  } = useAutoSave({
    documentId: schedule?.id || "",
    documentType: "production_schedules",
    userId: user?.id || "",
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

  // Collaboration hook (only for edit mode)
  const { activeUsers, status: connectionStatus } = useCollaboration({
    documentId: schedule?.id || "",
    documentType: "production_schedules",
    userId: user?.id || "",
    userEmail: user?.email || "",
    userName: user?.user_metadata?.name,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      if (payload.type === "field_update" && payload.field) {
        setSchedule((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            [payload.field!]: payload.value,
          };
        });
      }
    },
    onConflict: (conflict) => {
      setConflict(conflict);
      setShowConflict(true);
    },
  });

  useEffect(() => {
    const fetchSharedSchedule = async () => {
      if (!shareCode) {
        setError("Share code is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[SharedProductionSchedule] Fetching resource for shareCode: ${shareCode}`);
        const { resource, shareLink } = await getSharedResource(shareCode);
        console.log("[SharedProductionSchedule] Fetched resource:", resource);
        console.log("[SharedProductionSchedule] Fetched shareLink:", shareLink);
        console.log("[SharedProductionSchedule] Link type:", shareLink.link_type);
        console.log("[SharedProductionSchedule] Is edit mode?:", shareLink.link_type === "edit");

        if (shareLink.resource_type !== "production_schedule") {
          console.error(
            `[SharedProductionSchedule] Invalid resource type. Expected 'production_schedule', got '${shareLink.resource_type}'`,
          );
          throw new Error("Invalid resource type for this share link.");
        }

        const fullData = resource as FullProductionScheduleData;
        console.log(
          "[SharedProductionSchedule] Raw fullData:",
          JSON.parse(JSON.stringify(fullData)),
        );

        // Transform the data to ensure all fields are properly formatted
        const sharedScheduleData: FullProductionScheduleData = {
          id: fullData.id,
          user_id: fullData.user_id,
          name: fullData.name || "Untitled Shared Schedule",
          created_at: fullData.created_at,
          last_edited: fullData.last_edited,
          show_name: fullData.show_name || "",
          job_number: fullData.job_number || "",
          facility_name: fullData.facility_name || "",
          project_manager: fullData.project_manager || "",
          production_manager: fullData.production_manager || "",
          account_manager: fullData.account_manager || "",
          set_datetime: fullData.set_datetime || null,
          strike_datetime: fullData.strike_datetime || null,
          crew_key: fullData.crew_key || [],
          labor_schedule_items: fullData.labor_schedule_items || [],
          detailed_schedule_items: (fullData.detailed_schedule_items || []).map((item) => ({
            ...item,
            assigned_crew_ids:
              item.assigned_crew_ids || (item.assigned_crew_id ? [item.assigned_crew_id] : []),
          })),
          contact_name: fullData.contact_name,
          contact_email: fullData.contact_email,
          contact_phone: fullData.contact_phone,
        };

        setSchedule(sharedScheduleData);
        setShareLinkInfo(shareLink);
      } catch (err: unknown) {
        console.error("[SharedProductionSchedule] Error fetching shared production schedule:", err);
        const message =
          err instanceof Error
            ? err.message
            : "Failed to load shared production schedule. Please check the console for more details.";
        setError(message);
        if (
          err instanceof Error &&
          (err.message === "Share link has expired" || err.message === "Share link not found")
        ) {
          // Optionally redirect or show specific UI for these cases
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSharedSchedule();
  }, [shareCode, navigate]);

  // Keyboard shortcut for manual save (Cmd/Ctrl+S) - only in edit mode
  useEffect(() => {
    if (!collaborationEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        forceSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [collaborationEnabled, forceSave]);

  // Handler functions for editing (only used in edit mode)
  const handleHeaderFieldUpdate = (field: string, value: string) => {
    if (schedule && isEditMode) {
      setSchedule({
        ...schedule,
        [field]: value || null,
      });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (schedule && isEditMode) {
      setSchedule({ ...schedule, name: e.target.value });
    }
  };

  const handleAddCrewKeyItem = () => {
    if (schedule && isEditMode) {
      const nextColorIndex = (schedule.crew_key?.length || 0) % defaultColors.length;
      const newItem: CrewKeyItem = {
        id: uuidv4(),
        name: "",
        color: defaultColors[nextColorIndex],
      };
      setSchedule({
        ...schedule,
        crew_key: [...(schedule.crew_key || []), newItem],
      });
    }
  };

  const handleUpdateCrewKeyItem = (itemId: string, field: "name" | "color", value: string) => {
    if (schedule && isEditMode) {
      setSchedule({
        ...schedule,
        crew_key: (schedule.crew_key || []).map((item) =>
          item.id === itemId ? { ...item, [field]: value } : item,
        ),
      });
    }
  };

  const handleDeleteCrewKeyItem = (itemId: string) => {
    if (schedule && isEditMode) {
      const updatedDetailedScheduleItems = (schedule.detailed_schedule_items || []).map(
        (detailItem) => ({
          ...detailItem,
          assigned_crew_ids: (detailItem.assigned_crew_ids || []).filter(
            (crewId) => crewId !== itemId,
          ),
        }),
      );

      setSchedule({
        ...schedule,
        crew_key: (schedule.crew_key || []).filter((item) => item.id !== itemId),
        detailed_schedule_items: updatedDetailedScheduleItems,
      });
    }
  };

  const handleUpdateLaborScheduleItems = (items: LaborScheduleItem[]) => {
    if (schedule && isEditMode) {
      setSchedule({
        ...schedule,
        labor_schedule_items: items,
      });
    }
  };

  const handleUpdateDetailedScheduleItems = (items: DetailedScheduleItem[]) => {
    if (schedule && isEditMode) {
      setSchedule({
        ...schedule,
        detailed_schedule_items: items,
      });
    }
  };

  // Manual save handler (for non-collaboration mode)
  const handleSave = async () => {
    if (!schedule || !shareCode) return;

    // For collaboration-enabled mode, use forceSave
    if (collaborationEnabled) {
      await forceSave();
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
      console.log(
        "[SharedProductionSchedule] Saving shared production schedule with shareCode:",
        shareCode,
      );
      const savedData = await updateSharedResource(
        shareCode,
        "production_schedule",
        baseDataToSave,
      );

      if (savedData) {
        setSchedule({
          ...schedule,
          ...savedData,
          set_datetime: savedData.set_datetime || null,
          strike_datetime: savedData.strike_datetime || null,
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Please try again.";
      console.error("Error saving shared production schedule:", error);
      setSaveError(`Error saving schedule: ${errorMessage}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // Fetch version history
  const fetchVersionHistory = useCallback(async () => {
    if (!schedule?.id) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
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
        .limit(50);

      if (error) throw error;

      const versionsWithUsers = await Promise.all(
        (data || []).map(async (version) => {
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load version history";
      console.error("Error fetching version history:", error);
      setHistoryError(errorMessage);
    } finally {
      setHistoryLoading(false);
    }
  }, [schedule?.id]);

  // Restore a previous version
  const handleRestoreVersion = async (versionId: string) => {
    if (!schedule?.id || !shareCode) return;

    try {
      const { data: historyData, error: historyError } = await supabase
        .from("production_schedule_history")
        .select("content, version")
        .eq("id", versionId)
        .single();

      if (historyError) throw historyError;
      if (!historyData) throw new Error("Version not found");

      const restoredContent = historyData.content as Partial<FullProductionScheduleData>;

      // Update via shared resource
      await updateSharedResource(shareCode, "production_schedule", {
        ...restoredContent,
        last_edited: new Date().toISOString(),
      });

      // Update local state
      setSchedule({
        ...schedule,
        ...restoredContent,
      });

      setShowHistory(false);
      alert(`Successfully restored version ${historyData.version}`);
      await fetchVersionHistory();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Error restoring version:", error);
      alert(`Failed to restore version: ${errorMessage}`);
    }
  };

  // Fetch version history when modal opens
  useEffect(() => {
    if (showHistory && schedule?.id) {
      fetchVersionHistory();
    }
  }, [showHistory, schedule?.id, fetchVersionHistory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-lg text-gray-300">Loading Shared Production Schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 mt-24">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied or Error</h1>
          <p className="text-lg text-red-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 mt-24">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Production Schedule Not Found</h1>
          <p className="text-lg text-gray-400 mb-6">
            The requested production schedule could not be loaded.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if user authentication is required but not present
  if (requiresAuth && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 mt-24">
          <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Authentication Required</h1>
          <p className="text-lg text-gray-400 mb-6">
            Please sign in to edit this shared production schedule.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Sign In
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // Prepare schedule for export component (view mode only)
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
      contact_name: schedule.contact_name,
      contact_email: schedule.contact_email,
      contact_phone: schedule.contact_phone,
      event_start: undefined,
      event_end: undefined,
      event_type: undefined,
      sound_check: undefined,
      room: undefined,
      address: undefined,
      client_artist: undefined,
      foh_engineer: undefined,
      monitor_engineer: undefined,
    },
    crew_key: schedule.crew_key || [],
    labor_schedule_items: schedule.labor_schedule_items || [],
    detailed_schedule_items: schedule.detailed_schedule_items || [],
  };

  // VIEW MODE: Display read-only version
  if (!isEditMode) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-2 py-8 sm:px-4 mt-24">
          <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-gray-700">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">{schedule.name}</h1>
                <p className="text-sm text-indigo-400 flex items-center mt-1">
                  <Share2 className="h-4 w-4 mr-2" /> Shared for viewing
                </p>
              </div>
              {shareLinkInfo && shareLinkInfo.expires_at && (
                <p className="text-xs text-yellow-400 mt-2 sm:mt-0">
                  Link expires on: {new Date(shareLinkInfo.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-400 mb-6">
              This is a shared, view-only version of a production schedule.
            </p>
          </div>
          <div className="bg-slate-900 p-0 sm:p-0 rounded-lg shadow-lg overflow-x-auto">
            <ProductionScheduleExport
              ref={exportRef}
              schedule={scheduleForExportProps}
              forDisplay={true}
            />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // EDIT MODE: Display editable version with collaboration
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header
        dashboard={false}
        scheduleForExport={scheduleForExportProps}
        scheduleType="production"
      />

      {/* Collaboration Toolbar (for edit mode) */}
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
              onClick={() => navigate("/shared-with-me")}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-grow min-w-0">
              <input
                type="text"
                value={schedule.name}
                onChange={handleNameChange}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                placeholder="Enter schedule name"
              />
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {schedule.last_edited
                  ? `Last edited: ${new Date(schedule.last_edited).toLocaleString()}`
                  : `Created: ${new Date(schedule.created_at || Date.now()).toLocaleString()}`}
                {schedule.user_id && (
                  <span className="ml-2">
                    (Shared Edit, Original Owner: ...{schedule.user_id.slice(-6)})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Manual Save button (only when collaboration is disabled) */}
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

        {/* Error messages (for manual save errors) */}
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

        {/* Production Schedule Details */}
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">Production Schedule Details</h2>
            <p className="text-gray-400 text-sm">Manage the core information for your event.</p>
          </div>
          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="md:min-w-[800px]">
              <ProductionScheduleHeader
                scheduleData={{
                  show_name: schedule.show_name || "",
                  job_number: schedule.job_number || "",
                  facility_name: schedule.facility_name || "",
                  project_manager: schedule.project_manager || "",
                  production_manager: schedule.production_manager || "",
                  account_manager: schedule.account_manager || "",
                  set_datetime: schedule.set_datetime,
                  strike_datetime: schedule.strike_datetime,
                }}
                updateField={handleHeaderFieldUpdate}
              />
            </div>
          </div>
        </div>

        {/* Crew & Department Key */}
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
                crewKey={schedule.crew_key || []}
                onUpdateCrewKeyItem={handleUpdateCrewKeyItem}
                onAddCrewKeyItem={handleAddCrewKeyItem}
                onDeleteCrewKeyItem={handleDeleteCrewKeyItem}
              />
            </div>
          </div>
        </div>

        {/* Detailed Production Schedule */}
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
                detailedItems={schedule.detailed_schedule_items || []}
                onUpdateDetailedItems={handleUpdateDetailedScheduleItems}
                crewKey={schedule.crew_key || []}
              />
            </div>
          </div>
        </div>

        {/* Labor Schedule */}
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
                laborItems={schedule.labor_schedule_items || []}
                onUpdateLaborItems={handleUpdateLaborScheduleItems}
                crewKey={schedule.crew_key || []}
              />
            </div>
          </div>
        </div>

        {/* Bottom Save button (only when collaboration is disabled) */}
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

export default SharedProductionSchedule;

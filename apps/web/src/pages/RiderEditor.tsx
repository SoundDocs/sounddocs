import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RiderArtistInfo from "../components/rider/RiderArtistInfo";
import RiderInputList from "../components/rider/RiderInputList";
import RiderEquipment from "../components/rider/RiderEquipment";
import RiderTechnicalStaff from "../components/rider/RiderTechnicalStaff";
import { Loader, ArrowLeft, Save, AlertCircle, Users, ListChecks, Wrench, Zap } from "lucide-react";
import { BandMember, InputChannel, BacklineItem, StaffRequirement } from "../lib/types";
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

interface RiderData {
  id?: string;
  user_id?: string;
  name: string;
  created_at?: string;
  last_edited?: string;
  artist_name: string;
  band_members: BandMember[];
  genre: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  stage_plot_url?: string;
  input_list: InputChannel[];
  pa_requirements: string;
  monitor_requirements: string;
  console_requirements: string;
  backline_requirements: BacklineItem[];
  artist_provided_gear: BacklineItem[];
  required_staff: StaffRequirement[];
  special_requirements: string;
  power_requirements: string;
  lighting_notes: string;
  hospitality_notes: string;
  additional_notes: string;
}

const RiderEditor = () => {
  const { id, shareCode } = useParams(); // Get both id and shareCode
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rider, setRider] = useState<RiderData | null>(null);
  const [activeTab, setActiveTab] = useState("artist");
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

  // Local state for name input to prevent collaboration reversion
  const [localName, setLocalName] = useState<string>("");
  const localNameInitialized = useRef(false);

  // For unauthenticated shared edit users, generate a temporary ID
  const [anonymousUserId] = useState(() => `anonymous-${uuidv4()}`);
  const effectiveUserId = user?.id || (isSharedEdit ? anonymousUserId : "");
  const effectiveUserEmail = user?.email || (isSharedEdit ? `${anonymousUserId}@shared` : "");
  const effectiveUserName = user?.user_metadata?.name || (isSharedEdit ? "Anonymous User" : "");

  // Enable collaboration for existing documents (including edit-mode shared links)
  // For shared links, id will be undefined, so we check rider?.id instead
  // For edit-mode shared links, allow collaboration even without authentication
  const collaborationEnabled =
    (id ? id !== "new" : true) && // Allow if no id param (shared link) or if id !== "new"
    (!isSharedEdit || currentShareLink?.link_type === "edit") &&
    !!rider?.id &&
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
      hasRiderId: !!rider?.id,
      hasUser: !!user,
      userId: user?.id,
      riderId: rider?.id,
    };
    console.log("[RiderEditor] Collaboration status:");
    console.log(JSON.stringify(status, null, 2));
  }, [collaborationEnabled, id, isSharedEdit, currentShareLink, rider?.id, user]);

  // Auto-save hook
  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
  } = useAutoSave({
    documentId: rider?.id || "",
    documentType: "technical_riders",
    userId: effectiveUserId,
    data: rider,
    enabled: collaborationEnabled,
    debounceMs: 1500,
    shareCode: isSharedEdit ? shareCode : undefined,
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
    documentId: rider?.id || "",
    documentType: "technical_riders",
    userId: effectiveUserId,
    userEmail: effectiveUserEmail,
    userName: effectiveUserName,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      // GUARD: Don't process remote updates if collaboration is disabled
      // This prevents input reversion on NEW documents where collaboration is off
      if (!collaborationEnabled) {
        console.log("[RiderEditor] Ignoring remote update - collaboration disabled");
        return;
      }

      if (payload.type === "field_update" && payload.field) {
        if (payload.field === "name" && typeof payload.value === "string") {
          console.log("[RiderEditor] Updating localName from remote broadcast:", payload.value);
          setLocalName(payload.value);
        } else {
          setRider((prev: any) => ({
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
    if (!collaborationEnabled || !rider?.id) {
      return;
    }

    console.log("[RiderEditor] Setting up real-time subscription for rider:", rider.id);

    const channel = supabase
      .channel(`technical_rider_db_${rider.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "technical_riders",
          filter: `id=eq.${rider.id}`,
        },
        (payload) => {
          console.log("[RiderEditor] Received database UPDATE event:", payload);
          // NOTE: We intentionally DO NOT update local state from database UPDATE events
          // because they include our own saves echoing back, which would overwrite user typing
          // Real-time collaboration updates happen via the broadcast channel in useCollaboration
          console.log("[RiderEditor] Ignoring database UPDATE to prevent input reversion");
        },
      )
      .subscribe();

    return () => {
      console.log("[RiderEditor] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [collaborationEnabled, rider?.id]);

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

  // Initialize localName from rider on first load
  useEffect(() => {
    if (rider?.name && !localNameInitialized.current) {
      console.log("[RiderEditor] Initializing localName from rider:", rider.name);
      setLocalName(rider.name);
      localNameInitialized.current = true;
    }
  }, [rider?.name]);

  // Debounced sync: Update rider when localName changes (after user stops typing)
  useEffect(() => {
    if (!localNameInitialized.current) return;

    const timer = setTimeout(() => {
      if (localName !== rider?.name) {
        console.log("[RiderEditor] Syncing localName to rider:", {
          localName,
          previousName: rider?.name,
        });
        setRider((prev) => (prev ? { ...prev, name: localName } : prev));
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localName, rider?.name]);

  useEffect(() => {
    const fetchUserAndRider = async () => {
      setLoading(true);
      if (!user && !shareCode) {
        console.error("User not authenticated");
        navigate("/login");
        return;
      }

      const currentPathIsSharedEdit = location.pathname.includes("/shared/technical-rider/edit/");
      console.log(
        `[RiderEditor] Path: ${location.pathname}, shareCode: ${shareCode}, currentPathIsSharedEdit: ${currentPathIsSharedEdit}`,
      );

      if (currentPathIsSharedEdit && shareCode) {
        console.log("[RiderEditor] Attempting to fetch SHARED resource with shareCode:", shareCode);
        try {
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);

          console.log(
            "[RiderEditor] DEBUG: Fetched Shared Link Details:",
            JSON.stringify(fetchedShareLink, null, 2),
          );
          console.log(
            "[RiderEditor] DEBUG: Fetched Resource Details:",
            JSON.stringify(resource, null, 2),
          );

          if (fetchedShareLink.resource_type !== "technical_rider") {
            console.error(
              "[RiderEditor] Share code is for a different resource type:",
              fetchedShareLink.resource_type,
              "Expected: technical_rider",
            );
            navigate("/dashboard");
            setLoading(false);
            return;
          }

          if (fetchedShareLink.link_type !== "edit") {
            console.warn(
              `[RiderEditor] Link type is '${fetchedShareLink.link_type}', not 'edit'. Redirecting to view page.`,
            );
            window.location.href = getShareUrl(shareCode, "technical_rider", "view");
            return;
          }

          const sharedRiderData: RiderData = {
            id: resource.id,
            user_id: resource.user_id,
            name: resource.name || "Untitled Shared Rider",
            created_at: resource.created_at,
            last_edited: resource.last_edited,
            artist_name: resource.artist_name || "",
            band_members: resource.band_members || [],
            genre: resource.genre || "",
            contact_name: resource.contact_name || "",
            contact_email: resource.contact_email || "",
            contact_phone: resource.contact_phone || "",
            stage_plot_url: resource.stage_plot_url,
            input_list: resource.input_list || [],
            pa_requirements: resource.pa_requirements || "",
            monitor_requirements: resource.monitor_requirements || "",
            console_requirements: resource.console_requirements || "",
            backline_requirements: resource.backline_requirements || [],
            artist_provided_gear: resource.artist_provided_gear || [],
            required_staff: resource.required_staff || [],
            special_requirements: resource.special_requirements || "",
            power_requirements: resource.power_requirements || "",
            lighting_notes: resource.lighting_notes || "",
            hospitality_notes: resource.hospitality_notes || "",
            additional_notes: resource.additional_notes || "",
          };
          setRider(sharedRiderData);
          setCurrentShareLink(fetchedShareLink);
          setIsSharedEdit(true);
          console.log(
            "[RiderEditor] SHARED technical_rider resource loaded successfully for editing.",
          );
        } catch (error: any) {
          console.error(
            "[RiderEditor] Error fetching SHARED technical rider:",
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
        const newRider: RiderData = {
          name: "Untitled Technical Rider",
          artist_name: "",
          band_members: [],
          genre: "",
          contact_name: "",
          contact_email: "",
          contact_phone: "",
          input_list: [],
          pa_requirements: "",
          monitor_requirements: "",
          console_requirements: "",
          backline_requirements: [],
          artist_provided_gear: [],
          required_staff: [],
          special_requirements: "",
          power_requirements: "",
          lighting_notes: "",
          hospitality_notes: "",
          additional_notes: "",
          user_id: user.id,
          created_at: new Date().toISOString(),
        };
        setRider(newRider);
        setIsSharedEdit(false);
        setLoading(false);
      } else if (id) {
        if (!user) {
          navigate("/login");
          return;
        }
        try {
          const { data, error } = await supabase
            .from("technical_riders")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

          if (error) throw error;

          if (data) {
            setRider(data as RiderData);
          } else {
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Error fetching technical rider:", error);
          navigate("/dashboard");
        } finally {
          setIsSharedEdit(false);
          setLoading(false);
        }
      } else {
        console.error("[RiderEditor] Invalid route state. No id, no shareCode, not 'new'.");
        navigate("/dashboard");
        setLoading(false);
      }
    };

    fetchUserAndRider();
  }, [id, shareCode, navigate, location.pathname]);

  const handleSave = async () => {
    if (!rider) return;

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

    const baseDataToSave = {
      name: rider.name,
      artist_name: rider.artist_name,
      band_members: rider.band_members,
      genre: rider.genre,
      contact_name: rider.contact_name,
      contact_email: rider.contact_email,
      contact_phone: rider.contact_phone,
      stage_plot_url: rider.stage_plot_url,
      input_list: rider.input_list,
      pa_requirements: rider.pa_requirements,
      monitor_requirements: rider.monitor_requirements,
      console_requirements: rider.console_requirements,
      backline_requirements: rider.backline_requirements,
      artist_provided_gear: rider.artist_provided_gear,
      required_staff: rider.required_staff,
      special_requirements: rider.special_requirements,
      power_requirements: rider.power_requirements,
      lighting_notes: rider.lighting_notes,
      hospitality_notes: rider.hospitality_notes,
      additional_notes: rider.additional_notes,
      last_edited: new Date().toISOString(),
    };

    try {
      let savedData;
      if (isSharedEdit && shareCode) {
        console.log("[RiderEditor] Saving SHARED technical rider with shareCode:", shareCode);
        savedData = await updateSharedResource(shareCode, "technical_rider", baseDataToSave);
        if (savedData) {
          setRider({
            ...rider,
            ...savedData,
          });
        }
      } else if (user) {
        const dataForOwnedSave: any = {
          ...baseDataToSave,
          user_id: user.id,
        };

        if (id === "new") {
          dataForOwnedSave.created_at = rider.created_at || new Date().toISOString();
          const { data, error } = await supabase
            .from("technical_riders")
            .insert(dataForOwnedSave)
            .select()
            .single();
          if (error) throw error;
          savedData = data;
          if (data) navigate(`/rider/${data.id}`, { state: { from: location.state?.from } });
        } else {
          const { data, error } = await supabase
            .from("technical_riders")
            .update(dataForOwnedSave)
            .eq("id", rider.id as string)
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
        setRider(savedData as RiderData);
      } else if (savedData && isSharedEdit) {
        setRider((prev) =>
          prev ? { ...prev, last_edited: savedData.last_edited || prev.last_edited } : null,
        );
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving technical rider:", error);
      setSaveError(`Error saving rider: ${error.message || "Please try again."}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Fetch version history for the current document
   */
  const fetchVersionHistory = async () => {
    if (!rider?.id) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      // Query the technical_rider_history table
      const { data, error } = await supabase
        .from("technical_rider_history")
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
        .eq("technical_rider_id", rider.id)
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
    if (!rider?.id) return;

    try {
      // Fetch the full content from the history table
      const { data: historyData, error: historyError } = await supabase
        .from("technical_rider_history")
        .select("content, version")
        .eq("id", versionId)
        .single();

      if (historyError) throw historyError;
      if (!historyData) throw new Error("Version not found");

      // Update the current document with the historical content
      const restoredContent = historyData.content as any;

      // Update in the database
      const { error: updateError } = await supabase
        .from("technical_riders")
        .update({
          ...restoredContent,
          last_edited: new Date().toISOString(),
        })
        .eq("id", rider.id);

      if (updateError) throw updateError;

      // Update local state
      setRider({
        ...rider,
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
    if (showHistory && rider?.id) {
      fetchVersionHistory();
    }
  }, [showHistory, rider?.id]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Technical rider not found.</p>
      </div>
    );
  }

  const tabs = [
    { id: "artist", label: "Artist Info", icon: Users },
    { id: "inputs", label: "Input List", icon: ListChecks },
    { id: "equipment", label: "Equipment", icon: Wrench },
    { id: "staff", label: "Staff & Special", icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onSignOut={handleSignOut} />

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

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-8">
          <button
            onClick={() => navigate(location.state?.from || "/production")}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="text-3xl md:text-4xl font-bold text-white bg-transparent border-b-2 border-gray-700 focus:border-indigo-500 focus:outline-none w-full"
                placeholder="Rider Name"
              />
              <p className="text-sm text-gray-400 mt-2">
                {rider.last_edited
                  ? `Last edited: ${new Date(rider.last_edited).toLocaleString()}`
                  : `Created: ${new Date(rider.created_at || Date.now()).toLocaleString()}`}
                {isSharedEdit && rider.user_id && (
                  <span className="ml-2">
                    (Shared, Original Owner: ...{rider.user_id.slice(-6)})
                  </span>
                )}
              </p>
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
            <p className="text-green-400 text-sm">Technical rider saved successfully!</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-indigo-400 border-b-2 border-indigo-400"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-md mb-8">
          {activeTab === "artist" && (
            <RiderArtistInfo
              artistName={rider.artist_name}
              genre={rider.genre}
              contactName={rider.contact_name}
              contactEmail={rider.contact_email}
              contactPhone={rider.contact_phone}
              bandMembers={rider.band_members}
              onUpdateArtistName={(value) => setRider({ ...rider, artist_name: value })}
              onUpdateGenre={(value) => setRider({ ...rider, genre: value })}
              onUpdateContactName={(value) => setRider({ ...rider, contact_name: value })}
              onUpdateContactEmail={(value) => setRider({ ...rider, contact_email: value })}
              onUpdateContactPhone={(value) => setRider({ ...rider, contact_phone: value })}
              onUpdateBandMembers={(members) => setRider({ ...rider, band_members: members })}
            />
          )}

          {activeTab === "inputs" && (
            <RiderInputList
              inputList={rider.input_list}
              onUpdateInputList={(inputs) => setRider({ ...rider, input_list: inputs })}
            />
          )}

          {activeTab === "equipment" && (
            <RiderEquipment
              paRequirements={rider.pa_requirements}
              monitorRequirements={rider.monitor_requirements}
              consoleRequirements={rider.console_requirements}
              backlineRequirements={rider.backline_requirements}
              artistProvidedGear={rider.artist_provided_gear}
              onUpdatePaRequirements={(value) => setRider({ ...rider, pa_requirements: value })}
              onUpdateMonitorRequirements={(value) =>
                setRider({ ...rider, monitor_requirements: value })
              }
              onUpdateConsoleRequirements={(value) =>
                setRider({ ...rider, console_requirements: value })
              }
              onUpdateBacklineRequirements={(items) =>
                setRider({ ...rider, backline_requirements: items })
              }
              onUpdateArtistProvidedGear={(items) =>
                setRider({ ...rider, artist_provided_gear: items })
              }
            />
          )}

          {activeTab === "staff" && (
            <RiderTechnicalStaff
              requiredStaff={rider.required_staff}
              specialRequirements={rider.special_requirements}
              powerRequirements={rider.power_requirements}
              lightingNotes={rider.lighting_notes}
              hospitalityNotes={rider.hospitality_notes}
              additionalNotes={rider.additional_notes}
              onUpdateRequiredStaff={(staff) => setRider({ ...rider, required_staff: staff })}
              onUpdateSpecialRequirements={(value) =>
                setRider({ ...rider, special_requirements: value })
              }
              onUpdatePowerRequirements={(value) =>
                setRider({ ...rider, power_requirements: value })
              }
              onUpdateLightingNotes={(value) => setRider({ ...rider, lighting_notes: value })}
              onUpdateHospitalityNotes={(value) => setRider({ ...rider, hospitality_notes: value })}
              onUpdateAdditionalNotes={(value) => setRider({ ...rider, additional_notes: value })}
            />
          )}
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
                  Saving Rider...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Technical Rider
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
            documentId={rider?.id || ""}
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

export default RiderEditor;

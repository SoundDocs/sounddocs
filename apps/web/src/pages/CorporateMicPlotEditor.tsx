import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { v4 as uuidv4 } from "uuid";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PresenterEntryCard, {
  PresenterEntry,
} from "../components/corporate-mic-plot/PresenterEntryCard";
import { Loader, ArrowLeft, Save, PlusCircle, AlertCircle, Users, Share2 } from "lucide-react";
import {
  getSharedResource,
  updateSharedResource,
  SharedLink,
  ResourceType,
} from "../lib/shareUtils";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCollaboration } from "@/hooks/useCollaboration";
import { usePresence } from "@/hooks/usePresence";
import { CollaborationToolbar } from "@/components/CollaborationToolbar";
import { DocumentHistory } from "@/components/History/DocumentHistory";
import { ConflictResolution } from "@/components/ConflictResolution";
import type { DocumentConflict, VersionHistory } from "@/types/collaboration";

interface CorporateMicPlot {
  id: string;
  user_id?: string; // Optional for shared plots not yet claimed
  name: string;
  created_at: string;
  last_edited: string;
  presenters: PresenterEntry[];
}

const CorporateMicPlotEditor: React.FC = () => {
  const { id: routeId, shareCode } = useParams<{ id?: string; shareCode?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [micPlot, setMicPlot] = useState<CorporateMicPlot | null>(null);
  const [user, setUser] = useState<any>(null); // Current authenticated user
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [sharedLinkInfo, setSharedLinkInfo] = useState<SharedLink | null>(null);
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

  // Local state for name input to prevent reversion during typing
  const [localName, setLocalName] = useState("");
  const [localNameInitialized, setLocalNameInitialized] = useState(false);

  // Enable collaboration for existing documents (including edit-mode shared links)
  // For shared links, routeId will be undefined, so we check micPlot?.id instead
  // For edit-mode shared links, allow collaboration even without authentication
  const collaborationEnabled =
    (routeId ? routeId !== "new" : true) && // Allow if no routeId param (shared link) or if routeId !== "new"
    (!isSharedEdit || sharedLinkInfo?.link_type === "edit") &&
    !!micPlot?.id &&
    (!!user || (isSharedEdit && sharedLinkInfo?.link_type === "edit")); // Allow unauthenticated for edit-mode shared links

  // Debug: Log collaboration status
  useEffect(() => {
    const status = {
      collaborationEnabled,
      routeId,
      routeIdCheck: routeId ? routeId !== "new" : true,
      isNew: routeId === "new",
      isSharedEdit,
      sharedLinkType: sharedLinkInfo?.link_type,
      shareEditCheck: !isSharedEdit || sharedLinkInfo?.link_type === "edit",
      hasMicPlotId: !!micPlot?.id,
      hasUser: !!user,
      userId: user?.id,
      micPlotId: micPlot?.id,
    };
    console.log("[CorporateMicPlotEditor] Collaboration status:");
    console.log(JSON.stringify(status, null, 2));
  }, [collaborationEnabled, routeId, isSharedEdit, sharedLinkInfo, micPlot?.id, user]);

  const fetchMicPlotData = useCallback(
    async (currentUserId: string | null) => {
      setLoading(true);
      try {
        if (shareCode) {
          setIsSharedEdit(true);
          const { resource, shareLink } = await getSharedResource(shareCode);
          if (shareLink.resource_type !== "corporate_mic_plot" || shareLink.link_type !== "edit") {
            throw new Error("Invalid or unauthorized share link for editing.");
          }
          setMicPlot(resource as CorporateMicPlot);
          setSharedLinkInfo(shareLink);
        } else if (routeId === "new" && currentUserId) {
          setMicPlot({
            id: uuidv4(),
            user_id: currentUserId,
            name: "Untitled Corporate Mic Plot",
            created_at: new Date().toISOString(),
            last_edited: new Date().toISOString(),
            presenters: [],
          });
        } else if (routeId && currentUserId) {
          const { data, error } = await supabase
            .from("corporate_mic_plots")
            .select("*")
            .eq("id", routeId)
            .eq("user_id", currentUserId)
            .single();
          if (error) throw error;
          if (data) setMicPlot(data as CorporateMicPlot);
          else navigate("/audio", { replace: true, state: { error: "Mic plot not found." } });
        } else if (!currentUserId && !shareCode) {
          navigate("/login"); // Should not happen if ProtectedRoute is used correctly for non-shared routes
        }
      } catch (error: any) {
        console.error("Error fetching corporate mic plot:", error);
        setSaveError(`Failed to load mic plot: ${error.message}`);
        // Consider navigating away or showing a more persistent error UI
        navigate(shareCode ? "/" : "/audio", {
          replace: true,
          state: { error: `Failed to load mic plot: ${error.message}` },
        });
      } finally {
        setLoading(false);
      }
    },
    [routeId, shareCode, navigate],
  );

  useEffect(() => {
    const initialize = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser); // Set user regardless, for UI elements or potential future use

      if (!currentUser && !shareCode) {
        // If not a shared link and no user, redirect to login
        navigate("/login");
        return;
      }
      fetchMicPlotData(currentUser?.id || null);
    };
    initialize();
  }, [fetchMicPlotData, navigate, shareCode]);

  // Auto-save hook
  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
  } = useAutoSave({
    documentId: micPlot?.id || "",
    documentType: "corporate_mic_plots",
    userId: effectiveUserId,
    data: micPlot,
    enabled: collaborationEnabled,
    debounceMs: 1500,
    shareCode: isSharedEdit && shareCode ? shareCode : undefined,
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
    documentId: micPlot?.id || "",
    documentType: "corporate_mic_plots",
    userId: effectiveUserId,
    userEmail: effectiveUserEmail,
    userName: effectiveUserName,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      // GUARD: Don't process remote updates if collaboration is disabled
      // This prevents input reversion on NEW documents where collaboration is off
      if (!collaborationEnabled) {
        console.log("[CorporateMicPlotEditor] Ignoring remote update - collaboration disabled");
        return;
      }

      if (payload.type === "field_update" && payload.field) {
        if (payload.field === "name") {
          setMicPlot((prev: any) => ({
            ...prev,
            name: payload.value,
          }));
          // Update local name state when remote changes arrive
          setLocalName(payload.value);
        } else {
          setMicPlot((prev: any) => ({
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

  // Initialize local name from micPlot.name when document loads
  useEffect(() => {
    if (micPlot?.name && !localNameInitialized) {
      setLocalName(micPlot.name);
      setLocalNameInitialized(true);
    }
  }, [micPlot?.name, localNameInitialized]);

  // Debounced sync: Update micPlot.name after user stops typing (500ms delay)
  useEffect(() => {
    if (!localNameInitialized) return;

    const handler = setTimeout(() => {
      if (localName !== micPlot?.name) {
        setMicPlot((prev: any) => (prev ? { ...prev, name: localName } : prev));

        // Broadcast name change to other collaborators
        if (collaborationEnabled && broadcast) {
          broadcast({
            type: "field_update",
            field: "name",
            value: localName,
            userId: effectiveUserId,
          }).catch((err) =>
            console.error("[CorporateMicPlotEditor] Failed to broadcast name change:", err),
          );
        }
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [
    localName,
    localNameInitialized,
    micPlot?.name,
    setMicPlot,
    collaborationEnabled,
    broadcast,
    effectiveUserId,
  ]);

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

  // Real-time database subscription for syncing changes across users
  useEffect(() => {
    if (!collaborationEnabled || !micPlot?.id) {
      return;
    }

    console.log(
      "[CorporateMicPlotEditor] Setting up real-time subscription for mic plot:",
      micPlot.id,
    );

    const channel = supabase
      .channel(`corporate_mic_plot_db_${micPlot.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "corporate_mic_plots",
          filter: `id=eq.${micPlot.id}`,
        },
        (payload) => {
          console.log("[CorporateMicPlotEditor] Received database UPDATE event:", payload);
          // NOTE: We intentionally DO NOT update local state from database UPDATE events
          // because they include our own saves echoing back, which would overwrite user typing
          // Real-time collaboration updates happen via the broadcast channel in useCollaboration
          console.log(
            "[CorporateMicPlotEditor] Ignoring database UPDATE to prevent input reversion",
          );
        },
      )
      .subscribe();

    return () => {
      console.log("[CorporateMicPlotEditor] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [collaborationEnabled, micPlot?.id]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalName(e.target.value);
  };

  const handleAddPresenter = () => {
    if (micPlot) {
      const newPresenter: PresenterEntry = {
        id: uuidv4(),
        presenter_name: "",
        session_segment: "",
        mic_type: "",
        element_channel_number: "",
        tx_pack_location: "",
        backup_element: "",
        sound_check_time: "",
        notes: "",
        presentation_type: "",
        remote_participation: false,
        photo_url: null,
      };
      const updatedPresenters = [...micPlot.presenters, newPresenter];
      setMicPlot({ ...micPlot, presenters: updatedPresenters });

      // Broadcast presenter addition to other collaborators
      if (collaborationEnabled && broadcast) {
        broadcast({
          type: "field_update",
          field: "presenters",
          value: updatedPresenters,
          userId: effectiveUserId,
        }).catch((err) =>
          console.error("[CorporateMicPlotEditor] Failed to broadcast presenter addition:", err),
        );
      }
    }
  };

  const handleUpdatePresenter = (id: string, field: keyof PresenterEntry, value: any) => {
    if (micPlot) {
      const updatedPresenters = micPlot.presenters.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      );
      setMicPlot({
        ...micPlot,
        presenters: updatedPresenters,
      });

      // Broadcast presenter update to other collaborators
      if (collaborationEnabled && broadcast) {
        broadcast({
          type: "field_update",
          field: "presenters",
          value: updatedPresenters,
          userId: effectiveUserId,
        }).catch((err) =>
          console.error("[CorporateMicPlotEditor] Failed to broadcast presenter update:", err),
        );
      }
    }
  };

  const handleDeletePresenter = (id: string) => {
    if (micPlot) {
      const updatedPresenters = micPlot.presenters.filter((p) => p.id !== id);
      setMicPlot({
        ...micPlot,
        presenters: updatedPresenters,
      });

      // Broadcast presenter deletion to other collaborators
      if (collaborationEnabled && broadcast) {
        broadcast({
          type: "field_update",
          field: "presenters",
          value: updatedPresenters,
          userId: effectiveUserId,
        }).catch((err) =>
          console.error("[CorporateMicPlotEditor] Failed to broadcast presenter deletion:", err),
        );
      }
    }
  };

  const handleSave = async () => {
    if (!micPlot) return;

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

    const dataToSave = {
      ...micPlot,
      last_edited: new Date().toISOString(),
    };
    // Remove user_id if it's a shared edit and the original user_id is not available or relevant for this update
    if (isSharedEdit && !dataToSave.user_id) {
      delete dataToSave.user_id;
    }

    try {
      if (isSharedEdit && shareCode) {
        const updatedResource = await updateSharedResource(
          shareCode,
          "corporate_mic_plot" as ResourceType,
          dataToSave,
        );
        setMicPlot(updatedResource as CorporateMicPlot);
      } else if (user) {
        // Regular save by authenticated user
        if (routeId === "new") {
          const { data, error } = await supabase
            .from("corporate_mic_plots")
            .insert({ ...dataToSave, user_id: user.id })
            .select()
            .single();
          if (error) throw error;
          if (data) {
            navigate(`/corporate-mic-plot/${data.id}`, { replace: true, state: location.state });
            setMicPlot(data as CorporateMicPlot);
          }
        } else {
          const { data, error } = await supabase
            .from("corporate_mic_plots")
            .update(dataToSave)
            .eq("id", micPlot.id)
            .eq("user_id", user.id)
            .select()
            .single();
          if (error) throw error;
          if (data) {
            setMicPlot(data as CorporateMicPlot);
          }
        }
      } else {
        throw new Error("Cannot save: No user session and not a shared edit link.");
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving corporate mic plot:", error);
      setSaveError(`Failed to save: ${error.message}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Fetch version history for the current document
   */
  const fetchVersionHistory = async () => {
    if (!micPlot?.id) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      // Query the corporate_mic_plot_history table
      const { data, error } = await supabase
        .from("corporate_mic_plot_history")
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
        .eq("corporate_mic_plot_id", micPlot.id)
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
    if (!micPlot?.id) return;

    try {
      // Fetch the full content from the history table
      const { data: historyData, error: historyError } = await supabase
        .from("corporate_mic_plot_history")
        .select("content, version")
        .eq("id", versionId)
        .single();

      if (historyError) throw historyError;
      if (!historyData) throw new Error("Version not found");

      // Update the current document with the historical content
      const restoredContent = historyData.content as any;

      // Update in the database
      const { error: updateError } = await supabase
        .from("corporate_mic_plots")
        .update({
          ...restoredContent,
          last_edited: new Date().toISOString(),
        })
        .eq("id", micPlot.id);

      if (updateError) throw updateError;

      // Update local state
      setMicPlot({
        ...micPlot,
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
    if (showHistory && micPlot?.id) {
      fetchVersionHistory();
    }
  }, [showHistory, micPlot?.id]);

  const handleBackNavigation = () => {
    if (isSharedEdit) {
      // For shared edit, maybe go to a generic shared confirmation or home
      window.location.href = `/shared/corporate-mic-plot/${shareCode}`; // Go to view mode
      return;
    }
    const fromPath = location.state?.from as string | undefined;
    if (fromPath) {
      navigate(fromPath);
    } else {
      navigate("/audio");
    }
  };

  if (loading || !micPlot) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Determine if the current user is the owner, relevant for non-shared edits
  const isOwner = user && micPlot && micPlot.user_id === user.id;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={user && !isSharedEdit} />{" "}
      {/* Show dashboard header only if user is logged in and not a shared edit */}
      {isSharedEdit && sharedLinkInfo && (
        <div className="bg-indigo-700 text-white py-3 px-4 text-center text-sm">
          <Share2 className="inline h-4 w-4 mr-2" />
          You are editing a shared document. Changes will be saved for all viewers with this link.
          {sharedLinkInfo.expires_at && (
            <span className="ml-2 text-indigo-200">
              (Link expires: {new Date(sharedLinkInfo.expires_at).toLocaleDateString()})
            </span>
          )}
        </div>
      )}
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
                value={localName || micPlot?.name || ""}
                onChange={handleNameChange}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                placeholder="Enter Mic Plot Name"
              />
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                Last edited: {new Date(micPlot.last_edited).toLocaleString()}
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
            <p className="text-green-400 text-sm">Mic plot saved successfully!</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-3 text-indigo-400" />
              <h2 className="text-xl font-semibold text-white">Presenters & Microphones</h2>
            </div>
            <button
              onClick={handleAddPresenter}
              className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Add Presenter
            </button>
          </div>

          {micPlot.presenters.length === 0 && (
            <div className="text-center py-10 bg-gray-700/50 rounded-lg">
              <Users size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-300">No Presenters Added Yet</h3>
              <p className="text-sm text-gray-400 mb-4">Click "Add Presenter" to get started.</p>
            </div>
          )}

          {micPlot.presenters.map((entry) => (
            <PresenterEntryCard
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdatePresenter}
              onDelete={handleDeletePresenter}
              micPlotId={micPlot.id}
              userId={user?.id || micPlot.user_id || ""} // Pass owner's ID if available, or empty if truly anonymous shared edit
            />
          ))}
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
                  Saving Mic Plot...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Corporate Mic Plot
                </>
              )}
            </button>
          </div>
        )}
      </main>
      <Footer />
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
            documentId={micPlot?.id || ""}
            onResolve={(resolution) => {
              // Handle conflict resolution
              console.log("Conflict resolved with strategy:", resolution);
              setShowConflict(false);
              setConflict(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default CorporateMicPlotEditor;

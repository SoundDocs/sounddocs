import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PatchSheetInputs from "../components/patch-sheet/PatchSheetInputs";
import PatchSheetOutputs from "../components/patch-sheet/PatchSheetOutputs";
// import MobileScreenWarning from "../components/MobileScreenWarning"; // Removed
// import { useScreenSize } from "../hooks/useScreenSize"; // Removed
import { Loader, ArrowLeft, Save, AlertCircle } from "lucide-react";
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
import type { DocumentConflict } from "@/types/collaboration";
import { v4 as uuidv4 } from "uuid";

interface InputChannel {
  id: string;
  channelNumber: string;
  name: string;
  type: string;
  device: string;
  phantom: boolean;
  connection: string;
  connectionDetails?: {
    snakeType?: string;
    inputNumber?: string;
    networkType?: string;
    networkPatch?: string;
    consoleType?: string;
    consoleInputNumber?: string;
  };
  notes: string;
  isStereo?: boolean;
  stereoChannelNumber?: string;
}

interface OutputChannel {
  id: string;
  channelNumber: string;
  name: string;
  sourceType: string;
  sourceDetails?: {
    outputNumber?: string;
    snakeType?: string;
    networkType?: string;
    networkPatch?: string;
    consoleType?: string;
    consoleOutputNumber?: string;
  };
  destinationType: string;
  destinationGear: string;
  notes: string;
}

const PatchSheetEditor = () => {
  const { id, shareCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // const screenSize = useScreenSize(); // Removed
  const [loading, setLoading] = useState(true);
  const [patchSheet, setPatchSheet] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("inputs");
  const [inputs, setInputs] = useState<InputChannel[]>([]);
  const [outputs, setOutputs] = useState<OutputChannel[]>([]);
  // const [showMobileWarning, setShowMobileWarning] = useState(false); // Removed
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [shareLink, setShareLink] = useState<any>(null);
  const [currentShareLink, setCurrentShareLink] = useState<SharedLink | null>(null);

  // Local state for title input to prevent auto-save interference during typing
  const [localName, setLocalName] = useState<string>("");
  const localNameInitialized = useRef(false);

  // Collaboration state
  const [showHistory, setShowHistory] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflict, setConflict] = useState<DocumentConflict | null>(null);

  // For unauthenticated shared edit users, generate a temporary ID
  const [anonymousUserId] = useState(() => `anonymous-${uuidv4()}`);
  const effectiveUserId = user?.id || (isSharedEdit ? anonymousUserId : "");
  const effectiveUserEmail = user?.email || (isSharedEdit ? `${anonymousUserId}@shared` : "");
  const effectiveUserName = user?.user_metadata?.name || (isSharedEdit ? "Anonymous User" : "");

  // useEffect for isSharedEdit removed - now set inside fetchPatchSheetData to avoid re-render loop

  // Enable collaboration for existing documents (including edit-mode shared links)
  // For shared links, id will be undefined, so we check patchSheet?.id instead
  // For edit-mode shared links, allow collaboration even without authentication
  const collaborationEnabled =
    (id ? id !== "new" : true) && // Allow if no id param (shared link) or if id !== "new"
    (!isSharedEdit || currentShareLink?.link_type === "edit") &&
    !!patchSheet?.id &&
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
      hasPatchSheetId: !!patchSheet?.id,
      hasUser: !!user,
      userId: user?.id,
      patchSheetId: patchSheet?.id,
    };
    console.log("[PatchSheetEditor] Collaboration status:");
    console.log(JSON.stringify(status, null, 2));
  }, [collaborationEnabled, id, isSharedEdit, currentShareLink, patchSheet?.id, user]);

  // Auto-save hook
  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
    markAsRemoteUpdate,
  } = useAutoSave({
    documentId: patchSheet?.id || "",
    documentType: "patch_sheets",
    userId: effectiveUserId,
    data: patchSheet,
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
    onSaveComplete: (success, error, changedFields) => {
      // CRITICAL: After successfully saving, broadcast the changes to other users
      // This is how real-time collaboration works - we don't rely on database UPDATE events
      if (success && patchSheet && changedFields) {
        console.log(
          "[PatchSheetEditor] Save successful, broadcasting changes to other users:",
          changedFields,
        );

        // Broadcast each changed field to all connected users
        changedFields.forEach((field) => {
          const value = patchSheet[field as keyof typeof patchSheet];
          console.log(`[PatchSheetEditor] Broadcasting ${field}:`, {
            valueType: Array.isArray(value) ? `Array[${value.length}]` : typeof value,
            firstItem: Array.isArray(value) ? value[0] : undefined,
          });
          broadcast({
            type: "field_update",
            field,
            value,
            userId: effectiveUserId,
          }).catch((err) =>
            console.error(`[PatchSheetEditor] Broadcast failed for ${field}:`, err),
          );
        });
      }
    },
  });

  // Collaboration hook
  const {
    activeUsers,
    broadcast,
    status: connectionStatus,
  } = useCollaboration({
    documentId: patchSheet?.id || "",
    documentType: "patch_sheets",
    userId: effectiveUserId,
    userEmail: effectiveUserEmail,
    userName: effectiveUserName,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      // GUARD: Don't process remote updates if collaboration is disabled
      // This prevents title reversion on NEW patch sheets where collaboration is off
      if (!collaborationEnabled) {
        console.log("[PatchSheetEditor] Ignoring remote update - collaboration disabled");
        return;
      }

      if (payload.type === "field_update" && payload.field) {
        console.log(`[PatchSheetEditor] Applying remote update for field: ${payload.field}`);

        // CRITICAL: Mark as remote update BEFORE state change
        // This prevents the autosave effect from treating it as a local change
        markAsRemoteUpdate();

        // Update local state with remote change
        setPatchSheet((prev: any) => {
          if (!prev) return prev;
          return { ...prev, [payload.field!]: payload.value };
        });

        // CRITICAL: Also update inputs/outputs state if those fields changed
        // The UI components use these separate state variables
        if (payload.field === "inputs" && Array.isArray(payload.value)) {
          console.log("[PatchSheetEditor] Updating inputs state from remote broadcast", {
            receivedLength: payload.value.length,
            firstItem: payload.value[0],
          });
          // Create a new array reference to ensure React detects the change
          setInputs([...payload.value]);
        } else if (payload.field === "outputs" && Array.isArray(payload.value)) {
          console.log("[PatchSheetEditor] Updating outputs state from remote broadcast", {
            receivedLength: payload.value.length,
            firstItem: payload.value[0],
          });
          // Create a new array reference to ensure React detects the change
          setOutputs([...payload.value]);
        } else if (payload.field === "name" && typeof payload.value === "string") {
          console.log(
            "[PatchSheetEditor] Updating localName from remote broadcast:",
            payload.value,
          );
          // Update local name to reflect remote change
          setLocalName(payload.value);
        }
      }
    },
  });

  // Presence hook
  const { setEditingField } = usePresence({
    channel: null, // Will be set up when collaboration channels are ready
    userId: effectiveUserId,
  });

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

  // Sync local name with patchSheet when it loads
  useEffect(() => {
    if (patchSheet?.name && !localNameInitialized.current) {
      console.log("[PatchSheetEditor] Initializing localName from patchSheet:", patchSheet.name);
      setLocalName(patchSheet.name);
      localNameInitialized.current = true;
    }
  }, [patchSheet?.name]);

  // Debounced sync from local name to patchSheet state
  useEffect(() => {
    if (!localNameInitialized.current) return;

    const timer = setTimeout(() => {
      if (localName !== patchSheet?.name) {
        console.log("[PatchSheetEditor] Syncing localName to patchSheet:", {
          localName,
          previousName: patchSheet?.name,
        });
        setPatchSheet((prev: any) => ({
          ...prev,
          name: localName,
        }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [localName, patchSheet?.name]);

  // Real-time database subscription for syncing changes across users
  useEffect(() => {
    if (!collaborationEnabled || !patchSheet?.id) {
      return;
    }

    console.log(
      "[PatchSheetEditor] Setting up real-time subscription for patch sheet:",
      patchSheet.id,
    );

    const channel = supabase
      .channel(`patch_sheet_db_${patchSheet.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "patch_sheets",
          filter: `id=eq.${patchSheet.id}`,
        },
        (payload) => {
          console.log("[PatchSheetEditor] Received database UPDATE event:", payload);
          // NOTE: We intentionally DO NOT update local state from database UPDATE events
          // because they include our own saves echoing back, which creates an infinite loop
          // when using the RPC function for shared edits (the RPC function may return data
          // in a slightly different format due to JSONB serialization).
          // Real-time collaboration updates happen via the broadcast channel in useCollaboration,
          // which properly filters out the current user's own changes and ensures data consistency.
          console.log(
            "[PatchSheetEditor] Ignoring database UPDATE to prevent infinite loop with RPC saves",
          );
        },
      )
      .subscribe();

    return () => {
      console.log("[PatchSheetEditor] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [collaborationEnabled, patchSheet?.id]);

  useEffect(() => {
    const fetchPatchSheetData = async () => {
      setLoading(true);

      // Allow unauthenticated access ONLY if there's a shareCode
      if (!user && !shareCode) {
        console.error("[PatchSheetEditor] User not authenticated and no shareCode");
        navigate("/login");
        return;
      }

      const currentPathIsSharedEdit = location.pathname.includes("/shared/edit/");

      console.log(
        `[PatchSheetEditor] Fetching. Path: ${location.pathname}, ID: ${id}, ShareCode: ${shareCode}, IsShared: ${currentPathIsSharedEdit}`,
      );

      if (currentPathIsSharedEdit && shareCode) {
        console.log(
          "[PatchSheetEditor] Attempting to fetch SHARED resource with shareCode:",
          shareCode,
        );
        try {
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);
          console.log(
            "[PatchSheetEditor] Fetched SHARED resource:",
            resource,
            "Link:",
            fetchedShareLink,
          );

          if (fetchedShareLink.link_type !== "edit") {
            console.log("[PatchSheetEditor] Link type is not 'edit', redirecting to view.");
            window.location.href = getShareUrl(shareCode, fetchedShareLink.resource_type, "view");
            return;
          }

          setPatchSheet(resource);
          setShareLink(fetchedShareLink);
          setCurrentShareLink(fetchedShareLink);
          setInputs(resource.inputs && Array.isArray(resource.inputs) ? resource.inputs : []);
          const updatedOutputs = (
            resource.outputs && Array.isArray(resource.outputs) ? resource.outputs : []
          ).map((output: any) => ({
            ...output,
            destinationGear: output.destinationGear || "",
          }));
          setOutputs(updatedOutputs);
          setIsSharedEdit(true);
          setLoading(false);
          console.log("[PatchSheetEditor] SHARED resource loaded successfully.");
          return;
        } catch (error: any) {
          console.error("[PatchSheetEditor] Error fetching SHARED patch sheet:", error.message);
          navigate("/");
          setLoading(false);
          return;
        }
      } else if (id === "new") {
        console.log(
          `[PatchSheetEditor] Proceeding with OWNED document logic. ID: ${id}, User:`,
          user,
        );
        setPatchSheet({
          name: "Untitled Patch Sheet",
          created_at: new Date().toISOString(),
          info: {
            /* ... default info object ... */
          },
          inputs: [],
          outputs: [],
        });
        setInputs([]);
        setOutputs([]);
        setIsSharedEdit(false);
        setLoading(false);
        console.log("[PatchSheetEditor] New OWNED document initialized.");
        return;
      } else {
        console.log(
          `[PatchSheetEditor] Proceeding with OWNED document logic. ID: ${id}, User:`,
          user,
        );

        if (!id) {
          console.error("[PatchSheetEditor] OWNED logic: No ID, and not 'new'. Invalid state.");
          navigate("/dashboard");
          setLoading(false);
          return;
        }

        try {
          console.log("[PatchSheetEditor] Fetching OWNED patch sheet with id:", id);
          const { data, error } = await supabase
            .from("patch_sheets")
            .select("*")
            .eq("id", id)
            .single();

          if (error) {
            console.error(
              "[PatchSheetEditor] Error fetching OWNED patch sheet from Supabase:",
              error,
            );
            throw error;
          }
          if (!data) {
            console.error(
              "[PatchSheetEditor] OWNED patch sheet not found or access denied for id:",
              id,
            );
            navigate("/dashboard");
            setLoading(false);
            return;
          }
          setPatchSheet(data);
          setInputs(data.inputs && Array.isArray(data.inputs) ? data.inputs : []);
          const updatedOutputs = (
            data.outputs && Array.isArray(data.outputs) ? data.outputs : []
          ).map((output: any) => ({
            ...output,
            destinationGear: output.destinationGear || "",
          }));
          setOutputs(updatedOutputs);
          setIsSharedEdit(false);
          setLoading(false);
          console.log("[PatchSheetEditor] OWNED patch sheet loaded successfully.");
        } catch (error) {
          console.error("[PatchSheetEditor] Catch block for OWNED patch sheet fetch error:", error);
          navigate("/dashboard");
          setIsSharedEdit(false);
          setLoading(false);
        }
      }
    };

    fetchPatchSheetData();
    // Note: `user` is intentionally excluded from deps to prevent re-fetch on auth state updates
    // This matches the pattern in ProductionScheduleEditor.tsx and prevents infinite re-render loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, shareCode, navigate, location.pathname]);

  // Manual save handler (for new documents only - existing documents use auto-save)
  const handleSave = async () => {
    const updatedInputs = inputs.map((input) => ({
      ...input,
      connectionDetails: input.connection ? input.connectionDetails || {} : undefined,
    }));

    const updatedOutputs = outputs.map((output) => ({
      ...output,
      sourceDetails: output.sourceType ? output.sourceDetails || {} : undefined,
    }));

    try {
      const patchSheetData = {
        ...patchSheet,
        inputs: updatedInputs,
        outputs: updatedOutputs,
        last_edited: new Date().toISOString(),
      };

      if (isSharedEdit && shareCode) {
        const result = await updateSharedResource(shareCode, "patch_sheet", patchSheetData);
        if (result) {
          setPatchSheet(patchSheetData);
          setInputs(updatedInputs);
          setOutputs(updatedOutputs);
        }
      } else if (user) {
        if (id === "new") {
          const { data, error } = await supabase
            .from("patch_sheets")
            .insert([{ ...patchSheetData, user_id: user.id }])
            .select();
          if (error) throw error;
          if (data && data[0]) {
            navigate(`/patch-sheet/${data[0].id}`, { state: { from: location.state?.from } });
          }
        } else {
          // For existing documents, use forceSave from auto-save hook
          await forceSave();
        }
      } else {
        console.warn(
          "[PatchSheetEditor] Save attempt failed: Not a shared edit and user is not logged in.",
        );
      }
    } catch (error) {
      console.error("Error saving patch sheet:", error);
    }
  };

  const updateInputs = (newInputs: InputChannel[]) => {
    setInputs(newInputs);
    // Update patchSheet to trigger auto-save
    if (patchSheet) {
      setPatchSheet({ ...patchSheet, inputs: newInputs });
    }
  };

  const updateOutputs = (newOutputs: OutputChannel[]) => {
    setOutputs(newOutputs);
    // Update patchSheet to trigger auto-save
    if (patchSheet) {
      setPatchSheet({ ...patchSheet, outputs: newOutputs });
    }
  };

  const handleBackNavigation = () => {
    const fromPath = location.state?.from as string | undefined;

    if (isSharedEdit && shareCode) {
      // For shared edits, navigate to the view page of the shared resource
      window.location.href = getShareUrl(
        shareCode,
        patchSheet?.resource_type || "patch_sheet",
        "view",
      );
    } else if (fromPath) {
      navigate(fromPath);
    } else {
      // Fallback if 'from' state is somehow missing for non-shared documents
      if (id === "new") {
        navigate("/audio"); // Default for new if no 'from'
      } else {
        navigate("/all-patch-sheets"); // Default for existing if no 'from'
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* {showMobileWarning && ( // Removed
        <MobileScreenWarning
          title="Optimized for Larger Screens"
          description="This editor works best on larger screens. You can continue, but some features may be harder to use on mobile."
          continueAnyway={true}
          editorType="patch"
        />
      )} */}

      <Header dashboard={!isSharedEdit} />

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
          <div className="flex items-center">
            <button
              onClick={handleBackNavigation}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <input
                type="text"
                value={localName || "Untitled Patch Sheet"}
                onChange={(e) => setLocalName(e.target.value)}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full max-w-[220px] sm:max-w-none"
                placeholder="Enter patch sheet name"
              />
              <p className="text-xs sm:text-sm text-gray-400">
                Last edited:{" "}
                {new Date(patchSheet?.last_edited || patchSheet?.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Manual Save button (only for new documents) */}
          {id === "new" && (
            <div className="fixed bottom-4 right-4 z-10 md:static md:z-auto sm:ml-auto">
              <button
                onClick={handleSave}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 shadow-lg md:shadow-none"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </button>
            </div>
          )}
        </div>

        {/* Error messages (for new documents or manual save errors) */}
        {!collaborationEnabled && autoSaveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{autoSaveError}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">Patch Sheet Editor</h2>
            <p className="text-gray-400 text-sm">Manage your input and output lists</p>
          </div>

          <div className="border-b border-gray-700">
            <nav className="flex overflow-x-auto">
              <button
                className={`px-3 md:px-6 py-3 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === "inputs"
                    ? "text-white border-b-2 border-indigo-500"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("inputs")}
              >
                Inputs
              </button>
              <button
                className={`px-3 md:px-6 py-3 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === "outputs"
                    ? "text-white border-b-2 border-indigo-500"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("outputs")}
              >
                Outputs
              </button>
            </nav>
          </div>

          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="md:min-w-0">
              {" "}
              {/* Changed: Removed min-w-[800px] */}
              {activeTab === "inputs" && (
                <PatchSheetInputs inputs={inputs} updateInputs={updateInputs} />
              )}
              {activeTab === "outputs" && (
                <PatchSheetOutputs outputs={outputs} updateOutputs={updateOutputs} />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Save button (only for new documents) */}
        {id === "new" && (
          <div className="flex justify-center py-8">
            <button
              onClick={handleSave}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 shadow-lg text-base"
            >
              <Save className="h-5 w-5 mr-2" />
              Save Patch Sheet
            </button>
          </div>
        )}
      </main>

      {/* Collaboration Modals */}
      {collaborationEnabled && (
        <>
          <DocumentHistory
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            documentId={patchSheet?.id || ""}
            documentType="patch_sheets"
          />

          <ConflictResolution
            isOpen={showConflict}
            onClose={() => setShowConflict(false)}
            conflict={conflict}
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

export default PatchSheetEditor;

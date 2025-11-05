import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PixelMapControls from "../components/pixel-map/PixelMapControls";
import StandardPixelMapPreview from "../components/pixel-map/StandardPixelMapPreview";
import { ArrowLeft, Save, Download, Loader, AlertCircle } from "lucide-react";
import { useAuth } from "../lib/AuthContext";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCollaboration } from "@/hooks/useCollaboration";
import { usePresence } from "@/hooks/usePresence";
import { CollaborationToolbar } from "@/components/CollaborationToolbar";
import { DocumentHistory } from "@/components/History/DocumentHistory";
import { ConflictResolution } from "@/components/ConflictResolution";
import type { DocumentConflict } from "@/types/collaboration";
import { v4 as uuidv4 } from "uuid";
import {
  getSharedResource,
  updateSharedResource,
  getShareUrl,
  SharedLink,
} from "../lib/shareUtils";

export interface PixelMapData {
  project_name: string;
  screen_name: string;
  aspect_ratio_preset: string;
  aspect_ratio_w: number;
  aspect_ratio_h: number;
  resolution_preset: string;
  resolution_w: number;
  resolution_h: number;
}

interface PixelMapDocument extends PixelMapData {
  id?: string;
  user_id?: string;
  version?: number;
  last_edited?: string;
  metadata?: any;
}

const StandardPixelMapEditor = () => {
  const { id, shareCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflict, setConflict] = useState<DocumentConflict | null>(null);
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [currentShareLink, setCurrentShareLink] = useState<SharedLink | null>(null);
  const [document, setDocument] = useState<PixelMapDocument | null>(null);
  const [mapData, setMapData] = useState<PixelMapData>({
    project_name: "My Awesome Show",
    screen_name: "Center Screen",
    aspect_ratio_preset: "16:9",
    aspect_ratio_w: 16,
    aspect_ratio_h: 9,
    resolution_preset: "1920x1080",
    resolution_w: 1920,
    resolution_h: 1080,
  });
  const [showColorSwatches, setShowColorSwatches] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [gridColor, setGridColor] = useState("#FFFFFF");

  const backPath = location.state?.from || "/video";

  // For unauthenticated shared edit users, generate a temporary ID
  const [anonymousUserId] = useState(() => `anonymous-${uuidv4()}`);
  const effectiveUserId = user?.id || (isSharedEdit ? anonymousUserId : "");
  const effectiveUserEmail = user?.email || (isSharedEdit ? `${anonymousUserId}@shared` : "");
  const effectiveUserName = user?.user_metadata?.name || (isSharedEdit ? "Anonymous User" : "");

  // Local state for project name input to prevent reversion during typing
  const [localProjectName, setLocalProjectName] = useState("");
  const [localProjectNameInitialized, setLocalProjectNameInitialized] = useState(false);

  // Enable collaboration for existing documents (including edit-mode shared links)
  // For shared links, id will be undefined, so we check document?.id instead
  // For edit-mode shared links, allow collaboration even without authentication
  const collaborationEnabled =
    (id ? id !== "new" : true) && // Allow if no id param (shared link) or if id !== "new"
    (!isSharedEdit || currentShareLink?.link_type === "edit") &&
    !!document?.id &&
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
      hasDocumentId: !!document?.id,
      hasUser: !!user,
      userId: user?.id,
      documentId: document?.id,
    };
    console.log("[StandardPixelMapEditor] Collaboration status:");
    console.log(JSON.stringify(status, null, 2));
  }, [collaborationEnabled, id, isSharedEdit, currentShareLink, document?.id, user]);

  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
  } = useAutoSave({
    documentId: document?.id || "",
    documentType: "pixel_maps",
    userId: effectiveUserId,
    data: mapData,
    enabled: collaborationEnabled,
    debounceMs: 1500,
    onBeforeSave: async (data) => {
      if (!data.project_name || data.project_name.trim() === "") return false;
      return true;
    },
  });

  const {
    activeUsers,
    broadcast,
    status: connectionStatus,
  } = useCollaboration({
    documentId: document?.id || "",
    documentType: "pixel_maps",
    userId: effectiveUserId,
    userEmail: effectiveUserEmail,
    userName: effectiveUserName,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      // GUARD: Don't process remote updates if collaboration is disabled
      // This prevents input reversion on NEW documents where collaboration is off
      if (!collaborationEnabled) {
        console.log("[StandardPixelMapEditor] Ignoring remote update - collaboration disabled");
        return;
      }

      if (payload.type === "field_update" && payload.field) {
        if (payload.field === "project_name") {
          setMapData((prev: any) => (prev ? { ...prev, project_name: payload.value } : prev));
          // Update local project name state when remote changes arrive
          setLocalProjectName(payload.value);
        } else {
          setMapData((prev: any) => (prev ? { ...prev, [payload.field!]: payload.value } : prev));
        }
      }
    },
  });

  const { setEditingField } = usePresence({
    channel: null,
    userId: effectiveUserId,
  });

  // Initialize local project name from mapData.project_name when document loads
  useEffect(() => {
    if (mapData.project_name && !localProjectNameInitialized) {
      setLocalProjectName(mapData.project_name);
      setLocalProjectNameInitialized(true);
    }
  }, [mapData.project_name, localProjectNameInitialized]);

  // Debounced sync: Update mapData.project_name after user stops typing (500ms delay)
  useEffect(() => {
    if (!localProjectNameInitialized) return;

    const handler = setTimeout(() => {
      if (localProjectName !== mapData.project_name) {
        setMapData((prev: any) => ({ ...prev, project_name: localProjectName }));

        // Broadcast project name change to other collaborators
        if (collaborationEnabled && broadcast) {
          broadcast({
            type: "field_update",
            field: "project_name",
            value: localProjectName,
          });
        }
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [
    localProjectName,
    localProjectNameInitialized,
    mapData.project_name,
    setMapData,
    collaborationEnabled,
    broadcast,
  ]);

  // Real-time database subscription for syncing changes across users
  useEffect(() => {
    if (!collaborationEnabled || !document?.id) {
      return;
    }

    console.log(
      "[StandardPixelMapEditor] Setting up real-time subscription for pixel map:",
      document.id,
    );

    const channel = supabase
      .channel(`pixel_map_db_${document.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pixel_maps",
          filter: `id=eq.${document.id}`,
        },
        (payload) => {
          console.log("[StandardPixelMapEditor] Received database UPDATE event:", payload);
          // NOTE: We intentionally DO NOT update local state from database UPDATE events
          // because they include our own saves echoing back, which would overwrite user typing
          // Real-time collaboration updates happen via the broadcast channel in useCollaboration
          console.log(
            "[StandardPixelMapEditor] Ignoring database UPDATE to prevent input reversion",
          );
        },
      )
      .subscribe();

    return () => {
      console.log("[StandardPixelMapEditor] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [collaborationEnabled, document?.id]);

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
    const fetchUserAndData = async () => {
      setLoading(true);
      if (!user && !shareCode) {
        console.error("[StandardPixelMapEditor] User not authenticated");
        navigate("/login");
        return;
      }

      const currentPathIsSharedEdit = location.pathname.includes(
        "/shared/pixel-map/standard/edit/",
      );
      console.log(
        `[StandardPixelMapEditor] Path: ${location.pathname}, shareCode: ${shareCode}, currentPathIsSharedEdit: ${currentPathIsSharedEdit}`,
      );

      if (currentPathIsSharedEdit && shareCode) {
        console.log(
          "[StandardPixelMapEditor] Attempting to fetch SHARED resource with shareCode:",
          shareCode,
        );
        try {
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);

          console.log(
            "[StandardPixelMapEditor] DEBUG: Fetched Shared Link Details:",
            JSON.stringify(fetchedShareLink, null, 2),
          );
          console.log(
            "[StandardPixelMapEditor] DEBUG: Fetched Resource Details:",
            JSON.stringify(resource, null, 2),
          );

          if (fetchedShareLink.resource_type !== "pixel_map") {
            console.error(
              "[StandardPixelMapEditor] Share code is for a different resource type:",
              fetchedShareLink.resource_type,
              "Expected: pixel_map",
            );
            navigate("/video");
            setLoading(false);
            return;
          }

          if (fetchedShareLink.link_type !== "edit") {
            console.warn(
              `[StandardPixelMapEditor] Link type is '${fetchedShareLink.link_type}', not 'edit'. Redirecting to view page.`,
            );
            window.location.href = getShareUrl(shareCode, "pixel_map", "view");
            return;
          }

          const sharedPixelMapData: PixelMapDocument = {
            id: resource.id,
            user_id: resource.user_id,
            project_name: resource.project_name || "Untitled Project",
            screen_name: resource.screen_name || "Screen",
            aspect_ratio_w: resource.aspect_ratio_w || 16,
            aspect_ratio_h: resource.aspect_ratio_h || 9,
            aspect_ratio_preset: `${resource.aspect_ratio_w || 16}:${resource.aspect_ratio_h || 9}`,
            resolution_w: resource.resolution_w || 1920,
            resolution_h: resource.resolution_h || 1080,
            resolution_preset: `${resource.resolution_w || 1920}x${resource.resolution_h || 1080}`,
            version: resource.version,
            last_edited: resource.last_edited,
            metadata: resource.metadata,
          };
          setDocument(sharedPixelMapData);
          setMapData({
            project_name: sharedPixelMapData.project_name,
            screen_name: sharedPixelMapData.screen_name,
            aspect_ratio_w: sharedPixelMapData.aspect_ratio_w,
            aspect_ratio_h: sharedPixelMapData.aspect_ratio_h,
            aspect_ratio_preset: sharedPixelMapData.aspect_ratio_preset,
            resolution_w: sharedPixelMapData.resolution_w,
            resolution_h: sharedPixelMapData.resolution_h,
            resolution_preset: sharedPixelMapData.resolution_preset,
          });
          setCurrentShareLink(fetchedShareLink);
          setIsSharedEdit(true);
          console.log(
            "[StandardPixelMapEditor] SHARED pixel_map resource loaded successfully for editing.",
          );
          console.log(
            "[StandardPixelMapEditor] Set currentShareLink:",
            fetchedShareLink,
            "Set isSharedEdit: true",
          );
        } catch (error: any) {
          console.error(
            "[StandardPixelMapEditor] Error fetching SHARED pixel map:",
            error.message,
            error,
          );
          navigate("/video");
        } finally {
          setLoading(false);
        }
      } else if (id === "new") {
        if (!user) {
          navigate("/login");
          return;
        }
        // For new documents, document state remains null until first save
        setDocument(null);
        setIsSharedEdit(false);
        setLoading(false);
      } else if (id) {
        if (!user) {
          navigate("/login");
          return;
        }
        try {
          const { data, error } = await supabase
            .from("pixel_maps")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

          if (error) throw error;

          if (data) {
            const documentData: PixelMapDocument = {
              id: data.id,
              user_id: data.user_id,
              project_name: data.project_name,
              screen_name: data.screen_name,
              aspect_ratio_w: data.aspect_ratio_w,
              aspect_ratio_h: data.aspect_ratio_h,
              aspect_ratio_preset: `${data.aspect_ratio_w}:${data.aspect_ratio_h}`,
              resolution_w: data.resolution_w,
              resolution_h: data.resolution_h,
              resolution_preset: `${data.resolution_w}x${data.resolution_h}`,
              version: data.version,
              last_edited: data.last_edited,
              metadata: data.metadata,
            };
            setDocument(documentData);
            setMapData({
              project_name: data.project_name,
              screen_name: data.screen_name,
              aspect_ratio_preset: `${data.aspect_ratio_w}:${data.aspect_ratio_h}`,
              aspect_ratio_w: data.aspect_ratio_w,
              aspect_ratio_h: data.aspect_ratio_h,
              resolution_preset: `${data.resolution_w}x${data.resolution_h}`,
              resolution_w: data.resolution_w,
              resolution_h: data.resolution_h,
            });
          } else {
            navigate("/video");
          }
        } catch (error) {
          console.error("[StandardPixelMapEditor] Error fetching pixel map:", error);
          navigate("/video");
        } finally {
          setIsSharedEdit(false);
          setLoading(false);
        }
      } else {
        console.error(
          "[StandardPixelMapEditor] Invalid route state. No id, no shareCode, not 'new'.",
        );
        navigate("/video");
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [id, shareCode, navigate, location.pathname]);

  const handleSave = async () => {
    if (!user && !isSharedEdit) {
      setSaveError("You must be logged in to save.");
      return;
    }

    if (collaborationEnabled) {
      await forceSave();
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const baseDataToSave = {
      map_type: "standard",
      project_name: mapData.project_name,
      screen_name: mapData.screen_name,
      aspect_ratio_w: mapData.aspect_ratio_w,
      aspect_ratio_h: mapData.aspect_ratio_h,
      resolution_w: mapData.resolution_w,
      resolution_h: mapData.resolution_h,
      last_edited: new Date().toISOString(),
    };

    try {
      let savedData: any = null;

      if (isSharedEdit && shareCode) {
        console.log("[StandardPixelMapEditor] Saving SHARED pixel map with shareCode:", shareCode);
        savedData = await updateSharedResource(shareCode, "pixel_map", baseDataToSave);
        setSaveSuccess(true);
        console.log("[StandardPixelMapEditor] SHARED pixel map saved successfully:", savedData);
      } else if (id === "new") {
        if (!user) {
          setSaveError("You must be logged in to create a new pixel map.");
          return;
        }
        const dataToSave = {
          ...baseDataToSave,
          user_id: user.id,
        };
        const { data, error } = await supabase
          .from("pixel_maps")
          .insert(dataToSave)
          .select("id")
          .single();
        if (error) throw error;
        savedData = data;
        setSaveSuccess(true);
        navigate(`/pixel-map/standard/${data.id}`, { replace: true, state: { from: backPath } });
      } else {
        if (!user) {
          setSaveError("You must be logged in to save.");
          return;
        }
        const dataToSave = {
          ...baseDataToSave,
          user_id: user.id,
        };
        const { error } = await supabase.from("pixel_maps").update(dataToSave).eq("id", id);
        if (error) throw error;
        setSaveSuccess(true);
      }

      // Update document state with saved data
      if (savedData && !isSharedEdit) {
        setDocument((prev) => ({
          ...prev,
          ...savedData,
        }));
      } else if (savedData && isSharedEdit) {
        setDocument((prev) => ({
          ...prev,
          ...savedData,
        }));
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("[StandardPixelMapEditor] Error saving pixel map:", error);
      setSaveError(`Error saving: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setSaveError(null);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session) {
        throw new Error(sessionError?.message || "Authentication error: Not logged in.");
      }

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/svg-to-png`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          project_name: mapData.project_name,
          screen_name: mapData.screen_name,
          resolution_w: mapData.resolution_w,
          resolution_h: mapData.resolution_h,
          showColorSwatches: showColorSwatches,
          showGrid: showGrid,
          gridColor: gridColor,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let serverError = errorBody;
        try {
          const errorJson = JSON.parse(errorBody);
          serverError = errorJson.error || errorBody;
        } catch (e) {
          // Not a JSON response, use the raw text.
        }
        throw new Error(`Server returned status ${response.status}: ${serverError}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${mapData.project_name}_${mapData.screen_name}_${mapData.resolution_w}x${mapData.resolution_h}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      console.error("Failed to download image:", err);
      setSaveError(`Download failed. ${err.message}`);
    } finally {
      setDownloading(false);
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
      <Header dashboard={true} />
      {collaborationEnabled && (
        <CollaborationToolbar
          saveStatus={saveStatus}
          lastSavedAt={lastSavedAt ? new Date(lastSavedAt) : undefined}
          saveError={autoSaveError || undefined}
          onRetry={forceSave}
          activeUsers={activeUsers}
          currentUserId={effectiveUserId}
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
              onClick={() => navigate(backPath)}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-white">
                Standard Pixel Map Editor
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Create test patterns for projectors and LCDs
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 sm:ml-auto flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center bg-transparent border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-70"
            >
              {downloading ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </button>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        )}
        {saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start">
            <Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-400 text-sm">Pixel map saved successfully!</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">Pixel Map Configuration</h2>
            <p className="text-gray-400 text-sm">
              Configure your display settings and test patterns
            </p>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <PixelMapControls
                  mapData={{
                    ...mapData,
                    project_name: localProjectName || mapData.project_name,
                  }}
                  setMapData={(update) => {
                    if (typeof update === "function") {
                      const newData = update(mapData);
                      if (newData.project_name !== mapData.project_name) {
                        setLocalProjectName(newData.project_name);
                      } else {
                        setMapData(newData);
                      }
                    } else {
                      if (update.project_name !== mapData.project_name) {
                        setLocalProjectName(update.project_name);
                      } else {
                        setMapData(update);
                      }
                    }
                  }}
                  showColorSwatches={showColorSwatches}
                  setShowColorSwatches={setShowColorSwatches}
                  showGrid={showGrid}
                  setShowGrid={setShowGrid}
                  gridColor={gridColor}
                  setGridColor={setGridColor}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <StandardPixelMapPreview
                    {...mapData}
                    showColorSwatches={showColorSwatches}
                    showGrid={showGrid}
                    gridColor={gridColor}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {id === "new" && (
          <div className="flex justify-center py-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg text-base"
            >
              {saving ? (
                <>
                  <Loader className="h-5 w-5 mr-2 animate-spin" />
                  Saving Pixel Map...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Save Pixel Map
                </>
              )}
            </button>
          </div>
        )}
      </main>
      <Footer />
      {collaborationEnabled && (
        <>
          <DocumentHistory
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            documentId={document?.id || ""}
            documentType="pixel_maps"
          />
          <ConflictResolution
            isOpen={showConflict}
            onClose={() => setShowConflict(false)}
            conflict={conflict}
            onResolve={(resolution) => {
              setShowConflict(false);
              setConflict(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default StandardPixelMapEditor;

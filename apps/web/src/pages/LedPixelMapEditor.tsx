import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LedPixelMapControls from "../components/pixel-map/LedPixelMapControls";
import LedPixelMapPreview from "../components/pixel-map/LedPixelMapPreview";
import { ArrowLeft, Save, Download, Loader, AlertCircle } from "lucide-react";
import { gcd } from "../utils/math";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCollaboration } from "@/hooks/useCollaboration";
import { usePresence } from "@/hooks/usePresence";
import { CollaborationToolbar } from "@/components/CollaborationToolbar";
import { ConflictResolution } from "@/components/ConflictResolution";
import type { DocumentConflict } from "@/types/collaboration";
import { v4 as uuidv4 } from "uuid";
import {
  getSharedResource,
  updateSharedResource,
  getShareUrl,
  SharedLink,
} from "../lib/shareUtils";

export interface LedPixelMapData {
  projectName: string;
  screenName: string;
  mapWidth: number;
  mapHeight: number;
  halfHeightRow: boolean;
  panelWidth: number;
  panelHeight: number;
  panelType: string;
}

export interface PreviewOptions {
  displayMode: string;
  showScreenInfo: boolean;
  showStats: boolean;
  showFooter: boolean;
  showGuides: boolean;
}

const LedPixelMapEditor = () => {
  const { id, shareCode } = useParams(); // Get both id and shareCode
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showConflict, setShowConflict] = useState(false);
  const [conflict, setConflict] = useState<DocumentConflict | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [currentShareLink, setCurrentShareLink] = useState<SharedLink | null>(null);

  // For unauthenticated shared edit users, generate a temporary ID
  const [anonymousUserId] = useState(() => `anonymous-${uuidv4()}`);
  const effectiveUserId = user?.id || (isSharedEdit ? anonymousUserId : "");
  const effectiveUserEmail = user?.email || (isSharedEdit ? `${anonymousUserId}@shared` : "");
  const effectiveUserName = user?.user_metadata?.name || (isSharedEdit ? "Anonymous User" : "");

  const [mapData, setMapData] = useState<LedPixelMapData>({
    projectName: "My Awesome Show",
    screenName: "Main LED Wall",
    mapWidth: 16,
    mapHeight: 9,
    halfHeightRow: false,
    panelWidth: 120,
    panelHeight: 120,
    panelType: "custom",
  });

  const [previewOptions, setPreviewOptions] = useState<PreviewOptions>({
    displayMode: "grid",
    showScreenInfo: true,
    showStats: true,
    showFooter: true,
    showGuides: true,
  });

  const backPath = location.state?.from || "/video";

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
    console.log("[LedPixelMapEditor] Collaboration status:");
    console.log(JSON.stringify(status, null, 2));
  }, [collaborationEnabled, id, isSharedEdit, currentShareLink, documentId, user]);

  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
  } = useAutoSave({
    documentId: documentId || "",
    documentType: "pixel_maps",
    userId: effectiveUserId,
    data: mapData,
    enabled: collaborationEnabled,
    debounceMs: 1500,
    onBeforeSave: async (data) => {
      if (!data.projectName || data.projectName.trim() === "") return false;
      return true;
    },
  });

  const { activeUsers, status: connectionStatus } = useCollaboration({
    documentId: documentId || "",
    documentType: "pixel_maps",
    userId: effectiveUserId,
    userEmail: effectiveUserEmail,
    userName: effectiveUserName,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      if (payload.type === "field_update" && payload.field) {
        setMapData((prev) => (prev ? { ...prev, [payload.field!]: payload.value } : prev));
      }
    },
  });

  usePresence({ channel: null, userId: effectiveUserId });

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
    if (!collaborationEnabled || !documentId) {
      return;
    }

    console.log("[LedPixelMapEditor] Setting up real-time subscription for pixel map:", documentId);

    const channel = supabase
      .channel(`pixel_map_db_${documentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pixel_maps",
          filter: `id=eq.${documentId}`,
        },
        (payload) => {
          console.log("[LedPixelMapEditor] Received database UPDATE event:", payload);
          // Update local state with the new data
          // IMPORTANT: Exclude metadata fields to prevent triggering auto-save
          if (payload.new) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { last_edited, ...userEditableFields } = payload.new as Record<string, unknown>;
            setMapData((prev) => ({
              ...prev,
              ...userEditableFields,
            }));
          }
        },
      )
      .subscribe();

    return () => {
      console.log("[LedPixelMapEditor] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [collaborationEnabled, documentId]);

  useEffect(() => {
    const fetchUserAndPixelMap = async () => {
      setLoading(true);
      if (!user && !shareCode) {
        console.error("User not authenticated");
        navigate("/login");
        return;
      }

      const currentPathIsSharedEdit = location.pathname.includes("/shared/pixel-map/edit/");
      console.log(
        `[LedPixelMapEditor] Path: ${location.pathname}, shareCode: ${shareCode}, currentPathIsSharedEdit: ${currentPathIsSharedEdit}`,
      );

      if (currentPathIsSharedEdit && shareCode) {
        console.log(
          "[LedPixelMapEditor] Attempting to fetch SHARED resource with shareCode:",
          shareCode,
        );
        try {
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);

          console.log(
            "[LedPixelMapEditor] DEBUG: Fetched Shared Link Details:",
            JSON.stringify(fetchedShareLink, null, 2),
          );
          console.log(
            "[LedPixelMapEditor] DEBUG: Fetched Resource Details:",
            JSON.stringify(resource, null, 2),
          );

          if (fetchedShareLink.resource_type !== "pixel_map") {
            console.error(
              "[LedPixelMapEditor] Share code is for a different resource type:",
              fetchedShareLink.resource_type,
              "Expected: pixel_map",
            );
            navigate("/dashboard");
            setLoading(false);
            return;
          }

          if (fetchedShareLink.link_type !== "edit") {
            console.warn(
              `[LedPixelMapEditor] Link type is '${fetchedShareLink.link_type}', not 'edit'. Redirecting to view page.`,
            );
            window.location.href = getShareUrl(shareCode, "pixel_map", "view");
            return;
          }

          // Transform database format to component state format
          const settings = resource.settings || {};
          const sharedMapData: LedPixelMapData = {
            projectName: resource.project_name || "My Awesome Show",
            screenName: resource.screen_name || "Main LED Wall",
            mapWidth: settings.mapWidth || 16,
            mapHeight: settings.mapHeight || 9,
            halfHeightRow: settings.halfHeightRow || false,
            panelWidth: settings.panelWidth || 120,
            panelHeight: settings.panelHeight || 120,
            panelType: settings.panelType || "custom",
          };
          setMapData(sharedMapData);
          setPreviewOptions(settings.previewOptions || previewOptions);
          setDocumentId(resource.id);
          setCurrentShareLink(fetchedShareLink);
          setIsSharedEdit(true);
          console.log(
            "[LedPixelMapEditor] SHARED pixel_map resource loaded successfully for editing.",
          );
          console.log(
            "[LedPixelMapEditor] Set currentShareLink:",
            fetchedShareLink,
            "Set isSharedEdit: true",
          );
        } catch (error) {
          const err = error as Error;
          console.error("[LedPixelMapEditor] Error fetching SHARED pixel map:", err.message, err);
          navigate("/dashboard");
        } finally {
          setLoading(false);
        }
      } else if (id === "new") {
        if (!user) {
          navigate("/login");
          return;
        }
        // Keep default mapData for new documents
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
            // Transform database format to component state format
            const settings = data.settings || {};
            setMapData({
              projectName: data.project_name || "My Awesome Show",
              screenName: data.screen_name || "Main LED Wall",
              mapWidth: settings.mapWidth || 16,
              mapHeight: settings.mapHeight || 9,
              halfHeightRow: settings.halfHeightRow || false,
              panelWidth: settings.panelWidth || 120,
              panelHeight: settings.panelHeight || 120,
              panelType: settings.panelType || "custom",
            });
            setPreviewOptions(settings.previewOptions || previewOptions);
            setDocumentId(data.id);
          } else {
            navigate("/all-pixel-maps");
          }
        } catch (error) {
          console.error("Error fetching pixel map:", error);
          navigate("/all-pixel-maps");
        } finally {
          setIsSharedEdit(false);
          setLoading(false);
        }
      } else {
        console.error("[LedPixelMapEditor] Invalid route state. No id, no shareCode, not 'new'.");
        navigate("/dashboard");
        setLoading(false);
      }
    };

    fetchUserAndPixelMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, shareCode, navigate, location.pathname]);

  const screenWidth = mapData.mapWidth * mapData.panelWidth;
  const screenHeight = mapData.mapHeight * mapData.panelHeight;
  const divisor = screenWidth > 0 && screenHeight > 0 ? gcd(screenWidth, screenHeight) : 1;
  const aspectWidth = screenWidth / divisor;
  const aspectHeight = screenHeight / divisor;

  const isDataValid =
    mapData.mapWidth > 0 &&
    mapData.mapHeight > 0 &&
    mapData.panelWidth > 0 &&
    mapData.panelHeight > 0 &&
    mapData.projectName.trim() !== "" &&
    mapData.screenName.trim() !== "";

  const handleSave = async () => {
    if (!isDataValid) {
      setSaveError("Data is invalid.");
      return;
    }

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
      project_name: mapData.projectName,
      screen_name: mapData.screenName,
      aspect_ratio_w: aspectWidth,
      aspect_ratio_h: aspectHeight,
      resolution_w: screenWidth,
      resolution_h: screenHeight,
      last_edited: new Date().toISOString(),
      settings: {
        mapWidth: mapData.mapWidth,
        mapHeight: mapData.mapHeight,
        panelWidth: mapData.panelWidth,
        panelHeight: mapData.panelHeight,
        panelType: mapData.panelType,
        halfHeightRow: mapData.halfHeightRow,
        previewOptions: previewOptions,
      },
    };

    try {
      let savedData;
      if (isSharedEdit && shareCode) {
        console.log("[LedPixelMapEditor] Saving SHARED pixel map with shareCode:", shareCode);
        savedData = await updateSharedResource(shareCode, "pixel_map", baseDataToSave);
        if (savedData) {
          // Keep mapData state as is, since it's already in the correct format
          // Just update the document ID if needed
          if (!documentId && savedData.id) {
            setDocumentId(savedData.id);
          }
        }
      } else if (user) {
        const dataForOwnedSave = {
          ...baseDataToSave,
          user_id: user.id,
          map_type: "led" as const,
        };

        if (id === "new") {
          dataForOwnedSave.created_at = new Date().toISOString();
          const { data, error } = await supabase
            .from("pixel_maps")
            .insert(dataForOwnedSave)
            .select()
            .single();
          if (error) throw error;
          savedData = data;
          if (data) {
            setDocumentId(data.id);
            navigate(`/pixel-map/led/${data.id}`, { state: { from: location.state?.from } });
          }
        } else if (documentId) {
          const { data, error } = await supabase
            .from("pixel_maps")
            .update(dataForOwnedSave)
            .eq("id", documentId)
            .eq("user_id", user.id)
            .select()
            .single();
          if (error) throw error;
          savedData = data;
        }
      } else {
        throw new Error("Cannot save: No user session and not a shared edit.");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      const err = error as Error;
      console.error("Failed to save map:", err);
      setSaveError(`Failed to save map: ${err.message || "Please try again."}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!isDataValid) {
      setSaveError("Cannot download, map data is invalid.");
      return;
    }
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

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/led-map-to-png`;
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...mapData,
          ...previewOptions,
          aspectWidth,
          aspectHeight,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let serverError = errorBody;
        try {
          const errorJson = JSON.parse(errorBody);
          serverError = errorJson.error || errorBody;
        } catch {
          /* Not a JSON response, use raw text */
        }
        throw new Error(`Server returned status ${response.status}: ${serverError}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${mapData.projectName}_${mapData.screenName}_${screenWidth}x${screenHeight}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      const error = err as Error;
      console.error("Failed to download image:", error);
      setSaveError(`Download failed. ${error.message}`);
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
          currentUserId={user?.id}
          connectionStatus={connectionStatus}
          onOpenHistory={() => {}} // History not implemented yet for pixel_maps
          showHistory={false} // History not implemented yet for pixel_maps
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
              <h1 className="text-xl md:text-2xl font-bold text-white">LED Video Wall Editor</h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Design and configure complex LED displays
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 sm:ml-auto flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading || !isDataValid}
              className="inline-flex items-center bg-transparent border border-indigo-500 text-indigo-400 hover:bg-indigo-500/10 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-70"
            >
              {downloading ? (
                <Loader className="animate-spin h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download
            </button>
            {!collaborationEnabled && (
              <button
                onClick={handleSave}
                disabled={saving || !isDataValid}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save
              </button>
            )}
          </div>
        </div>

        {!collaborationEnabled && saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        )}
        {!collaborationEnabled && saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start">
            <Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-400 text-sm">Pixel map saved successfully!</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">LED Video Wall Configuration</h2>
            <p className="text-gray-400 text-sm">
              Configure your LED panel layout and display settings
            </p>
          </div>
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <LedPixelMapControls
                  mapData={mapData}
                  setMapData={setMapData}
                  previewOptions={previewOptions}
                  setPreviewOptions={setPreviewOptions}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="bg-gray-700/30 p-4 rounded-lg">
                  <LedPixelMapPreview
                    {...mapData}
                    {...previewOptions}
                    aspectWidth={aspectWidth}
                    aspectHeight={aspectHeight}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {!collaborationEnabled && (
          <div className="flex justify-center py-8">
            <button
              onClick={handleSave}
              disabled={saving || !isDataValid}
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
          {/* Note: DocumentHistory requires a history table (pixel_maps_history) which doesn't exist yet */}
          {/* Keeping the modal infrastructure for future implementation */}
          <ConflictResolution
            isOpen={showConflict}
            onClose={() => setShowConflict(false)}
            conflict={conflict}
            onResolve={() => {
              setShowConflict(false);
              setConflict(null);
            }}
          />
        </>
      )}
    </div>
  );
};

export default LedPixelMapEditor;

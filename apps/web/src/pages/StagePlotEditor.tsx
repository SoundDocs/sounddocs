import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/AuthContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import StageCanvas from "../components/stage-plot/StageCanvas";
import ElementToolbar from "../components/stage-plot/ElementToolbar";
import ElementProperties from "../components/stage-plot/ElementProperties";
// import MobileScreenWarning from "../components/MobileScreenWarning"; // Removed
// import { useScreenSize } from "../hooks/useScreenSize"; // Removed
import { StageElementProps } from "../components/stage-plot/StageElement";
import {
  ArrowLeft,
  Save,
  Trash2,
  AlertCircle,
  Eye,
  Image,
  Upload,
  XCircle,
  Sliders as Slider,
  Loader,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getSharedResource, updateSharedResource, getShareUrl } from "../lib/shareUtils";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCollaboration } from "@/hooks/useCollaboration";
import { usePresence } from "@/hooks/usePresence";
import { DocumentHistory } from "@/components/History/DocumentHistory";
import { ConflictResolution } from "@/components/ConflictResolution";
import type { DocumentConflict } from "@/types/collaboration";

const STAGE_DEPTHS = ["x-small", "small", "medium", "large", "x-large"] as const;
const STAGE_WIDTHS = ["narrow", "wide"] as const;

type StageDepth = (typeof STAGE_DEPTHS)[number];
type StageWidth = (typeof STAGE_WIDTHS)[number];
type StageSize = { depth: StageDepth; width: StageWidth };

const stageSizeToPx = (size: { depth: string; width: string }) => {
  const key = `${size.depth}-${size.width}`;
  switch (key) {
    case "x-small-narrow":
      return { width: 300, height: 300 };
    case "x-small-wide":
      return { width: 500, height: 300 };
    case "small-narrow":
      return { width: 400, height: 400 };
    case "small-wide":
      return { width: 600, height: 400 };
    case "medium-narrow":
      return { width: 500, height: 500 };
    case "medium-wide":
      return { width: 800, height: 500 };
    case "large-narrow":
      return { width: 600, height: 600 };
    case "large-wide":
      return { width: 1000, height: 600 };
    case "x-large-narrow":
      return { width: 700, height: 700 };
    case "x-large-wide":
      return { width: 1200, height: 700 };
    default:
      return { width: 800, height: 500 };
  }
};

function isValidStageDepth(maybeDepth: string): maybeDepth is StageDepth {
  return (STAGE_DEPTHS as readonly string[]).includes(maybeDepth);
}

function isValidStageWidth(maybeWidth: string): maybeWidth is StageWidth {
  return (STAGE_WIDTHS as readonly string[]).includes(maybeWidth);
}

function parseStageSize(stageSizeString: string): StageSize {
  const segments = stageSizeString.split("-");

  if (segments.length === 1 && isValidStageDepth(segments[0])) {
    return { depth: segments[0] as StageDepth, width: "wide" };
  }

  if (segments.length < 2) {
    console.warn(`Invalid stage size string format: ${stageSizeString}. Defaulting.`);
    return { depth: "medium", width: "wide" };
  }

  const depth = segments.slice(0, -1).join("-");
  const width = segments[segments.length - 1];

  if (!isValidStageDepth(depth)) {
    console.warn(`Invalid stage depth: ${depth} in ${stageSizeString}. Defaulting.`);
    return { depth: "medium", width: "wide" };
  }

  if (!isValidStageWidth(width)) {
    console.warn(`Invalid stage width: ${width} in ${stageSizeString}. Defaulting.`);
    return { depth: "medium", width: "wide" };
  }

  return { depth, width };
}

function stringifyStageSize(stageSize: StageSize): string {
  return `${stageSize.depth}-${stageSize.width}`;
}

const StagePlotEditor = () => {
  const { id, shareCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // const screenSize = useScreenSize(); // Removed
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stagePlot, setStagePlot] = useState<{ stage_size?: string; [k: string]: any } | null>(
    null,
  );
  const [stageSize, setStageSize] = useState<StageSize>(parseStageSize("medium-wide"));
  const [elements, setElements] = useState<StageElementProps[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false); // Default to false (editable)
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundOpacity, setBackgroundOpacity] = useState(50);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [shareLink, setShareLink] = useState<any>(null);

  // Collaboration state
  const [showHistory, setShowHistory] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflict, setConflict] = useState<DocumentConflict | null>(null);

  // For unauthenticated shared edit users, generate a temporary ID
  const [anonymousUserId] = useState(() => `anonymous-${uuidv4()}`);
  const effectiveUserId = user?.id || (isSharedEdit ? anonymousUserId : "");
  const effectiveUserEmail = user?.email || (isSharedEdit ? `${anonymousUserId}@shared` : "");
  const effectiveUserName = user?.user_metadata?.name || (isSharedEdit ? "Anonymous User" : "");

  const lastDimsRef = React.useRef(stageSizeToPx(stageSize));
  const canvasRef = useRef<HTMLDivElement>(null);
  const stagePlotRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const pathIsSharedEdit = location.pathname.includes("/shared/stage-plot/edit/");
    setIsSharedEdit(pathIsSharedEdit);
    // isViewMode is now primarily controlled by share link type during data fetching or other explicit settings.
    // Screen size no longer forces view mode.
  }, [location.pathname]);

  // Enable collaboration for existing documents (including edit-mode shared links)
  // For shared links, id will be undefined, so we check stagePlot?.id instead
  // For edit-mode shared links, allow collaboration even without authentication
  const collaborationEnabled =
    (id ? id !== "new" : true) && // Allow if no id param (shared link) or if id !== "new"
    (!isSharedEdit || shareLink?.link_type === "edit") &&
    !!stagePlot?.id &&
    (!!user || (isSharedEdit && shareLink?.link_type === "edit")); // Allow unauthenticated for edit-mode shared links

  // Debug: Log collaboration status
  useEffect(() => {
    const status = {
      collaborationEnabled,
      id,
      idCheck: id ? id !== "new" : true,
      isNew: id === "new",
      isSharedEdit,
      shareLinkType: shareLink?.link_type,
      shareEditCheck: !isSharedEdit || shareLink?.link_type === "edit",
      hasStagePlotId: !!stagePlot?.id,
      hasUser: !!user,
      userId: user?.id,
      stagePlotId: stagePlot?.id,
      effectiveUserId,
      effectiveUserEmail,
      effectiveUserName,
    };
    console.log("[StagePlotEditor] Collaboration status:");
    console.log(JSON.stringify(status, null, 2));
  }, [
    collaborationEnabled,
    id,
    isSharedEdit,
    shareLink,
    stagePlot?.id,
    user,
    effectiveUserId,
    effectiveUserEmail,
    effectiveUserName,
  ]);

  // Auto-save hook
  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
  } = useAutoSave({
    documentId: stagePlot?.id || "",
    documentType: "stage_plots",
    userId: effectiveUserId,
    data: {
      ...stagePlot,
      elements,
      stage_size: stringifyStageSize(stageSize),
      backgroundImage,
      backgroundOpacity,
    },
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
    documentId: stagePlot?.id || "",
    documentType: "stage_plots",
    userId: effectiveUserId,
    userEmail: effectiveUserEmail,
    userName: effectiveUserName,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      if (payload.type === "field_update" && payload.field) {
        // Handle different field updates
        if (payload.field === "name") {
          setStagePlot((prev: any) => ({ ...prev, name: payload.value }));
        } else if (payload.field === "elements") {
          setElements(payload.value);
        } else if (payload.field === "stage_size") {
          const newSize = parseStageSize(payload.value);
          setStageSize(newSize);
        } else if (payload.field === "backgroundImage") {
          setBackgroundImage(payload.value);
          setImageUrl(payload.value);
        } else if (payload.field === "backgroundOpacity") {
          setBackgroundOpacity(payload.value);
        } else {
          setStagePlot((prev: any) => ({
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
    if (!collaborationEnabled || !stagePlot?.id) {
      return;
    }

    console.log(
      "[StagePlotEditor] Setting up real-time subscription for stage plot:",
      stagePlot.id,
    );

    const channel = supabase
      .channel(`stage_plot_db_${stagePlot.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stage_plots",
          filter: `id=eq.${stagePlot.id}`,
        },
        (payload) => {
          console.log("[StagePlotEditor] Received database UPDATE event:", payload);
          // Update local state with the new data
          // IMPORTANT: Exclude metadata fields (version, last_edited, metadata) to prevent
          // triggering auto-save, which would create an infinite loop
          if (payload.new) {
            const { version, last_edited, metadata, ...userEditableFields } = payload.new as any;

            // Update stagePlot data
            setStagePlot((prev: any) => ({
              ...prev,
              ...userEditableFields,
              // Keep existing metadata to avoid triggering auto-save
              version: prev?.version,
              last_edited: prev?.last_edited,
              metadata: prev?.metadata,
            }));

            // Update individual state fields from the database payload
            if (userEditableFields.elements) {
              setElements(userEditableFields.elements);
            }
            if (userEditableFields.stage_size) {
              setStageSize(parseStageSize(userEditableFields.stage_size));
            }
            if (userEditableFields.backgroundImage !== undefined) {
              setBackgroundImage(userEditableFields.backgroundImage);
              setImageUrl(userEditableFields.backgroundImage);
            }
            if (userEditableFields.backgroundOpacity !== undefined) {
              setBackgroundOpacity(userEditableFields.backgroundOpacity);
            }
          }
        },
      )
      .subscribe();

    return () => {
      console.log("[StagePlotEditor] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [collaborationEnabled, stagePlot?.id]);

  // Keyboard shortcut for manual save (Cmd/Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (collaborationEnabled) {
          forceSave();
        } else if (!isViewMode) {
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [forceSave, collaborationEnabled, isViewMode]);

  useEffect(() => {
    const fetchStagePlotData = async () => {
      setLoading(true);
      const currentPathIsSharedEdit = location.pathname.includes("/shared/stage-plot/edit/");

      const processFetchedElements = (fetchedElements: any[] | undefined) => {
        if (fetchedElements && Array.isArray(fetchedElements)) {
          return fetchedElements.map((el: any) => ({
            ...el,
            icon: undefined,
            labelVisible: el.labelVisible === undefined ? true : el.labelVisible,
          }));
        }
        return [];
      };

      if (currentPathIsSharedEdit && shareCode) {
        try {
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);

          if (fetchedShareLink.resource_type !== "stage_plot") {
            navigate("/dashboard");
            setLoading(false);
            return;
          }

          if (fetchedShareLink.link_type !== "edit") {
            // This implies it's a 'view' link. The editor page should ideally not be reached
            // or should be forced into view mode. Current logic redirects.
            // For robustness, if it somehow lands here, set view mode.
            setIsViewMode(true);
            // Redirect to the proper view URL to maintain consistency
            window.location.href = getShareUrl(shareCode, "stage_plot", "view");
            return;
          }
          // If it's an edit link, ensure isViewMode is false
          setIsViewMode(false);

          setStagePlot(resource);
          setShareLink(fetchedShareLink);
          setStageSize(
            resource.stage_size && typeof resource.stage_size === "string"
              ? parseStageSize(resource.stage_size)
              : { depth: "medium", width: "wide" },
          );
          setElements(processFetchedElements(resource.elements));
          if (resource.backgroundImage) {
            setBackgroundImage(resource.backgroundImage);
            setImageUrl(resource.backgroundImage);
          }
          if (resource.backgroundOpacity !== undefined) {
            setBackgroundOpacity(resource.backgroundOpacity);
          }
          // setIsSharedEdit(true); // Already set in the other useEffect
          setLoading(false);
          return;
        } catch (error: any) {
          navigate("/dashboard");
          setLoading(false);
          return;
        }
      } else {
        // Not a shared edit link, so it's editable
        setIsViewMode(false);
        if (id === "new") {
          // Creating new stage plots is now allowed on all screen sizes
          setStagePlot({
            name: "Untitled Stage Plot",
            created_at: new Date().toISOString(),
            stage_size: "medium-wide",
            elements: [],
          });
          setStageSize(parseStageSize("medium-wide"));
          setElements([]);
          // setIsSharedEdit(false); // Already set in the other useEffect
          setLoading(false);
          return;
        }

        if (!id) {
          navigate("/dashboard");
          setLoading(false);
          return;
        }

        try {
          const { data, error } = await supabase
            .from("stage_plots")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          if (!data) {
            navigate("/dashboard");
            setLoading(false);
            return;
          }

          setStagePlot(data);
          setStageSize(
            data.stage_size && typeof data.stage_size === "string"
              ? parseStageSize(data.stage_size)
              : { depth: "medium", width: "wide" },
          );
          setElements(processFetchedElements(data.elements));
          if (data.backgroundImage) {
            setBackgroundImage(data.backgroundImage);
            setImageUrl(data.backgroundImage);
          }
          if (data.backgroundOpacity !== undefined) {
            setBackgroundOpacity(data.backgroundOpacity);
          }
          // setIsSharedEdit(false); // Already set
          setLoading(false);
        } catch (error) {
          navigate("/dashboard");
          setLoading(false);
        }
      }
    };

    fetchStagePlotData();
  }, [id, shareCode, location.pathname, navigate]);

  const getDefaultColorForType = (type: string): string => {
    if (type === "electric-guitar") return "#2563eb";
    if (type === "acoustic-guitar") return "#a16207";
    if (type === "bass-guitar") return "#1d4ed8";
    if (type === "keyboard") return "#0f766e";
    if (type === "drums") return "#9333ea";
    if (type === "percussion") return "#6d28d9";
    if (type === "violin") return "#c2410c";
    if (type === "cello") return "#9a3412";
    if (type === "trumpet") return "#b45309";
    if (type === "saxophone") return "#b91c1c";
    if (type === "generic-instrument") return "#2563eb";
    if (type === "custom-image") return "#6b7280";

    switch (type) {
      case "microphone":
        return "#4f46e5";
      case "power-strip":
        return "#dc2626";
      case "amplifier":
        return "#7e22ce";
      case "monitor-wedge":
        return "#16a34a";
      case "speaker":
        return "#0891b2";
      case "di-box":
        return "#eab308";
      case "iem":
        return "#ea580c";
      case "person":
        return "#be185d";
      default:
        return "#6b7280";
    }
  };

  const handleStageSizeChange = (newSize: StageSize) => {
    if (isViewMode) return;

    const oldDims = stageSizeToPx(stageSize);
    const newDims = stageSizeToPx(newSize);

    const scaleX = newDims.width / oldDims.width;
    const scaleY = newDims.height / oldDims.height;

    const scaledElements = elements.map((el) => {
      const newWidth = Math.max(20, Math.round((el.width ?? 0) * scaleX) || (el.width ?? 0));
      const newHeight = Math.max(20, Math.round((el.height ?? 0) * scaleY) || (el.height ?? 0));

      const newX = Math.min(
        Math.max(0, Math.round(el.x * scaleX)),
        newDims.width - (newWidth || 0),
      );
      const newY = Math.min(
        Math.max(0, Math.round(el.y * scaleY)),
        newDims.height - (newHeight || 0),
      );

      return {
        ...el,
        x: newX,
        y: newY,
        width: newWidth || el.width,
        height: newHeight || el.height,
      };
    });

    setElements(scaledElements);
    setStageSize(newSize);
    lastDimsRef.current = newDims;

    // Broadcast stage size change to other collaborators
    const newSizeString = stringifyStageSize(newSize);
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "stage_size",
        value: newSizeString,
      });
      // Also broadcast the scaled elements
      broadcast({
        type: "field_update",
        field: "elements",
        value: scaledElements,
      });
    }
  };

  const handleAddElement = (type: string, label: string) => {
    if (isViewMode) return;

    const stageCanvas = canvasRef.current?.querySelector('[class*="bg-grid-pattern"]');
    const canvasWidth = stageCanvas?.clientWidth || 600;
    const canvasHeight = stageCanvas?.clientHeight || 400;

    const newElement: StageElementProps = {
      id: uuidv4(),
      type,
      label,
      x: canvasWidth / 2 - 30,
      y: canvasHeight / 2 - 30,
      rotation: 0,
      color: getDefaultColorForType(type),
      customImageUrl: type === "custom-image" ? null : undefined,
      labelVisible: true,
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    setSelectedElementId(newElement.id);

    // Broadcast element addition to other collaborators
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "elements",
        value: updatedElements,
      });
    }
  };

  const handleSelectElement = (elementId: string | null) => {
    if (isViewMode) return;
    setSelectedElementId(elementId);
  };

  const handleElementDragStop = (elementId: string, x: number, y: number) => {
    if (isViewMode) return;
    const updatedElements = elements.map((el) => (el.id === elementId ? { ...el, x, y } : el));
    setElements(updatedElements);

    // Broadcast element position change to other collaborators
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "elements",
        value: updatedElements,
      });
    }
  };

  const handleElementRotate = (elementId: string, rotation: number) => {
    if (isViewMode) return;
    const updatedElements = elements.map((el) => (el.id === elementId ? { ...el, rotation } : el));
    setElements(updatedElements);

    // Broadcast element rotation to other collaborators
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "elements",
        value: updatedElements,
      });
    }
  };

  const handleElementLabelChange = (elementId: string, label: string) => {
    if (isViewMode) return;
    const updatedElements = elements.map((el) => (el.id === elementId ? { ...el, label } : el));
    setElements(updatedElements);

    // Broadcast element label change to other collaborators
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "elements",
        value: updatedElements,
      });
    }
  };

  const handleElementDelete = (elementId: string) => {
    if (isViewMode) return;
    const updatedElements = elements.filter((el) => el.id !== elementId);
    setElements(updatedElements);
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }

    // Broadcast element deletion to other collaborators
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "elements",
        value: updatedElements,
      });
    }
  };

  const handleElementDuplicate = (elementId: string) => {
    if (isViewMode) return;

    const elementToDuplicate = elements.find((el) => el.id === elementId);
    if (!elementToDuplicate) return;

    const newElement = {
      ...elementToDuplicate,
      id: uuidv4(),
      x: elementToDuplicate.x + 20,
      y: elementToDuplicate.y + 20,
    };

    const updatedElements = [...elements, newElement];
    setElements(updatedElements);
    setSelectedElementId(newElement.id);

    // Broadcast element duplication to other collaborators
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "elements",
        value: updatedElements,
      });
    }
  };

  const handleElementResize = (elementId: string, width: number, height: number) => {
    if (isViewMode) return;
    const updatedElements = elements.map((el) =>
      el.id === elementId ? { ...el, width, height } : el,
    );
    setElements(updatedElements);

    // Broadcast element resize to other collaborators
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "elements",
        value: updatedElements,
      });
    }
  };

  const handlePropertyChange = (elementId: string, property: string, value: any) => {
    if (isViewMode) return;
    const updatedElements = elements.map((el) =>
      el.id === elementId ? { ...el, [property]: value } : el,
    );
    setElements(updatedElements);

    // Broadcast element property change to other collaborators
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "elements",
        value: updatedElements,
      });
    }
  };

  const handleSave = async () => {
    if (isViewMode) return;

    // For existing documents with collaboration enabled, use forceSave
    if (collaborationEnabled) {
      await forceSave();
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const cleanedElements = elements.map(({ icon, ...rest }) => ({
        ...rest,
        labelVisible: rest.labelVisible === undefined ? true : rest.labelVisible,
      }));

      const stagePlotData = {
        ...stagePlot,
        elements: cleanedElements,
        stage_size: stringifyStageSize(stageSize),
        backgroundImage: backgroundImage,
        backgroundOpacity: backgroundOpacity,
        last_edited: new Date().toISOString(),
      };

      if (isSharedEdit && shareCode) {
        const result = await updateSharedResource(shareCode, "stage_plot", stagePlotData);
        if (result) {
          setStagePlot(stagePlotData);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        } else {
          setSaveError(
            "Failed to save shared stage plot. The share link might be invalid or permissions might have changed.",
          );
        }
      } else if (user) {
        if (id === "new") {
          const { data, error } = await supabase
            .from("stage_plots")
            .insert([{ ...stagePlotData, user_id: user.id }])
            .select()
            .single();

          if (error) throw error;
          if (data) {
            navigate(`/stage-plot/${data.id}`, { state: { from: location.state?.from } });
          } else {
            setSaveError("Error creating stage plot. Please try again.");
          }
        } else {
          const { error } = await supabase.from("stage_plots").update(stagePlotData).eq("id", id);
          if (error) throw error;
          setStagePlot(stagePlotData);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } else {
        setSaveError(
          "You must be logged in to save changes, or this shared link may not support editing.",
        );
      }
    } catch (error: any) {
      setSaveError(`Error saving stage plot: ${error.message}. Please try again.`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleClearAll = () => {
    if (isViewMode) return;
    if (window.confirm("Are you sure you want to clear all elements from the stage plot?")) {
      setElements([]);
      setSelectedElementId(null);
    }
  };

  const handleRemoveBackgroundImage = () => {
    if (isViewMode) return;
    setBackgroundImage(null);
    setImageUrl(null);

    // Broadcast background image removal to other collaborators
    if (collaborationEnabled && broadcast) {
      broadcast({
        type: "field_update",
        field: "backgroundImage",
        value: null,
      });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isViewMode) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      const newImageUrl = evt.target.result as string;
      setImageUrl(newImageUrl);
      setBackgroundImage(newImageUrl);
      setShowImageUpload(false);

      // Broadcast background image change to other collaborators
      if (collaborationEnabled && broadcast) {
        broadcast({
          type: "field_update",
          field: "backgroundImage",
          value: newImageUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(true);
  };

  const handleDragLeave = () => {
    setIsDraggingImage(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingImage(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (!evt.target?.result) return;
      const newImageUrl = evt.target.result as string;
      setImageUrl(newImageUrl);
      setBackgroundImage(newImageUrl);
      setShowImageUpload(false);

      // Broadcast background image change to other collaborators
      if (collaborationEnabled && broadcast) {
        broadcast({
          type: "field_update",
          field: "backgroundImage",
          value: newImageUrl,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const getSelectedElement = () => {
    if (!selectedElementId) return null;
    return elements.find((el) => el.id === selectedElementId) || null;
  };

  const handleBackNavigation = () => {
    const fromPath = location.state?.from as string | undefined;

    if (isSharedEdit && shareCode) {
      const resourceType = shareLink?.resource_type || "stage_plot";
      window.location.href = getShareUrl(shareCode, resourceType, "view");
    } else if (fromPath) {
      navigate(fromPath);
    } else {
      if (id === "new") {
        navigate("/audio");
      } else {
        navigate("/all-stage-plots");
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // Removed MobileScreenWarning related to id === "new" on mobile

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Removed MobileScreenWarning component and its conditional rendering */}

      <Header
        dashboard={!isSharedEdit}
        collaborationToolbar={
          collaborationEnabled
            ? {
                saveStatus,
                lastSavedAt: lastSavedAt ? new Date(lastSavedAt) : undefined,
                saveError: autoSaveError || undefined,
                onRetry: forceSave,
                activeUsers,
                currentUserId: effectiveUserId,
                connectionStatus,
                onOpenHistory: () => {
                  console.log("[StagePlotEditor] Opening history modal");
                  setShowHistory(true);
                },
                showHistory: true,
              }
            : undefined
        }
      />

      <main className="flex-grow container mx-auto px-4 py-4 md:py-8 mt-16 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6 gap-4">
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
                value={stagePlot?.name || "Untitled Stage Plot"}
                onChange={(e) => {
                  if (!isViewMode) {
                    const newName = e.target.value;
                    setStagePlot({ ...stagePlot, name: newName });

                    // Broadcast name change to other collaborators
                    if (collaborationEnabled && broadcast) {
                      broadcast({
                        type: "field_update",
                        field: "name",
                        value: newName,
                      });
                    }
                  }
                }}
                className={`text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full max-w-[220px] sm:max-w-none ${isViewMode ? "cursor-default" : ""}`}
                placeholder="Enter stage plot name"
                readOnly={isViewMode}
              />
              <p className="text-xs sm:text-sm text-gray-400">
                Last edited:{" "}
                {new Date(
                  stagePlot?.last_edited || stagePlot?.created_at || Date.now(),
                ).toLocaleString()}
              </p>
            </div>
          </div>

          {isViewMode && (
            <div className="sm:ml-auto flex items-center text-sm text-indigo-400 bg-indigo-900/30 px-3 py-1 rounded-full">
              <Eye className="h-4 w-4 mr-2" />
              View mode
            </div>
          )}

          {!isViewMode && (
            <div className="flex flex-wrap gap-3 sm:ml-auto">
              {/* Manual Save button (only for new documents or shared edits) */}
              {!collaborationEnabled && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
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

              <button
                onClick={() => setShowImageUpload(!showImageUpload)}
                className="inline-flex items-center bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                title="Add background image"
              >
                <Image className="h-4 w-4 mr-2" />
                {backgroundImage ? "Change Image" : "Add Image"}
              </button>

              <button
                onClick={handleClearAll}
                className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* Error messages (for new documents or manual save errors) */}
        {!collaborationEnabled && saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400">{saveError}</p>
          </div>
        )}

        {!collaborationEnabled && saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start">
            <Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-400">Stage plot saved successfully!</p>
          </div>
        )}

        {showImageUpload && !isViewMode && (
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Background Image</h3>
              <button
                className="text-gray-400 hover:text-white"
                onClick={() => setShowImageUpload(false)}
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div
              className={`image-upload-container mb-6 p-6 border-2 border-dashed border-gray-600 rounded-lg text-center ${isDraggingImage ? "border-indigo-500 bg-gray-750" : "hover:border-gray-500"}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                ref={fileInputRef}
              />

              <Upload className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <p className="text-gray-300 mb-2">Drag and drop an image here, or click to select</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
              >
                Select Image
              </button>
            </div>

            {imageUrl && (
              <>
                <div className="mb-6">
                  <div className="bg-gray-750 p-4 rounded-md">
                    <div className="aspect-video mb-4 overflow-hidden rounded-md relative bg-gray-700">
                      <img
                        src={imageUrl}
                        alt="Background Preview"
                        className="object-contain w-full h-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-gray-300 text-sm mb-2">
                    Image Opacity: {backgroundOpacity}%
                  </label>
                  <div className="flex items-center space-x-2">
                    <Slider className="h-4 w-4 text-gray-400" />
                    <input
                      type="range"
                      min="5"
                      max="100"
                      value={backgroundOpacity}
                      onChange={(e) => {
                        const newOpacity = parseInt(e.target.value);
                        setBackgroundOpacity(newOpacity);

                        // Broadcast background opacity change to other collaborators
                        if (collaborationEnabled && broadcast) {
                          broadcast({
                            type: "field_update",
                            field: "backgroundOpacity",
                            value: newOpacity,
                          });
                        }
                      }}
                      className="w-full accent-indigo-600"
                    />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button
                    onClick={handleRemoveBackgroundImage}
                    className="inline-flex items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </button>

                  <button
                    onClick={() => setShowImageUpload(false)}
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                  >
                    Apply
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {backgroundImage && !showImageUpload && !isViewMode && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex-grow">
                <label className="block text-gray-300 text-sm mb-2">
                  Background Opacity: {backgroundOpacity}%
                </label>
                <div className="flex items-center space-x-2">
                  <Slider className="h-4 w-4 text-gray-400" />
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={backgroundOpacity}
                    onChange={(e) => {
                      const newOpacity = parseInt(e.target.value);
                      setBackgroundOpacity(newOpacity);

                      // Broadcast background opacity change to other collaborators
                      if (collaborationEnabled && broadcast) {
                        broadcast({
                          type: "field_update",
                          field: "backgroundOpacity",
                          value: newOpacity,
                        });
                      }
                    }}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
              <div className="ml-4 flex space-x-2">
                <button
                  onClick={() => setShowImageUpload(true)}
                  className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded"
                  title="Change image"
                >
                  <Image className="h-5 w-5" />
                </button>
                <button
                  onClick={handleRemoveBackgroundImage}
                  className="p-2 text-gray-300 hover:text-red-400 hover:bg-gray-700 rounded"
                  title="Remove image"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 md:mb-8" ref={stagePlotRef}>
          <div className="bg-gray-850 rounded-lg overflow-hidden" ref={canvasRef}>
            <StageCanvas
              stageSize={stringifyStageSize(stageSize)}
              elements={elements}
              selectedElementId={selectedElementId}
              backgroundImage={backgroundImage}
              backgroundOpacity={backgroundOpacity}
              onSelectElement={handleSelectElement}
              onElementDragStop={handleElementDragStop}
              onElementRotate={handleElementRotate}
              onElementLabelChange={handleElementLabelChange}
              onElementDelete={handleElementDelete}
              onElementDuplicate={handleElementDuplicate}
              onElementResize={handleElementResize}
              isViewMode={isViewMode}
            />
          </div>
        </div>

        {!isViewMode && (
          <>
            <div className="bg-gray-800 p-4 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-white mb-4">Stage Size</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="md:col-span-2">
                  <h4 className="text-sm text-gray-400 mb-2">Width</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className={`px-3 py-2 rounded-md text-sm ${
                        stageSize.width === "narrow"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      onClick={() => {
                        handleStageSizeChange({ ...stageSize, width: "narrow" });
                      }}
                    >
                      Narrow
                    </button>
                    <button
                      className={`px-3 py-2 rounded-md text-sm ${
                        stageSize.width === "wide"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                      onClick={() => {
                        handleStageSizeChange({ ...stageSize, width: "wide" });
                      }}
                    >
                      Wide
                    </button>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <h4 className="text-sm text-gray-400 mb-2">Stage Depth</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {STAGE_DEPTHS.map((depth) => {
                      const currentDepth = stageSize.depth;
                      const isActive = currentDepth === depth;
                      return (
                        <button
                          key={depth}
                          className={`px-3 py-2 rounded-md text-sm ${
                            isActive
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          }`}
                          onClick={() => handleStageSizeChange({ ...stageSize, depth })}
                        >
                          {depth.charAt(0).toUpperCase() + depth.slice(1).replace("x-", "X-")}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ElementProperties
                  selectedElement={getSelectedElement()}
                  onPropertyChange={handlePropertyChange}
                />
              </div>
              <div>
                <ElementToolbar onAddElement={handleAddElement} />
              </div>
            </div>
          </>
        )}
      </main>

      {/* Collaboration Modals */}
      {collaborationEnabled && (
        <>
          <DocumentHistory
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            documentId={stagePlot?.id || ""}
            documentType="stage_plots"
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

export default StagePlotEditor;

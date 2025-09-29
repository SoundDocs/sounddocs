import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { User } from "@supabase/supabase-js";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ImportShowFlowModal from "../components/ImportShowFlowModal";
import {
  Loader,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Save,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  FileText,
  MonitorPlay,
  Palette,
  AlertTriangle,
  FileJson,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { verifyShareLink, SharedLink } from "../lib/shareUtils";

// Interfaces
export interface RunOfShowItem {
  id: string;
  type: "item" | "header";
  itemNumber: string;
  startTime: string;
  highlightColor?: string;

  headerTitle?: string;

  preset?: string;
  duration?: string;
  privateNotes?: string;
  productionNotes?: string;
  audio?: string;
  video?: string;
  lights?: string;
  [customKey: string]: string | number | boolean | undefined;
}

export interface CustomColumnDefinition {
  id: string;
  name: string;
  type: "text" | "number" | "time";
  highlightColor?: string;
}

interface RunOfShowData {
  id?: string;
  user_id?: string;
  name: string;
  items: RunOfShowItem[];
  custom_column_definitions: CustomColumnDefinition[];
  default_column_colors?: Record<string, string>; // Store colors for default columns
  created_at?: string;
  last_edited?: string;
  live_show_data?: Record<string, unknown> | null; // Added for consistency with shared data
}

// Time calculation utilities
const parseTimeToSeconds = (timeStr: string): number | null => {
  if (!timeStr || timeStr.trim() === "") return null;
  const parts = timeStr.split(":");
  if (parts.length === 3) {
    // HH:MM:SS format
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
      return hours * 3600 + minutes * 60 + seconds;
    }
  } else if (parts.length === 2) {
    // MM:SS format
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  }
  return null;
};

const parseDurationToSeconds = (durationStr: string): number | null => {
  if (!durationStr || durationStr.trim() === "") return null;
  const parts = durationStr.split(":");
  if (parts.length === 2) {
    // MM:SS format
    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    if (!isNaN(minutes) && !isNaN(seconds)) {
      return minutes * 60 + seconds;
    }
  } else if (parts.length === 1) {
    // Just seconds
    const seconds = parseInt(parts[0], 10);
    if (!isNaN(seconds)) {
      return seconds;
    }
  }
  return null;
};

const formatSecondsToTime = (totalSeconds: number): string => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  } else {
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
};

const PREDEFINED_HIGHLIGHT_COLORS: { name: string; value?: string; tailwindClass?: string }[] = [
  { name: "Default", value: undefined, tailwindClass: "bg-transparent" },
  { name: "Electric Blue", value: "#0066FF", tailwindClass: "bg-blue-600" },
  { name: "Forest Green", value: "#00AA44", tailwindClass: "bg-green-600" },
  { name: "Golden Yellow", value: "#FFB300", tailwindClass: "bg-yellow-600" },
  { name: "Crimson Red", value: "#E53E3E", tailwindClass: "bg-red-600" },
  { name: "Deep Purple", value: "#9F00FF", tailwindClass: "bg-violet-600" },
  { name: "Bright Orange", value: "#FF6600", tailwindClass: "bg-orange-600" },
  { name: "Hot Pink", value: "#FF1493", tailwindClass: "bg-pink-600" },
  { name: "Cool Gray", value: "#6B7280", tailwindClass: "bg-gray-600" },
  { name: "Cyan", value: "#00CCCC", tailwindClass: "bg-teal-600" },
  { name: "Royal Purple", value: "#6A00FF", tailwindClass: "bg-indigo-600" },
  { name: "Lime Green", value: "#AAFF00", tailwindClass: "bg-lime-600" },
];

const RunOfShowEditor: React.FC = () => {
  const { id, shareCode } = useParams<{ id?: string; shareCode?: string }>();
  console.log("[RoSEditor] Top Level Params:", { id, shareCode });
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [runOfShow, setRunOfShow] = useState<RunOfShowData | null>(null);
  const [user, setUser] = useState<User | null>(null); // Authenticated user
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [newColumnName, setNewColumnName] = useState<string>("");
  const [newColumnType, setNewColumnType] = useState<"text" | "number" | "time">("text");

  const [colorPickerModalTargetItemId, setColorPickerModalTargetItemId] = useState<string | null>(
    null,
  );
  const [colorPickerModalTargetColumnId, setColorPickerModalTargetColumnId] = useState<
    string | null
  >(null);
  const colorPickerModalRef = useRef<HTMLDivElement>(null);

  const [currentIsSharedEdit, setCurrentIsSharedEdit] = useState(false);
  const [sharedLinkData, setSharedLinkData] = useState<SharedLink | null>(null);

  // State for import modal
  const [showImportModal, setShowImportModal] = useState(false);

  // Effect 1: Determine and set currentIsSharedEdit
  useEffect(() => {
    const pathIsSharedEdit = location.pathname.includes("/shared/run-of-show/edit/");
    const derivedIsSharedEdit = pathIsSharedEdit && !!shareCode;
    console.log("[RoSEditor] Effect 1 - Setting currentIsSharedEdit:", {
      pathname: location.pathname,
      shareCodeParam: shareCode,
      pathIsSharedEdit,
      derivedIsSharedEdit,
    });
    setCurrentIsSharedEdit(derivedIsSharedEdit);
  }, [location.pathname, shareCode]);

  const fetchAndSetRunOfShow = useCallback(
    async (userIdToFetch?: string, resourceIdToFetch?: string) => {
      setLoading(true);
      setSaveError(null);
      console.log(
        "[RoSEditor] fetchAndSetRunOfShow called. currentIsSharedEdit (state):",
        currentIsSharedEdit,
        "Params:",
        { userIdToFetch, resourceIdToFetch },
      );

      try {
        let data: RunOfShowData | null = null;
        let error: unknown = null;

        if (currentIsSharedEdit && shareCode && resourceIdToFetch) {
          console.log(
            `[RoSEditor] Fetching shared RoS by resource_id: ${resourceIdToFetch} via shareCode: ${shareCode}`,
          );
          const response = await supabase
            .from("run_of_shows")
            .select("*")
            .eq("id", resourceIdToFetch)
            .single();
          data = response.data;
          error = response.error;
        } else if (id === "new") {
          console.log("[RoSEditor] Creating new RoS");
          setRunOfShow({
            name: "Untitled Run of Show",
            items: [],
            custom_column_definitions: [],
            default_column_colors: {},
            live_show_data: null,
          });
          setLoading(false);
          return;
        } else if (id && userIdToFetch) {
          console.log(`[RoSEditor] Fetching owned RoS by id: ${id} for user: ${userIdToFetch}`);
          const response = await supabase
            .from("run_of_shows")
            .select("*")
            .eq("id", id)
            .eq("user_id", userIdToFetch)
            .single();
          data = response.data;
          error = response.error;
        } else {
          console.warn(
            "[RoSEditor] fetchAndSetRunOfShow: Invalid parameters or state for fetching.",
          );
          throw new Error("Invalid parameters for fetching Run of Show.");
        }

        if (error) throw error;

        if (data) {
          const migratedItems = (data.items || []).map((item: RunOfShowItem) => ({
            ...item,
            type: item.type || "item",
            highlightColor: item.highlightColor || undefined,
          }));
          setRunOfShow({
            ...data,
            items: migratedItems,
            custom_column_definitions: (data.custom_column_definitions || []).map(
              (col: CustomColumnDefinition) => ({
                ...col,
                type: col.type || "text",
              }),
            ),
            default_column_colors: data.default_column_colors || {},
          });
        } else {
          setSaveError("Run of Show not found or access denied.");
          if (!currentIsSharedEdit) {
            console.log(
              "[RoSEditor] fetchAndSetRunOfShow: Data null, !currentIsSharedEdit -> navigating to dashboard.",
            );
            navigate("/dashboard");
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching run of show:", err);
        setSaveError(
          `Failed to load run of show data: ${err instanceof Error ? err.message : String(err)}`,
        );
        if (!currentIsSharedEdit) {
          console.log(
            "[RoSEditor] fetchAndSetRunOfShow: Caught error, !currentIsSharedEdit -> navigating to dashboard.",
          );
          navigate("/dashboard");
        }
      } finally {
        setLoading(false);
      }
    },
    [id, shareCode, currentIsSharedEdit, navigate],
  );

  // Effect 2: Initialize and fetch data, depends on currentIsSharedEdit being correctly set
  useEffect(() => {
    console.log(
      "[RoSEditor] Effect 2 - Init effect. currentIsSharedEdit:",
      currentIsSharedEdit,
      "id:",
      id,
      "shareCode:",
      shareCode,
    );

    const init = async () => {
      // setLoading(true); // Moved to fetchAndSetRunOfShow and start of this effect if needed
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        if (!currentIsSharedEdit) {
          console.error("User not authenticated for non-shared path:", authError);
          navigate("/login");
          return;
        }
        setUser(null);
      } else {
        setUser(authData.user);
      }

      if (currentIsSharedEdit && shareCode) {
        try {
          console.log(
            `[RoSEditor] Verifying shareCode for shared edit: ${shareCode}. currentIsSharedEdit is true.`,
          );
          const verifiedLink = await verifyShareLink(shareCode);
          if (verifiedLink.resource_type === "run_of_show" && verifiedLink.link_type === "edit") {
            setSharedLinkData(verifiedLink);
            await fetchAndSetRunOfShow(undefined, verifiedLink.resource_id);
          } else {
            throw new Error("Invalid share link type or resource for editing.");
          }
        } catch (err: unknown) {
          console.error("Error verifying share link for RoS edit:", err);
          setSaveError(
            `Error: ${err instanceof Error ? err.message : String(err)}. You may not have permission to edit this document or the link is invalid.`,
          );
          setLoading(false);
        }
      } else if (id) {
        console.log(
          `[RoSEditor] Path for owned/new document. id: ${id}. currentIsSharedEdit is false.`,
        );
        await fetchAndSetRunOfShow(authData.user?.id);
      } else if (!id && !shareCode) {
        // This case handles scenarios where neither id nor shareCode is present,
        // which might indicate an invalid route or parameters for this editor.
        // Example: Navigating to /run-of-show/ or /shared/run-of-show/edit/ without params.
        console.log("[RoSEditor] Invalid route state: no id, no shareCode.");
        setSaveError("Invalid route: Document ID or Share Code is missing.");
        setLoading(false);
      } else {
        // This is a fallback for any other unhandled combination.
        // For instance, if currentIsSharedEdit is false but shareCode is present (shouldn't happen with Effect 1)
        // Or if currentIsSharedEdit is true but shareCode is missing.
        console.log(
          "[RoSEditor] Unhandled route state or parameters missing. currentIsSharedEdit:",
          currentIsSharedEdit,
          "id:",
          id,
          "shareCode:",
          shareCode,
        );
        setSaveError(
          "Could not determine how to load the document due to inconsistent parameters.",
        );
        setLoading(false);
      }
    };

    // Determine if we have enough information to proceed with init
    const canInitialize = (currentIsSharedEdit && !!shareCode) || (!currentIsSharedEdit && !!id);

    if (canInitialize) {
      setLoading(true); // Set loading true before starting init
      init();
    } else {
      // If not enough info, and the path suggests it *should* be one of these types, set an error.
      // This handles cases like /run-of-show/ (no id) or /shared/run-of-show/edit/ (no shareCode).
      if (location.pathname.startsWith("/run-of-show/") && !id) {
        setSaveError("Document ID missing from URL.");
        setLoading(false);
      } else if (location.pathname.startsWith("/shared/run-of-show/edit/") && !shareCode) {
        setSaveError("Share code missing from URL for shared document.");
        setLoading(false);
      } else if (!location.pathname.startsWith("/run-of-show/new") && !id && !shareCode) {
        // Generic case if path doesn't match expected patterns and no params
        // For /run-of-show/new, id will be "new", so that's handled by canInitialize.
        setSaveError("Invalid page URL or parameters.");
        setLoading(false);
      }
      // If it's /run-of-show/new, `id` will be "new", so `canInitialize` will be true.
    }
  }, [id, shareCode, currentIsSharedEdit, navigate, fetchAndSetRunOfShow, location.pathname]);

  useEffect(() => {
    const handleClickOutsideModal = (event: MouseEvent) => {
      if (
        colorPickerModalRef.current &&
        !colorPickerModalRef.current.contains(event.target as Node)
      ) {
        setColorPickerModalTargetItemId(null);
        setColorPickerModalTargetColumnId(null);
      }
    };
    if (colorPickerModalTargetItemId || colorPickerModalTargetColumnId) {
      document.addEventListener("mousedown", handleClickOutsideModal);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideModal);
    };
  }, [colorPickerModalTargetItemId, colorPickerModalTargetColumnId]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (runOfShow) {
      setRunOfShow({ ...runOfShow, name: e.target.value });
    }
  };

  const handleAddItem = (type: "item" | "header" = "item") => {
    if (runOfShow) {
      const newItem: RunOfShowItem = {
        id: uuidv4(),
        type: type,
        itemNumber:
          type === "item"
            ? (runOfShow.items.filter((i) => i.type === "item").length + 1).toString()
            : "",
        startTime: "",
        highlightColor: undefined,
        headerTitle: type === "header" ? "New Section Header" : undefined,
        preset: type === "item" ? "" : undefined,
        duration: type === "item" ? "" : undefined,
        privateNotes: type === "item" ? "" : undefined,
        productionNotes: type === "item" ? "" : undefined,
        audio: type === "item" ? "" : undefined,
        video: type === "item" ? "" : undefined,
        lights: type === "item" ? "" : undefined,
      };
      if (type === "item") {
        runOfShow.custom_column_definitions.forEach((col) => {
          newItem[col.name] = "";
        });
      }
      setRunOfShow({ ...runOfShow, items: [...runOfShow.items, newItem] });
    }
  };

  const calculateNextCueTime = (currentItemId: string, updatedItems: RunOfShowItem[]) => {
    const currentIndex = updatedItems.findIndex((item) => item.id === currentItemId);
    if (currentIndex === -1) return updatedItems;

    const currentItem = updatedItems[currentIndex];
    if (currentItem.type !== "item") return updatedItems;

    const currentStartTime = parseTimeToSeconds(currentItem.startTime || "");
    const currentDuration = parseDurationToSeconds(currentItem.duration || "");

    // Only calculate if both start time and duration are valid
    if (currentStartTime !== null && currentDuration !== null) {
      const nextStartTimeSeconds = currentStartTime + currentDuration;
      const nextStartTime = formatSecondsToTime(nextStartTimeSeconds);

      // Find and update all immediately following items (both headers and regular items)
      for (let i = currentIndex + 1; i < updatedItems.length; i++) {
        const nextItem = updatedItems[i];

        if (nextItem.type === "header") {
          // Update section header start time
          updatedItems[i] = {
            ...updatedItems[i],
            startTime: nextStartTime,
          };
        } else if (nextItem.type === "item") {
          // Update next regular item start time and stop (only update the first regular item)
          updatedItems[i] = {
            ...updatedItems[i],
            startTime: nextStartTime,
          };
          break; // Stop after the first regular item
        }
      }
    }

    return updatedItems;
  };

  const handleItemChange = (
    itemId: string,
    field: keyof RunOfShowItem | string,
    value: string | number | boolean | undefined,
  ) => {
    if (runOfShow) {
      const updatedItems = runOfShow.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      );

      // Auto-calculate next cue time if startTime or duration changed
      let finalItems = updatedItems;
      if (field === "startTime" || field === "duration") {
        finalItems = calculateNextCueTime(itemId, updatedItems);
      }

      setRunOfShow({
        ...runOfShow,
        items: finalItems,
      });
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (runOfShow) {
      setRunOfShow({
        ...runOfShow,
        items: runOfShow.items.filter((item) => item.id !== itemId),
      });
    }
  };

  const handleMoveItem = (itemId: string, direction: "up" | "down") => {
    if (!runOfShow) return;

    const items = [...runOfShow.items];
    const currentIndex = items.findIndex((item) => item.id === itemId);

    if (currentIndex === -1) return;

    let targetIndex: number;
    if (direction === "up") {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) return;
    } else {
      targetIndex = currentIndex + 1;
      if (targetIndex >= items.length) return;
    }

    // Swap items
    [items[currentIndex], items[targetIndex]] = [items[targetIndex], items[currentIndex]];

    // Update item numbers for regular items
    let itemCount = 1;
    items.forEach((item) => {
      if (item.type === "item") {
        item.itemNumber = itemCount.toString();
        itemCount++;
      }
    });

    setRunOfShow({ ...runOfShow, items });
  };

  const handleAddCustomColumn = () => {
    if (runOfShow && newColumnName.trim() !== "") {
      const newColumn: CustomColumnDefinition = {
        id: uuidv4(),
        name: newColumnName.trim(),
        type: newColumnType,
      };
      const updatedDefinitions = [...runOfShow.custom_column_definitions, newColumn];
      const updatedItems: RunOfShowItem[] = runOfShow.items.map((item) =>
        item.type === "item" ? ({ ...item, [newColumn.name]: "" } as RunOfShowItem) : item,
      );

      setRunOfShow({
        ...runOfShow,
        custom_column_definitions: updatedDefinitions,
        items: updatedItems,
      });
      setNewColumnName("");
      setNewColumnType("text");
      setEditingColumnId(null);
    }
  };

  const handleRenameCustomColumn = (columnId: string, newName: string) => {
    if (runOfShow && newName.trim() !== "") {
      const oldColumn = runOfShow.custom_column_definitions.find((col) => col.id === columnId);
      if (!oldColumn) return;

      const oldName = oldColumn.name;
      const updatedDefinitions = runOfShow.custom_column_definitions.map((col) =>
        col.id === columnId ? { ...col, name: newName.trim(), type: newColumnType } : col,
      );
      const updatedItems: RunOfShowItem[] = runOfShow.items.map((item) => {
        if (item.type === "header") return item;
        if (oldName !== newName.trim() && Object.prototype.hasOwnProperty.call(item, oldName)) {
          const { [oldName]: value, ...rest } = item;
          return { ...rest, [newName.trim()]: value } as RunOfShowItem;
        }
        return item;
      });
      setRunOfShow({
        ...runOfShow,
        custom_column_definitions: updatedDefinitions,
        items: updatedItems,
      });
      setEditingColumnId(null);
      setNewColumnName("");
      setNewColumnType("text");
    }
  };

  const handleDeleteCustomColumn = (columnId: string) => {
    if (runOfShow) {
      const columnToDelete = runOfShow.custom_column_definitions.find((col) => col.id === columnId);
      if (!columnToDelete) return;

      const updatedDefinitions = runOfShow.custom_column_definitions.filter(
        (col) => col.id !== columnId,
      );
      const updatedItems: RunOfShowItem[] = runOfShow.items.map((item) => {
        if (item.type === "header") return item;
        const { [columnToDelete.name]: deletedValue, ...rest } = item;
        void deletedValue; // Mark as intentionally unused
        return rest as RunOfShowItem;
      });
      setRunOfShow({
        ...runOfShow,
        custom_column_definitions: updatedDefinitions,
        items: updatedItems,
      });
    }
  };

  const handleSave = async () => {
    if (!runOfShow) return;

    if (!user && currentIsSharedEdit) {
      setSaveError(
        "You must be logged in to save changes, even to a shared document. Please log in or sign up, then try claiming this share link again.",
      );
      setTimeout(() => setSaveError(null), 7000);
      return;
    }
    if (!user && !currentIsSharedEdit && id !== "new") {
      navigate("/login");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const liveShowDataToSave = runOfShow.live_show_data || null;

    const dataToSave: Partial<RunOfShowData> & { last_edited: string } = {
      name: runOfShow.name,
      items: runOfShow.items.map((item) => ({
        ...item,
        type: item.type || "item",
        highlightColor: item.highlightColor || undefined,
      })),
      custom_column_definitions: runOfShow.custom_column_definitions.map((col) => ({
        ...col,
        type: col.type || "text",
      })),
      default_column_colors: runOfShow.default_column_colors || {},
      last_edited: new Date().toISOString(),
      live_show_data: liveShowDataToSave,
    };

    try {
      let savedData;
      if (currentIsSharedEdit && runOfShow.id && sharedLinkData) {
        // Ensure sharedLinkData and runOfShow.id (resource_id) are present
        console.log(`[RoSEditor] Saving shared RoS ID: ${runOfShow.id}`);
        const { data, error } = await supabase
          .from("run_of_shows")
          .update(dataToSave)
          .eq("id", runOfShow.id)
          .select()
          .single();
        if (error) throw error;
        savedData = data;
      } else if (id === "new" && user) {
        console.log("[RoSEditor] Saving new RoS for user:", user.id);
        const { data, error } = await supabase
          .from("run_of_shows")
          .insert({ ...dataToSave, user_id: user.id, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        savedData = data;
        if (data) navigate(`/run-of-show/${data.id}`, { state: { from: location.state?.from } }); // Preserve 'from' state on new save
      } else if (runOfShow.id && user) {
        console.log(`[RoSEditor] Saving owned RoS ID: ${runOfShow.id} for user: ${user.id}`);
        const { data, error } = await supabase
          .from("run_of_shows")
          .update({ ...dataToSave, user_id: user.id })
          .eq("id", runOfShow.id)
          .eq("user_id", user.id)
          .select()
          .single();
        if (error) throw error;
        savedData = data;
      } else {
        throw new Error("Cannot save: Invalid state or missing user/ID/sharedLink information.");
      }

      if (savedData) {
        const migratedItems = (savedData.items || []).map((item: RunOfShowItem) => ({
          ...item,
          type: item.type || "item",
          highlightColor: item.highlightColor || undefined,
        }));
        setRunOfShow({
          ...(savedData as RunOfShowData), // Cast to ensure type compatibility
          items: migratedItems,
          custom_column_definitions: (savedData.custom_column_definitions || []).map(
            (col: CustomColumnDefinition) => ({ ...col, type: col.type || "text" }),
          ),
        });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: unknown) {
      console.error("Error saving run of show:", error);
      setSaveError(`Error saving: ${error instanceof Error ? error.message : "Please try again."}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleNavigateToShowMode = () => {
    const targetId = currentIsSharedEdit ? sharedLinkData?.resource_id : id;
    if (targetId && targetId !== "new") {
      navigate(`/show-mode/${targetId}`);
    } else {
      setSaveError("Please save the Run of Show before entering Show Mode.");
      setTimeout(() => setSaveError(null), 5000);
    }
  };

  const handleOpenColorPickerModal = (itemId: string) => {
    setColorPickerModalTargetItemId(itemId);
  };

  const handleSelectColor = (colorValue?: string) => {
    if (colorPickerModalTargetItemId) {
      handleItemChange(colorPickerModalTargetItemId, "highlightColor", colorValue);
    }
    if (colorPickerModalTargetColumnId) {
      handleColumnColorChange(colorPickerModalTargetColumnId, colorValue);
    }
    setColorPickerModalTargetItemId(null);
    setColorPickerModalTargetColumnId(null);
  };

  const handleOpenColumnColorPickerModal = (columnId: string) => {
    setColorPickerModalTargetColumnId(columnId);
  };

  const handleColumnColorChange = (columnId: string, colorValue?: string) => {
    if (runOfShow) {
      // Check if it's a custom column (has ID)
      const isCustomColumn = runOfShow.custom_column_definitions.some((col) => col.id === columnId);

      if (isCustomColumn) {
        // Handle custom column
        const updatedDefinitions = runOfShow.custom_column_definitions.map((col) =>
          col.id === columnId ? { ...col, highlightColor: colorValue } : col,
        );
        setRunOfShow({
          ...runOfShow,
          custom_column_definitions: updatedDefinitions,
        });
      } else {
        // Handle default column (columnId is the key)
        const updatedDefaultColors = { ...runOfShow.default_column_colors };
        if (colorValue) {
          updatedDefaultColors[columnId] = colorValue;
        } else {
          delete updatedDefaultColors[columnId];
        }
        setRunOfShow({
          ...runOfShow,
          default_column_colors: updatedDefaultColors,
        });
      }
    }
  };

  const handleBackNavigation = () => {
    const fromPath = location.state?.from as string | undefined;

    if (currentIsSharedEdit) {
      navigate("/shared-with-me");
    } else if (fromPath) {
      navigate(fromPath);
    } else {
      // Fallback if 'from' state is somehow missing
      if (id === "new") {
        navigate("/production"); // Default for new if no 'from'
      } else {
        navigate("/all-run-of-shows"); // Default for existing if no 'from'
      }
    }
  };

  const handleImportShowFlow = (
    name: string,
    items: RunOfShowItem[],
    customColumns: CustomColumnDefinition[],
  ) => {
    if (runOfShow) {
      // Add imported items to existing show
      setRunOfShow({
        ...runOfShow,
        name: name || runOfShow.name,
        items: items,
        custom_column_definitions: customColumns,
      });
      setShowImportModal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (saveError && !runOfShow) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header dashboard={true} />
        <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mb-4" />
          <h1 className="text-2xl font-bold text-red-400 mb-2">Error Loading Run of Show</h1>
          <p className="text-gray-300 mb-6">{saveError}</p>
          <button
            onClick={() => navigate(currentIsSharedEdit ? "/shared-with-me" : "/dashboard")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
          >
            {currentIsSharedEdit ? "Back to Shared With Me" : "Back to Dashboard"}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!runOfShow) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header dashboard={true} />
        <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-400 mb-4" />
          <h1 className="text-2xl font-bold text-yellow-400 mb-2">Run of Show Not Loaded</h1>
          <p className="text-gray-300 mb-6">
            The Run of Show data could not be loaded. This might be due to an invalid link or
            insufficient permissions. Please check the URL or try returning to your dashboard.
          </p>
          <button
            onClick={() => navigate(currentIsSharedEdit ? "/shared-with-me" : "/dashboard")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-md font-medium"
          >
            {currentIsSharedEdit ? "Back to Shared With Me" : "Back to Dashboard"}
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  const defaultColumns: {
    key: keyof RunOfShowItem | string;
    label: string;
    type?: string;
    id?: string;
    isCustom?: boolean;
    highlightColor?: string;
  }[] = [
    { key: "itemNumber", label: "Item #" },
    { key: "startTime", label: "Start", type: "time" },
    { key: "preset", label: "Preset / Scene" },
    { key: "duration", label: "Duration", type: "text" },
    { key: "privateNotes", label: "Private Notes" },
    { key: "productionNotes", label: "Production Notes" },
    { key: "audio", label: "Audio" },
    { key: "video", label: "Video" },
    { key: "lights", label: "Lights" },
  ];

  const allDisplayColumns = [
    ...defaultColumns.map((col) => ({
      ...col,
      highlightColor: runOfShow.default_column_colors?.[col.key] || col.highlightColor,
    })),
    ...runOfShow.custom_column_definitions.map((col) => ({
      key: col.name,
      label: col.name,
      id: col.id,
      isCustom: true,
      type: col.type || "text",
      highlightColor: col.highlightColor,
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />
      <main className="flex-grow container mx-auto px-2 sm:px-4 py-6 md:py-12 mt-16 md:mt-12">
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
                value={runOfShow.name}
                onChange={handleNameChange}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                placeholder="Enter Run of Show Name"
              />
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                {currentIsSharedEdit && sharedLinkData
                  ? `Editing shared document (Owner ID: ${sharedLinkData.user_id || "Unknown"})`
                  : runOfShow.last_edited
                    ? `Last edited: ${new Date(runOfShow.last_edited).toLocaleString()}`
                    : `Created: ${new Date(runOfShow.created_at || Date.now()).toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 sm:ml-auto flex-shrink-0">
            <button
              onClick={handleNavigateToShowMode}
              className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-4 py-2 rounded-md font-medium transition-all duration-200 shadow-lg md:shadow-none"
            >
              <MonitorPlay className="h-4 w-4 mr-2" />
              Show Mode
            </button>
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
        </div>

        {saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-3 mb-4 text-sm text-red-300">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-3 mb-4 text-sm text-green-300">
            Run of Show saved successfully!
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-white">Show Content</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                <FileJson className="h-4 w-4 mr-1.5" />
                Import
              </button>
              <button
                onClick={() => handleAddItem("header")}
                className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Add Header
              </button>
              <button
                onClick={() => handleAddItem("item")}
                className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Item
              </button>
            </div>
          </div>

          <div className="overflow-x-auto pb-4 max-h-[calc(100vh-300px)]">
            {/* Desktop Table */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-700 sticky top-0 z-20">
                <tr>
                  {allDisplayColumns.map((col, index) => (
                    <th
                      key={col.key || col.id}
                      scope="col"
                      className={`py-3 px-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap ${index === 0 ? "pl-4 md:pl-6" : ""} ${index === allDisplayColumns.length - 1 ? "pr-4 md:pr-6" : ""}`}
                      style={{
                        minWidth:
                          col.key === "itemNumber"
                            ? "200px"
                            : col.key === "privateNotes" || col.key === "productionNotes"
                              ? "250px"
                              : "150px",
                      }}
                    >
                      <div className="flex items-center">
                        {editingColumnId === col.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newColumnName}
                              onChange={(e) => setNewColumnName(e.target.value)}
                              className="bg-gray-900 text-white text-xs p-1 rounded border border-indigo-500 focus:ring-indigo-500 focus:border-indigo-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleRenameCustomColumn(col.id!, newColumnName);
                                if (e.key === "Escape") {
                                  setEditingColumnId(null);
                                  setNewColumnName("");
                                  setNewColumnType("text");
                                }
                              }}
                            />
                            <select
                              value={newColumnType}
                              onChange={(e) =>
                                setNewColumnType(e.target.value as "text" | "number" | "time")
                              }
                              className="bg-gray-900 text-white text-xs p-1 rounded border border-indigo-500 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                              <option value="text">Text</option>
                              <option value="number">Number</option>
                              <option value="time">Time</option>
                            </select>
                            <button
                              onClick={() => handleRenameCustomColumn(col.id!, newColumnName)}
                              className="text-green-400 hover:text-green-300 p-0.5"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setEditingColumnId(null);
                                setNewColumnName("");
                                setNewColumnType("text");
                              }}
                              className="text-red-400 hover:text-red-300 p-0.5"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            {col.label}
                            {/* Color picker for all columns */}
                            <button
                              onClick={() =>
                                handleOpenColumnColorPickerModal(col.id || String(col.key))
                              }
                              className="ml-1.5 text-gray-400 hover:text-purple-400 p-0.5"
                              title="Column Color"
                            >
                              <Palette size={12} />
                            </button>
                            {/* Edit/Delete buttons only for custom columns */}
                            {col.isCustom && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingColumnId(col.id!);
                                    setNewColumnName(col.label);
                                    setNewColumnType(
                                      (col.type as "text" | "number" | "time") || "text",
                                    );
                                  }}
                                  className="text-gray-400 hover:text-indigo-400 p-0.5"
                                  title="Edit Column"
                                >
                                  <Edit3 size={12} />
                                </button>
                                <button
                                  onClick={() => handleDeleteCustomColumn(col.id!)}
                                  className="text-gray-400 hover:text-red-400 p-0.5"
                                  title="Delete Column"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                  <th
                    scope="col"
                    className="py-3 px-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap pr-4 md:pr-6"
                  >
                    {editingColumnId === "new" ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={newColumnName}
                          onChange={(e) => setNewColumnName(e.target.value)}
                          placeholder="New Column Name"
                          className="bg-gray-900 text-white text-xs p-1 rounded border border-indigo-500 focus:ring-indigo-500 focus:border-indigo-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddCustomColumn();
                            if (e.key === "Escape") {
                              setEditingColumnId(null);
                              setNewColumnName("");
                              setNewColumnType("text");
                            }
                          }}
                        />
                        <select
                          value={newColumnType}
                          onChange={(e) =>
                            setNewColumnType(e.target.value as "text" | "number" | "time")
                          }
                          className="bg-gray-900 text-white text-xs p-1 rounded border border-indigo-500 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="text">Text</option>
                          <option value="number">Number</option>
                          <option value="time">Time</option>
                        </select>
                        <button
                          onClick={handleAddCustomColumn}
                          className="text-green-400 hover:text-green-300 p-0.5"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingColumnId(null);
                            setNewColumnName("");
                            setNewColumnType("text");
                          }}
                          className="text-red-400 hover:text-red-300 p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingColumnId("new");
                          setNewColumnName("");
                          setNewColumnType("text");
                        }}
                        className="flex items-center text-indigo-400 hover:text-indigo-300 text-xs font-medium"
                      >
                        <Plus size={14} className="mr-1" /> Add Column
                      </button>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="relative py-3 px-3 pr-4 md:pr-6"
                    style={{ minWidth: "100px" }}
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800">
                {runOfShow.items.map((item) => {
                  const rowStyle =
                    item.type === "item" && item.highlightColor
                      ? { backgroundColor: item.highlightColor }
                      : {};
                  if (item.type === "header") {
                    return (
                      <tr
                        key={item.id}
                        className="bg-gray-700 hover:bg-gray-600 transition-colors sticky top-[49px] z-10 border-t-0"
                      >
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-100 pl-4 md:pl-6">
                          <input
                            type="text"
                            value={item.headerTitle || ""}
                            onChange={(e) =>
                              handleItemChange(item.id, "headerTitle", e.target.value)
                            }
                            className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1 w-full placeholder-gray-400 text-lg font-bold"
                            placeholder="Section Header Title"
                          />
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-200">
                          <input
                            type="time"
                            step="1"
                            value={item.startTime}
                            onChange={(e) => handleItemChange(item.id, "startTime", e.target.value)}
                            className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1 w-full placeholder-gray-500 font-semibold"
                          />
                        </td>
                        {allDisplayColumns.slice(2).map((colConfig) => {
                          const columnColor = colConfig.highlightColor;
                          const cellStyle = columnColor ? { backgroundColor: columnColor } : {};

                          return (
                            <td
                              key={`header-empty-${colConfig.key || colConfig.id}`}
                              className="px-3 py-2 text-xs text-gray-500 italic"
                              style={cellStyle}
                            >
                              N/A
                            </td>
                          );
                        })}
                        <td className="px-3 py-2"></td>
                        <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium pr-4 md:pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleMoveItem(item.id, "up")}
                              disabled={runOfShow.items.findIndex((i) => i.id === item.id) === 0}
                              className="text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                              title="Move Up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleMoveItem(item.id, "down")}
                              disabled={
                                runOfShow.items.findIndex((i) => i.id === item.id) ===
                                runOfShow.items.length - 1
                              }
                              className="text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                              title="Move Down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Delete Header"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-700/50 transition-colors border-t border-gray-700"
                      style={rowStyle}
                    >
                      {allDisplayColumns.map((col, colIndex) => {
                        const columnColor = col.highlightColor;
                        // Don't apply column color if row has highlight color (row colors take priority)
                        const cellStyle =
                          columnColor && !item.highlightColor
                            ? { backgroundColor: columnColor }
                            : {};

                        return (
                          <td
                            key={col.key || col.id}
                            className={`px-3 py-2 whitespace-nowrap text-sm text-gray-200 ${colIndex === 0 ? "pl-4 md:pl-6" : ""}`}
                            style={cellStyle}
                          >
                            <input
                              type={col.type || "text"}
                              value={item[col.key as keyof RunOfShowItem] || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  col.key as keyof RunOfShowItem,
                                  e.target.value,
                                )
                              }
                              className={`bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1 w-full placeholder-gray-500 ${col.key === "itemNumber" ? "font-semibold" : ""}`}
                              placeholder={
                                col.key === "itemNumber"
                                  ? "Item Name/No."
                                  : col.key === "preset"
                                    ? "Preset/Scene"
                                    : col.key === "duration"
                                      ? "mm:ss"
                                      : col.label
                              }
                              step={
                                col.type === "time"
                                  ? "1"
                                  : col.type === "number"
                                    ? "any"
                                    : undefined
                              }
                            />
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-200"></td>
                      <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium pr-4 md:pr-6 relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleMoveItem(item.id, "up")}
                            disabled={runOfShow.items.findIndex((i) => i.id === item.id) === 0}
                            className="text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                            title="Move Up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleMoveItem(item.id, "down")}
                            disabled={
                              runOfShow.items.findIndex((i) => i.id === item.id) ===
                              runOfShow.items.length - 1
                            }
                            className="text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                            title="Move Down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenColorPickerModal(item.id)}
                            className="text-indigo-400 hover:text-indigo-300 p-1"
                            title="Highlight Row"
                          >
                            <Palette className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {runOfShow.items.length === 0 && (
                  <tr>
                    <td
                      colSpan={allDisplayColumns.length + 2}
                      className="text-center py-8 text-gray-400"
                    >
                      No content yet. Click "Add Item" or "Add Header" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {runOfShow.items.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-700/50 rounded-lg p-4 border border-gray-600"
                  style={
                    item.type === "item" && item.highlightColor
                      ? { backgroundColor: item.highlightColor, border: "none" }
                      : {}
                  }
                >
                  {item.type === "header" ? (
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={item.headerTitle || ""}
                        onChange={(e) => handleItemChange(item.id, "headerTitle", e.target.value)}
                        className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1 w-full placeholder-gray-400 text-lg font-bold"
                        placeholder="Section Header Title"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveItem(item.id, "up")}
                          disabled={runOfShow.items.findIndex((i) => i.id === item.id) === 0}
                          className="text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveItem(item.id, "down")}
                          disabled={
                            runOfShow.items.findIndex((i) => i.id === item.id) ===
                            runOfShow.items.length - 1
                          }
                          className="text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete Header"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <input
                          type="text"
                          value={item.itemNumber || ""}
                          onChange={(e) => handleItemChange(item.id, "itemNumber", e.target.value)}
                          className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded p-1 w-full font-bold text-white"
                          placeholder="Item Name/No."
                        />
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveItem(item.id, "up")}
                            disabled={runOfShow.items.findIndex((i) => i.id === item.id) === 0}
                            className="text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                            title="Move Up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleMoveItem(item.id, "down")}
                            disabled={
                              runOfShow.items.findIndex((i) => i.id === item.id) ===
                              runOfShow.items.length - 1
                            }
                            className="text-gray-400 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                            title="Move Down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenColorPickerModal(item.id)}
                            className="text-indigo-400 hover:text-indigo-300 p-1"
                            title="Highlight Row"
                          >
                            <Palette className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Delete Item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {allDisplayColumns.slice(1).map((col) => (
                          <div key={col.key || col.id}>
                            <label className="text-xs text-gray-400">{col.label}</label>
                            <input
                              type={col.type || "text"}
                              value={item[col.key as keyof RunOfShowItem] || ""}
                              onChange={(e) =>
                                handleItemChange(
                                  item.id,
                                  col.key as keyof RunOfShowItem,
                                  e.target.value,
                                )
                              }
                              className="bg-gray-600 text-white border border-gray-500 rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm w-full mt-1"
                              placeholder={col.label}
                              step={col.type === "time" ? "1" : undefined}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {runOfShow.items.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  No content yet. Click "Add Item" or "Add Header" to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Run of Show
              </>
            )}
          </button>
          <button
            onClick={handleNavigateToShowMode}
            className="inline-flex items-center bg-yellow-500 hover:bg-yellow-600 text-gray-900 px-6 py-3 rounded-md font-medium transition-all duration-200 shadow-lg"
          >
            <MonitorPlay className="h-5 w-5 mr-2" />
            Show Mode
          </button>
        </div>
      </main>
      <Footer />

      {/* Color Picker Modal */}
      {(colorPickerModalTargetItemId || colorPickerModalTargetColumnId) && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div
            ref={colorPickerModalRef}
            className="bg-gray-800 p-4 rounded-lg shadow-2xl w-full max-w-xs sm:max-w-sm transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">
                {colorPickerModalTargetColumnId ? "Column Color" : "Highlight Color"}
              </h3>
              <button
                onClick={() => {
                  setColorPickerModalTargetItemId(null);
                  setColorPickerModalTargetColumnId(null);
                }}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close color picker"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PREDEFINED_HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  title={color.name}
                  onClick={() => handleSelectColor(color.value)}
                  className="w-full h-12 sm:h-14 rounded-md transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-400"
                  style={{
                    backgroundColor: color.value || "#374151",
                    border: `2px solid ${color.value ? "transparent" : "#4B5563"}`,
                  }}
                >
                  {(() => {
                    let currentColor: string | undefined;

                    if (colorPickerModalTargetItemId) {
                      currentColor = runOfShow?.items.find(
                        (item) => item.id === colorPickerModalTargetItemId,
                      )?.highlightColor;
                    } else if (colorPickerModalTargetColumnId) {
                      // Check if it's a custom column first
                      const customColumn = runOfShow?.custom_column_definitions.find(
                        (col) => col.id === colorPickerModalTargetColumnId,
                      );
                      if (customColumn) {
                        currentColor = customColumn.highlightColor;
                      } else {
                        // It's a default column, check default_column_colors
                        currentColor =
                          runOfShow?.default_column_colors?.[colorPickerModalTargetColumnId];
                      }
                    }

                    return (
                      currentColor === color.value && (
                        <Check size={20} className="mx-auto text-white mix-blend-difference" />
                      )
                    );
                  })()}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleSelectColor(undefined)}
              className="mt-4 w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md font-medium transition-colors text-sm"
            >
              {colorPickerModalTargetColumnId ? "Clear Column Color" : "Clear Highlight"}
            </button>
          </div>
        </div>
      )}

      {/* Import Show Flow Modal */}
      <ImportShowFlowModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportShowFlow}
      />
    </div>
  );
};

export default RunOfShowEditor;

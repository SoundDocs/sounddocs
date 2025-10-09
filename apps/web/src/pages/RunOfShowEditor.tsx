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
  Copy,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { getSharedResource, SharedLink } from "../lib/shareUtils";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useCollaboration } from "@/hooks/useCollaboration";
import { usePresence } from "@/hooks/usePresence";
import { CollaborationToolbar } from "@/components/CollaborationToolbar";
import { DocumentHistory } from "@/components/History/DocumentHistory";
import { ConflictResolution } from "@/components/ConflictResolution";
import type { DocumentConflict } from "@/types/collaboration";

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
  const [currentShareLink, setCurrentShareLink] = useState<SharedLink | null>(null);

  // For unauthenticated shared edit users, generate a temporary ID
  const [anonymousUserId] = useState(() => `anonymous-${uuidv4()}`);
  const effectiveUserId = user?.id || (currentIsSharedEdit ? anonymousUserId : "");
  const effectiveUserEmail =
    user?.email || (currentIsSharedEdit ? `${anonymousUserId}@shared` : "");
  const effectiveUserName =
    user?.user_metadata?.name || (currentIsSharedEdit ? "Anonymous User" : "");
  const [showHistory, setShowHistory] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflict, setConflict] = useState<DocumentConflict | null>(null);

  // State for import modal
  const [showImportModal, setShowImportModal] = useState(false);

  // Enable collaboration for existing documents (including edit-mode shared links)
  // For shared links, id will be undefined, so we check runOfShow?.id instead
  // For edit-mode shared links, allow collaboration even without authentication
  const collaborationEnabled =
    (id ? id !== "new" : true) && // Allow if no id param (shared link) or if id !== "new"
    (!currentIsSharedEdit || currentShareLink?.link_type === "edit") &&
    !!runOfShow?.id &&
    (!!user || (currentIsSharedEdit && currentShareLink?.link_type === "edit")); // Allow unauthenticated for edit-mode shared links

  // Debug: Log collaboration status and history modal state
  useEffect(() => {
    const status = {
      collaborationEnabled,
      id,
      idCheck: id ? id !== "new" : true,
      isNew: id === "new",
      currentIsSharedEdit,
      currentShareLinkType: currentShareLink?.link_type,
      shareEditCheck: !currentIsSharedEdit || currentShareLink?.link_type === "edit",
      hasDocumentId: !!runOfShow?.id,
      hasUser: !!user,
      userId: user?.id,
      documentId: runOfShow?.id,
      showHistory,
    };
    console.log("[RunOfShowEditor] Collaboration status:");
    console.log(JSON.stringify(status, null, 2));
  }, [
    collaborationEnabled,
    id,
    currentIsSharedEdit,
    currentShareLink,
    runOfShow?.id,
    user,
    showHistory,
  ]);

  const {
    saveStatus,
    lastSavedAt,
    forceSave,
    error: autoSaveError,
  } = useAutoSave({
    documentId: runOfShow?.id || "",
    documentType: "run_of_shows",
    userId: effectiveUserId,
    data: runOfShow,
    enabled: collaborationEnabled,
    debounceMs: 1500,
    shareCode:
      currentIsSharedEdit && currentShareLink?.link_type === "edit" ? shareCode : undefined,
    onBeforeSave: async (data) => {
      if (!data.name || data.name.trim() === "") return false;
      return true;
    },
  });

  const { activeUsers, status: connectionStatus } = useCollaboration({
    documentId: runOfShow?.id || "",
    documentType: "run_of_shows",
    userId: effectiveUserId,
    userEmail: effectiveUserEmail,
    userName: effectiveUserName,
    enabled: collaborationEnabled,
    onRemoteUpdate: (payload) => {
      if (payload.type === "field_update" && payload.field) {
        setRunOfShow((prev) => (prev ? { ...prev, [payload.field!]: payload.value } : prev));
      }
    },
  });

  // Presence tracking (currently not used but will be needed for cursor/field tracking)
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
    if (!collaborationEnabled || !runOfShow?.id) {
      return;
    }

    console.log(
      "[RunOfShowEditor] Setting up real-time subscription for run_of_show:",
      runOfShow.id,
    );

    const channel = supabase
      .channel(`run_of_show_db_${runOfShow.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "run_of_shows",
          filter: `id=eq.${runOfShow.id}`,
        },
        (payload) => {
          console.log("[RunOfShowEditor] Received database UPDATE event:", payload);
          // Update local state with the new data
          // IMPORTANT: Exclude metadata fields (version, last_edited, metadata) to prevent
          // triggering auto-save, which would create an infinite loop
          if (payload.new) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { version, last_edited, metadata, ...userEditableFields } = payload.new as Record<
              string,
              unknown
            >;
            setRunOfShow((prev) => ({
              ...prev,
              ...userEditableFields,
              // Keep existing metadata to avoid triggering auto-save
              version: prev?.version,
              last_edited: prev?.last_edited,
              metadata: prev?.metadata,
            }));
          }
        },
      )
      .subscribe();

    return () => {
      console.log("[RunOfShowEditor] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [collaborationEnabled, runOfShow?.id]);

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

        if (currentIsSharedEdit && shareCode) {
          console.log(`[RoSEditor] Fetching shared RoS via shareCode: ${shareCode}`);
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);
          if (resource && fetchedShareLink) {
            // Validate resource type and link type
            if (fetchedShareLink.resource_type !== "run_of_show") {
              throw new Error("Invalid share link: not a Run of Show");
            }
            if (fetchedShareLink.link_type !== "edit") {
              throw new Error("This share link is view-only, not editable");
            }
            setCurrentShareLink(fetchedShareLink);
            data = {
              ...(resource as RunOfShowData),
              id: fetchedShareLink.resource_id, // Ensure id is set
            };
          } else {
            error = new Error("Shared resource not found");
          }
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
          console.log(`[RoSEditor] Loading shared edit via shareCode: ${shareCode}`);
          // fetchAndSetRunOfShow will call getSharedResource which validates and sets currentShareLink
          await fetchAndSetRunOfShow();
        } catch (err: unknown) {
          console.error("Error loading shared Run of Show:", err);
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
      // Initialize cumulative end time with the current item's end time
      let cumulativeEndTimeSeconds = currentStartTime + currentDuration;

      // Update all following items in cascade
      for (let i = currentIndex + 1; i < updatedItems.length; i++) {
        const nextItem = updatedItems[i];

        if (nextItem.type === "header") {
          // Update section header start time to match running time
          updatedItems[i] = {
            ...updatedItems[i],
            startTime: formatSecondsToTime(cumulativeEndTimeSeconds),
          };
          // Headers don't have duration, so cumulative time stays the same
        } else if (nextItem.type === "item") {
          // Update regular item start time to previous item's end time
          updatedItems[i] = {
            ...updatedItems[i],
            startTime: formatSecondsToTime(cumulativeEndTimeSeconds),
          };

          // Calculate this item's end time for the next iteration
          const itemDuration = parseDurationToSeconds(nextItem.duration || "");
          if (itemDuration !== null) {
            cumulativeEndTimeSeconds += itemDuration;
          }
          // Continue to next item (no break - this is the fix!)
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

  const handleDuplicateItem = (itemId: string) => {
    if (!runOfShow) return;

    const itemIndex = runOfShow.items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return;

    const originalItem = runOfShow.items[itemIndex];

    // Create a deep copy of the item with a new UUID
    const duplicatedItem: RunOfShowItem = {
      ...originalItem,
      id: uuidv4(),
    };

    // Handle item number for regular items
    if (originalItem.type === "item" && originalItem.itemNumber) {
      const itemNumber = originalItem.itemNumber;

      // Check if itemNumber is a pure number
      const parsedNumber = parseInt(itemNumber, 10);
      if (!isNaN(parsedNumber) && parsedNumber.toString() === itemNumber) {
        // Pure number: increment by 1
        duplicatedItem.itemNumber = (parsedNumber + 1).toString();
      } else {
        // Contains text: append "(copy)"
        duplicatedItem.itemNumber = `${itemNumber} (copy)`;
      }
    }

    // For headers, keep the same headerTitle but could optionally append "(copy)"
    // if (originalItem.type === "header" && originalItem.headerTitle) {
    //   duplicatedItem.headerTitle = `${originalItem.headerTitle} (copy)`;
    // }

    // Insert the duplicated item immediately after the original
    const newItems = [
      ...runOfShow.items.slice(0, itemIndex + 1),
      duplicatedItem,
      ...runOfShow.items.slice(itemIndex + 1),
    ];

    setRunOfShow({
      ...runOfShow,
      items: newItems,
    });
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

    // Step 1: Calculate gaps BEFORE reordering
    // This captures the gap each item has relative to its IMMEDIATE previous item
    const itemsWithGaps = items.map((item, index) => {
      let gap = 0;

      if (item.type === "item") {
        const itemStartTime = parseTimeToSeconds(item.startTime || "");

        if (itemStartTime === null) {
          // Without a valid start time we cannot compute a reliable gap
          return { ...item, calculatedGap: 0 };
        }

        // Walk backwards to find the previous item's end time, skipping headers
        let prevEndTime: number | null = null;
        for (let i = index - 1; i >= 0; i--) {
          const prev = items[i];
          if (prev.type !== "item") continue;

          const prevStart = parseTimeToSeconds(prev.startTime || "");
          const prevDuration = parseDurationToSeconds(prev.duration || "");

          if (prevStart !== null) {
            prevEndTime = prevStart + (prevDuration ?? 0);
            break;
          }

          // If no start, but we have duration, keep looking further back
          // However, don't add duration without a known anchor start.
          if (prevStart === null) continue;
        }

        if (prevEndTime !== null) {
          gap = itemStartTime - prevEndTime;
          if (gap < 0) gap = 0;
        } else {
          // No previous item with a valid start; treat as no gap to preserve
          gap = 0;
        }
      }

      return { ...item, calculatedGap: gap };
    });

    // Step 2: Swap items
    [itemsWithGaps[currentIndex], itemsWithGaps[targetIndex]] = [
      itemsWithGaps[targetIndex],
      itemsWithGaps[currentIndex],
    ];

    // Establish initial cumulative time from earliest anchored start (header or item)
    const firstAnchoredStart = (() => {
      for (const it of itemsWithGaps) {
        const t = parseTimeToSeconds(it.startTime || "");
        if (t !== null) return t;
      }
      return 0;
    })();

    // Step 3: Recalculate start times using stored gaps
    let cumulativeEndTimeSeconds = firstAnchoredStart;

    const recalculatedItems = itemsWithGaps.map((item) => {
      if (item.type === "header") {
        const existingStartTime = parseTimeToSeconds(item.startTime || "");
        let newHeaderStart: string;

        if (existingStartTime !== null) {
          // Advance pointer to header time if it's ahead, clamp if behind
          if (existingStartTime > cumulativeEndTimeSeconds) {
            cumulativeEndTimeSeconds = existingStartTime;
            newHeaderStart = item.startTime!;
          } else {
            newHeaderStart = formatSecondsToTime(cumulativeEndTimeSeconds);
          }
        } else {
          newHeaderStart = formatSecondsToTime(cumulativeEndTimeSeconds);
        }

        // Return header without calculatedGap property
        return {
          id: item.id,
          type: item.type,
          itemNumber: item.itemNumber,
          startTime: newHeaderStart,
          highlightColor: item.highlightColor,
          headerTitle: item.headerTitle,
        } as RunOfShowItem;
      }

      // Items - extract gap and other properties
      const itemWithGap = item as RunOfShowItem & { calculatedGap?: number };
      const gap = itemWithGap.calculatedGap || 0;
      const newStartTime = cumulativeEndTimeSeconds + gap;
      const durationSeconds = parseDurationToSeconds(item.duration || "");

      cumulativeEndTimeSeconds = newStartTime;
      if (durationSeconds !== null) {
        cumulativeEndTimeSeconds += durationSeconds;
      }

      // Return item without calculatedGap property
      return {
        id: item.id,
        type: item.type,
        itemNumber: item.itemNumber, // Preserve original itemNumber (user's custom name)
        startTime: formatSecondsToTime(newStartTime),
        highlightColor: item.highlightColor,
        preset: item.preset,
        duration: item.duration,
        privateNotes: item.privateNotes,
        productionNotes: item.productionNotes,
        audio: item.audio,
        video: item.video,
        lights: item.lights,
        // Include custom column values
        ...Object.keys(item)
          .filter(
            (key) =>
              ![
                "id",
                "type",
                "itemNumber",
                "startTime",
                "highlightColor",
                "preset",
                "duration",
                "privateNotes",
                "productionNotes",
                "audio",
                "video",
                "lights",
                "calculatedGap",
                "headerTitle",
              ].includes(key),
          )
          .reduce(
            (acc, key) => {
              acc[key] = item[key as keyof RunOfShowItem];
              return acc;
            },
            {} as Record<string, string | number | boolean | undefined>,
          ),
      } as RunOfShowItem;
    });

    setRunOfShow({ ...runOfShow, items: recalculatedItems });
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

    if (collaborationEnabled) {
      await forceSave();
      return;
    }

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
      if (currentIsSharedEdit && runOfShow.id && currentShareLink) {
        // Ensure currentShareLink and runOfShow.id (resource_id) are present
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
    const targetId = currentIsSharedEdit ? currentShareLink?.resource_id : id;
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
      // Check if there are existing items that would be replaced
      const hasExistingContent = runOfShow.items.length > 0;

      if (hasExistingContent) {
        const confirmMessage =
          "Are you sure you want to import this show flow?\n\n" +
          "This will replace all current items in your run of show. " +
          "This action cannot be undone.";

        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      // Replace the existing show content
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
      <Header
        dashboard={true}
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
                  console.log("[RunOfShowEditor] Opening history modal");
                  setShowHistory(true);
                },
                showHistory: true,
              }
            : undefined
        }
      />
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
                {currentIsSharedEdit && currentShareLink
                  ? `Editing shared document (Owner ID: ${currentShareLink.user_id || "Unknown"})`
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
            {id === "new" && (
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
            )}
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
                        className="bg-gray-700 hover:bg-gray-600 transition-colors sticky top-[40px] z-10"
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
                              onClick={() => handleDuplicateItem(item.id)}
                              className="text-blue-400 hover:text-blue-300 p-1"
                              title="Duplicate Header"
                            >
                              <Copy className="h-4 w-4" />
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
                            onClick={() => handleDuplicateItem(item.id)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Duplicate Item"
                          >
                            <Copy className="h-4 w-4" />
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
                          onClick={() => handleDuplicateItem(item.id)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Duplicate Header"
                        >
                          <Copy className="h-4 w-4" />
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
                            onClick={() => handleDuplicateItem(item.id)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Duplicate Item"
                          >
                            <Copy className="h-4 w-4" />
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

        {id === "new" && (
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
        )}
      </main>
      <Footer />
      {collaborationEnabled && (
        <>
          <DocumentHistory
            open={showHistory}
            onOpenChange={setShowHistory}
            versions={[]}
            onRestore={(versionId) => {
              console.log("[RunOfShowEditor] Restore version:", versionId);
              // TODO: Implement version restore
            }}
            loading={false}
          />
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

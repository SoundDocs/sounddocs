import * as React from "react";
import { History, Users, Wifi, WifiOff, Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { SaveStatus, PresenceUser, ConnectionStatus } from "@/types/collaboration";

export interface CollaborationToolbarProps {
  /** Current save status */
  saveStatus: SaveStatus;
  /** Timestamp when last saved */
  lastSavedAt?: Date;
  /** Error message for save failures */
  saveError?: string;
  /** Callback when user clicks retry button */
  onRetry?: () => void;
  /** List of active users */
  activeUsers: PresenceUser[];
  /** Current user ID (to exclude from active users list) */
  currentUserId?: string;
  /** Connection status */
  connectionStatus: ConnectionStatus;
  /** Connection latency in milliseconds */
  latency?: number;
  /** Callback when user clicks history button */
  onOpenHistory: () => void;
  /** Whether to show the history button */
  showHistory?: boolean;
  /** Layout variant */
  variant?: "horizontal" | "vertical";
  /** Position on screen */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  /** Additional CSS classes */
  className?: string;
}

type ExpandedSection = "connection" | "users" | "save" | null;

/**
 * Generates initials from a name or email
 */
const getInitials = (name: string | undefined, email: string): string => {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
};

/**
 * CollaborationToolbar Component
 *
 * Icon-based toolbar with expandable sections showing save status, active users,
 * connection status, and access to version history. Sections auto-expand on important events.
 *
 * @example
 * ```tsx
 * <CollaborationToolbar
 *   saveStatus={saveStatus}
 *   lastSavedAt={lastSaved}
 *   activeUsers={presenceUsers}
 *   currentUserId={user.id}
 *   connectionStatus="connected"
 *   onOpenHistory={() => setHistoryOpen(true)}
 * />
 * ```
 */
export const CollaborationToolbar: React.FC<CollaborationToolbarProps> = ({
  saveStatus,
  lastSavedAt,
  saveError,
  onRetry,
  activeUsers,
  currentUserId,
  connectionStatus,
  latency,
  onOpenHistory,
  showHistory = true,
  position = "top-right",
  className,
}) => {
  const [expandedSection, setExpandedSection] = React.useState<ExpandedSection>(null);
  const [autoExpandedSection, setAutoExpandedSection] = React.useState<ExpandedSection>(null);
  const [isPulsing, setIsPulsing] = React.useState(false);
  const autoCollapseTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Filter out current user
  const otherUsers = React.useMemo(() => {
    return activeUsers.filter((user) => user.userId !== currentUserId);
  }, [activeUsers, currentUserId]);

  // Auto-expand on important events
  React.useEffect(() => {
    // Save errors
    if (saveStatus === "error") {
      setAutoExpandedSection("save");
      setIsPulsing(true);
      clearAutoCollapseTimer();
      autoCollapseTimerRef.current = setTimeout(() => {
        setAutoExpandedSection(null);
        setIsPulsing(false);
      }, 5000);
    }
    // New user joins (check if count increased)
    // Note: This is a simplified check - could be enhanced with prev users comparison
  }, [saveStatus]);

  // Auto-expand on connection issues
  React.useEffect(() => {
    if (connectionStatus === "disconnected" || connectionStatus === "error") {
      setAutoExpandedSection("connection");
      setIsPulsing(true);
      clearAutoCollapseTimer();
      autoCollapseTimerRef.current = setTimeout(() => {
        setAutoExpandedSection(null);
        setIsPulsing(false);
      }, 4000);
    }
  }, [connectionStatus]);

  // Auto-expand when new user joins
  const prevUserCountRef = React.useRef(otherUsers.length);
  React.useEffect(() => {
    if (otherUsers.length > prevUserCountRef.current && otherUsers.length > 0) {
      setAutoExpandedSection("users");
      setIsPulsing(true);
      clearAutoCollapseTimer();
      autoCollapseTimerRef.current = setTimeout(() => {
        setAutoExpandedSection(null);
        setIsPulsing(false);
      }, 3000);
    }
    prevUserCountRef.current = otherUsers.length;
  }, [otherUsers.length]);

  const clearAutoCollapseTimer = () => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current);
      autoCollapseTimerRef.current = null;
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => clearAutoCollapseTimer();
  }, []);

  const getPositionClasses = (): string => {
    switch (position) {
      case "top-right":
        return "top-20 right-4 md:top-16";
      case "top-left":
        return "top-20 left-4 md:top-16";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
    }
  };

  const isExpanded = (section: ExpandedSection) => {
    return expandedSection === section || autoExpandedSection === section;
  };

  const toggleSection = (section: ExpandedSection) => {
    setExpandedSection((prev) => (prev === section ? null : section));
    clearAutoCollapseTimer();
    setAutoExpandedSection(null);
    setIsPulsing(false);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getConnectionStatusConfig = () => {
    switch (connectionStatus) {
      case "connected":
        return {
          icon: <Wifi className="h-4 w-4" />,
          color: "text-green-500",
          bgColor: "bg-green-500/10",
          label: "Online",
          description: latency ? `${latency}ms latency` : "Connection active",
        };
      case "connecting":
        return {
          icon: <Wifi className="h-4 w-4 animate-pulse" />,
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
          label: "Connecting",
          description: "Attempting to reconnect...",
        };
      case "disconnected":
      case "error":
        return {
          icon: <WifiOff className="h-4 w-4" />,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          label: "Offline",
          description: "Not connected to server",
        };
    }
  };

  const getSaveStatusConfig = () => {
    switch (saveStatus) {
      case "idle":
        return {
          icon: <Check className="h-4 w-4" />,
          color: "text-gray-400",
          bgColor: "bg-gray-400/10",
          label: "All changes saved",
        };
      case "typing":
        return {
          icon: null,
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
          label: "Typing...",
        };
      case "saving":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          color: "text-blue-400",
          bgColor: "bg-blue-400/10",
          label: "Saving...",
        };
      case "saved":
        return {
          icon: <Check className="h-4 w-4" />,
          color: "text-green-400",
          bgColor: "bg-green-400/10",
          label: lastSavedAt ? `Saved at ${formatTime(lastSavedAt)}` : "Saved",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          color: "text-red-400",
          bgColor: "bg-red-400/10",
          label: saveError || "Failed to save",
        };
      case "offline":
        return {
          icon: <WifiOff className="h-4 w-4" />,
          color: "text-yellow-400",
          bgColor: "bg-yellow-400/10",
          label: "Offline - Saved locally",
        };
    }
  };

  const connectionConfig = getConnectionStatusConfig();
  const saveConfig = getSaveStatusConfig();

  return (
    <div
      className={cn(
        "fixed z-40 bg-gray-900/95 backdrop-blur-md border border-gray-700/80 rounded-lg shadow-2xl",
        "transition-all duration-300 ease-out",
        isPulsing && "ring-2 ring-blue-500/40 animate-pulse",
        getPositionClasses(),
        className,
      )}
      role="toolbar"
      aria-label="Collaboration toolbar"
    >
      <div className="flex items-center gap-1.5 p-2.5">
        {/* Connection Status Section */}
        <div className="relative">
          <button
            onClick={() => toggleSection("connection")}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200",
              "hover:bg-gray-800/60 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900",
              connectionConfig.bgColor,
              isExpanded("connection") && "bg-gray-800/60 shadow-inner",
              autoExpandedSection === "connection" && "ring-2 ring-blue-500/30",
            )}
            aria-expanded={isExpanded("connection")}
            aria-label={`Connection status: ${connectionConfig.label}`}
          >
            <span
              className={cn(
                "flex-shrink-0 transition-transform duration-200",
                connectionConfig.color,
                isExpanded("connection") && "scale-110",
              )}
            >
              {connectionConfig.icon}
            </span>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                isExpanded("connection")
                  ? "max-w-[220px] opacity-100 ml-1"
                  : "max-w-0 opacity-0 ml-0",
              )}
            >
              <div className="whitespace-nowrap pr-2">
                <div className={cn("text-xs font-semibold leading-tight", connectionConfig.color)}>
                  {connectionConfig.label}
                </div>
                <div className="text-[11px] text-gray-400 leading-tight mt-0.5">
                  {connectionConfig.description}
                </div>
              </div>
            </div>
          </button>
        </div>

        <div className="h-7 w-px bg-gray-700/60" />

        {/* Active Users Section */}
        <div className="relative">
          <button
            onClick={() => toggleSection("users")}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200",
              "hover:bg-gray-800/60 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900",
              isExpanded("users") && "bg-gray-800/60 shadow-inner",
              autoExpandedSection === "users" && "ring-2 ring-blue-500/30",
            )}
            aria-expanded={isExpanded("users")}
            aria-label={`Active users: ${otherUsers.length}`}
          >
            {/* Stacked avatars */}
            <div
              className={cn(
                "flex -space-x-2 transition-transform duration-200",
                isExpanded("users") && "scale-105",
              )}
            >
              {otherUsers.length === 0 ? (
                <div className="h-6 w-6 rounded-full bg-gray-700 flex items-center justify-center ring-2 ring-gray-800 transition-all duration-200 hover:ring-gray-600">
                  <Users className="h-3 w-3 text-gray-400" />
                </div>
              ) : (
                <>
                  {otherUsers.slice(0, 3).map((user, index) => {
                    const initials = getInitials(user.name, user.email);
                    return (
                      <div
                        key={user.userId}
                        className="h-6 w-6 rounded-full ring-2 ring-gray-900 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-200 hover:ring-gray-700 hover:scale-110"
                        style={{
                          backgroundColor: user.color,
                          zIndex: otherUsers.length - index,
                        }}
                        title={user.name || user.email}
                      >
                        {initials}
                      </div>
                    );
                  })}
                  {otherUsers.length > 3 && (
                    <div
                      className="h-6 w-6 rounded-full ring-2 ring-gray-900 bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white transition-all duration-200 hover:ring-gray-700 hover:scale-110"
                      title={`${otherUsers.length - 3} more`}
                    >
                      +{otherUsers.length - 3}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Expanded user list */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                isExpanded("users") ? "max-w-[320px] opacity-100 ml-1" : "max-w-0 opacity-0 ml-0",
              )}
            >
              <div className="whitespace-nowrap pr-2">
                {otherUsers.length === 0 ? (
                  <div className="text-xs text-gray-400 leading-tight">No collaborators</div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-gray-200 leading-tight">
                      {otherUsers.length} {otherUsers.length === 1 ? "user" : "users"} viewing
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                      {otherUsers.slice(0, 5).map((user) => {
                        const displayName = user.name || user.email.split("@")[0];
                        const truncatedName =
                          displayName.length > 20
                            ? `${displayName.substring(0, 17)}...`
                            : displayName;
                        return (
                          <span
                            key={user.userId}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium text-white shadow-sm transition-all duration-200 hover:brightness-110"
                            style={{ backgroundColor: user.color }}
                            title={user.name || user.email}
                          >
                            {truncatedName}
                          </span>
                        );
                      })}
                      {otherUsers.length > 5 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium text-gray-300 bg-gray-700/50">
                          +{otherUsers.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </button>
        </div>

        <div className="h-7 w-px bg-gray-700/60" />

        {/* Save Status Section */}
        <div className="relative">
          <button
            onClick={() => toggleSection("save")}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-200",
              "hover:bg-gray-800/60 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900",
              saveConfig.bgColor,
              isExpanded("save") && "bg-gray-800/60 shadow-inner",
              autoExpandedSection === "save" && "ring-2 ring-blue-500/30",
            )}
            aria-expanded={isExpanded("save")}
            aria-label={`Save status: ${saveConfig.label}`}
          >
            {saveConfig.icon && (
              <span
                className={cn(
                  "flex-shrink-0 transition-transform duration-200",
                  saveConfig.color,
                  isExpanded("save") && "scale-110",
                )}
              >
                {saveConfig.icon}
              </span>
            )}
            {!saveConfig.icon && saveStatus === "typing" && (
              <span className="flex gap-1 items-center">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: "0ms", animationDuration: "0.6s" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: "150ms", animationDuration: "0.6s" }}
                />
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                  style={{ animationDelay: "300ms", animationDuration: "0.6s" }}
                />
              </span>
            )}

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                isExpanded("save") ? "max-w-[260px] opacity-100 ml-1" : "max-w-0 opacity-0 ml-0",
              )}
            >
              <div className="whitespace-nowrap pr-2">
                <div className={cn("text-xs font-semibold leading-tight", saveConfig.color)}>
                  {saveConfig.label}
                </div>
                {saveStatus === "error" && onRetry && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onRetry();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        onRetry();
                      }
                    }}
                    className="mt-1 text-xs font-medium underline hover:no-underline text-red-400 hover:text-red-300 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400/50 focus:ring-offset-1 focus:ring-offset-gray-900 rounded px-1 -ml-1"
                    role="button"
                    tabIndex={0}
                    aria-label="Retry saving"
                  >
                    Retry
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* History Button */}
        {showHistory && (
          <>
            <div className="h-7 w-px bg-gray-700/60" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenHistory}
              className="gap-2 text-gray-300 hover:text-white hover:bg-gray-800/60 active:scale-95 px-3 py-2 transition-all duration-200 focus:ring-2 focus:ring-gray-500/50 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Open version history"
            >
              <History className="h-4 w-4 transition-transform duration-200 hover:scale-110" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

CollaborationToolbar.displayName = "CollaborationToolbar";

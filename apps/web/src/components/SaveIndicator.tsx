import * as React from "react";
import { Check, Loader2, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SaveStatus } from "@/types/collaboration";

export interface SaveIndicatorProps {
  /** Current save status */
  status: SaveStatus;
  /** Timestamp when last saved (for displaying "Saved at HH:MM") */
  lastSavedAt?: Date;
  /** Error message to display when status is "error" */
  errorMessage?: string;
  /** Callback when user clicks retry button (shown on error) */
  onRetry?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SaveIndicator Component
 *
 * Displays the current save status of a document with appropriate icons and messages.
 * Supports states: idle, typing, saving, saved, error, and offline.
 *
 * @example
 * ```tsx
 * <SaveIndicator
 *   status="saved"
 *   lastSavedAt={new Date()}
 * />
 * ```
 */
export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  status,
  lastSavedAt,
  errorMessage = "Failed to save",
  onRetry,
  className,
}) => {
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getStatusContent = (): {
    icon: React.ReactNode;
    text: string;
    color: string;
  } => {
    switch (status) {
      case "idle":
        return {
          icon: <Check className="h-4 w-4" />,
          text: "All changes saved",
          color: "text-gray-500",
        };
      case "typing":
        return {
          icon: null,
          text: "Typing...",
          color: "text-blue-500",
        };
      case "saving":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: "Saving...",
          color: "text-blue-500",
        };
      case "saved":
        return {
          icon: <Check className="h-4 w-4" />,
          text: lastSavedAt ? `Saved at ${formatTime(lastSavedAt)}` : "Saved",
          color: "text-green-600",
        };
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: errorMessage,
          color: "text-red-600",
        };
      case "offline":
        return {
          icon: <WifiOff className="h-4 w-4" />,
          text: "Offline - Saved locally",
          color: "text-yellow-600",
        };
    }
  };

  const { icon, text, color } = getStatusContent();

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm font-medium transition-all duration-200",
        color,
        className,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {icon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <span>{text}</span>
      {status === "error" && onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            "ml-1 text-xs underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded",
            "transition-colors duration-150",
          )}
          aria-label="Retry saving"
        >
          Retry
        </button>
      )}
    </div>
  );
};

SaveIndicator.displayName = "SaveIndicator";

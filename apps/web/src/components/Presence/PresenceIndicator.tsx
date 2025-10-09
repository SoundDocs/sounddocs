import * as React from "react";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ConnectionStatus } from "@/types/collaboration";

export interface PresenceIndicatorProps {
  /** Current connection status */
  status: ConnectionStatus;
  /** Connection latency in milliseconds (optional) */
  latency?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * PresenceIndicator Component
 *
 * Displays the current connection status with a colored indicator.
 * Shows connection quality and latency information in a tooltip.
 *
 * @example
 * ```tsx
 * <PresenceIndicator
 *   status="connected"
 *   latency={45}
 * />
 * ```
 */
export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  status,
  latency,
  className,
}) => {
  const getIndicatorConfig = (): {
    color: string;
    pulseColor: string;
    icon: React.ReactNode;
    label: string;
    description: string;
  } => {
    switch (status) {
      case "connected":
        return {
          color: "bg-green-500",
          pulseColor: "bg-green-400",
          icon: <Wifi className="h-3 w-3" />,
          label: "Connected",
          description: getConnectionQualityDescription(latency),
        };
      case "connecting":
        return {
          color: "bg-yellow-500",
          pulseColor: "bg-yellow-400",
          icon: <Wifi className="h-3 w-3" />,
          label: "Reconnecting",
          description: "Attempting to reconnect...",
        };
      case "disconnected":
      case "error":
        return {
          color: "bg-red-500",
          pulseColor: "bg-red-400",
          icon: <WifiOff className="h-3 w-3" />,
          label: "Offline",
          description: "Not connected to server",
        };
    }
  };

  const getConnectionQualityDescription = (latency?: number): string => {
    if (!latency) return "Connection active";

    if (latency < 100) {
      return `Excellent connection (${latency}ms)`;
    } else if (latency < 300) {
      return `Good connection (${latency}ms)`;
    } else if (latency < 1000) {
      return `Fair connection (${latency}ms)`;
    } else {
      return `Poor connection (${latency}ms)`;
    }
  };

  const config = getIndicatorConfig();
  const isActive = status === "connected";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn("flex items-center gap-1.5", className)}
            role="status"
            aria-label={config.label}
          >
            {/* Pulsing indicator */}
            <div className="relative flex h-3 w-3">
              {isActive && (
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
                    config.pulseColor,
                  )}
                  aria-hidden="true"
                />
              )}
              <span
                className={cn(
                  "relative inline-flex h-3 w-3 rounded-full",
                  config.color,
                  status === "connecting" && "animate-pulse",
                )}
                aria-hidden="true"
              />
            </div>
            {/* Optional icon (hidden by default, can be shown with larger variant) */}
            <span className="sr-only">{config.icon}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1">
            <p className="font-semibold">{config.label}</p>
            <p className="text-xs text-gray-300">{config.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

PresenceIndicator.displayName = "PresenceIndicator";

/**
 * PresenceIndicator with label variant
 * Shows the connection status with text label
 */
export const PresenceIndicatorWithLabel: React.FC<PresenceIndicatorProps> = ({
  status,
  latency,
  className,
}) => {
  const getStatusText = (): string => {
    switch (status) {
      case "connected":
        return "Online";
      case "connecting":
        return "Connecting";
      case "disconnected":
      case "error":
        return "Offline";
    }
  };

  const getStatusColor = (): string => {
    switch (status) {
      case "connected":
        return "text-green-600";
      case "connecting":
        return "text-yellow-600";
      case "disconnected":
      case "error":
        return "text-red-600";
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <PresenceIndicator status={status} latency={latency} />
      <span className={cn("text-sm font-medium", getStatusColor())}>{getStatusText()}</span>
    </div>
  );
};

PresenceIndicatorWithLabel.displayName = "PresenceIndicatorWithLabel";

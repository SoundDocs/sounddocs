import React from "react";
import Draggable from "react-draggable";
import { User } from "lucide-react";

export interface BeltpackChannelAssignment {
  channel: "A" | "B" | "C" | "D";
  assignment: string; // e.g., "Production", "Audio", "Video", "Program", or custom
}

export interface CommsBeltpackProps {
  id: string;
  label: string;
  x: number;
  y: number;
  transceiverRef?: string; // ID of the connected transceiver
  selected?: boolean;
  onClick?: (id: string) => void;
  onDragStop?: (id: string, x: number, y: number) => void;
  scale?: number;
  signalStrength?: number; // 0-100
  batteryLevel?: number; // 0-100
  online?: boolean;
  channelAssignments?: BeltpackChannelAssignment[]; // Channel planning for beltpacks
}

const CommsBeltpack: React.FC<CommsBeltpackProps> = ({
  id,
  label,
  x,
  y,
  transceiverRef,
  selected,
  signalStrength = 100,
  batteryLevel = 100,
  online = true,
  channelAssignments,
  onClick,
  onDragStop,
}) => {
  const nodeRef = React.useRef<HTMLDivElement>(null);

  const handleDragStop = (_e: any, data: any) => {
    if (onDragStop) onDragStop(id, data.x, data.y);
  };

  const handleClick = () => {
    if (onClick) onClick(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const getSignalColor = () => {
    if (!online) return "bg-gray-500";
    if (signalStrength > 75) return "bg-green-500";
    if (signalStrength > 50) return "bg-yellow-500";
    if (signalStrength > 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const getBatteryColor = () => {
    if (batteryLevel > 50) return "text-green-400";
    if (batteryLevel > 20) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <Draggable nodeRef={nodeRef} position={{ x, y }} onStop={handleDragStop} bounds="parent">
      <div
        ref={nodeRef}
        className="absolute cursor-move"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Beltpack ${label}, ${online ? "online" : "offline"}, battery ${batteryLevel}%, signal ${signalStrength}%${transceiverRef ? ", connected" : ", not connected"}`}
      >
        <div className="relative flex flex-col items-center">
          {/* Main beltpack element */}
          <div
            className={`w-10 h-10 bg-yellow-500 rounded flex items-center justify-center text-white transition-all duration-150 ${
              selected
                ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-gray-900 shadow-lg"
                : "focus:ring-4 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            } ${!online ? "opacity-50" : ""}`}
          >
            <User className="h-5 w-5" />

            {/* Signal strength indicator */}
            <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${getSignalColor()}`} />

            {/* Battery indicator */}
            {batteryLevel < 50 && (
              <div className={`absolute -bottom-1 -right-1 text-xs ${getBatteryColor()}`}>
                {batteryLevel}%
              </div>
            )}
          </div>

          {/* Label below icon */}
          <div className="text-center mt-1">
            <span className="text-xs text-white block">{label}</span>
            {transceiverRef && <span className="text-xs text-gray-400 block">Connected</span>}
            {channelAssignments && channelAssignments.length > 0 && (
              <div className="text-xs text-blue-300 block">
                {channelAssignments
                  .slice(0, 2)
                  .map((ca) => `${ca.channel}:${ca.assignment.slice(0, 3)}`)
                  .join(", ")}
                {channelAssignments.length > 2 && "..."}
              </div>
            )}
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default CommsBeltpack;

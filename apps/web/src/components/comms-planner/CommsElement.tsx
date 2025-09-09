import React from "react";
import Draggable from "react-draggable";
import { Radio, Wifi, Server, Headphones, AlertCircle, Router } from "lucide-react";
import { SystemType, SystemModel, Transceiver, ValidationResult } from "../../lib/commsTypes";

export interface CommsElementProps extends Partial<Transceiver> {
  id: string;
  systemType: SystemType;
  model?: SystemModel; // NEW: model field
  label: string;
  x: number;
  y: number;
  selected?: boolean;
  validationErrors?: ValidationResult[];
  scale?: number;
  onClick?: (id: string) => void;
  onDragStop?: (id: string, x: number, y: number) => void;
}

const CommsElement: React.FC<CommsElementProps> = ({
  id,
  systemType,
  label,
  x,
  y,
  z = 8,
  currentBeltpacks = 0,
  maxBeltpacks = 5,
  channels,
  selected,
  validationErrors = [],
  onClick,
  onDragStop,
}) => {
  const handleDragStop = (_e: any, data: any) => {
    if (onDragStop) onDragStop(id, data.x, data.y);
  };

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  // Get icon based on system type
  const getIcon = () => {
    switch (systemType) {
      case "FSII":
        return <Radio className="h-6 w-6" />;
      case "FSII-Base":
        return <Router className="h-6 w-6" />;
      case "Edge":
        return <Wifi className="h-6 w-6" />;
      case "Bolero":
        return <Headphones className="h-6 w-6" />;
      case "Arcadia":
      case "ODIN":
        return <Server className="h-6 w-6" />;
      default:
        return <Radio className="h-6 w-6" />;
    }
  };

  // Get color based on system type and status
  const getColor = () => {
    if (validationErrors.some((e) => e.type === "error")) {
      return "bg-red-500";
    }
    if (validationErrors.some((e) => e.type === "warning")) {
      return "bg-yellow-500";
    }

    switch (systemType) {
      case "FSII":
        return "bg-blue-500";
      case "FSII-Base":
        return "bg-blue-600";
      case "Edge":
        return "bg-purple-500";
      case "Bolero":
        return "bg-green-500";
      case "Arcadia":
        return "bg-cyan-500";
      case "ODIN":
        return "bg-indigo-500";
      default:
        return "bg-gray-500";
    }
  };

  // Calculate fill percentage for beltpack capacity
  const capacityPercentage = maxBeltpacks > 0 ? (currentBeltpacks / maxBeltpacks) * 100 : 0;

  return (
    <Draggable position={{ x, y }} onStop={handleDragStop} bounds="parent">
      <div
        className="absolute cursor-move"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`${systemType} transceiver ${label}, ${currentBeltpacks}/${maxBeltpacks} beltpacks connected${validationErrors.length > 0 ? ", has validation issues" : ""}`}
      >
        {/* Main element */}
        <div className="relative flex flex-col items-center">
          <div
            className={`w-14 h-14 ${getColor()} rounded-full flex items-center justify-center text-white transition-all duration-150 ${
              selected
                ? "ring-4 ring-blue-400 ring-offset-2 ring-offset-gray-800 shadow-lg"
                : "focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-800"
            }`}
          >
            {getIcon()}

            {/* Validation indicator */}
            {validationErrors.length > 0 && (
              <div className="absolute -top-1 -right-1">
                <AlertCircle
                  className={`h-4 w-4 ${
                    validationErrors.some((e) => e.type === "error")
                      ? "text-red-300"
                      : "text-yellow-300"
                  }`}
                />
              </div>
            )}
          </div>

          {/* Capacity bar */}
          {(systemType === "FSII" || systemType === "Edge" || systemType === "Bolero") && (
            <div className="w-14 h-1 bg-gray-700 rounded-full mt-1">
              <div
                className={`h-full rounded-full transition-all ${
                  capacityPercentage > 80
                    ? "bg-red-400"
                    : capacityPercentage > 60
                      ? "bg-yellow-400"
                      : "bg-green-400"
                }`}
                style={{ width: `${capacityPercentage}%` }}
              />
            </div>
          )}

          {/* Label and info */}
          <div className="text-center mt-1">
            <span className="text-xs text-white block">{label}</span>
            <span className="text-xs text-gray-400">
              {z}ft
              {channels && ` • Ch ${channels.primary}`}
              {(systemType === "FSII" || systemType === "Edge" || systemType === "Bolero") &&
                currentBeltpacks !== undefined &&
                ` • ${currentBeltpacks}/${maxBeltpacks}BP`}
            </span>
          </div>
        </div>
      </div>
    </Draggable>
  );
};

export default CommsElement;

import React, { useState, useRef } from "react";
import Draggable from "react-draggable";
import {
  Mic,
  Music,
  Speaker,
  Square,
  Type,
  Users,
  Headphones,
  Volume2,
  Piano,
  Guitar,
  Blinds as Violin,
  Drum,
  Plug,
  CircleEllipsis,
  Image as ImageIcon,
} from "lucide-react";

export interface StageElementProps {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  rotation: number;
  icon?: React.ReactNode;
  color?: string;
  width?: number;
  height?: number;
  customImageUrl?: string | null; // New property for custom image
  selected?: boolean;
  disabled?: boolean;
  onClick?: (id: string) => void;
  onDragStop?: (id: string, x: number, y: number) => void;
  onRotate?: (id: string, rotation: number) => void;
  onLabelChange?: (id: string, label: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onResize?: (id: string, width: number, height: number) => void;
}

const StageElement: React.FC<StageElementProps> = ({
  id,
  type,
  label,
  x,
  y,
  rotation,
  color = "#4f46e5",
  width,
  height,
  customImageUrl,
  selected = false,
  disabled = false,
  onClick,
  onDragStop,
  onRotate,
  onLabelChange,
  onDelete,
  onDuplicate,
  onResize,
}) => {
  const [editingLabel, setEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(label);
  const [isResizing, setIsResizing] = useState(false);
  const isMobile = window.innerWidth < 768;

  const getDefaultDimensions = () => {
    if (
      type === "electric-guitar" ||
      type === "acoustic-guitar" ||
      type === "bass-guitar" ||
      type === "keyboard" ||
      type === "drums" ||
      type === "percussion" ||
      type === "violin" ||
      type === "cello" ||
      type === "trumpet" ||
      type === "saxophone" ||
      type === "generic-instrument" ||
      type === "custom-image" // Added for custom image type
    ) {
      return { width: 64, height: 64 };
    }

    switch (type) {
      case "microphone":
        return { width: 32, height: 32 };
      case "power-strip":
        return { width: 64, height: 24 };
      case "monitor-wedge":
        return { width: 48, height: 32 };
      case "amplifier":
        return { width: 56, height: 40 };
      case "speaker":
        return { width: 40, height: 64 };
      case "di-box":
        return { width: 24, height: 24 };
      case "iem":
        return { width: 32, height: 32 };
      case "person":
        return { width: 40, height: 40 };
      case "text":
        return { width: 120, height: 40 };
      default:
        return { width: 40, height: 40 };
    }
  };

  const getElementDimensions = () => {
    const defaultDims = getDefaultDimensions();
    return {
      width: width || defaultDims.width,
      height: height || defaultDims.height,
    };
  };

  const dimensions = getElementDimensions();

  const getElementStyles = () => {
    if (customImageUrl) {
      return {
        className: "rounded-md flex items-center justify-center overflow-hidden",
        style: { backgroundColor: "transparent" }, // No background color if custom image
      };
    }
    if (
      type === "electric-guitar" ||
      type === "acoustic-guitar" ||
      type === "bass-guitar" ||
      type === "keyboard" ||
      type === "drums" ||
      type === "percussion" ||
      type === "violin" ||
      type === "cello" ||
      type === "trumpet" ||
      type === "saxophone" ||
      type === "generic-instrument" ||
      type === "custom-image"
    ) {
      return {
        className: "rounded-lg flex items-center justify-center",
        style: { backgroundColor: color },
      };
    }

    switch (type) {
      case "microphone":
        return {
          className: "rounded-full flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "power-strip":
        return {
          className: "rounded-sm flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "monitor-wedge":
        return {
          className: "monitor-wedge flex items-center justify-center transform rotate-[15deg]",
          style: { backgroundColor: color },
        };
      case "amplifier":
      case "speaker":
        return {
          className: "rounded-md flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "di-box":
        return {
          className: "rounded-sm flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "iem":
      case "person":
        return {
          className: "rounded-full flex items-center justify-center",
          style: { backgroundColor: color },
        };
      default:
        return {
          className: "rounded-md flex items-center justify-center",
          style: { backgroundColor: color },
        };
    }
  };

  const getIconForType = () => {
    if (customImageUrl) return null; // No icon if custom image is used

    const iconSize = Math.max(12, Math.min(24, dimensions.width * 0.5));
    const iconProps = {
      style: { height: `${iconSize}px`, width: `${iconSize}px` },
      className: "text-white",
    };

    switch (type) {
      case "microphone":
        return <Mic {...iconProps} />;
      case "power-strip":
        return <Plug {...iconProps} />;
      case "electric-guitar":
      case "acoustic-guitar":
      case "bass-guitar":
        return <Guitar {...iconProps} />;
      case "keyboard":
        return <Piano {...iconProps} />;
      case "drums":
      case "percussion":
        return <Drum {...iconProps} />;
      case "violin":
      case "cello":
        return <Violin {...iconProps} />;
      case "trumpet":
      case "saxophone":
        return <Music {...iconProps} />;
      case "generic-instrument":
        return <CircleEllipsis {...iconProps} />;
      case "custom-image":
        return <ImageIcon {...iconProps} />; // Icon for the "Custom Image" type itself
      case "amplifier":
        return <Volume2 {...iconProps} />;
      case "monitor-wedge":
        return (
          <svg
            viewBox="0 0 24 24"
            style={{ width: `${iconSize}px`, height: `${iconSize}px` }}
            stroke="white"
            strokeWidth="2"
            fill="none"
          >
            <path d="M4 6h16l-2 10H6L4 6z" />
            <path d="M4 6l-2 3" />
            <path d="M20 6l2 3" />
          </svg>
        );
      case "speaker":
        return <Speaker {...iconProps} />;
      case "di-box":
        return (
          <Square
            {...iconProps}
            style={{
              ...iconProps.style,
              height: `${iconSize * 0.75}px`,
              width: `${iconSize * 0.75}px`,
            }}
          />
        );
      case "iem":
        return <Headphones {...iconProps} />;
      case "person":
        return <Users {...iconProps} />;
      case "text":
        return <Type {...iconProps} />;
      default:
        return null;
    }
  };

  const handleDragStop = (_e: any, data: any) => {
    if (disabled) return;
    if (onDragStop) onDragStop(id, data.x, data.y);
  };

  const handleRotate = (direction: "left" | "right") => {
    if (disabled) return;
    if (onRotate) {
      const newRotation = direction === "right" ? rotation + 15 : rotation - 15;
      onRotate(id, newRotation);
    }
  };

  const handleLabelChange = () => {
    if (disabled) return;
    setEditingLabel(false);
    if (onLabelChange && tempLabel !== label) {
      onLabelChange(id, tempLabel);
    }
  };

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setEditingLabel(true);
    setTempLabel(label);
  };

  const handleTextElementDoubleClick = (e: React.MouseEvent) => {
    if (disabled || type !== "text") return;
    e.stopPropagation();
    setEditingLabel(true);
    setTempLabel(label);
  };

  const handleDelete = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    if (onDelete) onDelete(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    if (onDuplicate) onDuplicate(id);
  };

  const handleResizeStop = () => {
    setIsResizing(false);
  };

  const handleTap = () => {
    if (disabled) return;
    if (onClick) onClick(id);
  };

  const mobileProps = isMobile && !disabled ? { onTouchEnd: handleTap } : {};
  const isResizable = !disabled; // Allow all non-disabled elements to be resizable
  const elementVisualStyles = type !== "text" ? getElementStyles() : null;

  const getFontSize = () => {
    const elementHeight = dimensions.height;
    if (type === "text") {
      return Math.max(12, Math.min(18, elementHeight * 0.3));
    }
    const elementWidth = dimensions.width;
    return Math.max(10, Math.min(14, elementWidth * 0.2));
  };

  const getLabelWidth = () => {
    const elementWidth = dimensions.width;
    return Math.max(60, elementWidth * 1.2);
  };

  return (
    <Draggable
      position={{ x, y }}
      onStop={handleDragStop}
      bounds="parent"
      grid={[5, 5]}
      disabled={disabled || isResizing}
      cancel=".resize-handle, input, button, span, textarea"
    >
      <div
        className={`absolute ${!disabled ? "cursor-move" : ""} touch-manipulation ${selected ? "z-20" : "z-10"}`}
        onClick={() => !disabled && !isResizing && onClick && onClick(id)}
        {...mobileProps}
        style={{
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      >
        {selected && !disabled && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-gray-800 border border-gray-600 p-1 rounded-md shadow-lg z-30">
            <button
              className="p-1 bg-gray-700 rounded text-gray-300 hover:text-white hover:bg-gray-600 w-6 h-6 flex items-center justify-center touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                handleRotate("left");
              }}
              title="Rotate Left"
            >
              ↺
            </button>
            <button
              className="p-1 bg-gray-700 rounded text-gray-300 hover:text-white hover:bg-gray-600 w-6 h-6 flex items-center justify-center touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                handleRotate("right");
              }}
              title="Rotate Right"
            >
              ↻
            </button>
            <button
              className="p-1 bg-gray-700 rounded text-gray-300 hover:text-white hover:bg-gray-600 w-6 h-6 flex items-center justify-center touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                handleDuplicate(e);
              }}
              title="Duplicate Element"
            >
              +
            </button>
            <button
              className="p-1 bg-red-700 hover:bg-red-600 rounded text-gray-300 hover:text-white w-6 h-6 flex items-center justify-center touch-manipulation"
              onClick={handleDelete}
              title="Delete Element"
            >
              ×
            </button>
          </div>
        )}

        <div
          className="element-visual-container"
          style={{
            width: "100%",
            height: "100%",
            transform: type !== "text" ? `rotate(${rotation}deg)` : "none",
            transformOrigin: "center center",
          }}
        >
          {type === "text" ? (
            <div
              className="text-label flex items-center justify-center w-full h-full"
              onDoubleClick={!disabled ? handleTextElementDoubleClick : undefined}
              style={{
                border: selected
                  ? "2px solid rgba(255, 255, 255, 0.8)"
                  : "1px solid rgba(99, 102, 241, 0.5)",
                boxShadow: selected ? "0 0 0 2px rgba(99, 102, 241, 0.5)" : "none",
                backgroundColor: "rgba(30, 41, 59, 0.9)",
                fontSize: `${getFontSize()}px`,
                overflow: "hidden",
                textAlign: "center",
                color: "white",
              }}
            >
              {editingLabel && !disabled ? (
                <textarea
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  onBlur={handleLabelChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleLabelChange();
                    }
                  }}
                  className="bg-transparent text-white border-none focus:outline-none text-center w-full h-full p-1 resize-none"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  style={{ fontSize: "inherit" }}
                />
              ) : (
                <span
                  className="text-white font-medium p-1 whitespace-pre-wrap break-words w-full h-full flex items-center justify-center"
                  style={{ fontSize: "inherit" }}
                >
                  {label}
                </span>
              )}
            </div>
          ) : (
            elementVisualStyles && (
              <div
                className={`${elementVisualStyles.className} ${selected && !customImageUrl ? "ring-2 ring-white ring-opacity-80" : ""} ${selected && customImageUrl ? "ring-2 ring-indigo-500 ring-opacity-80" : ""} w-full h-full`}
                style={elementVisualStyles.style}
              >
                {customImageUrl ? (
                  <img
                    src={customImageUrl}
                    alt={label || "Custom image"}
                    className="object-contain w-full h-full"
                    style={{ pointerEvents: "none" }} // Prevent image from interfering with drag
                    draggable="false" // Prevent native browser drag
                  />
                ) : (
                  getIconForType()
                )}
              </div>
            )
          )}
        </div>

        {type !== "text" && (
          <div
            className="absolute left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap flex justify-center"
            style={{
              top: `${dimensions.height}px`,
              zIndex: 5,
            }}
          >
            {editingLabel && !disabled ? (
              <input
                type="text"
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onBlur={handleLabelChange}
                onKeyDown={(e) => e.key === "Enter" && handleLabelChange()}
                className="px-2 py-1 text-xs bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:border-indigo-500 text-center"
                style={{
                  minWidth: `${getLabelWidth()}px`,
                  fontSize: `${getFontSize()}px`,
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span
                className={`text-xs text-white bg-gray-800/90 border border-gray-600 px-2 py-1 rounded-md shadow-md inline-block text-center ${!disabled ? "cursor-pointer" : ""}`}
                style={{
                  minWidth: `${getLabelWidth()}px`,
                  fontSize: `${getFontSize()}px`,
                }}
                onDoubleClick={!disabled ? handleLabelDoubleClick : undefined}
              >
                {label}
              </span>
            )}
          </div>
        )}

        {selected && isResizable && (
          <div
            className="resize-handle absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-full border-2 border-indigo-500 cursor-nwse-resize z-30"
            onMouseDown={(e) => {
              if (disabled || !onResize) return;
              e.stopPropagation();
              setIsResizing(true);

              const startX = e.clientX;
              const startY = e.clientY;
              const startWidth = dimensions.width;
              const startHeight = dimensions.height;

              const handleMouseMove = (moveEvent: MouseEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const deltaY = moveEvent.clientY - startY;
                const delta = Math.max(deltaX, deltaY);

                const newWidth = Math.max(20, startWidth + delta);
                const newHeight = Math.max(20, startHeight + delta);

                onResize(id, newWidth, newHeight);
              };

              const handleMouseUp = () => {
                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
                handleResizeStop();
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
          />
        )}
      </div>
    </Draggable>
  );
};

export default StageElement;

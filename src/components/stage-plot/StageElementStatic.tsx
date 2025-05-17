import React from "react";
import { StageElementProps } from "./StageElement"; // Re-using StageElementProps
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
  Plug, // Removed Drumstick as Drum is used for both
  CircleEllipsis,
  Image as ImageIcon, // Added for custom image
} from "lucide-react";

// No need to redefine StageElementStaticProps if it's identical to StageElementProps
// or if StageElementProps can be directly used.
// For clarity, if it might diverge, keep it:
interface StageElementStaticProps extends Omit<StageElementProps, 'onClick' | 'onDragStop' | 'onRotate' | 'onLabelChange' | 'onDelete' | 'onDuplicate' | 'onResize' | 'selected' | 'disabled'> {}


const StageElementStatic: React.FC<StageElementStaticProps> = ({
  type,
  label,
  x,
  y,
  rotation,
  color = "#4f46e5",
  width: propWidth, // Renamed to avoid conflict with internal width
  height: propHeight, // Renamed to avoid conflict with internal height
  customImageUrl,
  labelHidden = false, // Added labelHidden
}) => {
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
      type === "custom-image"
    ) {
      return { width: 64, height: 64 };
    }
    switch (type) {
      case "microphone": return { width: 32, height: 32 };
      case "power-strip": return { width: 64, height: 24 };
      case "monitor-wedge": return { width: 48, height: 32 };
      case "amplifier": return { width: 56, height: 40 };
      case "speaker": return { width: 40, height: 64 };
      case "di-box": return { width: 24, height: 24 };
      case "iem": return { width: 32, height: 32 };
      case "person": return { width: 40, height: 40 };
      case "text": return { width: 120, height: 40 }; // Default for text
      default: return { width: 40, height: 40 };
    }
  };

  const dimensions = {
    width: propWidth || getDefaultDimensions().width,
    height: propHeight || getDefaultDimensions().height,
  };


  const getElementStyles = () => {
    if (customImageUrl) {
      return {
        className: "rounded-md flex items-center justify-center overflow-hidden",
        style: { backgroundColor: "transparent", width: `${dimensions.width}px`, height: `${dimensions.height}px` },
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
        style: { backgroundColor: color, width: `${dimensions.width}px`, height: `${dimensions.height}px` },
      };
    }

    switch (type) {
      case "microphone":
        return {
          className: "rounded-full flex items-center justify-center",
          style: { backgroundColor: color, width: `${dimensions.width}px`, height: `${dimensions.height}px` },
        };
      case "power-strip":
        return {
          className: "rounded-sm flex items-center justify-center",
          style: { backgroundColor: color, width: `${dimensions.width}px`, height: `${dimensions.height}px` },
        };
      case "monitor-wedge":
        return {
          className: "monitor-wedge flex items-center justify-center transform rotate-[15deg]", // Rotation is part of the shape
          style: { backgroundColor: color, width: `${dimensions.width}px`, height: `${dimensions.height}px` },
        };
      case "amplifier":
      case "speaker":
        return {
          className: "rounded-md flex items-center justify-center",
          style: { backgroundColor: color, width: `${dimensions.width}px`, height: `${dimensions.height}px` },
        };
      case "di-box":
        return {
          className: "rounded-sm flex items-center justify-center",
          style: { backgroundColor: color, width: `${dimensions.width}px`, height: `${dimensions.height}px` },
        };
      case "iem":
      case "person":
        return {
          className: "rounded-full flex items-center justify-center",
          style: { backgroundColor: color, width: `${dimensions.width}px`, height: `${dimensions.height}px` },
        };
      case "text": // Text element specific styling
        return {
          className: "text-label flex items-center justify-center",
          style: {
            backgroundColor: "rgba(30, 41, 59, 0.9)", // Example background
            color: "white",
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            padding: '5px',
            border: '1px solid rgba(99, 102, 241, 0.5)',
            textAlign: 'center',
            fontSize: `${Math.max(12, Math.min(18, dimensions.height * 0.3))}px`,
            overflow: 'hidden',
            wordBreak: 'break-word',
          },
        };
      default:
        return {
          className: "rounded-md flex items-center justify-center",
          style: { backgroundColor: color, width: `${dimensions.width}px`, height: `${dimensions.height}px` },
        };
    }
  };

  const getIconForType = (currentType: string) => {
    if (customImageUrl && currentType !== "text") return null; // No icon if custom image, unless it's a text element

    const iconSize = Math.max(12, Math.min(24, dimensions.width * 0.5));
    const iconProps = {
      style: { height: `${iconSize}px`, width: `${iconSize}px` },
      className: "text-white",
    };

    switch (currentType) {
      case "microphone": return <Mic {...iconProps} />;
      case "power-strip": return <Plug {...iconProps} />;
      case "electric-guitar": case "acoustic-guitar": case "bass-guitar": return <Guitar {...iconProps} />;
      case "keyboard": return <Piano {...iconProps} />;
      case "drums": case "percussion": return <Drum {...iconProps} />;
      case "violin": case "cello": return <Violin {...iconProps} />;
      case "trumpet": case "saxophone": return <Music {...iconProps} />;
      case "generic-instrument": return <CircleEllipsis {...iconProps} />;
      case "custom-image": return <ImageIcon {...iconProps} />; // Icon for the type itself
      case "amplifier": return <Volume2 {...iconProps} />;
      case "monitor-wedge":
        return (
          <svg viewBox="0 0 24 24" style={{ width: `${iconSize}px`, height: `${iconSize}px` }} stroke="white" strokeWidth="2" fill="none">
            <path d="M4 6h16l-2 10H6L4 6z" /><path d="M4 6l-2 3" /><path d="M20 6l2 3" />
          </svg>
        );
      case "speaker": return <Speaker {...iconProps} />;
      case "di-box": return <Square {...iconProps} style={{ ...iconProps.style, height: `${iconSize * 0.75}px`, width: `${iconSize * 0.75}px` }} />;
      case "iem": return <Headphones {...iconProps} />;
      case "person": return <Users {...iconProps} />;
      // No icon for "text" type, as the text itself is the content
      case "text": return null;
      default: return null;
    }
  };

  const elementVisualStyles = getElementStyles();
  const fontSize = type === "text" ? elementVisualStyles.style.fontSize : `${Math.max(10, Math.min(14, dimensions.width * 0.2))}px`;
  const labelWidth = type === "text" ? 'auto' : `${Math.max(60, dimensions.width * 1.2)}px`;


  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        zIndex: type === "text" ? 15 : 10, // Text labels might need higher z-index
      }}
    >
      <div
        className="stage-element-static-visual-container" // Unique class for static visual part
        style={{
          transform: type !== "text" ? `rotate(${rotation}deg)` : 'none', // Text elements don't rotate their text box usually
          transformOrigin: "center center",
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
      >
        {type === "text" ? (
          <div className={elementVisualStyles.className} style={elementVisualStyles.style}>
            <span className="whitespace-pre-wrap break-words">{label}</span>
          </div>
        ) : (
          <div className={elementVisualStyles.className} style={elementVisualStyles.style}>
            {customImageUrl ? (
              <img
                src={customImageUrl}
                alt={label || "Custom image"}
                className="object-contain w-full h-full"
                draggable="false"
              />
            ) : (
              getIconForType(type)
            )}
          </div>
        )}
      </div>

      {!labelHidden && type !== "text" && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap flex justify-center"
          style={{
            top: `${dimensions.height}px`, // Position label below the element
            zIndex: 20, // Ensure label is above other elements if overlapping
          }}
        >
          <span
            className="text-xs text-white bg-gray-800/90 border border-gray-600 px-2 py-1 rounded-md shadow-md inline-block text-center"
            style={{
              minWidth: labelWidth,
              fontSize: fontSize,
            }}
          >
            {label}
          </span>
        </div>
      )}
    </div>
  );
};

export default StageElementStatic;

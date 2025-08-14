import React from "react";
import { StageElementProps } from "./StageElement";
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
  Drumstick,
  Plug,
  CircleEllipsis,
  Image as ImageIcon, // Added ImageIcon
} from "lucide-react";

interface StageElementStaticProps extends StageElementProps {}

const StageElementStatic: React.FC<StageElementStaticProps> = ({
  type,
  label,
  x,
  y,
  rotation,
  color = "#4f46e5",
  width, // Added width
  height, // Added height
  customImageUrl, // Added customImageUrl
  labelVisible = true, // Added labelVisible, default to true
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

  const dimensions = {
    width: width || getDefaultDimensions().width,
    height: height || getDefaultDimensions().height,
  };

  const getElementStyles = () => {
    if (customImageUrl) {
      return {
        className: "rounded-md flex items-center justify-center overflow-hidden",
        style: { backgroundColor: "transparent" },
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
      case "text":
        return {
          className: "text-label flex items-center justify-center",
          style: {
            backgroundColor: "rgba(30, 41, 59, 0.9)",
            border: "1px solid rgba(99, 102, 241, 0.5)",
            color: "white",
            textAlign: "center",
            overflow: "hidden",
            visibility: labelVisible ? "visible" : "hidden",
          },
        };
      default:
        return {
          className: "rounded-md flex items-center justify-center",
          style: { backgroundColor: color },
        };
    }
  };

  const getIconForType = (type: string) => {
    if (customImageUrl) return null;

    const iconSize = Math.max(
      12,
      Math.min(24, Math.min(dimensions.width, dimensions.height) * 0.5),
    );
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
        return <ImageIcon {...iconProps} />;
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
            <path d="M4 6h16l-2 10H6L4 6z" /> <path d="M4 6l-2 3" /> <path d="M20 6l2 3" />
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

  const elementStyles = getElementStyles();
  const getFontSize = () => {
    if (type === "text") {
      return Math.max(12, Math.min(18, dimensions.height * 0.3));
    }
    return Math.max(10, Math.min(14, dimensions.width * 0.2));
  };
  const getLabelWidth = () => Math.max(60, dimensions.width * 1.2);

  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        zIndex: type === "text" ? 15 : 10,
      }}
    >
      <div
        className="stage-element w-full h-full"
        style={{
          transform: type !== "text" ? `rotate(${rotation}deg)` : "none",
          transformOrigin: "center center",
        }}
      >
        {type === "text" ? (
          <div
            className={`${elementStyles.className} w-full h-full p-1 whitespace-pre-wrap break-words`}
            style={{ ...elementStyles.style, fontSize: `${getFontSize()}px` }}
          >
            {labelVisible ? label : ""}
          </div>
        ) : (
          <>
            <div className={`${elementStyles.className} w-full h-full`} style={elementStyles.style}>
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

            {labelVisible && (
              <div
                className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 whitespace-nowrap flex justify-center"
                style={{ zIndex: 20 }}
              >
                <span
                  className="text-xs text-white bg-gray-800/90 border border-gray-600 px-2 py-1 rounded-md shadow-md inline-block text-center"
                  style={{
                    minWidth: `${getLabelWidth()}px`,
                    fontSize: `${getFontSize()}px`,
                  }}
                >
                  {label}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StageElementStatic;

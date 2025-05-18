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
} from "lucide-react";

interface StageElementStaticProps extends StageElementProps {}

const StageElementStatic: React.FC<StageElementStaticProps> = ({
  type,
  label,
  x,
  y,
  rotation,
  color = "#4f46e5",
}) => {
  const getElementStyles = () => {
    // Instrument types
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
      type === "generic-instrument"
    ) {
      return {
        className: "w-16 h-16 rounded-lg flex items-center justify-center",
        style: { backgroundColor: color },
      };
    }

    // Other specific types
    switch (type) {
      case "microphone":
        return {
          className: "w-8 h-8 rounded-full flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "power-strip":
        return {
          className: "w-16 h-6 rounded-sm flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "monitor-wedge":
        return {
          className:
            "w-12 h-8 monitor-wedge flex items-center justify-center transform rotate-[15deg]",
          style: { backgroundColor: color },
        };
      case "amplifier":
        return {
          className: "w-14 h-10 rounded-md flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "speaker":
        return {
          className: "w-10 h-16 rounded-md flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "di-box":
        return {
          className: "w-6 h-6 rounded-sm flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "iem":
        return {
          className: "w-8 h-8 rounded-full flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "person":
        return {
          className: "w-10 h-10 rounded-full flex items-center justify-center",
          style: { backgroundColor: color },
        };
      case "text":
        return {
          className: "text-label",
          style: { backgroundColor: "rgba(30, 41, 59, 0.9)" },
        };
      default:
        return {
          className: "w-10 h-10 rounded-md flex items-center justify-center",
          style: { backgroundColor: color },
        };
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "microphone":
        return <Mic className="h-4 w-4 text-white" />;
      case "power-strip":
        return <Plug className="h-4 w-4 text-white" />;
      case "electric-guitar":
      case "acoustic-guitar":
      case "bass-guitar":
        return <Guitar className="h-5 w-5 text-white" />;
      case "keyboard":
        return <Piano className="h-5 w-5 text-white" />;
      case "drums":
      case "percussion":
        return <Drum className="h-5 w-5 text-white" />;
      case "violin":
      case "cello":
        return <Violin className="h-5 w-5 text-white" />;
      case "trumpet":
        return <Music className="h-5 w-5 text-white" />;
      case "saxophone":
        return <Music className="h-5 w-5 text-white" />;
      case "generic-instrument":
        return <CircleEllipsis className="h-5 w-5 text-white" />;
      case "amplifier":
        return <Volume2 className="h-5 w-5 text-white" />;
      case "monitor-wedge":
        return (
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
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
        return <Speaker className="h-5 w-5 text-white" />;
      case "di-box":
        return <Square className="h-3 w-3 text-white" />;
      case "iem":
        return <Headphones className="h-4 w-4 text-white" />;
      case "person":
        return <Users className="h-4 w-4 text-white" />;
      case "text":
        return <Type className="h-4 w-4 text-white" />;
      default:
        return null;
    }
  };

  const elementStyles = getElementStyles();

  return (
    <div
      className="absolute"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        zIndex: type === "text" ? 15 : 10,
      }}
    >
      <div
        className="stage-element"
        style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: "center center",
        }}
      >
        {type === "text" ? (
          <div className="text-label">
            <span className="text-sm font-medium">{label}</span>
          </div>
        ) : (
          <>
            <div className={`${elementStyles.className}`} style={elementStyles.style}>
              {getIconForType(type)}
            </div>

            {/* Label below the element */}
            <div
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap"
              style={{ zIndex: 20 }}
            >
              <span className="text-xs text-white bg-gray-800/90 border border-gray-600 px-2 py-1 rounded-md shadow-md min-w-[80px] inline-block text-center">
                {label}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StageElementStatic;

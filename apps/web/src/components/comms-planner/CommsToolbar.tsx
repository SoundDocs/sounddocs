import React from "react";
import { Radio, Wifi, Server, Headphones, Network, Router, Expand, Minimize } from "lucide-react";
import { SystemType } from "../../lib/commsTypes";

interface CommsToolbarProps {
  onAddElement: (systemType: SystemType) => void;
  onAddSwitch?: () => void;
  fitMode?: "fit" | "fill";
  onFitModeChange?: (mode: "fit" | "fill") => void;
}

const CommsToolbar: React.FC<CommsToolbarProps> = ({
  onAddElement,
  onAddSwitch,
  fitMode = "fit",
  onFitModeChange,
}) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg space-y-4">
      <div>
        <h3 className="text-lg font-medium text-white mb-4">Add Equipment</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg flex flex-col items-center justify-center transition-colors"
            onClick={() => onAddElement("FSII")}
          >
            <Radio className="h-6 w-6 mb-1" />
            <span className="text-xs">FreeSpeak II</span>
            <span className="text-xs text-gray-400">1.9/2.4 GHz</span>
          </button>

          <button
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg flex flex-col items-center justify-center transition-colors"
            onClick={() => onAddElement("FSII-Base")}
          >
            <Router className="h-6 w-6 mb-1" />
            <span className="text-xs">FSII Base Station</span>
            <span className="text-xs text-gray-400">1.9/2.4 GHz</span>
          </button>

          <button
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg flex flex-col items-center justify-center transition-colors"
            onClick={() => onAddElement("Edge")}
          >
            <Wifi className="h-6 w-6 mb-1" />
            <span className="text-xs">FreeSpeak Edge</span>
            <span className="text-xs text-gray-400">5 GHz</span>
          </button>

          <button
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg flex flex-col items-center justify-center transition-colors"
            onClick={() => onAddElement("Bolero")}
          >
            <Headphones className="h-6 w-6 mb-1" />
            <span className="text-xs">Riedel Bolero</span>
            <span className="text-xs text-gray-400">1.9/2.4 GHz</span>
          </button>

          <button
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg flex flex-col items-center justify-center transition-colors"
            onClick={() => onAddElement("Arcadia")}
          >
            <Server className="h-6 w-6 mb-1" />
            <span className="text-xs">Arcadia Station</span>
            <span className="text-xs text-gray-400">Dante/AES67</span>
          </button>

          <button
            className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg flex flex-col items-center justify-center transition-colors"
            onClick={() => onAddElement("ODIN")}
          >
            <Server className="h-6 w-6 mb-1" />
            <span className="text-xs">RTS ODIN</span>
            <span className="text-xs text-gray-400">OMNEO</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Planning Tools</h3>
        <div className="grid grid-cols-2 gap-3">
          {onAddSwitch && (
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg flex flex-col items-center justify-center transition-colors"
              onClick={onAddSwitch}
            >
              <Network className="h-6 w-6 mb-1" />
              <span className="text-xs">Add Switch</span>
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-white mb-4">Display Options</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onFitModeChange?.("fit")}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center transition-colors ${
              fitMode === "fit"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
          >
            <Minimize className="h-5 w-5 mr-2" />
            <span>Fit</span>
          </button>
          <button
            onClick={() => onFitModeChange?.("fill")}
            className={`flex-1 p-2 rounded-lg flex items-center justify-center transition-colors ${
              fitMode === "fill"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            }`}
          >
            <Expand className="h-5 w-5 mr-2" />
            <span>Fill</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommsToolbar;

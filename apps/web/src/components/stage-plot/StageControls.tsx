import React from "react";

interface StageControlsProps {
  stageSize: string;
  onStageSizeChange: (size: string) => void;
}

const StageControls: React.FC<StageControlsProps> = ({ stageSize, onStageSizeChange }) => {
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-4">Stage Size Options</h3>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-300 mb-2 text-sm">Width</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              className={`px-3 py-2 rounded-md text-sm ${
                stageSize.includes("narrow")
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => {
                const parts = stageSize.split("-");
                const currentDepth = parts.slice(0, -1).join("-");
                onStageSizeChange(`${currentDepth}-narrow`);
              }}
            >
              Narrow
            </button>
            <button
              className={`px-3 py-2 rounded-md text-sm ${
                stageSize.includes("wide")
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
              onClick={() => {
                const parts = stageSize.split("-");
                const currentDepth = parts.slice(0, -1).join("-");
                onStageSizeChange(`${currentDepth}-wide`);
              }}
            >
              Wide
            </button>
          </div>
        </div>

        <div className="col-span-2 md:col-span-4">
          <label className="block text-gray-300 mb-2 text-sm">Stage Size</label>
          <div className="grid grid-cols-5 gap-2">
            {["x-small", "small", "medium", "large", "x-large"].map((size) => {
              const parts = stageSize.split("-");
              const currentWidth = parts[parts.length - 1];
              const isActive = stageSize.startsWith(size);
              return (
                <button
                  key={size}
                  className={`px-3 py-2 rounded-md text-xs sm:text-sm ${
                    isActive
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                  onClick={() => onStageSizeChange(`${size}-${currentWidth}`)}
                >
                  {size.replace("x-", "X-")}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StageControls;

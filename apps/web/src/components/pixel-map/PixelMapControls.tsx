import React, { useMemo } from "react";
import { PixelMapData } from "../../pages/StandardPixelMapEditor";
import { ASPECT_RATIOS, RESOLUTIONS } from "../../lib/constants";

interface PixelMapControlsProps {
  mapData: PixelMapData;
  setMapData: React.Dispatch<React.SetStateAction<PixelMapData>>;
  showColorSwatches: boolean;
  setShowColorSwatches: React.Dispatch<React.SetStateAction<boolean>>;
  showGrid: boolean;
  setShowGrid: React.Dispatch<React.SetStateAction<boolean>>;
  gridColor: string;
  setGridColor: React.Dispatch<React.SetStateAction<string>>;
}

const GRID_COLORS = [
  { value: "#FFFFFF", label: "White" },
  { value: "#ef4444", label: "Red" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#10b981", label: "Green" },
];

const PixelMapControls: React.FC<PixelMapControlsProps> = ({
  mapData,
  setMapData,
  showColorSwatches,
  setShowColorSwatches,
  showGrid,
  setShowGrid,
  gridColor,
  setGridColor,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMapData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumericInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === "" ? 0 : parseInt(value, 10);
    if (!isNaN(numValue)) {
      setMapData((prev) => ({ ...prev, [name]: numValue }));
    }
  };

  const availableResolutions = useMemo(() => {
    if (mapData.aspect_ratio_preset === "custom") {
      return RESOLUTIONS;
    }
    return RESOLUTIONS.filter((r) => r.aspectRatio === mapData.aspect_ratio_preset);
  }, [mapData.aspect_ratio_preset]);

  const handleAspectRatioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (value === "custom") {
      setMapData((prev) => ({ ...prev, aspect_ratio_preset: "custom" }));
    } else {
      const [w, h] = value.split(":").map(Number);
      const compatibleResolutions = RESOLUTIONS.filter((r) => r.aspectRatio === value);
      const firstCompatible = compatibleResolutions[0] || {
        value: "custom",
        width: 1920,
        height: 1080,
      };

      setMapData((prev) => ({
        ...prev,
        aspect_ratio_preset: value,
        aspect_ratio_w: w,
        aspect_ratio_h: h,
        resolution_preset: firstCompatible.value,
        resolution_w: firstCompatible.width,
        resolution_h: firstCompatible.height,
      }));
    }
  };

  const handleResolutionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (value === "custom") {
      setMapData((prev) => ({ ...prev, resolution_preset: "custom" }));
    } else {
      const selectedResolution = RESOLUTIONS.find((r) => r.value === value);
      if (selectedResolution) {
        setMapData((prev) => ({
          ...prev,
          resolution_preset: value,
          resolution_w: selectedResolution.width,
          resolution_h: selectedResolution.height,
        }));
      }
    }
  };

  const inputClasses =
    "w-full bg-neutral-700/50 border border-border text-text rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-textSecondary transition-colors";
  const customInputClasses =
    "w-full bg-neutral-700/50 border border-border text-text rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder-textSecondary transition-colors";

  return (
    <div className="bg-surface p-6 rounded-xl space-y-6">
      <h2 className="text-xl font-bold text-text border-b border-border pb-3">Controls</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="project_name"
            className="block text-sm font-medium text-textSecondary mb-1"
          >
            Project Name
          </label>
          <input
            type="text"
            name="project_name"
            id="project_name"
            value={mapData.project_name}
            onChange={handleInputChange}
            className={inputClasses}
          />
        </div>
        <div>
          <label
            htmlFor="screen_name"
            className="block text-sm font-medium text-textSecondary mb-1"
          >
            Screen Name
          </label>
          <input
            type="text"
            name="screen_name"
            id="screen_name"
            value={mapData.screen_name}
            onChange={handleInputChange}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="aspect_ratio_preset"
          className="block text-sm font-medium text-textSecondary"
        >
          Aspect Ratio
        </label>
        <select
          name="aspect_ratio_preset"
          id="aspect_ratio_preset"
          value={mapData.aspect_ratio_preset}
          onChange={handleAspectRatioChange}
          className={inputClasses}
        >
          {ASPECT_RATIOS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {mapData.aspect_ratio_preset === "custom" && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="number"
              name="aspect_ratio_w"
              value={mapData.aspect_ratio_w}
              onChange={handleNumericInputChange}
              className={customInputClasses}
            />
            <span className="text-textSecondary">:</span>
            <input
              type="number"
              name="aspect_ratio_h"
              value={mapData.aspect_ratio_h}
              onChange={handleNumericInputChange}
              className={customInputClasses}
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="resolution_preset" className="block text-sm font-medium text-textSecondary">
          Resolution
        </label>
        <select
          name="resolution_preset"
          id="resolution_preset"
          value={mapData.resolution_preset}
          onChange={handleResolutionChange}
          className={inputClasses}
        >
          {availableResolutions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        {mapData.resolution_preset === "custom" && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="number"
              name="resolution_w"
              value={mapData.resolution_w}
              onChange={handleNumericInputChange}
              className={customInputClasses}
            />
            <span className="text-textSecondary">x</span>
            <input
              type="number"
              name="resolution_h"
              value={mapData.resolution_h}
              onChange={handleNumericInputChange}
              className={customInputClasses}
            />
          </div>
        )}
      </div>

      <div className="border-t border-border pt-6 space-y-4">
        <h3 className="text-lg font-semibold text-text">Display Options</h3>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="showColorSwatchesToggle" className="font-medium text-text">
              Color Swatches
            </label>
            <button
              type="button"
              id="showColorSwatchesToggle"
              onClick={() => setShowColorSwatches(!showColorSwatches)}
              className={`${
                showColorSwatches ? "bg-primary" : "bg-neutral-600"
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-white/50 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface`}
              role="switch"
              aria-checked={showColorSwatches}
            >
              <span className="sr-only">Use setting</span>
              <span
                aria-hidden="true"
                className={`${
                  showColorSwatches ? "translate-x-5" : "translate-x-0"
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          <p className="text-sm text-textSecondary mt-2">
            Toggle the visibility of the color and grayscale test patches.
          </p>
        </div>

        <div className="border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <label htmlFor="showGridToggle" className="font-medium text-text">
              Grid Overlay
            </label>
            <button
              type="button"
              id="showGridToggle"
              onClick={() => setShowGrid(!showGrid)}
              className={`${
                showGrid ? "bg-primary" : "bg-neutral-600"
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-white/50 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface`}
              role="switch"
              aria-checked={showGrid}
            >
              <span className="sr-only">Use setting</span>
              <span
                aria-hidden="true"
                className={`${
                  showGrid ? "translate-x-5" : "translate-x-0"
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
          <p className="text-sm text-textSecondary mt-2">
            Show a 1px grid overlay on the checkerboard pattern.
          </p>
          {showGrid && (
            <div className="pt-4 space-y-2">
              <label className="block text-sm font-medium text-textSecondary">Grid Color</label>
              <div className="grid grid-cols-4 gap-2">
                {GRID_COLORS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGridColor(value)}
                    className={`px-3 py-2 text-sm rounded-md transition-colors text-center ${
                      gridColor === value
                        ? "bg-primary text-white font-semibold"
                        : "bg-neutral-700/50 hover:bg-neutral-700 text-text"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PixelMapControls;

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Monitor, Ruler, Search, Check, AlertCircle, Projector, Zap, Target } from "lucide-react";
import {
  ASPECT_RATIOS,
  SCREEN_SIZES,
  calculateImageSize,
  convertToInches,
  convertFromInches,
  getUnitLabel,
  type ScreenData,
  type ProjectorRequirements,
  type InstallationConstraints,
  type Projector as ProjectorType,
  type Lens,
  type ScreenUnit,
} from "../../lib/lensCalculatorTypes";
import {
  fetchProjectors,
  fetchCompatibleLenses,
  fetchLensesByMountFamily,
  calculateCompatibleLenses,
  saveLensCalculation,
} from "../../lib/lensCalculatorUtils";
import debounce from "lodash.debounce";

interface LensCalculatorV2Props {
  onSave?: (calculationId: string) => void;
}

interface LensRecommendation {
  lens: Lens;
  throwDistance: number;
  minDistance: number;
  maxDistance: number;
  imageWidth: number;
  imageHeight: number;
  brightness: number;
  score: number;
  compatibility: "perfect" | "good" | "acceptable" | "warning";
}

const LensCalculatorV2: React.FC<LensCalculatorV2Props> = ({ onSave }) => {
  // Step 1: Projector Selection
  const [projectors, setProjectors] = useState<ProjectorType[]>([]);
  const [selectedProjector, setSelectedProjector] = useState<ProjectorType | null>(null);
  const [projectorSearch, setProjectorSearch] = useState("");
  const [loadingProjectors, setLoadingProjectors] = useState(false);

  // Step 2: Screen Configuration
  const [screenWidth, setScreenWidth] = useState(192); // 16 feet default in inches
  const [screenHeight, setScreenHeight] = useState(108); // 9 feet default in inches
  const [screenUnit, setScreenUnit] = useState<ScreenUnit>("inches");
  const [screenShape, setScreenShape] = useState<"rectangle" | "circle" | "rhombus" | "oval">(
    "rectangle",
  );
  const [aspectRatioIndex, setAspectRatioIndex] = useState(0);

  // Step 3: Distance Configuration
  const [projectorDistance, setProjectorDistance] = useState(25); // 25 feet default

  // Results
  const [recommendations, setRecommendations] = useState<LensRecommendation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationName, setCalculationName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Load projectors on mount
  useEffect(() => {
    const loadProjectors = async () => {
      setLoadingProjectors(true);
      try {
        const data = await fetchProjectors();
        setProjectors(data);
      } catch (error) {
        console.error("Error loading projectors:", error);
      } finally {
        setLoadingProjectors(false);
      }
    };
    loadProjectors();
  }, []);

  // Filter projectors based on search
  const filteredProjectors = useMemo(() => {
    if (!projectorSearch) return projectors;
    const search = projectorSearch.toLowerCase().trim();

    // Split search terms for multi-word searches
    const searchTerms = search.split(/\s+/);

    const filtered = projectors.filter((p) => {
      const fullText = `${p.manufacturer} ${p.series} ${p.model}`.toLowerCase();

      // Check if all search terms are found in the full text
      const allTermsFound = searchTerms.every((term) => fullText.includes(term));

      // Also check for exact matches on individual fields
      const exactFieldMatch =
        p.manufacturer.toLowerCase().includes(search) ||
        p.model.toLowerCase().includes(search) ||
        p.series.toLowerCase().includes(search);

      return allTermsFound || exactFieldMatch;
    });

    // Sort results by relevance
    filtered.sort((a, b) => {
      const aFullText = `${a.manufacturer} ${a.series} ${a.model}`.toLowerCase();
      const bFullText = `${b.manufacturer} ${b.series} ${b.model}`.toLowerCase();

      // Exact model match gets highest priority
      const aModelMatch = a.model.toLowerCase() === search;
      const bModelMatch = b.model.toLowerCase() === search;
      if (aModelMatch && !bModelMatch) return -1;
      if (!aModelMatch && bModelMatch) return 1;

      // Then check if search appears at start of model
      const aStartsWith = a.model.toLowerCase().startsWith(search);
      const bStartsWith = b.model.toLowerCase().startsWith(search);
      if (aStartsWith && !bStartsWith) return -1;
      if (!aStartsWith && bStartsWith) return 1;

      // Finally, sort alphabetically
      return aFullText.localeCompare(bFullText);
    });

    return filtered;
  }, [projectors, projectorSearch]);

  // Debounced calculation function with enhanced algorithm
  const debouncedCalculate = useCallback(
    debounce(
      async (projector: ProjectorType, screenW: number, screenH: number, distance: number) => {
        setIsCalculating(true);
        try {
          // Convert screen dimensions to feet for calculations
          const screenWidthFt = screenW / 12;
          const screenHeightFt = screenH / 12;

          // Fetch compatible lenses for this projector
          let lenses = await fetchCompatibleLenses(projector.id);

          // If no lenses found in compatibility matrix, try mount family fallback
          if (lenses.length === 0) {
            console.log("No lenses found in compatibility matrix, trying mount family fallback...");
            lenses = await fetchLensesByMountFamily(projector);
          }

          // Create screen data and installation constraints for enhanced calculation
          const screenData = {
            width: screenWidthFt,
            height: screenHeightFt,
            shape: screenShape,
            aspectRatio: `${screenW}:${screenH}`,
            gain: 1.0, // Default gain
          };

          const installationConstraints = {
            minDistance: distance * 0.9, // Allow ±10% flexibility
            maxDistance: distance * 1.1,
            lensShiftRequired: false,
            requiredVShiftPct: 0, // No offset requirements for now
            requiredHShiftPct: 0,
            environment: "indoor" as const,
          };

          // Use enhanced calculation algorithm
          const result = calculateCompatibleLenses(
            screenData,
            installationConstraints,
            lenses,
            projector.brightness_ansi || projector.brightness_center || 0, // No default fallback
            "presentation", // Default use case
          );

          // Convert to LensRecommendation format for UI compatibility
          const recs: LensRecommendation[] = result.compatibleLenses.map((cl) => {
            let compatibility: LensRecommendation["compatibility"] = "perfect";

            // Determine compatibility based on score
            if (cl.score >= 90) {
              compatibility = "perfect";
            } else if (cl.score >= 75) {
              compatibility = "good";
            } else if (cl.score >= 60) {
              compatibility = "acceptable";
            } else {
              compatibility = "warning";
            }

            // Calculate min/max distances
            const minDistance = screenWidthFt * cl.lens.throw_ratio_min;
            const maxDistance = screenWidthFt * cl.lens.throw_ratio_max;

            return {
              lens: cl.lens,
              throwDistance: cl.throwDistance,
              minDistance,
              maxDistance,
              imageWidth: screenW, // Keep in inches for UI
              imageHeight: screenH,
              brightness: cl.brightness,
              score: cl.score,
              compatibility,
            };
          });

          setRecommendations(recs);

          // Log warnings and recommendations for debugging
          if (result.warnings.length > 0) {
            console.warn("Lens calculation warnings:", result.warnings);
          }
          if (result.recommendations.length > 0) {
            console.info("Lens calculation recommendations:", result.recommendations);
          }
        } catch (error) {
          console.error("Error calculating recommendations:", error);
        } finally {
          setIsCalculating(false);
        }
      },
      500,
    ),
    [screenShape],
  );

  // Trigger calculation when inputs change
  useEffect(() => {
    if (selectedProjector) {
      debouncedCalculate(selectedProjector, screenWidth, screenHeight, projectorDistance);
    }
  }, [
    selectedProjector,
    screenWidth,
    screenHeight,
    screenUnit,
    screenShape,
    projectorDistance,
    debouncedCalculate,
  ]);

  // Handle aspect ratio change
  const handleAspectRatioChange = (index: number) => {
    setAspectRatioIndex(index);
    if (index < ASPECT_RATIOS.length - 1) {
      const ratio = ASPECT_RATIOS[index];
      const diagonal = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
      const { width, height } = calculateImageSize(diagonal, ratio.width, ratio.height);
      setScreenWidth(Math.round(width));
      setScreenHeight(Math.round(height));
    }
  };

  // Handle screen size preset
  const handleScreenSizePreset = (preset: { diagonal?: number; width?: number }) => {
    if (preset.diagonal) {
      const ratio = ASPECT_RATIOS[aspectRatioIndex];
      if (ratio.width > 0 && ratio.height > 0) {
        const { width, height } = calculateImageSize(
          preset.diagonal * 12,
          ratio.width,
          ratio.height,
        );
        setScreenWidth(Math.round(width));
        setScreenHeight(Math.round(height));
      }
    } else if (preset.width) {
      setScreenWidth(preset.width);
      const ratio = ASPECT_RATIOS[aspectRatioIndex];
      if (ratio.width > 0 && ratio.height > 0) {
        setScreenHeight(Math.round((preset.width * ratio.height) / ratio.width));
      }
    }
  };

  // Handle unit change
  const handleUnitChange = (newUnit: ScreenUnit) => {
    setScreenUnit(newUnit);
    // Keep the current dimensions but internally convert to inches for storage
    // The UI will automatically display in the new unit
  };

  // Handle dimension changes
  const handleDimensionChange = (dimension: "width" | "height", value: string) => {
    // Allow empty string or convert the entered value from current unit to inches
    if (value === "" || value === "0") {
      // Allow clearing the field or starting fresh with a new number
      if (dimension === "width") {
        setScreenWidth(0);
      } else {
        setScreenHeight(0);
      }
      return;
    }

    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      const valueInInches = convertToInches(numValue, screenUnit);
      if (dimension === "width") {
        setScreenWidth(valueInInches);
        // If aspect ratio is selected and not custom, update height accordingly
        if (aspectRatioIndex < ASPECT_RATIOS.length - 1) {
          const ratio = ASPECT_RATIOS[aspectRatioIndex];
          if (ratio.width > 0 && ratio.height > 0) {
            const newHeight = (valueInInches * ratio.height) / ratio.width;
            setScreenHeight(newHeight);
          }
        }
      } else {
        setScreenHeight(valueInInches);
        // If aspect ratio is selected and not custom, update width accordingly
        if (aspectRatioIndex < ASPECT_RATIOS.length - 1) {
          const ratio = ASPECT_RATIOS[aspectRatioIndex];
          if (ratio.width > 0 && ratio.height > 0) {
            const newWidth = (valueInInches * ratio.width) / ratio.height;
            setScreenWidth(newWidth);
          }
        }
      }
    }
  };

  // Save calculation
  const handleSave = async () => {
    if (!selectedProjector || recommendations.length === 0) return;

    setIsSaving(true);
    try {
      const screenData: ScreenData = {
        width: screenWidth / 12,
        height: screenHeight / 12,
        shape: screenShape,
        aspectRatio: `${screenWidth}:${screenHeight}`,
      };

      const projectorRequirements: ProjectorRequirements = {
        brightness: selectedProjector.brightness_ansi,
        resolution: selectedProjector.native_resolution,
        manufacturer: [selectedProjector.manufacturer],
      };

      const installationConstraints: InstallationConstraints = {
        minDistance: projectorDistance,
        maxDistance: projectorDistance,
      };

      const calculationResults = {
        compatibleLenses: recommendations.map((r) => ({
          lens: r.lens,
          throwDistance: r.throwDistance,
          imageWidth: r.imageWidth,
          imageHeight: r.imageHeight,
          brightness: r.brightness,
          score: r.score,
        })),
        warnings: [],
        recommendations: [],
      };

      const calculationId = await saveLensCalculation({
        user_id: "",
        calculation_name:
          calculationName || `${selectedProjector.model} - ${new Date().toLocaleDateString()}`,
        screen_data: screenData,
        projector_requirements: projectorRequirements,
        installation_constraints: installationConstraints,
        calculation_results: calculationResults,
      });

      if (calculationId && onSave) {
        onSave(calculationId);
      }
    } catch (error) {
      console.error("Error saving calculation:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get compatibility color
  const getCompatibilityColor = (compatibility: LensRecommendation["compatibility"]) => {
    switch (compatibility) {
      case "perfect":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "good":
        return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      case "acceptable":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "warning":
        return "text-red-400 bg-red-400/10 border-red-400/20";
    }
  };

  const getCompatibilityLabel = (compatibility: LensRecommendation["compatibility"]) => {
    switch (compatibility) {
      case "perfect":
        return "Perfect Match";
      case "good":
        return "Good Match";
      case "acceptable":
        return "Acceptable";
      case "warning":
        return "Warning";
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg">
      {/* Step 1: Projector Selection */}
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Projector className="h-5 w-5 mr-2 text-indigo-400" />
          Step 1: Select Projector
        </h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projectors (e.g. 'Barco UDM 4K22' or 'Christie M Series')"
            value={projectorSearch}
            onChange={(e) => setProjectorSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loadingProjectors ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {filteredProjectors.slice(0, 30).map((projector) => (
              <button
                key={projector.id}
                onClick={() => setSelectedProjector(projector)}
                className={`p-3 rounded-lg text-left transition-all ${
                  selectedProjector?.id === projector.id
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-650"
                }`}
              >
                <div className="font-medium">{projector.model}</div>
                <div className="text-sm opacity-75">
                  {projector.manufacturer} • {projector.brightness_ansi} lumens
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedProjector && (
          <div className="mt-4 p-4 bg-indigo-600/20 border border-indigo-600/30 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white font-medium">
                  {selectedProjector.manufacturer} {selectedProjector.model}
                </h3>
                <div className="mt-1 text-sm text-gray-300 grid grid-cols-2 gap-2">
                  <div>Brightness: {selectedProjector.brightness_ansi} lumens</div>
                  <div>Resolution: {selectedProjector.native_resolution}</div>
                  <div>Technology: {selectedProjector.technology_type}</div>
                  <div>Lens System: {selectedProjector.lens_mount_system}</div>
                </div>
              </div>
              <Check className="h-5 w-5 text-green-400" />
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Screen Configuration */}
      <div
        className={`p-6 border-b border-gray-700 ${!selectedProjector ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Monitor className="h-5 w-5 mr-2 text-indigo-400" />
          Step 2: Configure Screen
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
            <select
              value={aspectRatioIndex}
              onChange={(e) => handleAspectRatioChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {ASPECT_RATIOS.map((ratio, index) => (
                <option key={index} value={index}>
                  {ratio.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Screen Preset</label>
            <select
              onChange={(e) => {
                const preset = SCREEN_SIZES[parseInt(e.target.value)];
                if (preset) handleScreenSizePreset(preset);
              }}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              defaultValue=""
            >
              <option value="">Custom Size</option>
              {SCREEN_SIZES.map((size, index) => (
                <option key={index} value={index}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Screen Shape</label>
            <select
              value={screenShape}
              onChange={(e) =>
                setScreenShape(e.target.value as "rectangle" | "circle" | "rhombus" | "oval")
              }
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="rectangle">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="rhombus">Rhombus/Diamond</option>
              <option value="oval">Oval/Ellipse</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Units</label>
            <select
              value={screenUnit}
              onChange={(e) => handleUnitChange(e.target.value as ScreenUnit)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="inches">Inches</option>
              <option value="ft">Feet</option>
              <option value="m">Meters</option>
              <option value="mm">Millimeters</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {screenShape === "circle" ? "Diameter" : "Width"} ({getUnitLabel(screenUnit)})
            </label>
            <input
              type="number"
              step={screenUnit === "mm" ? "1" : "0.1"}
              value={
                screenWidth === 0
                  ? ""
                  : convertFromInches(screenWidth, screenUnit).toFixed(screenUnit === "mm" ? 0 : 1)
              }
              onChange={(e) => handleDimensionChange("width", e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className={screenShape === "circle" ? "opacity-50 pointer-events-none" : ""}>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {screenShape === "rhombus" ? "Height (diagonal)" : "Height"} (
              {getUnitLabel(screenUnit)})
            </label>
            <input
              type="number"
              step={screenUnit === "mm" ? "1" : "0.1"}
              value={
                screenHeight === 0
                  ? ""
                  : convertFromInches(screenHeight, screenUnit).toFixed(screenUnit === "mm" ? 0 : 1)
              }
              onChange={(e) => handleDimensionChange("height", e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {screenShape === "circle"
                  ? `⌀ ${(screenWidth / 12).toFixed(1)} ft`
                  : `${(screenWidth / 12).toFixed(1)} × ${(screenHeight / 12).toFixed(1)} ft`}
              </div>
              <div className="text-sm text-gray-400">
                {screenShape === "circle"
                  ? "Circle"
                  : screenShape === "rhombus"
                    ? "Rhombus"
                    : screenShape === "oval"
                      ? "Oval"
                      : "Rectangle"}{" "}
                Screen
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Distance Configuration */}
      <div
        className={`p-6 border-b border-gray-700 ${!selectedProjector ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Ruler className="h-5 w-5 mr-2 text-indigo-400" />
          Step 3: Set Projector Distance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Projector Distance (feet)
            </label>
            <input
              type="number"
              value={projectorDistance}
              onChange={(e) => setProjectorDistance(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-medium text-white">{projectorDistance} ft</div>
              <div className="text-sm text-gray-400">Target Distance</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Results */}
      {selectedProjector && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-400" />
              Lens Recommendations
              {isCalculating && <span className="ml-3 text-sm text-gray-400">Calculating...</span>}
            </h2>
            {recommendations.length > 0 && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Name this calculation..."
                  value={calculationName}
                  onChange={(e) => setCalculationName(e.target.value)}
                  className="px-3 py-1 bg-gray-700 text-white rounded-md text-sm"
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {recommendations.length === 0 && !isCalculating ? (
            <div className="text-center py-12 bg-gray-700/50 rounded-lg">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-300">
                No compatible lenses found for the current configuration.
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Try adjusting the distance or flexibility range.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 10).map((rec, index) => (
                <div
                  key={index}
                  className={`bg-gray-700 rounded-lg p-4 border-2 ${
                    index === 0 ? "border-indigo-500" : "border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-white font-medium flex items-center">
                        {index === 0 && <Target className="h-4 w-4 mr-2 text-indigo-400" />}
                        {rec.lens.manufacturer} {rec.lens.model}
                      </h3>
                      {rec.lens.part_number && (
                        <p className="text-sm text-gray-400">Part #: {rec.lens.part_number}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium border ${getCompatibilityColor(rec.compatibility)}`}
                      >
                        {getCompatibilityLabel(rec.compatibility)}
                      </span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">
                          {rec.minDistance === rec.maxDistance
                            ? `${rec.minDistance.toFixed(1)} ft`
                            : `${rec.minDistance.toFixed(1)}-${rec.maxDistance.toFixed(1)} ft`}
                        </div>
                        <div className="text-xs text-gray-400">Working Range</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Throw Ratio:</span>
                      <div className="text-white font-medium">
                        {rec.lens.throw_ratio_min.toFixed(2)}-{rec.lens.throw_ratio_max.toFixed(2)}
                        :1
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Distance:</span>
                      <div className="text-white font-medium">
                        {rec.throwDistance.toFixed(1)} ft
                        {Math.abs(rec.throwDistance - projectorDistance) > 0.1 && (
                          <span className="text-xs text-yellow-400 ml-1">
                            ({rec.throwDistance > projectorDistance ? "+" : ""}
                            {(rec.throwDistance - projectorDistance).toFixed(1)})
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-400">Brightness:</span>
                      <div className="text-white font-medium">{rec.brightness.toFixed(0)} ft-L</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <div className="text-white font-medium">
                        {rec.lens.lens_type} {rec.lens.zoom_type}
                      </div>
                    </div>
                  </div>

                  {/* Lens Features */}
                  <div className="flex gap-2 mt-3">
                    {rec.lens.motorized && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                        Motorized
                      </span>
                    )}
                    {rec.lens.lens_shift_v_max && rec.lens.lens_shift_v_max > 0 && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                        V-Shift: ±{rec.lens.lens_shift_v_max}%
                      </span>
                    )}
                    {rec.lens.lens_shift_h_max && rec.lens.lens_shift_h_max > 0 && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded">
                        H-Shift: ±{rec.lens.lens_shift_h_max}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LensCalculatorV2;

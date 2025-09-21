import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Monitor,
  Search,
  Check,
  AlertCircle,
  Projector,
  Zap,
  Target,
  Settings,
  Lightbulb,
  AlertTriangle,
} from "lucide-react";
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
  saveLensCalculation,
} from "../../lib/lensCalculatorUtils";
import {
  scoreLensEnhanced,
  ENHANCED_SCORING_PROFILES,
  type EnhancedScoringContext,
  type EnhancedScoringResult,
} from "../../lib/lensScoring.enhanced";
import { isSpecialUSTLens, calculateOptimalUSTInstallation } from "../../lib/ustCalculations";
import { checkMountCompatibility } from "../../lib/mountCompatibility";
import { supabase } from "../../lib/supabase";
import {
  DistanceConstraintVisualization,
  LensShiftVisualization,
  BrightnessVisualization,
} from "./ConstraintVisualization";

interface LensCalculatorV2EnhancedProps {
  onSave?: (calculationId: string) => void;
}

interface EnhancedLensRecommendation {
  lens: Lens;
  throwDistance: number;
  minDistance: number;
  maxDistance: number;
  imageWidth: number;
  imageHeight: number;
  brightness: number;
  score: number;
  confidence: number;
  compatibility: "excellent" | "good" | "acceptable" | "poor" | "incompatible";
  scoringBreakdown: EnhancedScoringResult;
  warnings: string[];
  recommendations: string[];
  installationGuidance: string[];
  ustInfo?: {
    optimalDistance: number;
    mountingHeight: number;
    tolerances: {
      distance: number;
      height: number;
      angle: number;
    };
    installationPlan: string[];
  };
  mountCompatibility?: {
    compatible: boolean;
    requiresAdapter?: boolean;
    adapterPartNumber?: string;
  };
}

interface CalculationError {
  type: "no_projector" | "no_lenses" | "invalid_constraints" | "compatibility_issues";
  message: string;
  suggestions: string[];
  quickFixes: Array<{
    label: string;
    action: () => void;
  }>;
}

const LensCalculatorV2Enhanced: React.FC<LensCalculatorV2EnhancedProps> = ({ onSave }) => {
  // Enhanced state management
  const [projectors, setProjectors] = useState<ProjectorType[]>([]);
  const [selectedProjector, setSelectedProjector] = useState<ProjectorType | null>(null);
  const [projectorSearch, setProjectorSearch] = useState("");
  const [loadingProjectors, setLoadingProjectors] = useState(false);

  // Screen configuration with enhanced validation
  const [screenWidth, setScreenWidth] = useState(192); // 16 feet default in inches
  const [screenHeight, setScreenHeight] = useState(108); // 9 feet default in inches
  const [screenUnit, setScreenUnit] = useState<ScreenUnit>("inches");
  const [screenShape, setScreenShape] = useState<"rectangle" | "circle" | "rhombus" | "oval">(
    "rectangle",
  );
  const [screenGain, setScreenGain] = useState(1.0);
  const [aspectRatioIndex, setAspectRatioIndex] = useState(0);

  // String inputs for better UX
  const [screenWidthInput, setScreenWidthInput] = useState("");
  const [screenHeightInput, setScreenHeightInput] = useState("");
  const [projectorDistanceInput, setProjectorDistanceInput] = useState("");
  const [distanceToleranceInput, setDistanceToleranceInput] = useState("");
  const [screenGainInput, setScreenGainInput] = useState("");
  const [vShiftInput, setVShiftInput] = useState("");
  const [hShiftInput, setHShiftInput] = useState("");

  // Enhanced installation constraints
  const [projectorDistance, setProjectorDistance] = useState(25);
  const [distanceTolerance, setDistanceTolerance] = useState(10); // ±10%
  const [requiredVShift, setRequiredVShift] = useState(0);
  const [requiredHShift, setRequiredHShift] = useState(0);
  const [useCase, setUseCase] = useState<keyof typeof ENHANCED_SCORING_PROFILES>("presentation");
  const [environment, setEnvironment] = useState<"indoor" | "outdoor">("indoor");

  // Enhanced results and error handling
  const [recommendations, setRecommendations] = useState<EnhancedLensRecommendation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<CalculationError | null>(null);
  const [calculationName, setCalculationName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Mobile-responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "projector" | "screen" | "constraints" | "results"
  >("projector");

  // Sync string inputs with numeric values on initialization and unit changes
  useEffect(() => {
    setScreenWidthInput(
      screenWidth === 0
        ? ""
        : convertFromInches(screenWidth, screenUnit).toFixed(screenUnit === "mm" ? 0 : 1),
    );
    setScreenHeightInput(
      screenHeight === 0
        ? ""
        : convertFromInches(screenHeight, screenUnit).toFixed(screenUnit === "mm" ? 0 : 1),
    );
  }, [screenUnit]);

  useEffect(() => {
    setProjectorDistanceInput(projectorDistance === 0 ? "" : projectorDistance.toString());
  }, [projectorDistance]);

  useEffect(() => {
    setDistanceToleranceInput(distanceTolerance === 0 ? "" : distanceTolerance.toString());
  }, [distanceTolerance]);

  useEffect(() => {
    setScreenGainInput(screenGain.toString());
  }, [screenGain]);

  useEffect(() => {
    setVShiftInput(requiredVShift === 0 ? "" : requiredVShift.toString());
  }, [requiredVShift]);

  useEffect(() => {
    setHShiftInput(requiredHShift === 0 ? "" : requiredHShift.toString());
  }, [requiredHShift]);

  // Initialize string inputs on mount
  useEffect(() => {
    setScreenWidthInput(
      convertFromInches(screenWidth, screenUnit).toFixed(screenUnit === "mm" ? 0 : 1),
    );
    setScreenHeightInput(
      convertFromInches(screenHeight, screenUnit).toFixed(screenUnit === "mm" ? 0 : 1),
    );
    setProjectorDistanceInput(projectorDistance.toString());
    setDistanceToleranceInput(distanceTolerance.toString());
    setScreenGainInput(screenGain.toString());
  }, []);

  // Auto-save calculation state to localStorage for professional workflow
  useEffect(() => {
    if (selectedProjector && screenWidth && screenHeight && projectorDistance) {
      const calculationState = {
        projectorId: selectedProjector.id,
        screenWidth,
        screenHeight,
        screenUnit,
        projectorDistance,
        distanceTolerance,
        requiredVShift,
        requiredHShift,
        useCase,
        environment,
        timestamp: Date.now(),
      };
      localStorage.setItem("lens-calculator-state", JSON.stringify(calculationState));
    }
  }, [
    selectedProjector,
    screenWidth,
    screenHeight,
    screenUnit,
    projectorDistance,
    distanceTolerance,
    requiredVShift,
    requiredHShift,
    useCase,
    environment,
  ]);

  // Load projectors on mount
  useEffect(() => {
    const loadProjectors = async () => {
      setLoadingProjectors(true);
      try {
        const data = await fetchProjectors();
        setProjectors(data);
      } catch (error) {
        console.error("Error loading projectors:", error);
        setCalculationError({
          type: "compatibility_issues",
          message: "Failed to load projector database",
          suggestions: ["Check internet connection", "Refresh the page"],
          quickFixes: [{ label: "Retry", action: () => window.location.reload() }],
        });
      } finally {
        setLoadingProjectors(false);
      }
    };
    loadProjectors();
  }, []);

  // Responsive design detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Enhanced projector filtering with manufacturer normalization
  const filteredProjectors = useMemo(() => {
    if (!projectorSearch) return [];
    const search = projectorSearch.toLowerCase().trim();
    const searchTerms = search.split(/\s+/);

    const filtered = projectors.filter((p) => {
      const fullText = `${p.manufacturer} ${p.series} ${p.model}`.toLowerCase();
      const allTermsFound = searchTerms.every((term) => fullText.includes(term));
      const exactFieldMatch =
        p.manufacturer.toLowerCase().includes(search) ||
        p.model.toLowerCase().includes(search) ||
        p.series.toLowerCase().includes(search);

      return allTermsFound || exactFieldMatch;
    });

    // Enhanced sorting with relevance scoring
    filtered.sort((a, b) => {
      const aFullText = `${a.manufacturer} ${a.series} ${a.model}`.toLowerCase();
      const bFullText = `${b.manufacturer} ${b.series} ${b.model}`.toLowerCase();

      // Prioritize 2024+ models
      const aYear = a.specifications?.year ? parseInt(a.specifications.year as string) : 2020;
      const bYear = b.specifications?.year ? parseInt(b.specifications.year as string) : 2020;
      if (aYear >= 2024 && bYear < 2024) return -1;
      if (aYear < 2024 && bYear >= 2024) return 1;

      // Then exact model match
      const aModelMatch = a.model.toLowerCase() === search;
      const bModelMatch = b.model.toLowerCase() === search;
      if (aModelMatch && !bModelMatch) return -1;
      if (!aModelMatch && bModelMatch) return 1;

      return aFullText.localeCompare(bFullText);
    });

    return filtered;
  }, [projectors, projectorSearch]);

  // Enhanced calculation function with comprehensive error handling
  const debouncedCalculate = useCallback(
    (projector: ProjectorType, screenW: number, screenH: number, distance: number) => {
      const calculate = async () => {
        setIsCalculating(true);
        setCalculationError(null);

        try {
          // Comprehensive input validation
          if (!projector) {
            throw new Error("No projector selected");
          }

          if (!projector.brightness_ansi && !projector.brightness_center) {
            throw new Error("Projector brightness information missing");
          }

          // Screen dimension validation with professional limits
          if (screenW <= 0 || screenH <= 0) {
            throw new Error("Invalid screen dimensions");
          }

          if (screenW > 1200 || screenH > 600) {
            // 100ft x 50ft max reasonable screen
            throw new Error("Screen dimensions exceed practical limits (max 100ft x 50ft)");
          }

          if (screenW < 12 || screenH < 6) {
            // 1ft x 6" minimum
            throw new Error('Screen dimensions below practical limits (min 12" x 6")');
          }

          // Distance validation with professional limits
          if (distance <= 0) {
            throw new Error("Invalid projector distance");
          }

          if (distance > 200) {
            // 200ft maximum throw
            throw new Error("Projector distance exceeds practical limits (max 200ft)");
          }

          if (distance < 1) {
            // 1ft minimum
            throw new Error("Projector distance below practical limits (min 1ft)");
          }

          // Professional ratio validation
          const throwRatio = distance / (screenW / 12);
          if (throwRatio > 10) {
            throw new Error("Throw ratio too high (>10:1) - consider shorter throw lens");
          }

          if (throwRatio < 0.1) {
            throw new Error("Throw ratio too low (<0.1:1) - may require special UST lens");
          }

          // Brightness validation
          const brightness = projector.brightness_ansi || projector.brightness_center;
          if (brightness > 50000) {
            console.warn("Very high brightness projector - ensure adequate cooling");
          }

          if (brightness < 1000) {
            console.warn("Low brightness projector - verify suitable for environment");
          }

          // Convert screen dimensions to feet for calculations
          const screenWidthFt = screenW / 12;
          const screenHeightFt = screenH / 12;

          // Fetch compatible lenses with enhanced fallback strategy
          let lenses = await fetchCompatibleLenses(projector.id);

          if (lenses.length === 0) {
            console.log("No lenses found in compatibility matrix, trying mount family fallback...");
            lenses = await fetchLensesByMountFamily(projector);
          }

          if (lenses.length === 0) {
            setCalculationError({
              type: "no_lenses",
              message: `No compatible lenses found for ${projector.manufacturer} ${projector.model}`,
              suggestions: [
                "Verify projector model is correct",
                "Check lens database for updates",
                "Consider different projector model",
              ],
              quickFixes: [
                {
                  label: "Search Similar Models",
                  action: () => setProjectorSearch(projector.manufacturer),
                },
              ],
            });
            return;
          }

          // Create enhanced screen data
          const screenData: ScreenData = {
            width: screenWidthFt,
            height: screenHeightFt,
            shape: screenShape,
            aspectRatio: `${screenW}:${screenH}`,
            gain: screenGain,
          };

          // Create enhanced installation constraints
          const installationConstraints: InstallationConstraints = {
            minDistance: distance * (1 - distanceTolerance / 100),
            maxDistance: distance * (1 + distanceTolerance / 100),
            lensShiftRequired: requiredVShift !== 0 || requiredHShift !== 0,
            requiredVShiftPct: requiredVShift,
            requiredHShiftPct: requiredHShift,
            environment: environment,
          };

          // Calculate target throw ratio
          const targetThrowRatio = distance / screenWidthFt;

          // Enhanced lens evaluation with comprehensive scoring
          const enhancedResults: EnhancedLensRecommendation[] = [];

          for (const lens of lenses) {
            try {
              // Check basic throw ratio compatibility
              if (
                targetThrowRatio < lens.throw_ratio_min ||
                targetThrowRatio > lens.throw_ratio_max
              ) {
                continue;
              }

              // Create enhanced scoring context
              const scoringContext: EnhancedScoringContext = {
                useCase,
                screenData,
                projectorLumens: projector.brightness_ansi || projector.brightness_center,
                projectorManufacturer: projector.manufacturer,
                installationConstraints,
                lens,
                targetThrowRatio,
                environmentalConditions: {
                  indoor: environment === "indoor",
                  temperature: environment === "indoor" ? 22 : 25,
                  humidity: environment === "indoor" ? 50 : 70,
                  dustLevel: environment === "indoor" ? "low" : "medium",
                },
              };

              // Get comprehensive scoring
              const scoringResult = scoreLensEnhanced(scoringContext);

              // Skip incompatible lenses
              if (scoringResult.compatibility === "incompatible") {
                continue;
              }

              // Check UST special requirements
              const ustClassification = isSpecialUSTLens(lens);
              let ustInfo = undefined;
              if (ustClassification.isUST) {
                ustInfo = calculateOptimalUSTInstallation(
                  lens,
                  screenW,
                  screenH,
                  installationConstraints,
                );
              }

              // Check mount compatibility
              const mountCompatibility = checkMountCompatibility(
                projector.lens_mount_system,
                lens.mount_family || "unknown",
                projector.manufacturer,
                lens.manufacturer,
              );

              // Calculate distances
              const throwDistance = screenWidthFt * targetThrowRatio;
              const minDistance = screenWidthFt * lens.throw_ratio_min;
              const maxDistance = screenWidthFt * lens.throw_ratio_max;

              enhancedResults.push({
                lens,
                throwDistance,
                minDistance,
                maxDistance,
                imageWidth: screenW,
                imageHeight: screenH,
                brightness: scoringResult.breakdown.brightness.actualFL,
                score: scoringResult.totalScore,
                confidence: scoringResult.confidence,
                compatibility: scoringResult.compatibility,
                scoringBreakdown: scoringResult,
                warnings: scoringResult.warnings,
                recommendations: scoringResult.recommendations,
                installationGuidance: scoringResult.installationGuidance,
                ustInfo,
                mountCompatibility,
              });
            } catch (lensError) {
              console.warn(`Error evaluating lens ${lens.model}:`, lensError);
            }
          }

          // Sort by score and confidence
          enhancedResults.sort((a, b) => {
            const scoreA = a.score * a.confidence;
            const scoreB = b.score * b.confidence;
            return scoreB - scoreA;
          });

          setRecommendations(enhancedResults);

          // Generate overall calculation warnings
          if (enhancedResults.length === 0) {
            setCalculationError({
              type: "no_lenses",
              message: "No lenses found for current configuration",
              suggestions: [
                `Adjust distance tolerance (currently ±${distanceTolerance}%)`,
                "Reduce lens shift requirements",
                "Consider different screen size",
                "Try different use case profile",
              ],
              quickFixes: [
                {
                  label: "Increase Tolerance",
                  action: () => setDistanceTolerance(Math.min(25, distanceTolerance + 5)),
                },
                {
                  label: "Reset Lens Shift",
                  action: () => {
                    setRequiredVShift(0);
                    setRequiredHShift(0);
                  },
                },
              ],
            });
          } else if (enhancedResults.length < 3) {
            console.warn(
              `Limited lens options: ${enhancedResults.length} out of ${lenses.length} total lenses`,
            );
          }
        } catch (error) {
          console.error("Enhanced calculation error:", error);
          setCalculationError({
            type: "compatibility_issues",
            message: error instanceof Error ? error.message : "Calculation failed",
            suggestions: [
              "Verify all input parameters",
              "Check projector specifications",
              "Try different configuration",
            ],
            quickFixes: [
              {
                label: "Reset to Defaults",
                action: () => {
                  setProjectorDistance(25);
                  setDistanceTolerance(10);
                  setRequiredVShift(0);
                  setRequiredHShift(0);
                  setUseCase("presentation");
                },
              },
            ],
          });
        } finally {
          setIsCalculating(false);
        }
      };

      const timeoutId = setTimeout(calculate, 500);
      return () => clearTimeout(timeoutId);
    },
    [
      screenShape,
      screenGain,
      distanceTolerance,
      requiredVShift,
      requiredHShift,
      useCase,
      environment,
    ],
  );

  // Trigger calculation when inputs change
  useEffect(() => {
    if (selectedProjector && screenWidth > 0 && screenHeight > 0) {
      const cleanup = debouncedCalculate(
        selectedProjector,
        screenWidth,
        screenHeight,
        projectorDistance,
      );
      return cleanup;
    }
  }, [
    selectedProjector,
    screenWidth,
    screenHeight,
    screenUnit,
    screenShape,
    screenGain,
    projectorDistance,
    distanceTolerance,
    requiredVShift,
    requiredHShift,
    useCase,
    environment,
    debouncedCalculate,
  ]);

  // Enhanced error display component
  const ErrorDisplay: React.FC<{ error: CalculationError }> = ({ error }) => (
    <div className="bg-gray-700 border border-red-500/30 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-red-400 font-medium mb-2">{error.message}</h3>

          {error.suggestions.length > 0 && (
            <div className="mb-3">
              <p className="text-gray-300 text-sm mb-1">Suggestions:</p>
              <ul className="text-gray-400 text-sm space-y-1">
                {error.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-gray-500">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error.quickFixes.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {error.quickFixes.map((fix, index) => (
                <button
                  key={index}
                  onClick={fix.action}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                >
                  {fix.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Enhanced lens recommendation card
  const LensRecommendationCard: React.FC<{
    recommendation: EnhancedLensRecommendation;
    index: number;
  }> = ({ recommendation, index }) => {
    const isExpanded = expandedCards.has(recommendation.lens.id);

    const toggleExpanded = () => {
      const newExpanded = new Set(expandedCards);
      if (isExpanded) {
        newExpanded.delete(recommendation.lens.id);
      } else {
        newExpanded.add(recommendation.lens.id);
      }
      setExpandedCards(newExpanded);
    };

    const getCompatibilityColor = (compatibility: EnhancedLensRecommendation["compatibility"]) => {
      switch (compatibility) {
        case "excellent":
          return "text-green-400 bg-green-400/10 border-green-400/20";
        case "good":
          return "text-blue-400 bg-blue-400/10 border-blue-400/20";
        case "acceptable":
          return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
        case "poor":
          return "text-orange-400 bg-orange-400/10 border-orange-400/20";
        case "incompatible":
          return "text-red-400 bg-red-400/10 border-red-400/20";
      }
    };

    return (
      <div
        className={`bg-gray-700 rounded-lg p-4 sm:p-6 border transition-all duration-200 hover:shadow-lg ${
          index === 0 ? "border-indigo-500 shadow-md" : "border-gray-600 hover:border-gray-500"
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-white font-medium flex items-center">
              {index === 0 && <Target className="h-4 w-4 mr-2 text-indigo-400" />}
              {recommendation.lens.manufacturer} {recommendation.lens.model}
            </h3>
            {recommendation.lens.part_number && (
              <p className="text-sm text-gray-400">Part #: {recommendation.lens.part_number}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium border ${getCompatibilityColor(recommendation.compatibility)}`}
            >
              {recommendation.compatibility.charAt(0).toUpperCase() +
                recommendation.compatibility.slice(1)}
            </span>
            <div className="text-right">
              <div className="text-lg font-bold text-white">{recommendation.score.toFixed(0)}%</div>
              <div className="text-xs text-gray-400">
                {(recommendation.confidence * 100).toFixed(0)}% conf.
              </div>
            </div>
          </div>
        </div>

        {/* Key metrics - Professional AV Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <span className="text-gray-400 block text-xs uppercase tracking-wide mb-1">
              Throw Distance
            </span>
            <div className="text-white font-semibold text-lg">
              {recommendation.throwDistance.toFixed(1)} ft
            </div>
            {Math.abs(recommendation.throwDistance - projectorDistance) > 0.1 && (
              <span className="text-xs text-yellow-400">
                ({recommendation.throwDistance > projectorDistance ? "+" : ""}
                {(recommendation.throwDistance - projectorDistance).toFixed(1)} ft variance)
              </span>
            )}
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <span className="text-gray-400 block text-xs uppercase tracking-wide mb-1">
              Lens Range
            </span>
            <div className="text-white font-semibold text-lg">
              {recommendation.minDistance.toFixed(1)}-{recommendation.maxDistance.toFixed(1)} ft
            </div>
            <span className="text-xs text-gray-400">
              {(
                ((recommendation.maxDistance - recommendation.minDistance) /
                  recommendation.minDistance) *
                100
              ).toFixed(0)}
              % flexibility
            </span>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <span className="text-gray-400 block text-xs uppercase tracking-wide mb-1">
              Brightness
            </span>
            <div className="text-white font-semibold text-lg">
              {recommendation.scoringBreakdown.breakdown.brightness.actualFL.toFixed(0)} fL
            </div>
            <span className="text-xs text-gray-400">
              Target: {recommendation.scoringBreakdown.breakdown.brightness.targetFL.toFixed(0)} fL
            </span>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <span className="text-gray-400 block text-xs uppercase tracking-wide mb-1">
              Throw Ratio
            </span>
            <div className="text-white font-semibold text-lg">
              {recommendation.lens.throw_ratio_min.toFixed(2)}-
              {recommendation.lens.throw_ratio_max.toFixed(2)}:1
            </div>
            <span className="text-xs text-gray-400">
              Current: {(projectorDistance / (screenWidth / 12)).toFixed(2)}:1
            </span>
          </div>
        </div>

        {/* Warning indicators */}
        {recommendation.warnings.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">Warnings</span>
            </div>
            <div className="text-gray-300 text-xs space-y-1">
              {recommendation.warnings.slice(0, isExpanded ? undefined : 2).map((warning, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className="text-yellow-400">•</span>
                  {warning}
                </div>
              ))}
              {!isExpanded && recommendation.warnings.length > 2 && (
                <button
                  onClick={toggleExpanded}
                  className="text-indigo-400 text-xs hover:text-indigo-300 ml-2"
                >
                  +{recommendation.warnings.length - 2} more warnings
                </button>
              )}
            </div>
          </div>
        )}

        {/* Professional lens features */}
        <div className="bg-gray-800/30 rounded-lg p-3 mb-4">
          <h4 className="text-gray-300 text-xs uppercase tracking-wide mb-2">
            Lens Specifications
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
            <div className="text-center">
              <div
                className={`w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center ${
                  recommendation.lens.motorized
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-gray-600/20 text-gray-500"
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </div>
              <div className={recommendation.lens.motorized ? "text-blue-400" : "text-gray-500"}>
                {recommendation.lens.motorized ? "Motorized" : "Manual"}
              </div>
            </div>

            {(recommendation.lens.lens_shift_v_max || 0) > 0 && (
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400">
                  ↕
                </div>
                <div className="text-purple-400">V-Shift</div>
                <div className="text-gray-400">±{recommendation.lens.lens_shift_v_max}%</div>
              </div>
            )}

            {(recommendation.lens.lens_shift_h_max || 0) > 0 && (
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-purple-500/20 text-purple-400">
                  ↔
                </div>
                <div className="text-purple-400">H-Shift</div>
                <div className="text-gray-400">±{recommendation.lens.lens_shift_h_max}%</div>
              </div>
            )}

            {recommendation.ustInfo && (
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-orange-500/20 text-orange-400">
                  UST
                </div>
                <div className="text-orange-400">Ultra Short</div>
                <div className="text-gray-400">Throw</div>
              </div>
            )}

            {recommendation.mountCompatibility?.requiresAdapter && (
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center bg-yellow-500/20 text-yellow-400">
                  ⚠
                </div>
                <div className="text-yellow-400">Adapter</div>
                <div className="text-gray-400">Required</div>
              </div>
            )}
          </div>
        </div>

        {/* Expand/collapse details */}
        <button
          onClick={toggleExpanded}
          className="w-full text-center text-indigo-400 hover:text-indigo-300 text-sm py-2 border-t border-gray-600 transition-colors"
        >
          {isExpanded ? "Show Less" : "Show Details"}
        </button>

        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-600 space-y-3">
            {/* Scoring breakdown */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">Scoring Breakdown</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Throw Ratio:</span>
                  <span className="text-white">
                    {recommendation.scoringBreakdown.breakdown.throwRatio.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Zoom Position:</span>
                  <span className="text-white">
                    {recommendation.scoringBreakdown.breakdown.zoomPosition.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Brightness:</span>
                  <span className="text-white">
                    {recommendation.scoringBreakdown.breakdown.brightness.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lens Shift:</span>
                  <span className="text-white">
                    {recommendation.scoringBreakdown.breakdown.lensShift.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ergonomics:</span>
                  <span className="text-white">
                    {recommendation.scoringBreakdown.breakdown.ergonomics.score.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Features:</span>
                  <span className="text-white">
                    {recommendation.scoringBreakdown.breakdown.specialFeatures.score.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Installation guidance */}
            {recommendation.installationGuidance.length > 0 && (
              <div>
                <h4 className="text-white text-sm font-medium mb-2">Installation Guidance</h4>
                <ul className="text-gray-300 text-xs space-y-1">
                  {recommendation.installationGuidance.map((guidance, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <Lightbulb className="h-3 w-3 text-yellow-400 mt-0.5 flex-shrink-0" />
                      {guidance}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Mount compatibility info */}
            {recommendation.mountCompatibility && (
              <div>
                <h4 className="text-white text-sm font-medium mb-2">Mount Compatibility</h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Compatible:</span>
                    <span
                      className={
                        recommendation.mountCompatibility.compatible
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {recommendation.mountCompatibility.compatible ? "Yes" : "No"}
                    </span>
                  </div>
                  {recommendation.mountCompatibility.requiresAdapter && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Adapter:</span>
                      <span className="text-yellow-400">
                        {recommendation.mountCompatibility.adapterPartNumber}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Mobile section navigation
  const SectionNavigation: React.FC = () => (
    <div className="flex bg-gray-800 rounded-lg p-1 mb-4 md:hidden">
      {(["projector", "screen", "constraints", "results"] as const).map((section) => (
        <button
          key={section}
          onClick={() => setActiveSection(section)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
            activeSection === section
              ? "bg-indigo-600 text-white"
              : "text-gray-300 hover:text-white hover:bg-gray-700"
          }`}
        >
          {section.charAt(0).toUpperCase() + section.slice(1)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 rounded-t-xl p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
              Professional Lens Calculator
            </h1>
            <p className="text-gray-300 text-sm">
              Precision lens selection for professional AV installations
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <div className="bg-gray-700 rounded-lg px-3 py-2">
              <div className="text-gray-300 text-xs font-medium">
                {recommendations.length > 0 ? `${recommendations.length} Compatible` : "Ready"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isMobile && <SectionNavigation />}

      {/* Step 1: Projector Selection */}
      <div
        className={`p-4 md:p-6 border-b border-gray-700 ${
          isMobile ? (activeSection === "projector" ? "block" : "hidden") : "block"
        }`}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Projector className="h-5 w-5 mr-2 text-indigo-400" />
          Select Projector
        </h2>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search projectors (e.g. 'Barco UDM 4K22' or 'Christie M Series')"
              value={projectorSearch}
              onChange={(e) => setProjectorSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {loadingProjectors ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
              <div className="text-gray-400 text-sm">Loading projector database...</div>
              <div className="text-gray-500 text-xs mt-1">This may take a moment</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
              {filteredProjectors.slice(0, 30).map((projector) => (
                <button
                  key={projector.id}
                  onClick={() => setSelectedProjector(projector)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    selectedProjector?.id === projector.id
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <div className="font-medium">{projector.model}</div>
                  <div className="text-sm opacity-75 flex items-center gap-2">
                    <span>{projector.manufacturer}</span>
                    <span>•</span>
                    <span>{projector.brightness_ansi} lumens</span>
                    {projector.specifications?.year &&
                      parseInt(projector.specifications.year as string) >= 2024 && (
                        <span className="px-1 py-0.5 bg-indigo-500/20 text-indigo-400 text-xs rounded">
                          2024+
                        </span>
                      )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedProjector && (
            <div className="mt-4 p-4 bg-gray-700 border border-indigo-500/30 rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium">
                    {selectedProjector.manufacturer} {selectedProjector.model}
                  </h3>
                  <div className="mt-1 text-sm text-gray-300 grid grid-cols-1 md:grid-cols-2 gap-2">
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
      </div>

      {/* Step 2: Screen Configuration */}
      <div
        className={`p-4 md:p-6 border-b border-gray-700 ${
          isMobile ? (activeSection === "screen" ? "block" : "hidden") : "block"
        } ${!selectedProjector ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Monitor className="h-5 w-5 mr-2 text-indigo-400" />
          Configure Screen
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
              <select
                value={aspectRatioIndex}
                onChange={(e) => {
                  const index = parseInt(e.target.value);
                  setAspectRatioIndex(index);
                  if (index < ASPECT_RATIOS.length - 1) {
                    const ratio = ASPECT_RATIOS[index];
                    const diagonal = Math.sqrt(
                      screenWidth * screenWidth + screenHeight * screenHeight,
                    );
                    const { width, height } = calculateImageSize(
                      diagonal,
                      ratio.width,
                      ratio.height,
                    );
                    setScreenWidth(Math.round(width));
                    setScreenHeight(Math.round(height));
                    setScreenWidthInput(
                      convertFromInches(Math.round(width), screenUnit).toFixed(
                        screenUnit === "mm" ? 0 : 1,
                      ),
                    );
                    setScreenHeightInput(
                      convertFromInches(Math.round(height), screenUnit).toFixed(
                        screenUnit === "mm" ? 0 : 1,
                      ),
                    );
                  }
                }}
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
                  if (preset) {
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
                        setScreenWidthInput(
                          convertFromInches(Math.round(width), screenUnit).toFixed(
                            screenUnit === "mm" ? 0 : 1,
                          ),
                        );
                        setScreenHeightInput(
                          convertFromInches(Math.round(height), screenUnit).toFixed(
                            screenUnit === "mm" ? 0 : 1,
                          ),
                        );
                      }
                    } else if (preset.width) {
                      setScreenWidth(preset.width);
                      const ratio = ASPECT_RATIOS[aspectRatioIndex];
                      if (ratio.width > 0 && ratio.height > 0) {
                        const newHeight = Math.round((preset.width * ratio.height) / ratio.width);
                        setScreenHeight(newHeight);
                        setScreenWidthInput(
                          convertFromInches(preset.width, screenUnit).toFixed(
                            screenUnit === "mm" ? 0 : 1,
                          ),
                        );
                        setScreenHeightInput(
                          convertFromInches(newHeight, screenUnit).toFixed(
                            screenUnit === "mm" ? 0 : 1,
                          ),
                        );
                      }
                    }
                  }
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
                onChange={(e) => setScreenUnit(e.target.value as ScreenUnit)}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="inches">Inches</option>
                <option value="ft">Feet</option>
                <option value="m">Meters</option>
                <option value="mm">Millimeters</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {screenShape === "circle" ? "Diameter" : "Width"} ({getUnitLabel(screenUnit)})
              </label>
              <input
                type="number"
                step={screenUnit === "mm" ? "1" : "0.1"}
                value={screenWidthInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setScreenWidthInput(value);

                  if (value === "") {
                    setScreenWidth(0);
                    return;
                  }

                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    const valueInInches = convertToInches(numValue, screenUnit);
                    setScreenWidth(valueInInches);
                    if (aspectRatioIndex < ASPECT_RATIOS.length - 1) {
                      const ratio = ASPECT_RATIOS[aspectRatioIndex];
                      if (ratio.width > 0 && ratio.height > 0) {
                        const newHeight = (valueInInches * ratio.height) / ratio.width;
                        setScreenHeight(newHeight);
                        setScreenHeightInput(
                          convertFromInches(newHeight, screenUnit).toFixed(
                            screenUnit === "mm" ? 0 : 1,
                          ),
                        );
                      }
                    }
                  }
                }}
                placeholder="Enter width"
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
                value={screenHeightInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setScreenHeightInput(value);

                  if (value === "") {
                    setScreenHeight(0);
                    return;
                  }

                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    const valueInInches = convertToInches(numValue, screenUnit);
                    setScreenHeight(valueInInches);
                    if (aspectRatioIndex < ASPECT_RATIOS.length - 1) {
                      const ratio = ASPECT_RATIOS[aspectRatioIndex];
                      if (ratio.width > 0 && ratio.height > 0) {
                        const newWidth = (valueInInches * ratio.width) / ratio.height;
                        setScreenWidth(newWidth);
                        setScreenWidthInput(
                          convertFromInches(newWidth, screenUnit).toFixed(
                            screenUnit === "mm" ? 0 : 1,
                          ),
                        );
                      }
                    }
                  }
                }}
                placeholder="Enter height"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Screen Gain</label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={screenGainInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setScreenGainInput(value);

                  if (value === "") {
                    setScreenGain(1.0);
                    return;
                  }

                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0.1 && numValue <= 10) {
                    setScreenGain(numValue);
                  }
                }}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-center p-4 bg-gray-700/50 rounded-lg">
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
                Screen • Gain: {screenGain}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Installation Constraints */}
      <div
        className={`p-4 md:p-6 border-b border-gray-700 ${
          isMobile ? (activeSection === "constraints" ? "block" : "hidden") : "block"
        } ${!selectedProjector ? "opacity-50 pointer-events-none" : ""}`}
      >
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
          <Settings className="h-5 w-5 mr-2 text-indigo-400" />
          Installation Constraints
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Projector Distance (feet)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                step="0.1"
                value={projectorDistanceInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setProjectorDistanceInput(value);

                  if (value === "") {
                    setProjectorDistance(0);
                    return;
                  }

                  const numValue = parseFloat(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setProjectorDistance(numValue);
                  }
                }}
                placeholder="Enter distance"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Distance Tolerance (±%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={distanceToleranceInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setDistanceToleranceInput(value);

                  if (value === "") {
                    setDistanceTolerance(0);
                    return;
                  }

                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 0) {
                    setDistanceTolerance(numValue);
                  }
                }}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="text-xs text-gray-400 mt-1">
                Range: {(projectorDistance * (1 - distanceTolerance / 100)).toFixed(1)} -{" "}
                {(projectorDistance * (1 + distanceTolerance / 100)).toFixed(1)} ft
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Use Case</label>
              <select
                value={useCase}
                onChange={(e) =>
                  setUseCase(e.target.value as keyof typeof ENHANCED_SCORING_PROFILES)
                }
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {Object.entries(ENHANCED_SCORING_PROFILES).map(([key, profile]) => (
                  <option key={key} value={key}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-400 mt-1">
                Target: {ENHANCED_SCORING_PROFILES[useCase].targetFootLamberts} fL
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Required Vertical Shift (%)
              </label>
              <input
                type="number"
                min="-100"
                max="100"
                step="1"
                value={vShiftInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setVShiftInput(value);

                  if (value === "") {
                    setRequiredVShift(0);
                    return;
                  }

                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    setRequiredVShift(numValue);
                  }
                }}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Required Horizontal Shift (%)
              </label>
              <input
                type="number"
                min="-100"
                max="100"
                step="1"
                value={hShiftInput}
                onChange={(e) => {
                  const value = e.target.value;
                  setHShiftInput(value);

                  if (value === "") {
                    setRequiredHShift(0);
                    return;
                  }

                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    setRequiredHShift(numValue);
                  }
                }}
                placeholder="0"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as "indoor" | "outdoor")}
                className="w-full px-3 py-2 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Results */}
      <div
        className={`p-4 md:p-6 ${
          isMobile ? (activeSection === "results" ? "block" : "hidden") : "block"
        }`}
      >
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
                onClick={async () => {
                  if (!selectedProjector || recommendations.length === 0) return;
                  setIsSaving(true);
                  try {
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) {
                      console.error("User not authenticated. Cannot save calculation.");
                      return;
                    }

                    const screenData: ScreenData = {
                      width: screenWidth / 12,
                      height: screenHeight / 12,
                      shape: screenShape,
                      aspectRatio: `${screenWidth}:${screenHeight}`,
                      gain: screenGain,
                    };

                    const projectorRequirements: ProjectorRequirements = {
                      brightness: selectedProjector.brightness_ansi,
                      resolution: selectedProjector.native_resolution,
                      manufacturer: [selectedProjector.manufacturer],
                    };

                    const installationConstraints: InstallationConstraints = {
                      minDistance: projectorDistance * (1 - distanceTolerance / 100),
                      maxDistance: projectorDistance * (1 + distanceTolerance / 100),
                      requiredVShiftPct: requiredVShift,
                      requiredHShiftPct: requiredHShift,
                      environment: environment,
                    };

                    const calculationResults = {
                      compatibleLenses: recommendations.slice(0, 10).map((r) => ({
                        lens: r.lens,
                        throwDistance: r.throwDistance,
                        imageWidth: r.imageWidth,
                        imageHeight: r.imageHeight,
                        brightness: r.brightness,
                        score: r.score,
                      })),
                      warnings: recommendations.flatMap((r) => r.warnings).slice(0, 10),
                      recommendations: recommendations
                        .flatMap((r) => r.recommendations)
                        .slice(0, 10),
                    };

                    const calculationId = await saveLensCalculation({
                      user_id: user.id,
                      calculation_name:
                        calculationName ||
                        `${selectedProjector.model} - ${new Date().toLocaleDateString()}`,
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
                }}
                disabled={isSaving}
                className="px-4 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          )}
        </div>

        {calculationError && <ErrorDisplay error={calculationError} />}

        {/* Constraint Visualizations */}
        {recommendations.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <DistanceConstraintVisualization
              lens={recommendations[0].lens}
              targetDistance={projectorDistance}
              screenWidth={screenWidth}
              tolerance={distanceTolerance}
            />
            <LensShiftVisualization
              lens={recommendations[0].lens}
              requiredVShift={requiredVShift}
              requiredHShift={requiredHShift}
              screenWidth={screenWidth}
              screenHeight={screenHeight}
            />
            <BrightnessVisualization
              projectorLumens={selectedProjector?.brightness_ansi || 0}
              screenSize={(screenWidth * screenHeight) / 144} // Convert to sq ft
              screenGain={screenGain}
              targetFootLamberts={ENHANCED_SCORING_PROFILES[useCase].targetFootLamberts}
              environment={environment}
            />
          </div>
        )}

        {isCalculating ? (
          <div className="flex flex-col items-center justify-center py-16 bg-gray-700/50 rounded-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
            <div className="text-white text-lg font-medium mb-2">Analyzing Lens Compatibility</div>
            <div className="text-gray-400 text-sm mb-1">
              Processing lens database and calculations...
            </div>
            <div className="text-gray-500 text-xs">This ensures accurate professional results</div>
          </div>
        ) : recommendations.length === 0 && !calculationError ? (
          <div className="text-center py-12 bg-gray-700 rounded-lg">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-300">
              {selectedProjector
                ? "Configure screen and constraints to see lens recommendations"
                : "Select a projector to begin"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Results Summary */}
            {recommendations.length > 0 && (
              <div className="bg-gray-700/50 border border-indigo-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-indigo-400 font-medium mb-1">
                      {recommendations.length} Compatible Lens
                      {recommendations.length > 1 ? "es" : ""} Found
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Ranked by compatibility score for your{" "}
                      {ENHANCED_SCORING_PROFILES[useCase].name.toLowerCase()} use case
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {recommendations[0]?.score.toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-400">Best Match</div>
                  </div>
                </div>
              </div>
            )}

            {/* Lens Cards */}
            {recommendations.slice(0, 10).map((rec, index) => (
              <LensRecommendationCard key={rec.lens.id} recommendation={rec} index={index} />
            ))}

            {recommendations.length > 10 && (
              <div className="text-center py-6">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <div className="text-gray-300 mb-2">
                    Showing top 10 of {recommendations.length} compatible lenses
                  </div>
                  <div className="text-xs text-gray-400">
                    Refine your constraints to see more specific results
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700 px-4 md:px-6 py-3 bg-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-gray-400">
          <div>Professional lens calculator for AV installations • v2.0</div>
        </div>
      </div>
    </div>
  );
};

export default LensCalculatorV2Enhanced;

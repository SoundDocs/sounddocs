/**
 * Real-time Constraint Visualization Components
 * Provides visual feedback for installation constraints, distances, and lens shift zones
 */

import React from "react";
import { AlertTriangle, CheckCircle, Target } from "lucide-react";

interface DistanceConstraintVisualizationProps {
  lens: {
    throw_ratio_min?: number;
    throw_ratio_max?: number;
  } | null;
  targetDistance: number;
  screenWidth: number;
  tolerance: number;
}

export const DistanceConstraintVisualization: React.FC<DistanceConstraintVisualizationProps> = ({
  lens,
  targetDistance,
  screenWidth,
  tolerance,
}) => {
  // Extract lens properties with null safety
  const minDistance = lens?.throw_ratio_min ? (screenWidth * lens.throw_ratio_min) / 12 : null; // Convert to feet
  const maxDistance = lens?.throw_ratio_max ? (screenWidth * lens.throw_ratio_max) / 12 : null;
  const projectorDistance = targetDistance || 0;
  const distanceTolerance = tolerance || 10;
  const unit = "ft";
  const toleranceMin = projectorDistance * (1 - distanceTolerance / 100);
  const toleranceMax = projectorDistance * (1 + distanceTolerance / 100);

  // Calculate visualization scale
  const visualMin = Math.min(toleranceMin, minDistance || toleranceMin) * 0.8;
  const visualMax = Math.max(toleranceMax, maxDistance || toleranceMax) * 1.2;
  const visualRange = visualMax - visualMin;

  // Calculate positions as percentages
  const getPosition = (value: number) => ((value - visualMin) / visualRange) * 100;

  const toleranceMinPos = getPosition(toleranceMin);
  const toleranceMaxPos = getPosition(toleranceMax);
  const targetPos = targetDistance ? getPosition(targetDistance) : getPosition(projectorDistance);
  const minPos = minDistance ? getPosition(minDistance) : null;
  const maxPos = maxDistance ? getPosition(maxDistance) : null;

  // Determine compatibility
  const isCompatible = () => {
    if (!minDistance || !maxDistance) return true;
    return toleranceMin <= maxDistance && toleranceMax >= minDistance;
  };

  const getOverlapRange = () => {
    if (!minDistance || !maxDistance) return null;
    const overlapMin = Math.max(toleranceMin, minDistance);
    const overlapMax = Math.min(toleranceMax, maxDistance);
    if (overlapMin > overlapMax) return null;
    return {
      min: overlapMin,
      max: overlapMax,
      minPos: getPosition(overlapMin),
      maxPos: getPosition(overlapMax),
    };
  };

  const overlap = getOverlapRange();
  const compatible = isCompatible();

  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {compatible ? (
          <CheckCircle className="h-4 w-4 text-green-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-400" />
        )}
        <h3 className="text-white font-medium">Distance Compatibility</h3>
      </div>

      {/* Visual distance range */}
      <div className="relative h-8 bg-gray-800 rounded mb-8">
        {/* Tolerance range (blue) */}
        <div
          className="absolute h-full bg-blue-500/30 border border-blue-500/50 rounded"
          style={{
            left: `${toleranceMinPos}%`,
            width: `${toleranceMaxPos - toleranceMinPos}%`,
          }}
        />

        {/* Lens range (gray) */}
        {minPos !== null && maxPos !== null && (
          <div
            className="absolute h-full bg-gray-500/20 border border-gray-500/40"
            style={{
              left: `${minPos}%`,
              width: `${maxPos - minPos}%`,
            }}
          />
        )}

        {/* Overlap range (green) */}
        {overlap && (
          <div
            className="absolute h-full bg-green-500/40 border border-green-500/60 rounded"
            style={{
              left: `${overlap.minPos}%`,
              width: `${overlap.maxPos - overlap.minPos}%`,
            }}
          />
        )}

        {/* Target distance marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-400"
          style={{ left: `${targetPos}%` }}
        >
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-yellow-400 rounded-full" />
        </div>

        {/* Scale markers */}
        <div className="absolute -bottom-6 left-0 text-xs text-gray-400">
          {(visualMin || 0).toFixed(1)}
          {unit}
        </div>
        <div className="absolute -bottom-6 right-0 text-xs text-gray-400 text-right">
          {(visualMax || 0).toFixed(1)}
          {unit}
        </div>

        {/* Current distance marker with improved positioning */}
        <div
          className="absolute text-xs text-yellow-400 font-medium"
          style={{
            left: `${Math.max(10, Math.min(80, targetPos))}%`,
            bottom: targetPos < 20 || targetPos > 80 ? "-24px" : "-18px",
            transform: "translateX(-50%)",
            zIndex: 20,
          }}
        >
          <div className="bg-gray-900/80 px-2 py-1 rounded border border-yellow-400/50">
            {(projectorDistance || 0).toFixed(1)}
            {unit}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-2 bg-blue-500/30 border border-blue-500/50 rounded" />
          <span className="text-gray-300">Tolerance Range</span>
        </div>
        {minDistance && maxDistance && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-gray-500/20 border border-gray-500/40" />
            <span className="text-gray-300">Lens Range</span>
          </div>
        )}
        {overlap && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 bg-green-500/40 border border-green-500/60 rounded" />
            <span className="text-gray-300">Compatible</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="w-0.5 h-2 bg-yellow-400" />
          <span className="text-gray-300">Target</span>
        </div>
      </div>

      {/* Status message */}
      <div className="mt-3 text-sm">
        {compatible ? (
          <div className="text-green-400">
            ✓ Compatible distance range found
            {overlap && (
              <span className="text-gray-300 ml-2">
                ({(overlap?.min || 0).toFixed(1)} - {(overlap?.max || 0).toFixed(1)} {unit})
              </span>
            )}
          </div>
        ) : (
          <div className="text-red-400">
            ⚠ No compatible distance range
            <div className="text-gray-300 text-xs mt-1">
              Increase tolerance or adjust constraints
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface LensShiftVisualizationProps {
  lens: {
    lens_shift_v_max?: number;
    lens_shift_h_max?: number;
    model?: string;
  } | null;
  requiredVShift: number; // percentage
  requiredHShift: number; // percentage
  screenWidth: number;
  screenHeight: number;
}

export const LensShiftVisualization: React.FC<LensShiftVisualizationProps> = ({
  lens,
  requiredVShift,
  requiredHShift,
}) => {
  // Extract lens shift capabilities with null safety
  const maxVShift = lens?.lens_shift_v_max || 0;
  const maxHShift = lens?.lens_shift_h_max || 0;
  const lensModel = lens?.model || "Unknown Lens";

  // Calculate elliptical utilization
  const vNorm = maxVShift ? (requiredVShift / maxVShift) ** 2 : 0;
  const hNorm = maxHShift ? (requiredHShift / maxHShift) ** 2 : 0;
  const ellipseFactor = vNorm + hNorm;
  const utilization = Math.sqrt(ellipseFactor);
  const feasible = ellipseFactor <= 1.0;

  // Visual scaling
  const size = 120; // SVG size
  const center = size / 2;
  const maxRadius = center - 10;

  // Calculate ellipse parameters
  const ellipseRadiusH = maxHShift > 0 ? maxRadius : 0;
  const ellipseRadiusV = maxVShift > 0 ? maxRadius : 0;

  // Required position
  const requiredX = maxHShift > 0 ? center + (requiredHShift / maxHShift) * ellipseRadiusH : center;
  const requiredY = maxVShift > 0 ? center - (requiredVShift / maxVShift) * ellipseRadiusV : center;

  const getStatusColor = () => {
    if (!feasible) return "text-red-400";
    if (utilization > 0.8) return "text-orange-400";
    if (utilization > 0.6) return "text-yellow-400";
    return "text-green-400";
  };

  const getStatusMessage = () => {
    if (!feasible) return "Shift requirements exceed lens capability";
    if (utilization > 0.8) return "Operating near shift limits - high precision required";
    if (utilization > 0.6) return "Moderate shift utilization";
    if (utilization > 0.2) return "Low shift utilization - good margin";
    return "Minimal shift required";
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        {feasible ? (
          <CheckCircle className="h-4 w-4 text-green-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-red-400" />
        )}
        <h3 className="text-white font-medium">Lens Shift Analysis</h3>
        {lensModel && <span className="text-gray-400 text-sm">({lensModel})</span>}
      </div>

      <div className="flex items-center gap-4">
        {/* SVG visualization */}
        <div className="flex-shrink-0">
          <svg width={size} height={size} className="bg-gray-800 rounded">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#374151" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width={size} height={size} fill="url(#grid)" />

            {/* Center lines */}
            <line x1={center} y1="0" x2={center} y2={size} stroke="#6B7280" strokeWidth="1" />
            <line x1="0" y1={center} x2={size} y2={center} stroke="#6B7280" strokeWidth="1" />

            {/* Lens shift capability ellipse */}
            {(ellipseRadiusH > 0 || ellipseRadiusV > 0) && (
              <ellipse
                cx={center}
                cy={center}
                rx={ellipseRadiusH}
                ry={ellipseRadiusV}
                fill="none"
                stroke={feasible ? "#10B981" : "#EF4444"}
                strokeWidth="2"
                strokeDasharray={feasible ? "none" : "4,4"}
              />
            )}

            {/* Required position */}
            <circle
              cx={requiredX}
              cy={requiredY}
              r="4"
              fill={feasible ? "#F59E0B" : "#EF4444"}
              stroke="white"
              strokeWidth="1"
            />

            {/* Center point */}
            <circle cx={center} cy={center} r="2" fill="#6B7280" />

            {/* Labels */}
            <text x={center + 5} y="15" fontSize="10" fill="#9CA3AF">
              +V
            </text>
            <text x={center + 5} y={size - 5} fontSize="10" fill="#9CA3AF">
              -V
            </text>
            <text x="5" y={center - 5} fontSize="10" fill="#9CA3AF">
              -H
            </text>
            <text x={size - 15} y={center - 5} fontSize="10" fill="#9CA3AF">
              +H
            </text>
          </svg>
        </div>

        {/* Details */}
        <div className="flex-1 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="space-y-2">
              <div>
                <span className="text-gray-400 block text-xs">Required V-Shift:</span>
                <div className="text-white font-medium">
                  {requiredVShift > 0 ? "+" : ""}
                  {requiredVShift}%
                </div>
              </div>
              <div>
                <span className="text-gray-400 block text-xs">Max V-Shift:</span>
                <div className="text-white font-medium">±{maxVShift}%</div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-gray-400 block text-xs">Required H-Shift:</span>
                <div className="text-white font-medium">
                  {requiredHShift > 0 ? "+" : ""}
                  {requiredHShift}%
                </div>
              </div>
              <div>
                <span className="text-gray-400 block text-xs">Max H-Shift:</span>
                <div className="text-white font-medium">±{maxHShift}%</div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-400 text-sm">Utilization:</span>
              <span className={`font-medium ${getStatusColor()}`}>
                {((utilization || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className={`text-sm ${getStatusColor()}`}>{getStatusMessage()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface BrightnessVisualizationProps {
  projectorLumens: number;
  screenSize: number; // square feet
  screenGain: number;
  targetFootLamberts: number;
  environment: string;
}

export const BrightnessVisualization: React.FC<BrightnessVisualizationProps> = ({
  projectorLumens,
  screenSize,
  screenGain,
  targetFootLamberts,
  environment,
}) => {
  // Calculate actual brightness using industry-standard formula
  const actualBrightness =
    projectorLumens && screenSize
      ? (() => {
          // Convert ANSI to center lumens (ANSI is typically 90% of center)
          const centerLumens = projectorLumens / 0.9;
          // Industry-standard formula: Foot-Lamberts = (Center Lumens × Screen Gain) / Screen Area (ft²)
          return (centerLumens * (screenGain || 1)) / screenSize;
        })()
      : 0;
  const targetBrightness = targetFootLamberts || 14;
  const useCase = environment || "indoor";
  const ratio = targetBrightness > 0 ? actualBrightness / targetBrightness : 0;
  const percentage = Math.min(ratio * 100, 200); // Cap at 200% for display

  const getStatusColor = () => {
    if (ratio < 0.8) return "text-red-400";
    if (ratio < 0.9) return "text-orange-400";
    if (ratio > 2.0) return "text-yellow-400";
    if (ratio > 1.5) return "text-blue-400";
    return "text-green-400";
  };

  const getStatusMessage = () => {
    if (ratio < 0.5) return "Critically insufficient brightness";
    if (ratio < 0.8) return "Below recommended brightness";
    if (ratio < 0.9) return "Slightly below target";
    if (ratio <= 1.2) return "Optimal brightness range";
    if (ratio <= 1.5) return "Above target - good margin";
    if (ratio <= 2.0) return "High brightness - consider adjustments";
    return "Excessive brightness - may cause eye strain";
  };

  return (
    <div className="bg-gray-700/50 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-blue-400" />
        <h3 className="text-white font-medium">Brightness Analysis</h3>
        <span className="text-gray-400 text-sm">({useCase})</span>
      </div>

      {/* Brightness bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>0 fL</span>
          <span>Target: {targetBrightness} fL</span>
          <span>{targetBrightness * 2} fL</span>
        </div>

        <div className="relative h-6 bg-gray-800 rounded">
          {/* Target marker */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-white" style={{ left: "50%" }}>
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-white rounded-full" />
          </div>

          {/* Actual brightness bar */}
          <div
            className={`h-full rounded transition-all duration-300 ${
              ratio < 0.8
                ? "bg-red-500/60"
                : ratio < 0.9
                  ? "bg-orange-500/60"
                  : ratio > 2.0
                    ? "bg-yellow-500/60"
                    : ratio > 1.5
                      ? "bg-blue-500/60"
                      : "bg-green-500/60"
            }`}
            style={{ width: `${Math.min(percentage / 2, 100)}%` }}
          />
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
        <div className="space-y-1">
          <span className="text-gray-400 block text-xs">Actual:</span>
          <div className={`font-medium ${getStatusColor()}`}>
            {(actualBrightness || 0).toFixed(1)} fL
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-gray-400 block text-xs">Target:</span>
          <div className="text-white font-medium">{(targetBrightness || 0).toFixed(1)} fL</div>
        </div>
        <div className="space-y-1">
          <span className="text-gray-400 block text-xs">Ratio:</span>
          <div className={`font-medium ${getStatusColor()}`}>{(ratio || 0).toFixed(2)}x</div>
        </div>
        <div className="space-y-1">
          <span className="text-gray-400 block text-xs">Screen Area:</span>
          <div className="text-white font-medium">{(screenSize || 0).toFixed(1)} ft²</div>
        </div>
      </div>

      {/* Status message */}
      <div className={`text-sm ${getStatusColor()}`}>{getStatusMessage()}</div>

      {/* Calculation details */}
      <div className="mt-2 text-xs text-gray-400">
        Formula: ({(projectorLumens || 0).toLocaleString()} ANSI ÷ 0.9) × {screenGain}x gain ÷{" "}
        {(screenSize || 0).toFixed(1)} ft² = {(actualBrightness || 0).toFixed(1)} fL
      </div>
    </div>
  );
};

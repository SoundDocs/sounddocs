/**
 * Web Worker for Lens Calculator Processing
 * Handles intensive lens evaluation calculations to prevent UI blocking
 */

// Import scoring functions (would need to be available in worker context)
// For now, we'll implement lightweight versions

self.onmessage = function (event) {
  const { type, data } = event.data;

  switch (type) {
    case "CALCULATE_LENS_RECOMMENDATIONS":
      calculateLensRecommendations(data);
      break;
    default:
      console.warn("Unknown worker message type:", type);
  }
};

function calculateLensRecommendations({ lenses, screenData, projectorData, constraints, useCase }) {
  try {
    const results = [];
    let processed = 0;

    // Process lenses in batches to allow progress updates
    const batchSize = 10;

    function processBatch(startIndex) {
      const endIndex = Math.min(startIndex + batchSize, lenses.length);

      for (let i = startIndex; i < endIndex; i++) {
        const lens = lenses[i];

        try {
          // Basic throw ratio compatibility check with input validation
          const width = Number(screenData?.width);
          const targetDistance = Number(constraints?.targetDistance);
          if (
            !Number.isFinite(width) ||
            width <= 0 ||
            !Number.isFinite(targetDistance) ||
            targetDistance <= 0
          ) {
            throw new Error(
              "Invalid input: screen width and target distance must be positive numbers",
            );
          }
          const targetThrowRatio = targetDistance / width;

          if (
            targetThrowRatio >= lens.throw_ratio_min &&
            targetThrowRatio <= lens.throw_ratio_max
          ) {
            // Calculate basic score (simplified version for worker)
            const score = calculateBasicScore(
              lens,
              targetThrowRatio,
              projectorData,
              screenData,
              useCase,
            );

            if (score > 0) {
              results.push({
                lens,
                score,
                throwDistance: screenData.width * targetThrowRatio,
                minDistance: screenData.width * lens.throw_ratio_min,
                maxDistance: screenData.width * lens.throw_ratio_max,
                compatibility: score > 80 ? "excellent" : score > 60 ? "good" : "acceptable",
                warnings: generateWarnings(lens, targetThrowRatio, constraints),
                recommendations: generateRecommendations(lens, useCase),
              });
            }
          }
        } catch (lensError) {
          console.warn(`Error processing lens ${lens.model}:`, lensError);
        }

        processed++;
      }

      // Send progress update
      self.postMessage({
        type: "PROGRESS",
        data: {
          processed,
          total: lenses.length,
          percentage: Math.round((processed / lenses.length) * 100),
        },
      });

      // Continue with next batch or finish
      if (endIndex < lenses.length) {
        setTimeout(() => processBatch(endIndex), 0); // Non-blocking
      } else {
        // Sort results by score
        results.sort((a, b) => b.score - a.score);

        // Send final results
        self.postMessage({
          type: "RESULTS",
          data: {
            recommendations: results,
            summary: {
              totalLenses: lenses.length,
              compatibleLenses: results.length,
              processingTime: Date.now() - startTime,
            },
          },
        });
      }
    }

    const startTime = Date.now();
    processBatch(0);
  } catch (error) {
    self.postMessage({
      type: "ERROR",
      data: {
        message: error.message,
        stack: error.stack,
      },
    });
  }
}

function calculateBasicScore(lens, throwRatio, projectorData, screenData, useCase) {
  let score = 100;

  // Throw ratio optimization (closer to center is better)
  const throwRatioCenter = (lens.throw_ratio_min + lens.throw_ratio_max) / 2;
  const throwRatioDeviation = Math.abs(throwRatio - throwRatioCenter) / throwRatioCenter;
  score -= throwRatioDeviation * 20;

  // Brightness adequacy (simplified) with comprehensive input validation
  const width = Number(screenData.width) || 0;
  const height = Number(screenData.height) || 0;
  const gain = Number(screenData.gain);
  const safeGain = Number.isFinite(gain) && gain > 0 ? gain : 1;
  const screenArea = width * height;
  const lumens = Number(projectorData.brightness) || 0;
  const footLamberts = screenArea > 0 ? (lumens * safeGain) / screenArea : 0;

  const targetBrightness = getTargetBrightness(useCase);
  if (footLamberts < targetBrightness * 0.8) {
    score -= 30; // Insufficient brightness
  } else if (footLamberts > targetBrightness * 2) {
    score -= 10; // Excessive brightness
  }

  // Lens shift capability bonus
  if (lens.lens_shift_v_max > 0) score += 10;
  if (lens.lens_shift_h_max > 0) score += 5;

  // Motorized lens bonus for professional use
  if (lens.motorized) score += 15;

  return Math.max(0, Math.min(100, score));
}

function getTargetBrightness(useCase) {
  const targets = {
    cinema: 14,
    presentation: 30,
    classroom: 35,
    bright_venue: 50,
    outdoor: 100,
    mapping: 25,
    museum: 20,
    simulation: 40,
  };
  return targets[useCase] || 30;
}

function generateWarnings(lens, throwRatio, constraints) {
  const warnings = [];

  // UST warnings
  if (throwRatio < 0.4) {
    warnings.push("UST lens requires precise positioning (±1mm tolerance)");
    warnings.push("Screen flatness critical - ±2mm tolerance required");
  }

  // Extreme throw ratios
  if (throwRatio > 5) {
    warnings.push("Long throw installation - consider ambient light impact");
  }

  // Lens shift limits
  if (
    constraints.requiredVShift &&
    Math.abs(constraints.requiredVShift) > (lens.lens_shift_v_max || 0)
  ) {
    warnings.push("Required vertical shift exceeds lens capability");
  }

  return warnings;
}

function generateRecommendations(lens, useCase) {
  const recommendations = [];

  if (lens.motorized) {
    recommendations.push("Motorized lens enables remote adjustment and automation");
  }

  if (useCase === "cinema" && lens.throw_ratio_max < 2) {
    recommendations.push("Consider ambient light rejection screen for short throw cinema");
  }

  if (useCase === "outdoor" && !lens.sealed) {
    recommendations.push("Verify projector/lens environmental sealing for outdoor use");
  }

  return recommendations;
}

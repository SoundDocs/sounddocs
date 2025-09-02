import React, { useRef, useEffect, useCallback, useState } from "react";
import type { FrequencyData } from "./useRta";

export interface RtaVisualizerProps {
  frequencyData: FrequencyData | null;
  width?: number;
  height?: number;
  className?: string;
  minDb?: number;
  maxDb?: number;
  minFreq?: number;
  maxFreq?: number;
  onResetView?: () => void;
}

interface ViewRange {
  minDb: number;
  maxDb: number;
  minFreq: number;
  maxFreq: number;
}

export const RtaVisualizer: React.FC<RtaVisualizerProps> = ({
  frequencyData,
  width = 800,
  height = 400,
  className = "",
  minDb = -60,
  maxDb = 20,
  minFreq = 20,
  maxFreq = 20000,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // Dynamic view range state
  const [viewRange, setViewRange] = useState<ViewRange>({
    minDb,
    maxDb,
    minFreq,
    maxFreq,
  });

  // Reset view range when props change
  useEffect(() => {
    setViewRange({ minDb, maxDb, minFreq, maxFreq });
  }, [minDb, maxDb, minFreq, maxFreq]);

  // Convert frequency to x position (logarithmic scale)
  const freqToX = useCallback(
    (freq: number): number => {
      const logMin = Math.log10(viewRange.minFreq);
      const logMax = Math.log10(viewRange.maxFreq);
      const logFreq = Math.log10(Math.max(freq, viewRange.minFreq));
      return ((logFreq - logMin) / (logMax - logMin)) * width;
    },
    [viewRange.minFreq, viewRange.maxFreq, width],
  );

  // Convert dB to y position
  const dbToY = useCallback(
    (db: number): number => {
      return height - ((db - viewRange.minDb) / (viewRange.maxDb - viewRange.minDb)) * height;
    },
    [viewRange.minDb, viewRange.maxDb, height],
  );

  // Draw frequency grid
  const drawGrid = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "#9CA3AF";

      // Frequency grid lines (logarithmic)
      const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
      frequencies.forEach((freq) => {
        if (freq >= viewRange.minFreq && freq <= viewRange.maxFreq) {
          const x = freqToX(freq);
          if (x >= 0 && x <= width) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();

            // Frequency labels
            ctx.fillText(freq >= 1000 ? `${freq / 1000}k` : `${freq}`, x + 4, height - 8);
          }
        }
      });

      // dB grid lines
      const dbStep = Math.ceil((viewRange.maxDb - viewRange.minDb) / 8);
      const startDb = Math.ceil(viewRange.minDb / dbStep) * dbStep;

      for (let db = startDb; db <= viewRange.maxDb; db += dbStep) {
        const y = dbToY(db);
        if (y >= 0 && y <= height) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();

          // dB labels
          ctx.fillText(`${db} dB`, 8, y - 4);
        }
      }
    },
    [freqToX, dbToY, width, height, viewRange],
  );

  // Draw the frequency response curve
  const drawSpectrum = useCallback(
    (ctx: CanvasRenderingContext2D, data: FrequencyData) => {
      if (!data.frequencies || !data.magnitudes) return;

      ctx.strokeStyle = "#10B981";
      ctx.lineWidth = 2;
      ctx.beginPath();

      let firstPoint = true;

      for (let i = 0; i < data.frequencies.length; i++) {
        const freq = data.frequencies[i];
        const magnitude = data.magnitudes[i];

        if (freq >= viewRange.minFreq && freq <= viewRange.maxFreq) {
          const x = freqToX(freq);
          const y = dbToY(magnitude);

          if (x >= 0 && x <= width && y >= 0 && y <= height) {
            if (firstPoint) {
              ctx.moveTo(x, y);
              firstPoint = false;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
      }

      ctx.stroke();

      // Fill under curve with gradient
      ctx.globalAlpha = 0.3;
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#10B981");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;

      // Close the path to bottom
      ctx.lineTo(freqToX(viewRange.maxFreq), height);
      ctx.lineTo(freqToX(viewRange.minFreq), height);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    },
    [freqToX, dbToY, viewRange, width, height],
  );

  // Main draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Set up high DPI rendering
    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Dark background
    ctx.fillStyle = "#1F2937";
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    drawGrid(ctx);

    // Draw spectrum if data is available
    if (frequencyData) {
      drawSpectrum(ctx, frequencyData);
    }
  }, [width, height, drawGrid, drawSpectrum, frequencyData]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="block bg-gray-800 rounded-lg border border-gray-600"
        style={{ width: `${width}px`, height: `${height}px` }}
      />

      {/* Overlay info */}
      <div className="absolute top-4 right-4 bg-gray-900/80 rounded-lg px-3 py-2 text-sm text-gray-300">
        <div>RTA - Real Time Analyzer</div>
        {frequencyData && (
          <div className="text-xs mt-1 text-gray-400">
            {frequencyData.sampleRate / 1000} kHz | FFT: {frequencyData.magnitudes.length * 2}
          </div>
        )}
      </div>

      {/* No data overlay */}
      {!frequencyData && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 rounded-lg">
          <div className="text-center text-gray-400">
            <div className="text-lg font-medium mb-2">No Audio Signal</div>
            <div className="text-sm">
              Connect an audio device and start analysis to see the spectrum
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RtaVisualizer;

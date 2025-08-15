import React, { useRef, useEffect, useCallback } from "react";
import type { TFData } from "@sounddocs/analyzer-protocol";

export interface TransferFunctionVisualizerProps {
  tfData: TFData | null;
  width?: number;
  height?: number;
  className?: string;
}

export const TransferFunctionVisualizer: React.FC<TransferFunctionVisualizerProps> = ({
  tfData,
  width = 800,
  height = 600,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  // This component will be complex. For now, we will just draw a placeholder.
  // The full implementation will follow in subsequent steps.

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Dark background
    ctx.fillStyle = "#1F2937";
    ctx.fillRect(0, 0, width, height);

    // Placeholder text
    ctx.fillStyle = "#9CA3AF";
    ctx.font = "16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Transfer Function Visualizer - Coming Soon", width / 2, height / 2);

    if (tfData) {
      ctx.fillText(`Received ${tfData.freqs.length} frequency bins.`, width / 2, height / 2 + 20);
    }
  }, [width, height, tfData]);

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
    </div>
  );
};

export default TransferFunctionVisualizer;

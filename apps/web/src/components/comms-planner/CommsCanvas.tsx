import React, { useEffect, useRef, useState } from "react";
import CommsElement, { CommsElementProps } from "./CommsElement";
import CommsBeltpack from "./CommsBeltpack";
import { Zone } from "../../lib/commsTypes";

interface CommsCanvasProps {
  elements: CommsElementProps[];
  beltpacks?: any[];
  zones?: Zone[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onElementDragStop: (id: string, x: number, y: number) => void;
  onElementRotate?: (id: string, rotation: number) => void;
  onBeltpackDragStop?: (id: string, x: number, y: number) => void;
  venueWidthFt: number;
  venueHeightFt: number;
  showGrid?: boolean;
  showCoverage?: boolean;
  showHeatmap?: boolean;
  fitMode?: "fit" | "fill";
  renderCoverageOnCanvas?: boolean; // default false
}

const CommsCanvas: React.FC<CommsCanvasProps> = ({
  elements,
  beltpacks = [],
  zones = [],
  selectedElementId,
  onSelectElement,
  onElementDragStop,
  onBeltpackDragStop,
  venueWidthFt = 100,
  venueHeightFt = 80,
  showGrid = true,
  showCoverage = true,
  showHeatmap = false,
  fitMode = "fit",
  renderCoverageOnCanvas = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [scaleY, setScaleY] = useState(1);
  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.currentTarget === e.target) {
      onSelectElement(null);
    }
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = -e.deltaY * 0.001;
    setView((v) => {
      const oldZoom = v.zoom;
      const newZoom = Math.max(0.2, Math.min(5, oldZoom * (1 + delta)));
      if (newZoom === oldZoom) return v;
      // compute world coordinates pre-zoom
      const worldX = (mouseX - v.x) / oldZoom;
      const worldY = (mouseY - v.y) / oldZoom;
      // adjust view so the same world point remains under cursor
      const newX = mouseX - worldX * newZoom;
      const newY = mouseY - worldY * newZoom;
      return { ...v, zoom: newZoom, x: newX, y: newY };
    });
  };

  // Keyboard handlers for spacebar and arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
        setIsDragging(false);
      }
    };

    const handleArrowKeys = (e: KeyboardEvent) => {
      if (e.target !== document.body) return; // Only handle when not in input fields
      const step = e.shiftKey ? 100 : 10; // Shift×10 for larger nudges
      switch (e.code) {
        case "ArrowUp":
          e.preventDefault();
          setView((v) => ({ ...v, y: v.y + step }));
          break;
        case "ArrowDown":
          e.preventDefault();
          setView((v) => ({ ...v, y: v.y - step }));
          break;
        case "ArrowLeft":
          e.preventDefault();
          setView((v) => ({ ...v, x: v.x + step }));
          break;
        case "ArrowRight":
          e.preventDefault();
          setView((v) => ({ ...v, x: v.x - step }));
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("keydown", handleArrowKeys);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("keydown", handleArrowKeys);
    };
  }, []);

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || spacePressed) {
      // Middle mouse or space + left mouse
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - view.x, y: e.clientY - view.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setView((v) => ({
        ...v,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Auto-scale venue to fit window
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Calculate scale to fit venue in container with margins
        const margin = 40; // pixels margin
        const availableWidth = containerWidth - margin * 2;
        const availableHeight = containerHeight - margin * 2;

        const safeVenueWidth = venueWidthFt || 1;
        const safeVenueHeight = venueHeightFt || 1;

        if (fitMode === "fill") {
          const newScaleX = availableWidth / safeVenueWidth;
          const newScaleY = availableHeight / safeVenueHeight;
          setScale(newScaleX);
          setScaleY(newScaleY);
          setCanvasSize({
            width: availableWidth,
            height: availableHeight,
          });
        } else {
          // Fit mode
          if (venueWidthFt > 0 && venueHeightFt > 0) {
            const scaleX = availableWidth / venueWidthFt;
            const scaleY = availableHeight / venueHeightFt;
            const newScale = Math.max(0.1, Math.min(scaleX, scaleY));

            setScale(newScale);
            setScaleY(newScale);
            setCanvasSize({
              width: venueWidthFt * newScale,
              height: venueHeightFt * newScale,
            });
          } else {
            // Handle case where dimensions are 0 or invalid
            setScale(1);
            setScaleY(1);
            setCanvasSize({ width: 0, height: 0 });
          }
        }
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [venueWidthFt, venueHeightFt, fitMode]);

  // Convert feet to pixels with zoom
  const zoomedScale = scale * view.zoom;
  const zoomedScaleY = scaleY * view.zoom;
  const ftToPx = (ft: number) => ft * zoomedScale;
  const ftToPy = (ft: number) => ft * zoomedScaleY;
  const pxToFt = (px: number) => px / zoomedScale;
  const pyToFt = (py: number) => py / zoomedScaleY;

  // Draw grid and scale indicators
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size with device pixel ratio for crisp lines
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    ctx.save();
    ctx.scale(dpr, dpr);

    if (showGrid) {
      // Draw grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;

      // Grid spacing in feet
      const gridSpacingFt = 10;

      // Vertical lines
      for (let ft = 0; ft <= venueWidthFt; ft += gridSpacingFt) {
        const x = ftToPx(ft);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let ft = 0; ft <= venueHeightFt; ft += gridSpacingFt) {
        const y = ftToPy(ft);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
      }

      // Draw major grid lines every 50 feet
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      const majorGridSpacingFt = 50;

      for (let ft = 0; ft <= venueWidthFt; ft += majorGridSpacingFt) {
        const x = ftToPx(ft);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvasSize.height);
        ctx.stroke();
      }

      for (let ft = 0; ft <= venueHeightFt; ft += majorGridSpacingFt) {
        const y = ftToPy(ft);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvasSize.width, y);
        ctx.stroke();
      }

      // Draw scale indicators
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.font = "10px sans-serif";

      // X-axis labels
      for (let ft = 0; ft <= venueWidthFt; ft += majorGridSpacingFt) {
        const x = ftToPx(ft);
        ctx.fillText(`${ft}ft`, x + 2, 12);
      }

      // Y-axis labels
      for (let ft = 0; ft <= venueHeightFt; ft += majorGridSpacingFt) {
        const y = ftToPy(ft);
        if (ft > 0) {
          ctx.fillText(`${ft}ft`, 2, y - 2);
        }
      }
    }

    if (showCoverage && !showHeatmap && renderCoverageOnCanvas) {
      elements.forEach((el) => {
        if (el.systemType === "FSII" || el.systemType === "Edge" || el.systemType === "Bolero") {
          const radiusX = ftToPx(el.coverageRadius || 30);
          const radiusY = ftToPy(el.coverageRadius || 30);
          const centerOffset = 28;
          const cx = ftToPx(el.x) + centerOffset;
          const cy = ftToPy(el.y) + centerOffset;

          // radial gradient circle (handles non-square pixels by scaling)
          ctx.save();
          // scale to turn ellipse into circle for gradient
          const k = radiusY / Math.max(1, radiusX);
          ctx.translate(cx, cy);
          ctx.scale(1, k);

          const r = Math.max(radiusX, 1);
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
          const color =
            el.systemType === "FSII"
              ? "59,130,246"
              : el.systemType === "Edge"
                ? "147,51,234"
                : "34,197,94";
          grad.addColorStop(0, `rgba(${color},0.30)`);
          grad.addColorStop(0.7, `rgba(${color},0.10)`);
          grad.addColorStop(1, `rgba(${color},0.00)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();

          // dashed border
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // reset to dpr scaling
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = "rgba(255,255,255,0.3)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      });
    }

    // Draw zones
    zones.forEach((zone) => {
      ctx.fillStyle = zone.color + "20";
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = 2;

      ctx.beginPath();
      zone.polygon.forEach((point, index) => {
        const x = ftToPx(point.x);
        const y = ftToPy(point.y);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Zone label
      if (zone.polygon.length > 0) {
        const centerX = ftToPx(zone.polygon.reduce((sum, p) => sum + p.x, 0) / zone.polygon.length);
        const centerY = ftToPy(zone.polygon.reduce((sum, p) => sum + p.y, 0) / zone.polygon.length);

        ctx.fillStyle = zone.color;
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(zone.name, centerX, centerY);
        ctx.font = "12px sans-serif";
        ctx.fillText(`${zone.bpTarget} BP target`, centerX, centerY + 16);
      }
    });

    // Draw coverage heatmap with offscreen canvas and -6dB falloff
    if (showHeatmap && showCoverage) {
      const off = document.createElement("canvas");
      off.width = canvasSize.width;
      off.height = canvasSize.height;
      const ictx = off.getContext("2d")!;
      const img = ictx.createImageData(off.width, off.height);
      const data = img.data;

      // Helper functions for path loss
      function pathLossExponent(systemType: string, band?: string): number {
        if (systemType === "Edge" || band === "5GHz") return 2.8; // 5 GHz
        if (band === "2.4GHz") return 2.2; // 2.4 GHz
        return 2.0; // 1.9 GHz / default
      }

      function refDistForMinus6dB(radiusFt: number, n: number): number {
        const scale = Math.pow(10, 6 / (10 * n));
        return radiusFt / scale;
      }

      function intensityAtDistance(d: number, dRef: number, n: number): number {
        if (d <= 0.01) return 1;
        const I = Math.pow(dRef / d, n);
        return Math.max(0, Math.min(1, I));
      }

      // Precompute antenna params in FEET
      type Ant = {
        cxFt: number;
        cyFt: number;
        dRef: number;
        n: number;
        tint: "fsii" | "edge" | "bolero";
      };

      const ANTENNA_CENTER_PX = 28;
      const antennas: Ant[] = elements
        .filter(
          (el) =>
            el.systemType === "FSII" || el.systemType === "Edge" || el.systemType === "Bolero",
        )
        .map((el) => {
          const cxFt = el.x + pxToFt(ANTENNA_CENTER_PX);
          const cyFt = el.y + pyToFt(ANTENNA_CENTER_PX);
          const rFt = el.coverageRadius || 300;
          const n = pathLossExponent(el.systemType, el.band);
          const dRef = refDistForMinus6dB(rFt, n);
          return {
            cxFt,
            cyFt,
            dRef,
            n,
            tint:
              el.systemType === "FSII" || el.systemType === "FSII-Base"
                ? "fsii"
                : el.systemType === "Edge"
                  ? "edge"
                  : "bolero",
          };
        });

      if (antennas.length) {
        const step = Math.max(2, Math.round(4 / Math.max(scale, 0.0001)));

        for (let y = 0; y < off.height; y += step) {
          const yFt = pyToFt(y);
          for (let x = 0; x < off.width; x += step) {
            const xFt = pxToFt(x);

            let accum = 0;
            let prod = 1;
            let wFSII = 0,
              wEdge = 0,
              wBolero = 0;

            for (const a of antennas) {
              const d = Math.hypot(xFt - a.cxFt, yFt - a.cyFt);
              const I = intensityAtDistance(d, a.dRef, a.n);
              prod *= 1 - I;
              if (I > 0.001) {
                if (a.tint === "fsii") wFSII = Math.max(wFSII, I);
                else if (a.tint === "edge") wEdge = Math.max(wEdge, I);
                else wBolero = Math.max(wBolero, I);
              }
            }
            accum = 1 - prod;

            if (accum > 0.02) {
              let r = 0,
                g = 0,
                b = 0,
                a = 0;

              if (accum < 0.5) {
                r = 255 * (accum * 2 * 0.2);
                g = 255 * (accum * 2);
                b = 0;
              } else {
                const t = (accum - 0.5) * 2;
                r = 255;
                g = 255 * (1 - t);
                b = 0;
              }

              const maxTint = Math.max(wFSII, wEdge, wBolero);
              if (maxTint > 0.05) {
                const bias = Math.min(0.35, maxTint * 0.35);
                if (maxTint === wFSII) {
                  r *= 1 - bias;
                  b = b + 255 * bias;
                } else if (maxTint === wEdge) {
                  r = r * (1 - bias) + 180 * bias;
                  b = b + 180 * bias;
                } else {
                  r *= 1 - bias;
                  g = Math.min(255, g + 255 * bias);
                }
              }

              a = Math.min(255, Math.floor(accum * 0.35 * 255));

              for (let yy = 0; yy < step; yy++) {
                for (let xx = 0; xx < step; xx++) {
                  const idx = ((y + yy) * off.width + (x + xx)) * 4;
                  data[idx] = r | 0;
                  data[idx + 1] = g | 0;
                  data[idx + 2] = b | 0;
                  data[idx + 3] = a | 0;
                }
              }
            }
          }
        }

        ictx.putImageData(img, 0, 0);
        ctx.drawImage(off, 0, 0);
      }
    }

    // Restore the initial canvas state
    ctx.restore();
  }, [
    canvasSize,
    scale,
    showGrid,
    showCoverage,
    showHeatmap,
    zones,
    elements,
    venueWidthFt,
    venueHeightFt,
  ]);

  return (
    <div
      className="bg-gray-850 rounded-lg border border-gray-700 overflow-hidden relative flex items-center justify-center"
      style={{ height: "100%", width: "100%", minHeight: "400px" }}
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="relative bg-gray-900 mx-auto"
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})`,
          transformOrigin: "0 0",
        }}
        onClick={handleCanvasClick}
      >
        {/* Background canvas for grid, zones, and heatmap */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        />

        {/* Coverage circles for individual transceivers */}
        {showCoverage &&
          !showHeatmap &&
          !renderCoverageOnCanvas &&
          elements.map((element) => {
            if (
              element.systemType === "FSII" ||
              element.systemType === "Edge" ||
              element.systemType === "Bolero"
            ) {
              const radiusX = ftToPx(element.coverageRadius || 30);
              const radiusY = ftToPy(element.coverageRadius || 30);
              // The element is 56px wide (w-14), so center is at 28px offset
              const elementCenterOffset = 28;
              const centerX = ftToPx(element.x) + elementCenterOffset;
              const centerY = ftToPy(element.y) + elementCenterOffset;
              return (
                <div
                  key={`coverage-${element.id}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    left: centerX - radiusX,
                    top: centerY - radiusY,
                    width: radiusX * 2,
                    height: radiusY * 2,
                    background: `radial-gradient(circle, 
                    ${
                      element.systemType === "FSII"
                        ? "rgba(59, 130, 246, 0.3)"
                        : element.systemType === "Edge"
                          ? "rgba(147, 51, 234, 0.3)"
                          : "rgba(34, 197, 94, 0.3)"
                    } 0%, 
                    transparent 70%)`,
                    border: "1px dashed rgba(255, 255, 255, 0.3)",
                  }}
                />
              );
            }
            return null;
          })}

        {/* Connection lines between beltpacks and transceivers */}
        <svg
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          {beltpacks.map((beltpack) => {
            if (beltpack.transceiverRef) {
              const transceiver = elements.find((el) => el.id === beltpack.transceiverRef);
              if (transceiver) {
                // Calculate positions with element centering offsets
                const transceiverCenterOffset = 28; // 56px width / 2
                const transceiverX = ftToPx(transceiver.x) + transceiverCenterOffset;
                const transceiverY = ftToPy(transceiver.y) + transceiverCenterOffset;
                const beltpackX = ftToPx(beltpack.x) + 20; // 40px width / 2
                const beltpackY = ftToPy(beltpack.y) + 20; // Center on icon (40px height / 2)

                return (
                  <line
                    key={`connection-${beltpack.id}`}
                    x1={beltpackX}
                    y1={beltpackY}
                    x2={transceiverX}
                    y2={transceiverY}
                    stroke="rgba(59, 130, 246, 0.6)"
                    strokeWidth="2"
                    strokeDasharray={beltpack.online ? "none" : "5,5"}
                  />
                );
              }
            }
            return null;
          })}
        </svg>

        {/* Transceiver elements */}
        {elements.map((element) => (
          <CommsElement
            key={element.id}
            {...element}
            x={ftToPx(element.x)}
            y={ftToPy(element.y)}
            selected={selectedElementId === element.id}
            onClick={onSelectElement}
            onDragStop={(id, xPx, yPx) => onElementDragStop(id, pxToFt(xPx), pyToFt(yPx))}
          />
        ))}

        {/* Beltpacks */}
        {beltpacks.map((beltpack) => (
          <CommsBeltpack
            key={beltpack.id}
            {...beltpack}
            x={ftToPx(beltpack.x)}
            y={ftToPy(beltpack.y)}
            selected={selectedElementId === beltpack.id}
            onClick={onSelectElement}
            onDragStop={
              onBeltpackDragStop
                ? (id: string, xPx: number, yPx: number) =>
                    onBeltpackDragStop(id, pxToFt(xPx), pyToFt(yPx))
                : undefined
            }
          />
        ))}

        {/* Scale indicator */}
        <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 p-2 rounded text-white text-sm">
          <div className="flex items-center gap-2">
            <div style={{ width: "80px" }} className="h-0.5 bg-white"></div>
            <span>{scale > 0 ? `${Math.round(pxToFt(80))}ft` : "..."}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Venue: {venueWidthFt} × {venueHeightFt} ft
          </div>
        </div>

        {/* Legend */}
        <div className="absolute top-4 right-4 bg-gray-800 bg-opacity-90 p-2 rounded text-white text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>FSII</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span>Edge (5 GHz)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Bolero</span>
          </div>
          {beltpacks.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Beltpack</span>
            </div>
          )}
        </div>

        {/* Coverage analysis summary */}
        {elements.length > 0 && (
          <div className="absolute top-4 left-4 bg-gray-800 bg-opacity-90 p-2 rounded text-white text-xs">
            <div className="font-semibold mb-1">Coverage Analysis</div>
            <div className="space-y-1">
              <div>
                Transceivers:{" "}
                {
                  elements.filter(
                    (e) =>
                      e.systemType !== "Arcadia" &&
                      e.systemType !== "ODIN" &&
                      e.systemType !== "FSII-Base",
                  ).length
                }
              </div>
              <div>
                Total capacity: {elements.reduce((sum, e) => sum + (e.maxBeltpacks || 0), 0)} BP
              </div>
              <div>
                Active BPs: {elements.reduce((sum, e) => sum + (e.currentBeltpacks || 0), 0)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommsCanvas;

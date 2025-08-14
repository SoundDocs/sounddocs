import React, { useEffect, useRef, useState } from "react";
import StageElement, { StageElementProps } from "./StageElement";

interface StageCanvasProps {
  stageSize: string;
  elements: StageElementProps[];
  selectedElementId: string | null;
  backgroundImage: string | null;
  backgroundOpacity: number;
  onSelectElement: (id: string | null) => void;
  onElementDragStop: (id: string, x: number, y: number) => void;
  onElementRotate: (id: string, rotation: number) => void;
  onElementLabelChange: (id: string, label: string) => void;
  onElementDelete: (id: string) => void;
  onElementDuplicate?: (id: string) => void;
  onElementResize?: (id: string, width: number, height: number) => void;
  isViewMode: boolean; // Prop from parent
}

const StageCanvas: React.FC<StageCanvasProps> = ({
  stageSize,
  elements,
  selectedElementId,
  backgroundImage,
  backgroundOpacity,
  onSelectElement,
  onElementDragStop,
  onElementRotate,
  onElementLabelChange,
  onElementDelete,
  onElementDuplicate,
  onElementResize,
  isViewMode, // Use this prop
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [startDistance, setStartDistance] = useState<null | number>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Removed internal isViewMode state: const [isViewMode, setIsViewMode] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Removed setIsViewMode(mobile); // Component now relies on the prop for view mode
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isMobile) return;

    const container = containerRef.current;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const distance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY,
        );
        setStartDistance(distance);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && startDistance !== null) {
        e.preventDefault();

        const distance = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY,
        );

        const delta = distance / startDistance;
        const newScale = Math.min(Math.max(scale * delta, 0.5), 2);

        setScale(newScale);
        setStartDistance(distance);
      }
    };

    const handleTouchEnd = () => {
      setStartDistance(null);
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, scale, startDistance]);

  const getStageDimensions = () => {
    switch (stageSize) {
      case "x-small-narrow":
        return { width: 300, height: 300 };
      case "x-small-wide":
        return { width: 500, height: 300 };
      case "small-narrow":
        return { width: 400, height: 400 };
      case "small-wide":
        return { width: 600, height: 400 };
      case "medium-narrow":
        return { width: 500, height: 500 };
      case "medium-wide":
        return { width: 800, height: 500 };
      case "large-narrow":
        return { width: 600, height: 600 };
      case "large-wide":
        return { width: 1000, height: 600 };
      case "x-large-narrow":
        return { width: 700, height: 700 };
      case "x-large-wide":
        return { width: 1200, height: 700 };
      default:
        return { width: 800, height: 500 };
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isViewMode) return; // Use prop

    if (e.currentTarget === e.target) {
      onSelectElement(null);
    }
  };

  useEffect(() => {
    setScale(1);
  }, [stageSize]);

  const dimensions = getStageDimensions();
  const mobileCanvasPadding = 16;
  const getCanvasWidth = () => {
    if (isMobile) {
      return `calc(100vw - ${mobileCanvasPadding * 2}px)`;
    }
    return `${dimensions.width}px`;
  };

  return (
    <div
      className="bg-gray-850 rounded-lg border border-gray-700 overflow-auto canvas-container"
      style={{ maxHeight: "65vh" }}
      ref={containerRef}
    >
      <div className="flex flex-col items-center">
        {isMobile && (
          <div className="text-xs text-gray-400 py-2">
            {isViewMode // Use prop
              ? "Pinch to zoom. View only."
              : "Pinch to zoom. Drag elements to position."}
          </div>
        )}
        <div className="flex justify-center mb-2 w-full">
          <div className="bg-gray-800/80 text-white text-xs md:text-sm px-4 py-1.5 rounded-full shadow-md">
            Back of Stage
          </div>
        </div>
        <div
          className="relative mx-auto bg-grid-pattern overflow-hidden"
          style={{
            width: isMobile ? getCanvasWidth() : `${dimensions.width}px`,
            height: `${dimensions.height}px`,
            minWidth: isMobile ? getCanvasWidth() : `${dimensions.width}px`,
            minHeight: `${dimensions.height}px`,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: "transform 0.1s ease-out",
          }}
          onClick={handleCanvasClick}
        >
          {backgroundImage && (
            <div
              className="absolute inset-0 bg-center bg-no-repeat bg-contain pointer-events-none"
              style={{
                backgroundImage: `url(${backgroundImage})`,
                opacity: backgroundOpacity / 100,
                zIndex: 1,
              }}
            />
          )}

          {elements.map((element) => (
            <StageElement
              key={element.id}
              {...element}
              selected={selectedElementId === element.id}
              onClick={onSelectElement}
              onDragStop={onElementDragStop}
              onRotate={onElementRotate}
              onLabelChange={onElementLabelChange}
              onDelete={onElementDelete}
              onDuplicate={onElementDuplicate}
              onResize={onElementResize}
              disabled={isViewMode} // Use prop
            />
          ))}
        </div>
        <div className="flex justify-center mt-2 w-full">
          <div className="bg-gray-800/80 text-white text-xs md:text-sm px-4 py-1.5 rounded-full shadow-md">
            Front of Stage / Audience
          </div>
        </div>
        {isMobile && (
          <div className="flex justify-center gap-3 py-3">
            <button
              onClick={() => setScale(Math.max(scale - 0.1, 0.5))}
              className="bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-white text-xl leading-none"
            >
              -
            </button>
            <button
              onClick={() => setScale(1)}
              className="bg-gray-700 rounded px-3 py-1 text-white text-sm"
            >
              Reset
            </button>
            <button
              onClick={() => setScale(Math.min(scale + 0.1, 2))}
              className="bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center text-white text-xl leading-none"
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StageCanvas;

import React from "react";
import { LedPixelMapData, PreviewOptions } from "../../pages/LedPixelMapEditor";

interface LedPixelMapPreviewProps extends LedPixelMapData, PreviewOptions {
  aspectWidth: number;
  aspectHeight: number;
}

// Tetromino shapes, their rotations, and classic colors
const tetrisShapes = {
  I: {
    color: "#2dd4bf", // Cyan
    blocks: [
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ],
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [0, 3],
      ],
    ],
  },
  O: {
    color: "#facc15", // Yellow
    blocks: [
      [
        [0, 0],
        [0, 1],
        [1, 0],
        [1, 1],
      ],
    ],
  },
  T: {
    color: "#a78bfa", // Purple
    blocks: [
      [
        [0, 1],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [0, 1],
        [1, 1],
        [1, 2],
      ],
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [1, 1],
      ],
      [
        [0, 1],
        [1, 1],
        [1, 2],
        [1, 0],
      ],
    ],
  },
  L: {
    color: "#fb923c", // Orange
    blocks: [
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 2],
      ],
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [0, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [2, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
    ],
  },
  J: {
    color: "#60a5fa", // Blue
    blocks: [
      [
        [1, 0],
        [1, 1],
        [1, 2],
        [0, 2],
      ],
      [
        [0, 0],
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
      ],
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [2, 1],
      ],
    ],
  },
  S: {
    color: "#4ade80", // Green
    blocks: [
      [
        [1, 0],
        [2, 0],
        [0, 1],
        [1, 1],
      ],
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
    ],
  },
  Z: {
    color: "#f87171", // Red
    blocks: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [2, 1],
      ],
      [
        [1, 0],
        [0, 1],
        [1, 1],
        [0, 2],
      ],
    ],
  },
};
const shapeKeys = Object.keys(tetrisShapes);

const LedPixelMapPreview: React.FC<LedPixelMapPreviewProps> = ({
  projectName = "SoundDocs",
  mapWidth,
  mapHeight,
  panelWidth,
  panelHeight,
  screenName,
  aspectWidth,
  aspectHeight,
  displayMode,
  showScreenInfo,
  showStats,
  showFooter,
  showGuides,
}) => {
  const width = mapWidth * panelWidth;
  const height = mapHeight * panelHeight;
  const totalPixels = width * height;
  const aspectRatio = width / height;

  const viewBoxWidth = 2000;
  const viewBoxHeight = 2000 / aspectRatio;

  const panelViewWidth = viewBoxWidth / mapWidth;
  const panelViewHeight = viewBoxHeight / mapHeight;

  const tetrisGrid = React.useMemo(() => {
    if (displayMode !== "tetris") return [];

    const grid: (string | null)[][] = Array(mapHeight)
      .fill(null)
      .map(() => Array(mapWidth).fill(null));

    // Simple deterministic pseudo-random number generator based on map dimensions
    // This ensures the pattern is the same for the same dimensions, but changes if dimensions change.
    let seed = mapWidth * 31 + mapHeight * 73;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let r = 0; r < mapHeight; r++) {
      for (let c = 0; c < mapWidth; c++) {
        if (grid[r][c] === null) {
          const shapeKey = shapeKeys[Math.floor(random() * shapeKeys.length)];
          const shapeInfo = tetrisShapes[shapeKey as keyof typeof tetrisShapes];
          const rotation = shapeInfo.blocks[Math.floor(random() * shapeInfo.blocks.length)];

          let canPlace = true;
          const shapeCells: [number, number][] = [];
          for (const [dr, dc] of rotation) {
            const newR = r + dr;
            const newC = c + dc;
            if (newR >= mapHeight || newC >= mapWidth || grid[newR]?.[newC] !== null) {
              canPlace = false;
              break;
            }
            shapeCells.push([newR, newC]);
          }

          if (canPlace) {
            for (const [cellR, cellC] of shapeCells) {
              grid[cellR][cellC] = shapeInfo.color;
            }
          }
        }
      }
    }

    // Fill any remaining gaps with a 75% gray color
    for (let r = 0; r < mapHeight; r++) {
      for (let c = 0; c < mapWidth; c++) {
        if (grid[r][c] === null) {
          grid[r][c] = "#BFBFBF";
        }
      }
    }

    return grid as string[][];
  }, [mapWidth, mapHeight, displayMode]);

  const getPanelColor = (colIndex: number, rowIndex: number): string => {
    if (displayMode === "white") {
      return "#FFFFFF";
    }
    if (displayMode === "tetris") {
      return tetrisGrid[rowIndex]?.[colIndex] ?? "#BFBFBF";
    }

    const progress = mapWidth > 1 ? colIndex / (mapWidth - 1) : 0;

    if (displayMode === "gradient") {
      const hue = progress * 360;
      return `hsl(${hue}, 100%, 50%)`;
    }
    if (displayMode === "gradient-pastel") {
      const hue = progress * 360;
      return `hsl(${hue}, 75%, 75%)`;
    }
    if (displayMode === "gradient-evil") {
      const hue = (270 + progress * 130) % 360;
      return `hsl(${hue}, 90%, 55%)`;
    }
    if (displayMode === "gradient-ocean") {
      const hue = 180 + progress * 60;
      return `hsl(${hue}, 85%, 60%)`;
    }
    // Default to 'grid'
    return (rowIndex + colIndex) % 2 === 0 ? "#2F2F2F" : "#262626";
  };

  const panelStrokeColor = displayMode === "white" ? "black" : "white";

  const panels = Array.from({ length: mapHeight }, (_, rowIndex) =>
    Array.from({ length: mapWidth }, (_, colIndex) => ({
      x: colIndex * panelViewWidth,
      y: rowIndex * panelViewHeight,
      label: `${String.fromCharCode(65 + colIndex)},${rowIndex + 1}`,
      color: getPanelColor(colIndex, rowIndex),
    })),
  ).flat();

  const fontSize = Math.min(panelViewWidth, panelViewHeight) * 0.2;
  const infoBoxScale = viewBoxWidth / 1920;

  return (
    <div style={{ aspectRatio: `${width} / ${height}`, background: "#171717" }}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="gridPattern" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="#222226" />
            <rect x="50" width="50" height="50" fill="#242830" />
            <rect y="50" width="50" height="50" fill="#242830" />
            <rect x="50" y="50" width="50" height="50" fill="#222226" />
          </pattern>
        </defs>
        <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#gridPattern)" />
        <rect
          x="0"
          y="0"
          width={viewBoxWidth}
          height={viewBoxHeight}
          fill="none"
          stroke="white"
          strokeWidth="4"
        />

        {/* Panel Grid */}
        {panels.map((panel, i) => (
          <g key={i}>
            <rect
              x={panel.x}
              y={panel.y}
              width={panelViewWidth}
              height={panelViewHeight}
              fill={panel.color}
              stroke={panelStrokeColor}
              strokeWidth="1"
            />
            <text
              x={panel.x + panelViewWidth / 2}
              y={panel.y + panelViewHeight / 2}
              dy=".3em"
              fontFamily="Inter, sans-serif"
              fontSize={fontSize}
              fill="white"
              textAnchor="middle"
              style={{ mixBlendMode: "difference" }}
            >
              {panel.label}
            </text>
          </g>
        ))}

        {/* Guide Lines */}
        {showGuides && (
          <g fill="none" strokeWidth="2" strokeDasharray="10 10">
            <line
              x1={viewBoxWidth / 2}
              y1="0"
              x2={viewBoxWidth / 2}
              y2={viewBoxHeight}
              stroke="#A3A3A3"
            />
            <line
              x1="0"
              y1={viewBoxHeight / 2}
              x2={viewBoxWidth}
              y2={viewBoxHeight / 2}
              stroke="#A3A3A3"
            />
            <line x1="0" y1="0" x2={viewBoxWidth} y2={viewBoxHeight} stroke="#FFFFFF" />
            <line x1={viewBoxWidth} y1="0" x2="0" y2={viewBoxHeight} stroke="#FFFFFF" />
            <circle
              cx={viewBoxWidth / 2}
              cy={viewBoxHeight / 2}
              r={Math.min(viewBoxWidth, viewBoxHeight) * 0.25}
              stroke="#A3A3A3"
            />
            <circle
              cx={viewBoxWidth / 2}
              cy={viewBoxHeight / 2}
              r={Math.min(viewBoxWidth, viewBoxHeight) * 0.375}
              stroke="#A3A3A3"
            />
          </g>
        )}

        {/* Center Info Box (Screen Name & Resolution) */}
        {showScreenInfo && (
          <g transform={`translate(${viewBoxWidth / 2}, ${viewBoxHeight / 2})`}>
            <rect
              x={-250 * infoBoxScale}
              y={-50 * infoBoxScale}
              width={500 * infoBoxScale}
              height={100 * infoBoxScale}
              rx={15 * infoBoxScale}
              fill="rgba(23, 23, 23, 0.9)"
              stroke="#9E7FFF"
              strokeWidth={3 * infoBoxScale}
            />
            <text
              y="-5 * infoBoxScale"
              dy=".3em"
              fontFamily="Inter, sans-serif"
              fill="#FFFFFF"
              textAnchor="middle"
              fontSize={40 * infoBoxScale}
              fontWeight="bold"
            >
              {screenName}
            </text>
            <text
              y="35 * infoBoxScale"
              fontFamily="Inter, sans-serif"
              fontSize={24 * infoBoxScale}
              fill="#A3A3A3"
              textAnchor="middle"
            >
              {`${width}x${height}px`}
            </text>
          </g>
        )}

        {/* Bottom Info Group */}
        {showStats && (
          <g transform={`translate(${viewBoxWidth / 2}, ${viewBoxHeight - 100 * infoBoxScale})`}>
            <rect
              x={-350 * infoBoxScale}
              y={-45 * infoBoxScale}
              width={700 * infoBoxScale}
              height={90 * infoBoxScale}
              rx={15 * infoBoxScale}
              fill="rgba(23, 23, 23, 0.9)"
              stroke="#444"
              strokeWidth={2 * infoBoxScale}
            />
            <text fontFamily="Inter, sans-serif" textAnchor="middle" fill="#A3A3A3">
              <tspan x="0" y={-10 * infoBoxScale} fontSize={22 * infoBoxScale}>
                <tspan fill="#FFFFFF" fontWeight="bold">{`Panels: ${mapWidth}x${mapHeight}`}</tspan>
                <tspan dx="1.5em">{`•`}</tspan>
                <tspan
                  dx="1.5em"
                  fill="#FFFFFF"
                  fontWeight="bold"
                >{`Aspect Ratio: ${aspectWidth}:${aspectHeight}`}</tspan>
              </tspan>
              <tspan x="0" y={25 * infoBoxScale} fontSize={18 * infoBoxScale}>
                Total Pixels:{" "}
                <tspan fontWeight="bold" fill="#FFFFFF">
                  {totalPixels.toLocaleString()}
                </tspan>
              </tspan>
            </text>
          </g>
        )}

        {/* Footer Branding */}
        {showFooter && (
          <g>
            <rect
              y={viewBoxHeight - 40 * infoBoxScale}
              width={viewBoxWidth}
              height={40 * infoBoxScale}
              fill="rgba(23, 23, 23, 0.85)"
            />
            <text
              x={15 * infoBoxScale}
              y={viewBoxHeight - 15 * infoBoxScale}
              fontFamily="Inter, sans-serif"
              fontSize={16 * infoBoxScale}
              fill="#A3A3A3"
              textAnchor="start"
            >
              {projectName}
            </text>
            <text
              x={viewBoxWidth - 15 * infoBoxScale}
              y={viewBoxHeight - 15 * infoBoxScale}
              fontFamily="Inter, sans-serif"
              fontSize={16 * infoBoxScale}
              fill="#A3A3A3"
              textAnchor="end"
            >
              Generated by{" "}
              <tspan fontWeight="bold" fill="#9E7FFF">
                SoundDocs
              </tspan>
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default LedPixelMapPreview;

interface LedMapSvgProps {
  width: number;
  height: number;
  projectName: string;
  screenName: string;
  mapWidth: number;
  mapHeight: number;
  panelWidth: number;
  panelHeight: number;
  aspectWidth: number;
  aspectHeight: number;
  displayMode: string;
  showScreenInfo: boolean;
  showStats: boolean;
  showFooter: boolean;
  showGuides: boolean;
}

const tetrisShapes = {
  I: {
    color: "#2dd4bf",
    blocks: [
      [
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [3, 0],
        ],
      ],
      [
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3],
        ],
      ],
    ],
  },
  O: {
    color: "#facc15",
    blocks: [
      [
        [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ],
      ],
    ],
  },
  T: {
    color: "#a78bfa",
    blocks: [
      [
        [
          [0, 1],
          [1, 0],
          [1, 1],
          [2, 1],
        ],
      ],
      [
        [
          [1, 0],
          [0, 1],
          [1, 1],
          [1, 2],
        ],
      ],
      [
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [1, 1],
        ],
      ],
      [
        [
          [0, 1],
          [1, 1],
          [1, 2],
          [1, 0],
        ],
      ],
    ],
  },
  L: {
    color: "#fb923c",
    blocks: [
      [
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [1, 2],
        ],
      ],
      [
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [0, 1],
        ],
      ],
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [1, 2],
        ],
      ],
      [
        [
          [2, 0],
          [0, 1],
          [1, 1],
          [2, 1],
        ],
      ],
    ],
  },
  J: {
    color: "#60a5fa",
    blocks: [
      [
        [
          [1, 0],
          [1, 1],
          [1, 2],
          [0, 2],
        ],
      ],
      [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [2, 1],
        ],
      ],
      [
        [
          [0, 0],
          [0, 1],
          [0, 2],
          [1, 0],
        ],
      ],
      [
        [
          [0, 0],
          [1, 0],
          [2, 0],
          [2, 1],
        ],
      ],
    ],
  },
  S: {
    color: "#4ade80",
    blocks: [
      [
        [
          [1, 0],
          [2, 0],
          [0, 1],
          [1, 1],
        ],
      ],
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [2, 1],
        ],
      ],
    ],
  },
  Z: {
    color: "#f87171",
    blocks: [
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [2, 1],
        ],
      ],
      [
        [
          [1, 0],
          [0, 1],
          [1, 1],
          [0, 2],
        ],
      ],
    ],
  },
};
const shapeKeys = Object.keys(tetrisShapes);

function generateTetrisGrid(mapWidth: number, mapHeight: number): string[][] {
  const grid: (string | null)[][] = Array(mapHeight)
    .fill(null)
    .map(() => Array(mapWidth).fill(null));
  let seed = mapWidth * 31 + mapHeight * 73;
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  for (let r = 0; r < mapHeight; r++) {
    for (let c = 0; c < mapWidth; c++) {
      if (grid[r][c] === null) {
        const shapeKey = shapeKeys[
          Math.floor(random() * shapeKeys.length)
        ] as keyof typeof tetrisShapes;
        const shapeInfo = tetrisShapes[shapeKey];
        const rotation = shapeInfo.blocks[Math.floor(random() * shapeInfo.blocks.length)][0];

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
  return grid.map((row) => row.map((cell) => cell ?? "#BFBFBF"));
}

export function createLedPixelMapSvg(props: LedMapSvgProps): string {
  const {
    width,
    height,
    projectName,
    screenName,
    mapWidth,
    mapHeight,
    aspectWidth,
    aspectHeight,
    displayMode,
    showScreenInfo,
    showStats,
    showFooter,
    showGuides,
  } = props;

  const totalPixels = width * height;
  const aspectRatio = width / height;
  const viewBoxWidth = 2000;
  const viewBoxHeight = 2000 / aspectRatio;
  const panelViewWidth = viewBoxWidth / mapWidth;
  const panelViewHeight = viewBoxHeight / mapHeight;
  const fontSize = Math.min(panelViewWidth, panelViewHeight) * 0.2;
  const infoBoxScale = viewBoxWidth / 1920;

  const tetrisGrid = displayMode === "tetris" ? generateTetrisGrid(mapWidth, mapHeight) : [];

  const getPanelColor = (colIndex: number, rowIndex: number): string => {
    if (displayMode === "white") return "#FFFFFF";
    if (displayMode === "tetris") return tetrisGrid[rowIndex]?.[colIndex] ?? "#BFBFBF";
    const progress = mapWidth > 1 ? colIndex / (mapWidth - 1) : 0;
    if (displayMode === "gradient") return `hsl(${progress * 360}, 100%, 50%)`;
    if (displayMode === "gradient-pastel") return `hsl(${progress * 360}, 75%, 75%)`;
    if (displayMode === "gradient-evil") return `hsl(${(270 + progress * 130) % 360}, 90%, 55%)`;
    if (displayMode === "gradient-ocean") return `hsl(${180 + progress * 60}, 85%, 60%)`;
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

  const panelsSvg = panels
    .map(
      (panel, i) => `
    <g key="${i}">
      <rect
        x="${panel.x}" y="${panel.y}"
        width="${panelViewWidth}" height="${panelViewHeight}"
        fill="${panel.color}" stroke="${panelStrokeColor}" stroke-width="1"
      />
      <text
        x="${panel.x + panelViewWidth / 2}" y="${panel.y + panelViewHeight / 2}"
        dy=".3em" font-family="Inter, sans-serif" font-size="${fontSize}"
        fill="white" text-anchor="middle" style="mix-blend-mode: difference;"
      >
        ${panel.label}
      </text>
    </g>
  `,
    )
    .join("");

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap');
        </style>
      </defs>
      <rect width="${viewBoxWidth}" height="${viewBoxHeight}" fill="#171717" />
      <rect x="0" y="0" width="${viewBoxWidth}" height="${viewBoxHeight}" fill="none" stroke="white" stroke-width="4" />

      ${panelsSvg}

      ${
        showGuides
          ? `
        <g fill="none" stroke-width="2" stroke-dasharray="10 10">
          <line x1="${viewBoxWidth / 2}" y1="0" x2="${viewBoxWidth / 2}" y2="${viewBoxHeight}" stroke="#A3A3A3" />
          <line x1="0" y1="${viewBoxHeight / 2}" x2="${viewBoxWidth}" y2="${viewBoxHeight / 2}" stroke="#A3A3A3" />
          <line x1="0" y1="0" x2="${viewBoxWidth}" y2="${viewBoxHeight}" stroke="#FFFFFF" />
          <line x1="${viewBoxWidth}" y1="0" x2="0" y2="${viewBoxHeight}" stroke="#FFFFFF" />
          <circle cx="${viewBoxWidth / 2}" cy="${viewBoxHeight / 2}" r="${Math.min(viewBoxWidth, viewBoxHeight) * 0.25}" stroke="#A3A3A3" />
          <circle cx="${viewBoxWidth / 2}" cy="${viewBoxHeight / 2}" r="${Math.min(viewBoxWidth, viewBoxHeight) * 0.375}" stroke="#A3A3A3" />
        </g>
      `
          : ""
      }

      ${
        showScreenInfo
          ? `
        <g transform="translate(${viewBoxWidth / 2}, ${viewBoxHeight / 2})">
          <rect
            x="${-250 * infoBoxScale}" y="${-50 * infoBoxScale}"
            width="${500 * infoBoxScale}" height="${100 * infoBoxScale}"
            rx="${15 * infoBoxScale}" fill="rgba(23, 23, 23, 0.9)"
            stroke="#9E7FFF" stroke-width="${3 * infoBoxScale}"
          />
          <text y="${-5 * infoBoxScale}" dy=".3em" font-family="Inter, sans-serif" fill="#FFFFFF" text-anchor="middle" font-size="${40 * infoBoxScale}" font-weight="bold">
            ${screenName}
          </text>
          <text y="${35 * infoBoxScale}" font-family="Inter, sans-serif" font-size="${24 * infoBoxScale}" fill="#A3A3A3" text-anchor="middle">
            ${width}x${height}px
          </text>
        </g>
      `
          : ""
      }

      ${
        showStats
          ? `
        <g transform="translate(${viewBoxWidth / 2}, ${viewBoxHeight - 100 * infoBoxScale})">
          <rect
            x="${-350 * infoBoxScale}" y="${-45 * infoBoxScale}"
            width="${700 * infoBoxScale}" height="${90 * infoBoxScale}"
            rx="${15 * infoBoxScale}" fill="rgba(23, 23, 23, 0.9)"
            stroke="#444" stroke-width="${2 * infoBoxScale}"
          />
          <text font-family="Inter, sans-serif" text-anchor="middle" fill="#A3A3A3">
            <tspan x="0" y="${-10 * infoBoxScale}" font-size="${22 * infoBoxScale}">
              <tspan fill="#FFFFFF" font-weight="bold">Panels: ${mapWidth}x${mapHeight}</tspan>
              <tspan dx="1.5em">•</tspan>
              <tspan dx="1.5em" fill="#FFFFFF" font-weight="bold">Aspect Ratio: ${aspectWidth}:${aspectHeight}</tspan>
            </tspan>
            <tspan x="0" y="${25 * infoBoxScale}" font-size="${18 * infoBoxScale}">
              Total Pixels: <tspan font-weight="bold" fill="#FFFFFF">${totalPixels.toLocaleString()}</tspan>
            </tspan>
          </text>
        </g>
      `
          : ""
      }

      ${
        showFooter
          ? `
        <g>
          <rect y="${viewBoxHeight - 40 * infoBoxScale}" width="${viewBoxWidth}" height="${40 * infoBoxScale}" fill="rgba(23, 23, 23, 0.85)" />
          <text x="${15 * infoBoxScale}" y="${viewBoxHeight - 15 * infoBoxScale}" font-family="Inter, sans-serif" font-size="${16 * infoBoxScale}" fill="#A3A3A3" text-anchor="start">
            ${projectName}
          </text>
          <text x="${viewBoxWidth - 15 * infoBoxScale}" y="${viewBoxHeight - 15 * infoBoxScale}" font-family="Inter, sans-serif" font-size="${16 * infoBoxScale}" fill="#A3A3A3" text-anchor="end">
            Generated by <tspan font-weight="bold" fill="#9E7FFF">SoundDocs</tspan>
          </text>
        </g>
      `
          : ""
      }
    </svg>
  `;
}

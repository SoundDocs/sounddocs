import React from 'react';
import { PixelMapData } from '../../pages/StandardPixelMapEditor';

const StandardPixelMapPreview: React.FC<PixelMapData> = ({
  project_name,
  screen_name,
  resolution_w,
  resolution_h,
}) => {
  const width = resolution_w || 1920;
  const height = resolution_h || 1080;

  const barYPos = Math.max(30, height * 0.05);
  const patchSize = Math.min(width * 0.08, height * 0.08);
  const labelFontSize = Math.max(12, patchSize * 0.15);
  const patchSpacing = patchSize * 0.25;

  const colorPatches = [
    // Grayscale Ramp
    { color: '#FFFFFF', label: 'White' },
    { color: '#C0C0C0', label: '75%' },
    { color: '#808080', label: '50%' },
    { color: '#404040', label: '25%' },
    { color: '#000000', label: 'Black' },
    // Primary Colors (Additive)
    { color: '#FF0000', label: 'Red' },
    { color: '#00FF00', label: 'Green' },
    { color: '#0000FF', label: 'Blue' },
    // Secondary Colors (Subtractive)
    { color: '#FFFF00', label: 'Yellow' },
    { color: '#00FFFF', label: 'Cyan' },
    { color: '#FF00FF', label: 'Magenta' },
  ];

  const totalPatchesWidth = colorPatches.length * patchSize + (colorPatches.length - 1) * patchSpacing;
  const barXPos = (width - totalPatchesWidth) / 2;

  const scale = Math.min(width, height) / 1080;
  const boxWidth = 400 * scale;
  const boxHeight = 200 * scale;
  const boxX = (width - boxWidth) / 2;
  const boxY = (height - boxHeight) / 2;
  const logoScale = 2.5 * scale;
  const logoStrokeWidth = 1.5 / 2.5;
  const titleFontSize = 32 * scale;
  const resolutionFontSize = 24 * scale;

  return (
    <div style={{ aspectRatio: `${width} / ${height}`, background: '#171717' }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
        <defs>
          <pattern id="gridPattern" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="#222226" />
            <rect x="50" width="50" height="50" fill="#242830" />
            <rect y="50" width="50" height="50" fill="#242830" />
            <rect x="50" y="50" width="50" height="50" fill="#222226" />
          </pattern>
        </defs>
        
        <rect width={width} height={height} fill="url(#gridPattern)" />

        {/* Guides and Markers */}
        <line x1={width / 2} y1="0" x2={width / 2} y2={height} stroke="#A3A3A3" strokeWidth="2" strokeDasharray="10 10" />
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="#A3A3A3" strokeWidth="2" strokeDasharray="10 10" />
        <line x1="0" y1="0" x2={width} y2={height} stroke="#FFFFFF" strokeWidth="2" strokeDasharray="10 10" />
        <line x1={width} y1="0" x2="0" y2={height} stroke="#FFFFFF" strokeWidth="2" strokeDasharray="10 10" />
        <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.25} fill="none" stroke="#A3A3A3" strokeWidth="2" strokeDasharray="10 10" />
        <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.375} fill="none" stroke="#A3A3A3" strokeWidth="2" strokeDasharray="10 10" />

        {/* Color & Grayscale Patches */}
        <g transform={`translate(${barXPos}, ${barYPos})`}>
          {colorPatches.map((patch, index) => {
            const patchX = index * (patchSize + patchSpacing);
            return (
              <g key={patch.label}>
                <rect x={patchX} y={0} width={patchSize} height={patchSize} fill={patch.color} stroke="#A3A3A3" strokeWidth="2" rx="4" />
                <text x={patchX + patchSize / 2} y={patchSize + labelFontSize + 10} fontFamily="Inter" fontSize={labelFontSize} fill="#A3A3A3" textAnchor="middle">
                  {patch.label.toUpperCase()}
                </text>
              </g>
            );
          })}
        </g>

        {/* Center Info Box */}
        <rect x={boxX} y={boxY} width={boxWidth} height={boxHeight} rx={20 * scale} fill="rgba(23, 23, 23, 0.9)" stroke="#9E7FFF" strokeWidth={3 * scale} />

        {/* Screen Name */}
        <text x={width / 2} y={height / 2 - 40 * scale} fontFamily="Inter" fontSize={titleFontSize} fill="#FFFFFF" textAnchor="middle">
          {screen_name.toUpperCase()}
        </text>

        {/* Logo */}
        <g transform={`translate(${width / 2}, ${height / 2}) scale(${logoScale})`}>
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" transform="translate(-12, -12)" stroke="#9E7FFF" strokeWidth={logoStrokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        {/* Resolution */}
        <text x={width / 2} y={height / 2 + 55 * scale} fontFamily="Inter" fontSize={resolutionFontSize} fill="#A3A3A3" textAnchor="middle">
          {`W ${width} x H ${height}`}
        </text>

        {/* Footer Branding */}
        <rect y={height - 40} width={width} height={40} fill="rgba(23, 23, 23, 0.85)" />
        <text x="15" y={height - 15} fontFamily="Inter" fontSize="16" fill="#A3A3A3" textAnchor="start">
          {project_name}
        </text>
        <text x={width - 15} y={height - 15} fontFamily="Inter" fontSize="16" fill="#A3A3A3" textAnchor="end">
          Generated by{' '}
          <tspan fontWeight="bold" fill="#9E7FFF">
            SoundDocs
          </tspan>
        </text>
      </svg>
    </div>
  );
};

export default StandardPixelMapPreview;

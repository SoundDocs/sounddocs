import React, { forwardRef } from 'react';
import { Bookmark, Layout, Clock } from 'lucide-react';
import { StageElementProps } from './stage-plot/StageElement';
import { Mic, Music, Speaker, Square, Type, Users, Headphones, Volume2, Piano, Guitar, Blinds as Violin, Drum, Plug, CircleEllipsis } from 'lucide-react';

interface StagePlotExportProps {
  stagePlot: {
    name: string;
    created_at: string;
    last_edited?: string;
    stage_size: string;
    elements: any[]; // Use any[] for now as element structure might vary slightly
    backgroundImage?: string;
    backgroundOpacity?: number;
  };
}

// Default dimensions for elements if not specified
const getDefaultDimensions = (type: string) => {
  if (
    type === 'electric-guitar' ||
    type === 'acoustic-guitar' ||
    type === 'bass-guitar' ||
    type === 'keyboard' ||
    type === 'drums' ||
    type === 'percussion' ||
    type === 'violin' ||
    type === 'cello' ||
    type === 'trumpet' ||
    type === 'saxophone' ||
    type === 'generic-instrument'
  ) {
    return { width: 64, height: 64 };
  }

  switch (type) {
    case 'microphone':
      return { width: 32, height: 32 };
    case 'power-strip':
      return { width: 64, height: 24 };
    case 'monitor-wedge':
      return { width: 48, height: 32 };
    case 'amplifier':
      return { width: 56, height: 40 };
    case 'speaker':
      return { width: 40, height: 64 };
    case 'di-box':
      return { width: 24, height: 24 };
    case 'iem':
      return { width: 32, height: 32 };
    case 'person':
      return { width: 40, height: 40 };
    case 'text':
      return { width: 120, height: 40 };
    default:
      return { width: 40, height: 40 };
  }
};


const StagePlotExport = forwardRef<HTMLDivElement, StagePlotExportProps>(({ stagePlot }, ref) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get stage dimensions
  const getStageDimensions = (stageSize: string) => {
    // Using fixed pixel values for consistency
    switch (stageSize) {
      case 'x-small-narrow':
        return { width: 300, height: 300 };
      case 'x-small-wide':
        return { width: 500, height: 300 };
      case 'small-narrow':
        return { width: 400, height: 400 };
      case 'small-wide':
        return { width: 600, height: 400 };
      case 'medium-narrow':
        return { width: 500, height: 500 };
      case 'medium-wide':
        return { width: 800, height: 500 };
      case 'large-narrow':
        return { width: 600, height: 600 };
      case 'large-wide':
        return { width: 1000, height: 600 };
      case 'x-large-narrow':
        return { width: 700, height: 700 };
      case 'x-large-wide':
        return { width: 1200, height: 700 };
      case 'small': // Handle legacy sizes
        return { width: 600, height: 400 };
      case 'medium': // Handle legacy sizes
        return { width: 800, height: 500 };
      case 'large': // Handle legacy sizes
        return { width: 1000, height: 600 };
      default: // Default to medium-wide if size is unknown
        return { width: 800, height: 500 };
    }
  };

  // Function to render element
  const renderElement = (element: any) => {
    const defaultDims = getDefaultDimensions(element.type);
    const elementWidth = element.width || defaultDims.width;
    const elementHeight = element.height || defaultDims.height;

    // Calculate label width based on element size
    const getLabelWidth = () => {
      // Return proportional width based on element size
      return Math.max(60, elementWidth * 1.2); // 120% of width, min 60px
    };

    // Scale font size based on element dimensions
    const getFontSize = () => {
      if (element.type === 'text') {
        // For text elements, scale font size based on height
        return Math.max(12, Math.min(18, elementHeight * 0.3)); // 30% of height, min 12px, max 18px
      } else {
        // For other elements, scale based on width
        return Math.max(10, Math.min(14, elementWidth * 0.2)); // 20% of width, min 10px, max 14px
      }
    };

    // Get element styles based on type
    const getElementStyles = () => {
      // Instrument types
      if (
        element.type === 'electric-guitar' ||
        element.type === 'acoustic-guitar' ||
        element.type === 'bass-guitar' ||
        element.type === 'keyboard' ||
        element.type === 'drums' ||
        element.type === 'percussion' ||
        element.type === 'violin' ||
        element.type === 'cello' ||
        element.type === 'trumpet' ||
        element.type === 'saxophone' ||
        element.type === 'generic-instrument'
      ) {
        return {
          className: `rounded-lg flex items-center justify-center`,
          style: {
            backgroundColor: element.color || '#4f46e5',
            width: `${elementWidth}px`, // Use calculated width
            height: `${elementHeight}px` // Use calculated height
          }
        };
      }

      // Other specific types
      switch (element.type) {
        case 'microphone':
          return {
            className: 'rounded-full flex items-center justify-center',
            style: {
              backgroundColor: element.color || '#4f46e5',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`
            }
          };
        case 'power-strip':
          return {
            className: 'rounded-sm flex items-center justify-center',
            style: {
              backgroundColor: element.color || '#dc2626',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`
            }
          };
        case 'monitor-wedge':
          return {
            className: 'monitor-wedge flex items-center justify-center transform rotate-[15deg]',
            style: {
              backgroundColor: element.color || '#16a34a',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`
            }
          };
        case 'amplifier':
          return {
            className: 'rounded-md flex items-center justify-center',
            style: {
              backgroundColor: element.color || '#7e22ce',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`
            }
          };
        case 'speaker':
          return {
            className: 'rounded-md flex items-center justify-center',
            style: {
              backgroundColor: element.color || '#0891b2',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`
            }
          };
        case 'di-box':
          return {
            className: 'rounded-sm flex items-center justify-center',
            style: {
              backgroundColor: element.color || '#eab308',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`
            }
          };
        case 'iem':
          return {
            className: 'rounded-full flex items-center justify-center',
            style: {
              backgroundColor: element.color || '#ea580c',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`
            }
          };
        case 'person':
          return {
            className: 'rounded-full flex items-center justify-center',
            style: {
              backgroundColor: element.color || '#be185d',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`
            }
          };
        case 'text':
          return {
            className: 'text-label',
            style: {
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }
          };
        default:
          return {
            className: 'rounded-md flex items-center justify-center',
            style: {
              backgroundColor: element.color || '#6b7280',
              width: `${elementWidth}px`,
              height: `${elementHeight}px`
            }
          };
      }
    };

    // Get icon for element type, scale based on size
    const getIconForType = () => {
      const iconSize = Math.max(12, Math.min(24, elementWidth * 0.5)); // Scale icon size based on width

      switch (element.type) {
        case 'microphone':
          return <Mic style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'power-strip':
          return <Plug style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'electric-guitar':
        case 'acoustic-guitar':
        case 'bass-guitar':
          return <Guitar style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'keyboard':
          return <Piano style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'drums':
        case 'percussion':
          return <Drum style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'violin':
        case 'cello':
          return <Violin style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'trumpet':
        case 'saxophone':
          return <Music style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'generic-instrument':
          return <CircleEllipsis style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'amplifier':
          return <Volume2 style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'monitor-wedge':
          return (
            <svg viewBox="0 0 24 24" style={{ width: `${iconSize}px`, height: `${iconSize}px` }} stroke="white" strokeWidth="2" fill="none">
              <path d="M4 6h16l-2 10H6L4 6z" />
              <path d="M4 6l-2 3" />
              <path d="M20 6l2 3" />
            </svg>
          );
        case 'speaker':
          return <Speaker style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'di-box':
          return <Square style={{ height: `${iconSize * 0.75}px`, width: `${iconSize * 0.75}px` }} className="text-white" />; // Slightly smaller
        case 'iem':
          return <Headphones style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'person':
          return <Users style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        case 'text':
          return <Type style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
        default:
          return null;
      }
    };

    const styles = getElementStyles();
    const labelWidth = getLabelWidth();
    const fontSize = getFontSize();

    return (
      <div
        key={element.id}
        style={{
          position: 'absolute',
          left: `${element.x}px`,
          top: `${element.y}px`,
          // Apply width/height to the container for correct positioning and rotation origin
          width: `${elementWidth}px`,
          height: `${elementHeight}px`,
          transform: `rotate(${element.rotation}deg)`,
          transformOrigin: 'center center',
          zIndex: element.type === 'text' ? 15 : 10
        }}
      >
        {element.type === 'text' ? (
          <div style={{ ...styles.style, width: '100%', height: '100%' }}>
            <span style={{
              color: 'white',
              fontSize: `${fontSize}px`,
              fontWeight: 500,
              padding: '2px', // Add padding for text
              overflow: 'hidden', // Prevent text overflow
              textAlign: 'center' // Center text
            }}>
              {element.label}
            </span>
          </div>
        ) : (
          // Wrapper div for non-text elements to handle label positioning correctly with rotation
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div className={styles.className} style={{ ...styles.style, width: '100%', height: '100%' }}>
              {getIconForType()}
            </div>

            {/* Label positioned below the element */}
            <div style={{
              position: 'absolute',
              top: '100%', // Position below the element
              left: '50%', // Center horizontally relative to the element
              transform: 'translateX(-50%)', // Adjust centering
              marginTop: '8px', // Space between element and label
              whiteSpace: 'nowrap',
              zIndex: 20
            }}>
              <span style={{
                color: 'white',
                fontSize: `${fontSize}px`,
                backgroundColor: 'rgba(31, 41, 55, 0.9)',
                border: '1px solid rgba(75, 85, 99, 0.5)',
                padding: '3px 8px',
                borderRadius: '4px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                display: 'inline-block',
                minWidth: `${labelWidth}px`,
                maxWidth: `${labelWidth * 1.5}px`, // Limit max width
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {element.label}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const dimensions = getStageDimensions(stagePlot.stage_size);

  return (
    <div
      ref={ref}
      className="export-wrapper text-white p-8 rounded-lg shadow-xl"
      style={{
        width: '1600px',
        position: 'absolute',
        left: '-9999px',
        fontFamily: 'Inter, sans-serif',
        background: 'linear-gradient(to bottom, #111827, #0f172a)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header with enhanced branding */}
      <div
        className="flex justify-between items-center mb-8 pb-6 relative overflow-hidden"
        style={{
          borderBottom: '2px solid rgba(99, 102, 241, 0.4)',
          background: 'linear-gradient(to right, rgba(15, 23, 42, 0.3), rgba(20, 30, 70, 0.2))',
          borderRadius: '10px',
          padding: '20px'
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.2) 0%, rgba(99, 102, 241, 0) 70%)',
            zIndex: 0
          }}
        ></div>

        {/* Brand logo and name */}
        <div className="flex items-center z-10">
          <div
            className="p-3 rounded-lg mr-4"
            style={{
              background: 'linear-gradient(145deg, #4f46e5, #4338ca)',
              boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)'
            }}
          >
            <Bookmark className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">SoundDocs</h1>
            <p className="text-indigo-400 font-medium">Professional Audio Documentation</p>
          </div>
        </div>

        {/* Document title and date */}
        <div className="text-right z-10 flex flex-col items-end">
          <h2 className="text-2xl font-bold text-white">{stagePlot.name}</h2>
          <div className="flex items-center text-gray-400 mt-1">
            <Layout className="h-4 w-4 mr-2" />
            <span>Stage Plot</span>
          </div>
          <p className="text-gray-400 mt-1">
            Last edited: {formatDate(stagePlot.last_edited || stagePlot.created_at)}
          </p>
        </div>
      </div>

      {/* Back of stage label - MOVED OUTSIDE THE STAGE */}
      <div
        className="text-center mb-2 flex items-center justify-center"
        style={{
          zIndex: 20
        }}
      >
        <span
          className="bg-gray-800/80 text-white text-sm px-4 py-1.5 rounded-full shadow-md"
          style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}
        >
          Back of Stage
        </span>
      </div>

      {/* Stage Plot Canvas */}
      <div className="mb-2">
        <div
          className="bg-gray-850 rounded-lg border border-gray-700 mx-auto overflow-hidden"
          style={{
            width: dimensions.width,
            height: dimensions.height,
            position: 'relative',
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
            backgroundColor: '#1a202c'
          }}
        >
          {/* Background image if present */}
          {stagePlot.backgroundImage && (
            <div
              className="absolute inset-0 bg-center bg-no-repeat bg-contain pointer-events-none"
              style={{
                backgroundImage: `url(${stagePlot.backgroundImage})`,
                opacity: (stagePlot.backgroundOpacity !== undefined ? stagePlot.backgroundOpacity : 50) / 100,
                zIndex: 1
              }}
            />
          )}

          {/* Stage elements */}
          {stagePlot.elements && stagePlot.elements.map(renderElement)}
        </div>
      </div>

      {/* Front of stage label - MOVED OUTSIDE THE STAGE */}
      <div
        className="text-center mt-2 mb-8 flex items-center justify-center"
        style={{
          zIndex: 20
        }}
      >
        <span
          className="bg-gray-800/80 text-white text-sm px-4 py-1.5 rounded-full shadow-md"
          style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}
        >
          Front of Stage / Audience
        </span>
      </div>

      {/* Footer with enhanced branding */}
      <div className="relative mt-8 pt-6 overflow-hidden rounded-lg">
        {/* Decorative background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(31, 41, 55, 0.5), rgba(31, 41, 55, 0.7))',
            borderTop: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '8px',
            zIndex: -1
          }}
        ></div>

        <div className="flex justify-between items-center p-4">
          <div className="flex items-center">
            <div
              className="p-2 rounded-md mr-2"
              style={{
                background: 'linear-gradient(145deg, #4f46e5, #4338ca)',
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)'
              }}
            >
              <Bookmark className="h-5 w-5 text-white" />
            </div>
            <span className="text-indigo-400 font-medium">SoundDocs Stage Plot</span>
          </div>
          <div className="text-gray-400 text-sm flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>Generated on {new Date().toLocaleDateString()}</span>
          </div>
        </div>

        {/* Watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            right: '-30px',
            opacity: '0.05',
            transform: 'rotate(-15deg)',
            zIndex: -1
          }}
        >
          <Bookmark className="h-40 w-40" />
        </div>
      </div>
    </div>
  );
});

StagePlotExport.displayName = 'StagePlotExport';

export default StagePlotExport;

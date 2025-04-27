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
    elements: any[];
    backgroundImage?: string;
    backgroundOpacity?: number;
  };
}

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
      case 'small':
        return { width: 600, height: 400 };
      case 'medium':
        return { width: 800, height: 500 };
      case 'large':
        return { width: 1000, height: 600 };
      default:
        return { width: 800, height: 500 };
    }
  };

  // Function to render element
  const renderElement = (element: any) => {
    // Calculate label width based on element size
    const getLabelWidth = () => {
      const elementWidth = element.width || 
        (element.type === 'text' ? 120 : 
          ['microphone', 'di-box', 'iem'].includes(element.type) ? 32 : 
          ['speaker'].includes(element.type) ? 40 : 
          ['monitor-wedge'].includes(element.type) ? 48 : 
          ['amplifier'].includes(element.type) ? 56 : 
          ['power-strip', 'electric-guitar', 'acoustic-guitar', 'bass-guitar', 'keyboard', 'drums', 'percussion', 'violin', 'cello', 'trumpet', 'saxophone', 'generic-instrument'].includes(element.type) ? 64 : 40);
      
      // Return proportional width based on element size
      return Math.max(80, elementWidth * 1.5);
    };
    
    // Scale font size based on element dimensions
    const getFontSize = () => {
      if (element.type === 'text') {
        // For text elements, scale font size based on height
        const elementHeight = element.height || 40;
        return Math.max(12, Math.min(18, elementHeight * 0.3)); // 30% of height, min 12px, max 18px
      } else {
        // For other elements, scale based on width
        const elementWidth = element.width || 
          (['microphone', 'di-box', 'iem'].includes(element.type) ? 32 : 
          ['speaker', 'person'].includes(element.type) ? 40 : 
          ['monitor-wedge'].includes(element.type) ? 48 : 
          ['amplifier'].includes(element.type) ? 56 : 
          ['power-strip', 'electric-guitar', 'acoustic-guitar', 'bass-guitar', 'keyboard', 'drums', 'percussion', 'violin', 'cello', 'trumpet', 'saxophone', 'generic-instrument'].includes(element.type) ? 64 : 40);
        
        return Math.max(10, Math.min(14, elementWidth * 0.2));
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
            width: element.width ? `${element.width}px` : '64px',
            height: element.height ? `${element.height}px` : '64px'
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
              width: element.width ? `${element.width}px` : '32px',
              height: element.height ? `${element.height}px` : '32px'
            }
          };
        case 'power-strip':
          return {
            className: 'rounded-sm flex items-center justify-center',
            style: { 
              backgroundColor: element.color || '#dc2626',
              width: element.width ? `${element.width}px` : '64px',
              height: element.height ? `${element.height}px` : '24px'
            }
          };
        case 'monitor-wedge':
          return {
            className: 'monitor-wedge flex items-center justify-center transform rotate-[15deg]',
            style: { 
              backgroundColor: element.color || '#16a34a',
              width: element.width ? `${element.width}px` : '48px',
              height: element.height ? `${element.height}px` : '32px'
            }
          };
        case 'amplifier':
          return {
            className: 'rounded-md flex items-center justify-center',
            style: { 
              backgroundColor: element.color || '#7e22ce',
              width: element.width ? `${element.width}px` : '56px',
              height: element.height ? `${element.height}px` : '40px'
            }
          };
        case 'speaker':
          return {
            className: 'rounded-md flex items-center justify-center',
            style: { 
              backgroundColor: element.color || '#0891b2',
              width: element.width ? `${element.width}px` : '40px',
              height: element.height ? `${element.height}px` : '64px'
            }
          };
        case 'di-box':
          return {
            className: 'rounded-sm flex items-center justify-center',
            style: { 
              backgroundColor: element.color || '#eab308',
              width: element.width ? `${element.width}px` : '24px',
              height: element.height ? `${element.height}px` : '24px'
            }
          };
        case 'iem':
          return {
            className: 'rounded-full flex items-center justify-center',
            style: { 
              backgroundColor: element.color || '#ea580c',
              width: element.width ? `${element.width}px` : '32px',
              height: element.height ? `${element.height}px` : '32px'
            }
          };
        case 'person':
          return {
            className: 'rounded-full flex items-center justify-center',
            style: { 
              backgroundColor: element.color || '#be185d',
              width: element.width ? `${element.width}px` : '40px',
              height: element.height ? `${element.height}px` : '40px'
            }
          };
        case 'text':
          return {
            className: 'text-label',
            style: { 
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              width: element.width ? `${element.width}px` : '120px',
              height: element.height ? `${element.height}px` : '40px',
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
              width: element.width ? `${element.width}px` : '40px',
              height: element.height ? `${element.height}px` : '40px'
            }
          };
      }
    };

    // Get icon for element type
    const getIconForType = () => {
      switch (element.type) {
        case 'microphone':
          return <Mic className="h-4 w-4 text-white" />;
        case 'power-strip':
          return <Plug className="h-4 w-4 text-white" />;
        case 'electric-guitar':
        case 'acoustic-guitar':
        case 'bass-guitar':
          return <Guitar className="h-5 w-5 text-white" />;
        case 'keyboard':
          return <Piano className="h-5 w-5 text-white" />;
        case 'drums':
        case 'percussion':
          return <Drum className="h-5 w-5 text-white" />;
        case 'violin':
        case 'cello':
          return <Violin className="h-5 w-5 text-white" />;
        case 'trumpet':
        case 'saxophone':
          return <Music className="h-5 w-5 text-white" />;
        case 'generic-instrument':
          return <CircleEllipsis className="h-5 w-5 text-white" />;
        case 'amplifier':
          return <Volume2 className="h-5 w-5 text-white" />;
        case 'monitor-wedge':
          return (
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="white" strokeWidth="2" fill="none">
              <path d="M4 6h16l-2 10H6L4 6z" />
              <path d="M4 6l-2 3" />
              <path d="M20 6l2 3" />
            </svg>
          );
        case 'speaker':
          return <Speaker className="h-5 w-5 text-white" />;
        case 'di-box':
          return <Square className="h-3 w-3 text-white" />;
        case 'iem':
          return <Headphones className="h-4 w-4 text-white" />;
        case 'person':
          return <Users className="h-4 w-4 text-white" />;
        case 'text':
          return <Type className="h-4 w-4 text-white" />;
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
          transform: `rotate(${element.rotation}deg)`,
          transformOrigin: 'center center',
          zIndex: element.type === 'text' ? 15 : 10
        }}
      >
        {element.type === 'text' ? (
          <div style={styles.style}>
            <span style={{ 
              color: 'white', 
              fontSize: `${fontSize}px`, 
              fontWeight: 500 
            }}>
              {element.label}
            </span>
          </div>
        ) : (
          <div>
            <div className={styles.className} style={styles.style}>
              {getIconForType()}
            </div>
            
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
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
                maxWidth: `${labelWidth * 1.5}px`,
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
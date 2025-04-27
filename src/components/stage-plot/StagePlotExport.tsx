import React, { forwardRef } from 'react';
import { Bookmark, Layout, Clock } from 'lucide-react';
import { StageElementProps } from './StageElement';
import { Mic, Music, Speaker, Square, Type, Users, Headphones, Volume2, Piano, Guitar, Blinds as Violin, Drum as Trumpet, Drumstick, Plug } from 'lucide-react';

interface StagePlotExportProps {
  stagePlot: {
    name: string;
    created_at: string;
    last_edited?: string;
    stage_size: string;
    elements: StageElementProps[];
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
    const [depth, width] = stageSize.split('-');
    
    // Base dimensions
    let baseWidth = 800;
    let baseHeight = 400;
    
    // Adjust width based on the width parameter
    if (width === 'narrow') {
      baseWidth = 600;
    } else if (width === 'wide') {
      baseWidth = 1000;
    }
    
    // Adjust height based on the depth parameter
    switch (depth) {
      case 'x-small':
        baseHeight = 200;
        break;
      case 'small':
        baseHeight = 300;
        break;
      case 'medium':
        baseHeight = 400;
        break;
      case 'large':
        baseHeight = 500;
        break;
      case 'x-large':
        baseHeight = 600;
        break;
      default:
        baseHeight = 400;
    }
    
    return { width: baseWidth, height: baseHeight };
  };
  
  const dimensions = getStageDimensions(stagePlot.stage_size);
  
  // Helper function to summarize elements by type
  const summarizeElements = (elements: StageElementProps[]) => {
    const counts: Record<string, number> = {};
    const elementLabels: Record<string, string> = {
      'microphone': 'Microphones',
      'power-strip': 'Power Strips',
      'electric-guitar': 'Electric Guitars',
      'acoustic-guitar': 'Acoustic Guitars',
      'bass-guitar': 'Bass Guitars',
      'keyboard': 'Keyboards',
      'drums': 'Drum Kits',
      'percussion': 'Percussion',
      'violin': 'Violins',
      'cello': 'Cellos',
      'trumpet': 'Brass',
      'saxophone': 'Wind Instruments',
      'amplifier': 'Amplifiers',
      'monitor-wedge': 'Monitor Wedges',
      'speaker': 'Speakers',
      'di-box': 'DI Boxes',
      'iem': 'IEMs',
      'person': 'People',
      'text': 'Text Labels',
      'generic-instrument': 'Other Instruments'
    };
    
    // Count elements by type
    elements.forEach(element => {
      if (counts[element.type]) {
        counts[element.type]++;
      } else {
        counts[element.type] = 1;
      }
    });
    
    // Convert to array for rendering
    return Object.entries(counts)
      .filter(([type]) => type) // Filter out any undefined types
      .map(([type, count]) => ({
        type,
        label: elementLabels[type as keyof typeof elementLabels] || type,
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  // Function to render static element for export
  const renderElement = (element: StageElementProps) => {
    // Get appropriate styles and icon based on element type
    const getStyles = () => {
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
          className: 'w-16 h-16 rounded-lg flex items-center justify-center',
          style: { backgroundColor: element.color || '#4f46e5' }
        };
      }
      
      // Other specific types
      switch (element.type) {
        case 'microphone':
          return {
            className: 'w-8 h-8 rounded-full flex items-center justify-center',
            style: { backgroundColor: element.color || '#4f46e5' }
          };
        case 'power-strip':
          return {
            className: 'w-16 h-6 rounded-sm flex items-center justify-center',
            style: { backgroundColor: element.color || '#dc2626' }
          };
        case 'monitor-wedge':
          return {
            className: 'w-12 h-8 monitor-wedge flex items-center justify-center transform rotate-[15deg]',
            style: { backgroundColor: element.color || '#16a34a' }
          };
        case 'amplifier':
          return {
            className: 'w-14 h-10 rounded-md flex items-center justify-center',
            style: { backgroundColor: element.color || '#7e22ce' }
          };
        case 'speaker':
          return {
            className: 'w-10 h-16 rounded-md flex items-center justify-center',
            style: { backgroundColor: element.color || '#0891b2' }
          };
        case 'di-box':
          return {
            className: 'w-6 h-6 rounded-sm flex items-center justify-center',
            style: { backgroundColor: element.color || '#eab308' }
          };
        case 'iem':
          return {
            className: 'w-8 h-8 rounded-full flex items-center justify-center',
            style: { backgroundColor: element.color || '#ea580c' }
          };
        case 'person':
          return {
            className: 'w-10 h-10 rounded-full flex items-center justify-center',
            style: { backgroundColor: element.color || '#be185d' }
          };
        case 'text':
          return {
            className: 'text-label',
            style: { backgroundColor: 'rgba(30, 41, 59, 0.9)' }
          };
        default:
          return {
            className: 'w-10 h-10 rounded-md flex items-center justify-center',
            style: { backgroundColor: element.color || '#6b7280' }
          };
      }
    };

    const getIcon = () => {
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
          return <Drumstick className="h-5 w-5 text-white" />;
        case 'violin':
        case 'cello':
          return <Violin className="h-5 w-5 text-white" />;
        case 'trumpet':
        case 'saxophone':
          return <Trumpet className="h-5 w-5 text-white" />;
        case 'generic-instrument':
          return <Music className="h-5 w-5 text-white" />;
        case 'amplifier':
          return <Volume2 className="h-5 w-5 text-white" />;
        case 'monitor-wedge':
          return <div className="h-5 w-5 text-white flex items-center justify-center">▼</div>;
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

    const styles = getStyles();
    
    return (
      <div
        key={element.id}
        className="absolute"
        style={{
          left: `${element.x}px`,
          top: `${element.y}px`,
          zIndex: element.type === 'text' ? 15 : 10
        }}
      >
        <div
          style={{
            transform: `rotate(${element.rotation}deg)`,
            transformOrigin: 'center center'
          }}
        >
          {element.type === 'text' ? (
            <div className="text-label">
              <span className="text-sm font-medium">{element.label}</span>
            </div>
          ) : (
            <>
              <div
                className={styles.className}
                style={styles.style}
              >
                {getIcon()}
              </div>
              
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 element-label">
                <span className="text-xs text-white bg-gray-800/90 border border-gray-600 px-2 py-1 rounded-md shadow-md min-w-[80px] inline-block text-center">
                  {element.label}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div 
      ref={ref} 
      className="export-wrapper text-white rounded-lg shadow-xl"
      style={{ 
        width: `${dimensions.width + 120}px`, // Add padding for the export
        fontFamily: 'Inter, sans-serif',
        position: 'absolute',
        left: '-9999px',
        background: 'linear-gradient(to bottom, #0f172a, #111827)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '40px 60px'
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
      
      {/* Stage Plot Canvas */}
      <div 
        className="bg-gray-850 rounded-lg border border-gray-700 mx-auto mb-8 overflow-hidden"
        style={{ 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          width: dimensions.width,
          height: dimensions.height,
          position: 'relative'
        }}
      >
        <div 
          className="relative bg-grid-pattern w-full h-full"
        >
          {/* Back of stage label */}
          <div 
            className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800/90 text-white px-4 py-1.5 rounded-full shadow-md z-20 font-medium"
            style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}
          >
            Back of Stage
          </div>
          
          {/* Front of stage label */}
          <div 
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/90 text-white px-4 py-1.5 rounded-full shadow-md z-20 font-medium"
            style={{ border: '1px solid rgba(99, 102, 241, 0.3)' }}
          >
            Front of Stage / Audience
          </div>
          
          {/* Stage elements */}
          {stagePlot.elements.map(renderElement)}
        </div>
      </div>
      
      {/* Info Labels */}
      <div 
        className="grid grid-cols-2 gap-6 mb-8" 
        style={{
          color: 'rgba(255, 255, 255, 0.9)',
        }}
      >
        {/* Stage Size Information */}
        <div 
          className="bg-gray-800/80 p-4 rounded-lg"
          style={{ 
            borderLeft: '4px solid #4f46e5',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h3 className="text-lg font-semibold text-indigo-400 mb-2">Stage Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-gray-400 text-sm">Stage Size</p>
              <p className="text-white font-medium">
                {stagePlot.stage_size.split('-').map((word: string) => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ')}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Elements</p>
              <p className="text-white font-medium">{stagePlot.elements.length}</p>
            </div>
          </div>
        </div>
        
        {/* Element Count */}
        <div 
          className="bg-gray-800/80 p-4 rounded-lg"
          style={{ 
            borderLeft: '4px solid #4f46e5',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          <h3 className="text-lg font-semibold text-indigo-400 mb-2">Element Summary</h3>
          <div>
            {summarizeElements(stagePlot.elements).map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-white">{item.label}</span>
                <span 
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: 'rgba(79, 70, 229, 0.2)',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
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
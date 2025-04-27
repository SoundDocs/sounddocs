import React, { forwardRef } from 'react';

interface PrintStagePlotExportProps {
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

const PrintStagePlotExport = forwardRef<HTMLDivElement, PrintStagePlotExportProps>(({ stagePlot }, ref) => {
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

    if (element.type === 'text') {
      // Scale font size based on element dimensions
      const fontSize = Math.max(12, Math.min(18, (element.height || 40) * 0.3));
      
      return (
        <div 
          key={element.id}
          style={{
            position: 'absolute',
            left: `${element.x}px`,
            top: `${element.y}px`,
            transform: `rotate(${element.rotation}deg)`,
            transformOrigin: 'center center',
            zIndex: 15,
            backgroundColor: 'rgba(245, 245, 245, 0.9)',
            border: '1px solid #999',
            padding: '6px 12px',
            minWidth: element.width ? `${element.width}px` : '120px',
            minHeight: element.height ? `${element.height}px` : '40px',
            display: 'flex',
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '4px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          <span style={{ 
            color: '#111', 
            fontSize: `${fontSize}px`, 
            fontWeight: 500 
          }}>
            {element.label}
          </span>
        </div>
      );
    }
    
    // Determine element style based on type
    let elementStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      zIndex: 10
    };

    // Wrapper for rotation
    let wrapperStyle: React.CSSProperties = {
      transform: `rotate(${element.rotation}deg)`,
      transformOrigin: 'center center'
    };

    // Inner element style
    let innerStyle: React.CSSProperties = {
      backgroundColor: '#777',
      border: '1px solid #666',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    // Symbol/icon style
    let symbolStyle: React.CSSProperties = {
      color: '#fff',
      fontSize: '14px',
      fontWeight: 'bold'
    };

    // Scale icon/symbol size based on element dimensions
    if (element.width && element.height) {
      const size = Math.min(element.width, element.height);
      symbolStyle.fontSize = `${Math.max(10, Math.min(16, size * 0.25))}px`;
    }

    // Label style
    const labelWidth = getLabelWidth();
    const fontSize = Math.max(10, Math.min(14, (element.width || 40) * 0.2));

    let labelStyle: React.CSSProperties = {
      position: 'absolute',
      top: '100%',
      left: '50%',
      transform: 'translateX(-50%)',
      marginTop: '8px',
      backgroundColor: 'white',
      border: '1px solid #aaa',
      padding: '3px 8px',
      borderRadius: '4px',
      fontSize: `${fontSize}px`,
      color: '#333',
      whiteSpace: 'nowrap',
      textAlign: 'center',
      minWidth: `${labelWidth}px`,
      maxWidth: `${labelWidth * 1.5}px`,
      zIndex: 20,
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    };

    // Customize based on element type
    switch (element.type) {
      // Instruments - larger squares
      case 'electric-guitar':
      case 'acoustic-guitar':
      case 'bass-guitar':
      case 'keyboard':
      case 'drums':
      case 'percussion':
      case 'violin':
      case 'cello':
      case 'trumpet':
      case 'saxophone':
      case 'generic-instrument':
        innerStyle = {
          ...innerStyle,
          width: element.width ? `${element.width}px` : '64px',
          height: element.height ? `${element.height}px` : '64px',
          borderRadius: '8px'
        };
        break;

      // Circular elements
      case 'microphone':
      case 'iem':
        innerStyle = {
          ...innerStyle,
          width: element.width ? `${element.width}px` : '32px',
          height: element.height ? `${element.height}px` : '32px',
          borderRadius: '50%' 
        };
        break;

      case 'person':
        innerStyle = {
          ...innerStyle,
          width: element.width ? `${element.width}px` : '40px',
          height: element.height ? `${element.height}px` : '40px',
          borderRadius: '50%'
        };
        break;

      // Rectangular elements
      case 'power-strip':
        innerStyle = {
          ...innerStyle,
          width: element.width ? `${element.width}px` : '64px',
          height: element.height ? `${element.height}px` : '24px',
          borderRadius: '4px'
        };
        break;

      case 'amplifier':
        innerStyle = {
          ...innerStyle,
          width: element.width ? `${element.width}px` : '56px',
          height: element.height ? `${element.height}px` : '40px',
          borderRadius: '4px'
        };
        break;

      case 'speaker':
        innerStyle = {
          ...innerStyle,
          width: element.width ? `${element.width}px` : '40px',
          height: element.height ? `${element.height}px` : '64px',
          borderRadius: '4px'
        };
        break;

      case 'di-box':
        innerStyle = {
          ...innerStyle,
          width: element.width ? `${element.width}px` : '24px',
          height: element.height ? `${element.height}px` : '24px',
          borderRadius: '4px'
        };
        break;

      // Special shapes
      case 'monitor-wedge':
        innerStyle = {
          ...innerStyle,
          width: element.width ? `${element.width}px` : '48px',
          height: element.height ? `${element.height}px` : '32px',
          borderRadius: '4px',
          clipPath: 'polygon(0 0, 100% 0, 100% 90%, 50% 100%, 0 90%)',
          transform: 'rotate(15deg)'
        };
        break;

      // Default fallback
      default:
        innerStyle = {
          ...innerStyle,
          width: element.width ? `${element.width}px` : '40px',
          height: element.height ? `${element.height}px` : '40px',
          borderRadius: '4px'
        };
    }

    // Get appropriate symbol for the element type
    let symbol = '';
    switch (element.type) {
      case 'microphone': symbol = 'M'; break;
      case 'power-strip': symbol = 'P'; break;
      case 'electric-guitar':
      case 'acoustic-guitar':
      case 'bass-guitar': symbol = 'G'; break;
      case 'keyboard': symbol = 'K'; break;
      case 'drums':
      case 'percussion': symbol = 'D'; break;
      case 'violin':
      case 'cello': symbol = 'V'; break;
      case 'trumpet':
      case 'saxophone': symbol = 'T'; break;
      case 'generic-instrument': symbol = 'I'; break;
      case 'amplifier': symbol = 'A'; break;
      case 'monitor-wedge': symbol = 'W'; break;
      case 'speaker': symbol = 'S'; break;
      case 'di-box': symbol = 'DI'; break;
      case 'iem': symbol = 'IE'; break;
      case 'person': symbol = 'P'; break;
      default: symbol = '';
    }

    return (
      <div key={element.id} style={elementStyle}>
        <div style={wrapperStyle}>
          <div style={innerStyle}>
            <span style={symbolStyle}>{symbol}</span>
          </div>
          <div style={labelStyle}>
            {element.label}
          </div>
        </div>
      </div>
    );
  };

  const dimensions = getStageDimensions(stagePlot.stage_size);
  
  return (
    <div 
      ref={ref} 
      className="print-stage-plot-export"
      style={{ 
        width: '1600px', 
        position: 'absolute', 
        left: '-9999px', 
        fontFamily: 'Inter, sans-serif',
        backgroundColor: 'white',
        color: '#111',
        padding: '40px'
      }}
    >
      {/* Header */}
      <div style={{
        borderBottom: '2px solid #ddd',
        padding: '20px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            padding: '12px', 
            marginRight: '16px', 
            background: '#eee', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            {/* Bookmark icon */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>SoundDocs</h1>
            <p style={{ color: '#666', margin: 0 }}>Professional Audio Documentation</p>
          </div>
        </div>
        
        {/* Document title and date */}
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>{stagePlot.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', color: '#666' }}>
            <span>Stage Plot</span>
          </div>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Last edited: {formatDate(stagePlot.last_edited || stagePlot.created_at)}
          </p>
        </div>
      </div>
      
      {/* Back of stage label - MOVED OUTSIDE THE STAGE */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '10px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '5px 15px',
          borderRadius: '15px',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          Back of Stage
        </div>
      </div>
      
      {/* Stage Plot Canvas */}
      <div style={{ 
        width: dimensions.width,
        height: dimensions.height,
        margin: '0 auto',
        border: '1px solid #ccc',
        position: 'relative',
        backgroundColor: '#f8f9fa',
        backgroundImage: `
          linear-gradient(#ddd 1px, transparent 1px),
          linear-gradient(90deg, #ddd 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        borderRadius: '4px'
      }}>
        {/* Background image if present */}
        {stagePlot.backgroundImage && (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundImage: `url(${stagePlot.backgroundImage})`,
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              opacity: (stagePlot.backgroundOpacity !== undefined ? stagePlot.backgroundOpacity : 50) / 100,
              zIndex: 1
            }}
          />
        )}
        
        {/* Render each element */}
        {stagePlot.elements && stagePlot.elements.map(renderElement)}
      </div>
      
      {/* Front of stage label - MOVED OUTSIDE THE STAGE */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '10px',
        marginBottom: '30px',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #ccc',
          padding: '5px 15px',
          borderRadius: '15px',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          Front of Stage / Audience
        </div>
      </div>
      
      {/* Footer */}
      <div style={{ 
        marginTop: '40px', 
        borderTop: '1px solid #eee', 
        paddingTop: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        color: '#666'
      }}>
        <div>
          <span style={{ fontWeight: 'bold' }}>SoundDocs</span> | Professional Audio Documentation
        </div>
        <div>
          Generated on {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
});

PrintStagePlotExport.displayName = 'PrintStagePlotExport';

export default PrintStagePlotExport;
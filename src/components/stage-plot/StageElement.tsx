import React, { useState, useRef } from 'react';
import Draggable from 'react-draggable';
import { Mic, Music, Speaker, Square, Type, Users, Headphones, Volume2, Piano, Guitar, Blinds as Violin, Drum, Plug, CircleEllipsis } from 'lucide-react';
import { Resizable, ResizeCallbackData } from 'react-resizable';

export interface StageElementProps {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  rotation: number;
  icon?: React.ReactNode; // This is optional and will be generated internally if not provided
  color?: string;
  width?: number;
  height?: number;
  selected?: boolean;
  disabled?: boolean; // New prop to handle view-only mode
  onClick?: (id: string) => void;
  onDragStop?: (id: string, x: number, y: number) => void;
  onRotate?: (id: string, rotation: number) => void;
  onLabelChange?: (id: string, label: string) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void; // New prop for duplicate functionality
  onResize?: (id: string, width: number, height: number) => void; // New prop for resize functionality
}

const StageElement: React.FC<StageElementProps> = ({ 
  id, 
  type, 
  label, 
  x, 
  y, 
  rotation, 
  icon, // We'll ignore this and use getIconForType instead
  color = '#4f46e5', 
  width,
  height,
  selected = false,
  disabled = false, // Default to not disabled
  onClick,
  onDragStop,
  onRotate,
  onLabelChange,
  onDelete,
  onDuplicate, // New duplicate handler
  onResize
}) => {
  const [editingLabel, setEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(label);
  const [isResizing, setIsResizing] = useState(false);
  const isMobile = window.innerWidth < 768;
  const elementRef = useRef<HTMLDivElement>(null);
  
  const getElementDimensions = () => {
    // For custom width/height elements, return the specified dimensions
    if (width && height) {
      return { width, height };
    }
    
    // Default dimensions based on element type
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
  
  const getElementStyles = () => {
    const dimensions = getElementDimensions();
    
    // Instrument types
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
      return {
        className: 'rounded-lg flex items-center justify-center',
        style: { 
          backgroundColor: color,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`
        }
      };
    }
    
    // Other specific types
    switch (type) {
      case 'microphone':
        return {
          className: 'rounded-full flex items-center justify-center',
          style: { 
            backgroundColor: color,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
      case 'power-strip':
        return {
          className: 'rounded-sm flex items-center justify-center',
          style: { 
            backgroundColor: color,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
      case 'monitor-wedge':
        return {
          className: 'monitor-wedge flex items-center justify-center transform rotate-[15deg]',
          style: { 
            backgroundColor: color,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
      case 'amplifier':
        return {
          className: 'rounded-md flex items-center justify-center',
          style: { 
            backgroundColor: color,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
      case 'speaker':
        return {
          className: 'rounded-md flex items-center justify-center',
          style: { 
            backgroundColor: color,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
      case 'di-box':
        return {
          className: 'rounded-sm flex items-center justify-center',
          style: { 
            backgroundColor: color,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
      case 'iem':
        return {
          className: 'rounded-full flex items-center justify-center',
          style: { 
            backgroundColor: color,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
      case 'person':
        return {
          className: 'rounded-full flex items-center justify-center',
          style: { 
            backgroundColor: color,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
      case 'text':
        return {
          className: 'text-label',
          style: { 
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
      default:
        return {
          className: 'rounded-md flex items-center justify-center',
          style: { 
            backgroundColor: color,
            width: `${dimensions.width}px`,
            height: `${dimensions.height}px`
          }
        };
    }
  };

  // Generate icon based on element type
  const getIconForType = () => {
    switch (type) {
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
        return <Music className="h-5 w-5 text-white" />;
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

  const handleDragStop = (_e: any, data: any) => {
    if (disabled) return;
    
    if (onDragStop) {
      onDragStop(id, data.x, data.y);
    }
  };

  const handleRotate = (direction: 'left' | 'right') => {
    if (disabled) return;
    
    if (onRotate) {
      const newRotation = direction === 'right' ? 
        rotation + 15 : rotation - 15;
      onRotate(id, newRotation);
    }
  };

  const handleLabelChange = () => {
    if (disabled) return;
    
    setEditingLabel(false);
    if (onLabelChange && tempLabel !== label) {
      onLabelChange(id, tempLabel);
    }
  };

  const handleLabelDoubleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.stopPropagation();
    setEditingLabel(true);
  };

  const handleTextElementDoubleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    
    if (type === 'text') {
      e.stopPropagation();
      setEditingLabel(true);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };
  
  const handleDuplicate = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.stopPropagation();
    if (onDuplicate) {
      onDuplicate(id);
    }
  };

  // Handle resize
  const handleResize = (_e: React.SyntheticEvent, data: ResizeCallbackData) => {
    if (disabled || !onResize) return;
    
    // Set resizing flag during resize
    setIsResizing(true);
    
    const { width, height } = data.size;
    
    // Call the resize handler with new dimensions
    onResize(id, width, height);
  };
  
  // End of resize operation
  const handleResizeStop = () => {
    setIsResizing(false);
  };

  // Handle touch/tap for mobile devices
  const handleTap = () => {
    if (disabled) return;
    
    if (onClick) onClick(id);
  };

  const elementStyles = getElementStyles();
  const dimensions = getElementDimensions();

  // Calculate font size based on element size
  const getFontSize = () => {
    if (type === 'text') {
      // For text elements, scale font size based on height
      const elementHeight = height || dimensions.height;
      return Math.max(12, Math.min(18, elementHeight * 0.3)); // 30% of height, min 12px, max 18px
    }
    return undefined; // Use default for other elements
  };

  // Calculate label width based on element size
  const getLabelWidth = () => {
    const elementWidth = width || dimensions.width;
    // Make label width proportional to element width, but with some minimum
    return Math.max(80, elementWidth * 1.5);
  };

  // Add touch support for mobile
  const mobileProps = isMobile && !disabled ? {
    onTouchEnd: handleTap
  } : {};

  // Determine if the element can be resized 
  // Don't allow resizing for special shapes like wedge monitors
  const isResizable = !['monitor-wedge'].includes(type) && !disabled;

  const elementContent = (
    <div
      className="stage-element relative"
      style={{ 
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
        cursor: isResizing ? 'nwse-resize' : (disabled ? 'default' : 'move')
      }}
      ref={elementRef}
    >
      {type === 'text' ? (
        <div 
          className="text-label"
          onDoubleClick={!disabled ? handleTextElementDoubleClick : undefined}
          style={{ 
            border: selected ? '2px solid rgba(255, 255, 255, 0.8)' : '1px solid rgba(99, 102, 241, 0.5)',
            boxShadow: selected ? '0 0 0 2px rgba(99, 102, 241, 0.5)' : 'none',
            width: '100%',
            height: '100%'
          }}
        >
          {editingLabel && !disabled ? (
            <input
              type="text"
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              onBlur={handleLabelChange}
              onKeyDown={(e) => e.key === 'Enter' && handleLabelChange()}
              className="bg-transparent text-white border-none focus:outline-none text-center w-full h-full"
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{ fontSize: `${getFontSize()}px` }}
            />
          ) : (
            <span 
              className="text-sm font-medium absolute inset-0 flex items-center justify-center"
              style={{ fontSize: `${getFontSize()}px` }}
            >
              {label}
            </span>
          )}
        </div>
      ) : (
        <>
          <div 
            className={`${elementStyles.className} ${selected ? 'ring-2 ring-white ring-opacity-80' : ''}`}
            style={elementStyles.style}
          >
            {getIconForType()}
          </div>
          
          {/* Label below the element - scale with element size */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap">
            {editingLabel && !disabled ? (
              <input
                type="text"
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onBlur={handleLabelChange}
                onKeyDown={(e) => e.key === 'Enter' && handleLabelChange()}
                className="px-2 py-1 text-xs bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:border-indigo-500"
                style={{ minWidth: `${getLabelWidth()}px` }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span 
                className={`text-xs text-white bg-gray-800/90 border border-gray-600 px-2 py-1 rounded-md shadow-md inline-block text-center ${!disabled ? 'cursor-pointer' : ''}`}
                style={{ 
                  minWidth: `${getLabelWidth()}px`,
                  // Scale font size with element size
                  fontSize: `${Math.max(10, Math.min(14, (width || dimensions.width) * 0.2))}px`
                }}
                onDoubleClick={!disabled ? handleLabelDoubleClick : undefined}
              >
                {label}
              </span>
            )}
          </div>
          
          {/* Resize handles - only show when selected and not in view mode */}
          {selected && isResizable && (
            <div className="absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-full border-2 border-indigo-500 cursor-nwse-resize z-30"
                 onMouseDown={(e) => {
                   e.stopPropagation();
                   const startWidth = elementRef.current?.clientWidth || dimensions.width;
                   const startHeight = elementRef.current?.clientHeight || dimensions.height;
                   
                   const handleMouseMove = (moveEvent: MouseEvent) => {
                     if (disabled || !onResize) return;
                     
                     const deltaX = moveEvent.clientX - e.clientX;
                     const deltaY = moveEvent.clientY - e.clientY;
                     
                     // Make resizing somewhat proportional by taking the larger of the two deltas
                     const delta = Math.max(deltaX, deltaY);
                     
                     // Apply minimum size constraints
                     const newWidth = Math.max(20, startWidth + delta);
                     const newHeight = Math.max(20, startHeight + delta);
                     
                     onResize(id, newWidth, newHeight);
                   };
                   
                   const handleMouseUp = () => {
                     document.removeEventListener('mousemove', handleMouseMove);
                     document.removeEventListener('mouseup', handleMouseUp);
                   };
                   
                   document.addEventListener('mousemove', handleMouseMove);
                   document.addEventListener('mouseup', handleMouseUp);
                 }}
            />
          )}
        </>
      )}
    </div>
  );

  // Wrap the element in a Draggable component
  return (
    <Draggable
      position={{ x, y }}
      onStop={handleDragStop}
      bounds="parent"
      grid={[5, 5]}
      disabled={disabled}
      cancel=".resize-handle, input" // Don't initiate drag on resize handles or inputs
    >
      <div 
        className={`absolute ${!disabled ? 'cursor-move' : ''} touch-manipulation ${selected ? 'z-20' : 'z-10'}`}
        onClick={() => !disabled && onClick && onClick(id)}
        {...mobileProps}
      >
        {/* Control buttons - positioned above the element when selected and not disabled */}
        {selected && !disabled && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-1 bg-gray-800 border border-gray-600 p-1 rounded-md shadow-lg z-30">
            <button 
              className="p-1 bg-gray-700 rounded text-gray-300 hover:text-white hover:bg-gray-600 w-6 h-6 flex items-center justify-center touch-manipulation"
              onClick={(e) => { e.stopPropagation(); handleRotate('left'); }}
              title="Rotate Left"
            >
              ↺
            </button>
            <button 
              className="p-1 bg-gray-700 rounded text-gray-300 hover:text-white hover:bg-gray-600 w-6 h-6 flex items-center justify-center touch-manipulation"
              onClick={(e) => { e.stopPropagation(); handleRotate('right'); }}
              title="Rotate Right"
            >
              ↻
            </button>
            <button 
              className="p-1 bg-gray-700 rounded text-gray-300 hover:text-white hover:bg-gray-600 w-6 h-6 flex items-center justify-center touch-manipulation"
              onClick={(e) => { e.stopPropagation(); handleDuplicate(e); }}
              title="Duplicate Element"
            >
              +
            </button>
            <button 
              className="p-1 bg-red-700 hover:bg-red-600 rounded text-gray-300 hover:text-white w-6 h-6 flex items-center justify-center touch-manipulation"
              onClick={handleDelete}
              title="Delete Element"
            >
              ×
            </button>
          </div>
        )}
        
        {elementContent}
      </div>
    </Draggable>
  );
};

export default StageElement;
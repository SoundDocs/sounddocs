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
    // Use provided width/height if available, otherwise calculate defaults
    const currentWidth = width || getDefaultDimensions().width;
    const currentHeight = height || getDefaultDimensions().height;
    return { width: currentWidth, height: currentHeight };
  };

  const getDefaultDimensions = () => {
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
    const dimensions = getElementDimensions(); // Use current dimensions

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
    const dimensions = getElementDimensions();
    const iconSize = Math.max(12, Math.min(24, dimensions.width * 0.5)); // Scale icon size based on width

    switch (type) {
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
        return <Music style={{ height: `${iconSize}px`, width: `${iconSize}px` }} className="text-white" />;
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

    const { width: newWidth, height: newHeight } = data.size;

    // Call the resize handler with new dimensions
    onResize(id, newWidth, newHeight);
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
  const dimensions = getElementDimensions(); // Get current dimensions

  // Calculate font size based on element size
  const getFontSize = () => {
    const elementHeight = dimensions.height; // Use current height
    if (type === 'text') {
      // For text elements, scale font size based on height
      return Math.max(12, Math.min(18, elementHeight * 0.3)); // 30% of height, min 12px, max 18px
    }
    // For other elements, scale based on width
    const elementWidth = dimensions.width; // Use current width
    return Math.max(10, Math.min(14, elementWidth * 0.2)); // 20% of width, min 10px, max 14px
  };

  // Calculate label width based on element size
  const getLabelWidth = () => {
    const elementWidth = dimensions.width; // Use current width
    // Make label width proportional to element width, but with some minimum
    return Math.max(60, elementWidth * 1.2); // 120% of width, min 60px
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
        cursor: isResizing ? 'nwse-resize' : (disabled ? 'default' : 'move'),
        // Set width and height here for the container div
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
      }}
      ref={elementRef}
    >
      {type === 'text' ? (
        <div
          className="text-label flex items-center justify-center" // Added flex centering
          onDoubleClick={!disabled ? handleTextElementDoubleClick : undefined}
          style={{
            border: selected ? '2px solid rgba(255, 255, 255, 0.8)' : '1px solid rgba(99, 102, 241, 0.5)',
            boxShadow: selected ? '0 0 0 2px rgba(99, 102, 241, 0.5)' : 'none',
            width: '100%', // Take full width of parent
            height: '100%', // Take full height of parent
            backgroundColor: 'rgba(30, 41, 59, 0.9)', // Moved from getElementStyles
            fontSize: `${getFontSize()}px`, // Apply font size directly
            overflow: 'hidden', // Hide overflow
            textAlign: 'center', // Center text
          }}
        >
          {editingLabel && !disabled ? (
            <input
              type="text"
              value={tempLabel}
              onChange={(e) => setTempLabel(e.target.value)}
              onBlur={handleLabelChange}
              onKeyDown={(e) => e.key === 'Enter' && handleLabelChange()}
              className="bg-transparent text-white border-none focus:outline-none text-center w-full h-full p-1" // Added padding
              onClick={(e) => e.stopPropagation()}
              autoFocus
              style={{ fontSize: 'inherit' }} // Inherit font size
            />
          ) : (
            <span
              className="text-white font-medium p-1" // Added padding
              style={{ fontSize: 'inherit' }} // Inherit font size
            >
              {label}
            </span>
          )}
        </div>
      ) : (
        <>
          <div
            className={`${elementStyles.className} ${selected ? 'ring-2 ring-white ring-opacity-80' : ''}`}
            style={{
              ...elementStyles.style,
              width: '100%', // Take full width of parent
              height: '100%', // Take full height of parent
            }}
          >
            {getIconForType()}
          </div>

          {/* Label below the element - scale with element size */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 whitespace-nowrap flex justify-center">
            {editingLabel && !disabled ? (
              <input
                type="text"
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onBlur={handleLabelChange}
                onKeyDown={(e) => e.key === 'Enter' && handleLabelChange()}
                className="px-2 py-1 text-xs bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:border-indigo-500 text-center" // Added text-center
                style={{
                  minWidth: `${getLabelWidth()}px`, // Use dynamic width
                  fontSize: `${getFontSize()}px`, // Use dynamic font size
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <span
                className={`text-xs text-white bg-gray-800/90 border border-gray-600 px-2 py-1 rounded-md shadow-md inline-block text-center ${!disabled ? 'cursor-pointer' : ''}`}
                style={{
                  minWidth: `${getLabelWidth()}px`, // Use dynamic width
                  fontSize: `${getFontSize()}px`, // Use dynamic font size
                }}
                onDoubleClick={!disabled ? handleLabelDoubleClick : undefined}
              >
                {label}
              </span>
            )}
          </div>

          {/* Resize handles - only show when selected and not in view mode */}
          {selected && isResizable && (
            <div className="resize-handle absolute -right-2 -bottom-2 w-4 h-4 bg-white rounded-full border-2 border-indigo-500 cursor-nwse-resize z-30"
                 onMouseDown={(e) => {
                   e.stopPropagation(); // Prevent drag start
                   if (disabled || !onResize) return;

                   const startX = e.clientX;
                   const startY = e.clientY;
                   const startWidth = dimensions.width;
                   const startHeight = dimensions.height;

                   const handleMouseMove = (moveEvent: MouseEvent) => {
                     const deltaX = moveEvent.clientX - startX;
                     const deltaY = moveEvent.clientY - startY;

                     // Maintain aspect ratio (roughly) by using the larger delta
                     const delta = Math.max(deltaX, deltaY);

                     // Apply minimum size constraints
                     const newWidth = Math.max(20, startWidth + delta);
                     const newHeight = Math.max(20, startHeight + delta);

                     // Trigger resize immediately
                     onResize(id, newWidth, newHeight);
                   };

                   const handleMouseUp = () => {
                     document.removeEventListener('mousemove', handleMouseMove);
                     document.removeEventListener('mouseup', handleMouseUp);
                     handleResizeStop(); // Call resize stop handler
                   };

                   setIsResizing(true); // Set resizing flag
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
      disabled={disabled || isResizing} // Disable drag while resizing
      cancel=".resize-handle, input, button, span" // Prevent drag on specific elements
    >
      <div
        className={`absolute ${!disabled ? 'cursor-move' : ''} touch-manipulation ${selected ? 'z-20' : 'z-10'}`}
        onClick={() => !disabled && !isResizing && onClick && onClick(id)} // Prevent click during resize
        {...mobileProps}
        style={{
          // Apply width/height to the draggable container itself
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }}
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

        {/* Render the element content inside the draggable container */}
        {elementContent}
      </div>
    </Draggable>
  );
};

export default StageElement;

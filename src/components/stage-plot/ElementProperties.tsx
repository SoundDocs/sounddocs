import React, { useState, useEffect } from 'react';

interface ElementPropertiesProps {
  selectedElement: {
    id: string;
    type: string;
    label: string;
    x: number;
    y: number;
    rotation: number;
    color?: string;
  } | null;
  onPropertyChange: (id: string, property: string, value: any) => void;
}

const ElementProperties: React.FC<ElementPropertiesProps> = ({ 
  selectedElement,
  onPropertyChange
}) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#4f46e5');
  const [rotation, setRotation] = useState(0);
  
  // Update local state when selected element changes
  useEffect(() => {
    if (selectedElement) {
      setLabel(selectedElement.label);
      setColor(selectedElement.color || '#4f46e5');
      setRotation(selectedElement.rotation);
    }
  }, [selectedElement]);
  
  if (!selectedElement) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-3">Element Properties</h3>
        <p className="text-gray-400 text-sm">Select an element on the stage to edit its properties</p>
      </div>
    );
  }
  
  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    onPropertyChange(selectedElement.id, 'label', newLabel);
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    onPropertyChange(selectedElement.id, 'color', newColor);
  };
  
  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRotation = parseInt(e.target.value);
    setRotation(newRotation);
    onPropertyChange(selectedElement.id, 'rotation', newRotation);
  };

  const handleManualRotation = (degrees: number) => {
    const newRotation = (rotation + degrees) % 360;
    const normalizedRotation = newRotation >= 0 ? newRotation : newRotation + 360;
    setRotation(normalizedRotation);
    onPropertyChange(selectedElement.id, 'rotation', normalizedRotation);
  };
  
  const elementTypes: Record<string, string> = {
    // Instruments
    'electric-guitar': 'Electric Guitar',
    'acoustic-guitar': 'Acoustic Guitar',
    'bass-guitar': 'Bass Guitar',
    'keyboard': 'Keyboard',
    'drums': 'Drums',
    'percussion': 'Percussion',
    'violin': 'Violin',
    'cello': 'Cello',
    'trumpet': 'Trumpet/Brass',
    'saxophone': 'Saxophone',
    'generic-instrument': 'Other Instrument',
    
    // Basic elements
    'microphone': 'Microphone',
    'monitor-wedge': 'Wedge Monitor',
    'amplifier': 'Amplifier',
    'speaker': 'Speaker',
    'di-box': 'DI Box',
    'power-strip': 'Power Strip',
    'iem': 'IEM',
    'person': 'Person',
    'text': 'Text Label'
  };
  
  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h3 className="text-lg font-medium text-white mb-4">Element Properties</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-2 text-sm">Element Type</label>
          <div className="bg-gray-700 px-3 py-2 rounded-md text-white text-sm">
            {elementTypes[selectedElement.type] || selectedElement.type}
          </div>
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2 text-sm" htmlFor="elementLabel">
            Label
          </label>
          <input
            id="elementLabel"
            type="text"
            value={label}
            onChange={handleLabelChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
          />
        </div>
        
        {selectedElement.type !== 'text' && (
          <div>
            <label className="block text-gray-300 mb-2 text-sm" htmlFor="elementColor">
              Color
            </label>
            <div className="flex space-x-3">
              <input
                id="elementColor"
                type="color"
                value={color}
                onChange={handleColorChange}
                className="bg-gray-700 border border-gray-600 rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-9 w-9"
              />
              <input 
                type="text"
                value={color}
                onChange={handleColorChange}
                className="flex-grow bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        )}
        
        <div>
          <label className="block text-gray-300 mb-2 text-sm" htmlFor="elementRotation">
            Rotation ({rotation}°)
          </label>
          <input
            id="elementRotation"
            type="range"
            min="0"
            max="359"
            step="5"
            value={rotation}
            onChange={handleRotationChange}
            className="w-full"
            style={{
              backgroundSize: `${(rotation / 359) * 100}% 100%`
            }}
          />
          <div className="flex justify-between mt-2">
            <button 
              className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 touch-manipulation"
              onClick={() => handleManualRotation(-45)}
            >
              -45°
            </button>
            <button 
              className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 touch-manipulation"
              onClick={() => handleManualRotation(-15)}
            >
              -15°
            </button>
            <button 
              className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 touch-manipulation"
              onClick={() => setRotation(0) || onPropertyChange(selectedElement.id, 'rotation', 0)}
            >
              Reset
            </button>
            <button 
              className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 touch-manipulation"
              onClick={() => handleManualRotation(15)}
            >
              +15°
            </button>
            <button 
              className="px-2 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 touch-manipulation"
              onClick={() => handleManualRotation(45)}
            >
              +45°
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2 text-sm">Position</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs mb-1">X</label>
              <div className="bg-gray-700 px-3 py-2 rounded-md text-white text-sm">
                {Math.round(selectedElement.x)}
              </div>
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Y</label>
              <div className="bg-gray-700 px-3 py-2 rounded-md text-white text-sm">
                {Math.round(selectedElement.y)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementProperties;
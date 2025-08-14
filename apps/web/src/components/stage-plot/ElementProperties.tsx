import React, { useState, useEffect, useRef } from "react";
import { Image as ImageIcon, Trash2, Eye, EyeOff } from "lucide-react"; // Added Eye, EyeOff
import { StageElementProps } from "./StageElement";

interface ElementPropertiesPanelProps {
  selectedElement: StageElementProps | null;
  onPropertyChange: (id: string, property: string, value: any) => void;
}

const ElementProperties: React.FC<ElementPropertiesPanelProps> = ({
  selectedElement,
  onPropertyChange,
}) => {
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#4f46e5");
  const [rotation, setRotation] = useState(0);
  const [labelVisible, setLabelVisible] = useState(true); // New state for label visibility
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedElement) {
      setLabel(selectedElement.label);
      setColor(selectedElement.color || "#4f46e5");
      setRotation(selectedElement.rotation);
      setLabelVisible(
        selectedElement.labelVisible === undefined ? true : selectedElement.labelVisible,
      ); // Default to true if undefined
    }
  }, [selectedElement]);

  if (!selectedElement) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-white mb-3">Element Properties</h3>
        <p className="text-gray-400 text-sm">
          Select an element on the stage to edit its properties
        </p>
      </div>
    );
  }

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setLabel(newLabel);
    onPropertyChange(selectedElement.id, "label", newLabel);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    onPropertyChange(selectedElement.id, "color", newColor);
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRotation = parseInt(e.target.value);
    setRotation(newRotation);
    onPropertyChange(selectedElement.id, "rotation", newRotation);
  };

  const handleManualRotation = (degrees: number) => {
    const newRotation = (rotation + degrees) % 360;
    const normalizedRotation = newRotation >= 0 ? newRotation : newRotation + 360;
    setRotation(normalizedRotation);
    onPropertyChange(selectedElement.id, "rotation", normalizedRotation);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedElement) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image size should be less than 2MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        onPropertyChange(selectedElement.id, "customImageUrl", event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomImage = () => {
    if (selectedElement) {
      onPropertyChange(selectedElement.id, "customImageUrl", null);
    }
  };

  const toggleLabelVisibility = () => {
    const newVisibility = !labelVisible;
    setLabelVisible(newVisibility);
    onPropertyChange(selectedElement.id, "labelVisible", newVisibility);
  };

  const elementTypes: Record<string, string> = {
    "electric-guitar": "Electric Guitar",
    "acoustic-guitar": "Acoustic Guitar",
    "bass-guitar": "Bass Guitar",
    keyboard: "Keyboard",
    drums: "Drums",
    percussion: "Percussion",
    violin: "Violin",
    cello: "Cello",
    trumpet: "Trumpet/Brass",
    saxophone: "Saxophone",
    "generic-instrument": "Other Instrument",
    "custom-image": "Custom Image",
    microphone: "Microphone",
    "monitor-wedge": "Wedge Monitor",
    amplifier: "Amplifier",
    speaker: "Speaker",
    "di-box": "DI Box",
    "power-strip": "Power Strip",
    iem: "IEM",
    person: "Person",
    text: "Text Label",
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
          <div className="flex justify-between items-center mb-2">
            <label className="block text-gray-300 text-sm" htmlFor="elementLabel">
              Label
            </label>
            <button
              onClick={toggleLabelVisibility}
              className={`p-1 rounded-md ${labelVisible ? "text-indigo-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-700"}`}
              title={labelVisible ? "Hide Label" : "Show Label"}
            >
              {labelVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
          <input
            id="elementLabel"
            type="text"
            value={label}
            onChange={handleLabelChange}
            className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
            disabled={!labelVisible && selectedElement.type !== "text"} // Text elements can always edit label, but visibility still applies
          />
        </div>

        {selectedElement.type !== "text" && !selectedElement.customImageUrl && (
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

        {selectedElement.type !== "text" && (
          <div>
            <label className="block text-gray-300 mb-2 text-sm">Custom Image</label>
            {selectedElement.customImageUrl ? (
              <div className="space-y-2">
                <img
                  src={selectedElement.customImageUrl}
                  alt="Custom element"
                  className="max-w-full h-auto rounded border border-gray-600 max-h-32 object-contain"
                />
                <button
                  onClick={handleRemoveCustomImage}
                  className="w-full inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md font-medium text-sm transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Image
                </button>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  ref={fileInputRef}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md font-medium text-sm transition-all duration-200"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Image
                </button>
                <p className="text-xs text-gray-400 mt-1">Max 2MB. Replaces element color.</p>
              </>
            )}
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
              backgroundSize: `${(rotation / 359) * 100}% 100%`,
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
              onClick={() => setRotation(0) || onPropertyChange(selectedElement.id, "rotation", 0)}
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

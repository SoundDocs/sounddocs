import React from "react";
import { X, Plus, Palette } from "lucide-react";

// Define and export CrewKeyItem here
export interface CrewKeyItem {
  id: string;
  name: string;
  color: string;
}

interface ProductionScheduleCrewKeyProps {
  crewKey: CrewKeyItem[];
  onAddCrewKeyItem: () => void;
  onDeleteCrewKeyItem: (id: string) => void; 
  onUpdateCrewKeyItem: (itemId: string, field: "name" | "color", value: string) => void; 
}

const predefinedColors = [
  "#FF6B6B", // Red
  "#4ECDC4", // Teal
  "#45B7D1", // Blue
  "#FED766", // Yellow
  "#2AB7CA", // Cyan
  "#F0B67F", // Orange
  "#8A6FBF", // Purple
  "#51E898", // Green
  "#FFB3BA", // Pink
  "#F9ADA0", // Light Salmon
  "#A0E7E5", // Light Cyan
  "#B4F8C8", // Light Green
];

const ProductionScheduleCrewKey: React.FC<ProductionScheduleCrewKeyProps> = ({
  crewKey,
  onAddCrewKeyItem,
  onDeleteCrewKeyItem, 
  onUpdateCrewKeyItem,
}) => {
  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        {crewKey.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center space-x-3 p-3 bg-gray-700 rounded-md"
          >
            <span className="text-gray-400">{index + 1}.</span>
            <input
              type="text"
              placeholder="Crew Name (e.g., Audio, Lighting)"
              value={item.name}
              onChange={(e) => onUpdateCrewKeyItem(item.id, "name", e.target.value)} 
              className="flex-grow bg-gray-600 text-white p-2 rounded-md border border-gray-500 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="relative">
              <input
                type="color"
                value={item.color}
                onChange={(e) => onUpdateCrewKeyItem(item.id, "color", e.target.value)} 
                className="w-10 h-10 p-0 border-none rounded-md cursor-pointer appearance-none invisible"
                id={`color-picker-${item.id}`}
              />
              <label
                htmlFor={`color-picker-${item.id}`}
                className="w-10 h-10 rounded-md cursor-pointer flex items-center justify-center border border-gray-500"
                style={{ backgroundColor: item.color }}
                title="Select Color"
              >
                <Palette size={20} className="text-white opacity-75" />
              </label>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {predefinedColors.slice(0, 6).map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-5 h-5 rounded-sm border border-gray-500 hover:opacity-80"
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateCrewKeyItem(item.id, "color", color)} 
                  title={`Set color to ${color}`}
                />
              ))}
            </div>
             <div className="grid grid-cols-6 gap-1">
              {predefinedColors.slice(6, 12).map((color) => (
                <button
                  key={color}
                  type="button"
                  className="w-5 h-5 rounded-sm border border-gray-500 hover:opacity-80"
                  style={{ backgroundColor: color }}
                  onClick={() => onUpdateCrewKeyItem(item.id, "color", color)} 
                  title={`Set color to ${color}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => onDeleteCrewKeyItem(item.id)} 
              className="p-2 text-red-400 hover:text-red-300 transition-colors"
              title="Remove Crew Item"
            >
              <X size={20} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAddCrewKeyItem}
        className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
      >
        <Plus size={18} className="mr-2" />
        Add Crew Type
      </button>
    </div>
  );
};

export default ProductionScheduleCrewKey;

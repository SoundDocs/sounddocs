import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Palette } from "lucide-react";

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
  "#EF4444",
  "#F97316",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
  "#78716C",
  "#A3A3A3",
  "#4B5563",
];

const POPUP_WIDTH_PX = 256; // Corresponds to w-64 (16rem * 16px/rem)
const POPUP_HEIGHT_PX = 330; // Estimated height, adjusted for padding/margins
const MARGIN_PX = 8; // Margin from button to popup

const ProductionScheduleCrewKey: React.FC<ProductionScheduleCrewKeyProps> = ({
  crewKey,
  onAddCrewKeyItem,
  onDeleteCrewKeyItem,
  onUpdateCrewKeyItem,
}) => {
  const [openColorPickerItemId, setOpenColorPickerItemId] = useState<string | null>(null);
  const [currentEditingHex, setCurrentEditingHex] = useState<string>("");
  const [portalPosition, setPortalPosition] = useState<{ top: number; left: number } | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  const handleToggleColorPicker = (
    itemId: string,
    currentColor: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (openColorPickerItemId === itemId) {
      if (currentEditingHex && /^#([0-9A-Fa-f]{3}){1,2}$/i.test(currentEditingHex)) {
        onUpdateCrewKeyItem(itemId, "color", currentEditingHex);
      }
      setOpenColorPickerItemId(null);
      setPortalPosition(null);
      setCurrentEditingHex("");
    } else {
      triggerButtonRef.current = event.currentTarget;
      const buttonRect = event.currentTarget.getBoundingClientRect();

      let placement = "below";
      const spaceBelow = window.innerHeight - buttonRect.bottom - MARGIN_PX;
      const spaceAbove = buttonRect.top - MARGIN_PX;

      if (spaceBelow < POPUP_HEIGHT_PX) {
        if (spaceAbove >= POPUP_HEIGHT_PX) {
          placement = "above";
        } else {
          // Not enough space above or below, pick side with more space or default to below
          placement = spaceAbove > spaceBelow ? "above" : "below";
        }
      }

      let newTop: number;
      if (placement === "above") {
        newTop = buttonRect.top - POPUP_HEIGHT_PX - MARGIN_PX;
      } else {
        newTop = buttonRect.bottom + MARGIN_PX;
      }

      let newLeft = buttonRect.left + buttonRect.width / 2 - POPUP_WIDTH_PX / 2;

      // Clamp to viewport
      if (newLeft < MARGIN_PX) newLeft = MARGIN_PX;
      if (newLeft + POPUP_WIDTH_PX > window.innerWidth - MARGIN_PX) {
        newLeft = window.innerWidth - POPUP_WIDTH_PX - MARGIN_PX;
      }
      if (newTop < MARGIN_PX) newTop = MARGIN_PX;
      if (newTop + POPUP_HEIGHT_PX > window.innerHeight - MARGIN_PX) {
        newTop = window.innerHeight - POPUP_HEIGHT_PX - MARGIN_PX;
      }

      setPortalPosition({ top: newTop, left: newLeft });
      setOpenColorPickerItemId(itemId);
      setCurrentEditingHex(currentColor);
    }
  };

  const handleColorSelected = (itemId: string, color: string) => {
    onUpdateCrewKeyItem(itemId, "color", color);
    setCurrentEditingHex(color);
  };

  const handlePredefinedColorClick = (itemId: string, color: string) => {
    handleColorSelected(itemId, color);
    setOpenColorPickerItemId(null);
    setPortalPosition(null);
    setCurrentEditingHex("");
  };

  const handleDoneClick = () => {
    if (openColorPickerItemId && currentEditingHex) {
      if (/^#([0-9A-Fa-f]{3}){1,2}$/i.test(currentEditingHex)) {
        onUpdateCrewKeyItem(openColorPickerItemId, "color", currentEditingHex);
      }
    }
    setOpenColorPickerItemId(null);
    setPortalPosition(null);
    setCurrentEditingHex("");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node) &&
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(event.target as Node)
      ) {
        const targetIsAnotherTriggerButton =
          (event.target as HTMLElement).closest(".color-picker-trigger-button") &&
          !(triggerButtonRef.current && triggerButtonRef.current.contains(event.target as Node));

        if (!targetIsAnotherTriggerButton) {
          handleDoneClick();
        }
      }
    };

    if (openColorPickerItemId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (!openColorPickerItemId) {
        triggerButtonRef.current = null;
      }
    };
  }, [openColorPickerItemId]); // Removed currentEditingHex from dependencies

  return (
    <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-md">
      <div className="space-y-4">
        {crewKey.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center space-x-3 p-3 bg-gray-700 rounded-md relative" // Relative is still useful for non-portaled elements if any
          >
            <span className="text-gray-400 flex-shrink-0">{index + 1}.</span>
            <input
              type="text"
              placeholder="Crew Name (e.g., Audio, Lighting)"
              value={item.name}
              onChange={(e) => onUpdateCrewKeyItem(item.id, "name", e.target.value)}
              className="flex-grow bg-gray-600 text-white p-2 rounded-md border border-gray-500 focus:ring-indigo-500 focus:border-indigo-500 min-w-0"
            />
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={(e) => handleToggleColorPicker(item.id, item.color, e)}
                className="w-10 h-10 rounded-md cursor-pointer flex items-center justify-center border border-gray-500 hover:opacity-80 color-picker-trigger-button"
                style={{ backgroundColor: item.color }}
                title="Select Color"
              >
                <Palette size={20} className="text-white opacity-75 pointer-events-none" />
              </button>
            </div>

            {openColorPickerItemId === item.id &&
              portalPosition &&
              createPortal(
                <div
                  ref={colorPickerRef}
                  className="fixed z-[60] w-64 p-3 bg-slate-800 border border-gray-600 rounded-lg shadow-xl"
                  style={{ top: `${portalPosition.top}px`, left: `${portalPosition.left}px` }}
                  onClick={(e) => e.stopPropagation()} // Prevent clicks inside picker from closing it
                >
                  <p className="text-sm text-gray-300 mb-2 font-medium">Select Color</p>
                  <div className="grid grid-cols-6 gap-1.5 mb-3">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-full aspect-square rounded border border-gray-500 hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => handlePredefinedColorClick(item.id, color)}
                        title={`Set color to ${color}`}
                      />
                    ))}
                  </div>

                  <div className="mb-2">
                    <label
                      htmlFor={`hex-color-input-${item.id}`}
                      className="block text-xs text-gray-400 mb-1"
                    >
                      HEX Code
                    </label>
                    <input
                      type="text"
                      id={`hex-color-input-${item.id}`}
                      value={currentEditingHex}
                      onChange={(e) => setCurrentEditingHex(e.target.value)}
                      className="w-full bg-gray-600 text-white p-1.5 rounded-md border border-gray-500 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="#RRGGBB"
                    />
                  </div>

                  <div className="mb-3">
                    <label
                      htmlFor={`native-color-picker-${item.id}`}
                      className="block text-xs text-gray-400 mb-1"
                    >
                      Custom Color
                    </label>
                    <input
                      type="color"
                      id={`native-color-picker-${item.id}`}
                      value={item.color} // Bind to item.color for immediate reflection if changed by hex/predefined
                      onChange={(e) => handleColorSelected(item.id, e.target.value)}
                      className="w-full h-10 p-0 border-none rounded-md cursor-pointer appearance-none bg-transparent"
                      // The browser will show the color, style backgroundColor is mostly for fallback or consistency
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDoneClick}
                    className="w-full text-sm bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-colors"
                  >
                    Done
                  </button>
                </div>,
                document.body,
              )}
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={() => onDeleteCrewKeyItem(item.id)}
                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                title="Remove Crew Item"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAddCrewKeyItem}
        className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500"
      >
        <Plus size={18} className="mr-2" />
        Add Crew Type
      </button>
    </div>
  );
};

export default ProductionScheduleCrewKey;

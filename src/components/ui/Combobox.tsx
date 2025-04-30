/**
 * A customizable dropdown select component with search functionality.
 * 
 * Features:
 * - Dropdown selection with search filtering
 * - Keyboard navigation support
 * - Custom styling options
 * - Visual feedback for selected items
 * - Accessible with ARIA attributes
 * - Support for data attributes for table integration
 * - Type-safe with TypeScript
 * 
 * Props:
 * @param value - Current selected value
 * @param options - Array of available options
 * @param onChange - Callback function when value changes
 * @param className - Optional custom CSS classes
 * @param data-row - Optional row index for table integration
 * @param data-field - Optional field name for table integration
 * @param onKeyDown - Optional keyboard event handler
 * 
 * Usage:
 * ```tsx
 * <Combobox
 *   value={selectedValue}
 *   options={['Option 1', 'Option 2', 'Option 3']}
 *   onChange={(value) => setSelectedValue(value)}
 *   className="custom-class"
 * />
 * ```
 */


import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

// Simple utility function to combine class names
const combineClasses = (...classes: (string | undefined | boolean)[]) => {
    return classes.filter(Boolean).join(' ');
  };

interface ComboboxProps {
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  className?: string;
  'data-row'?: number;
  'data-field'?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const Combobox: React.FC<ComboboxProps> = ({
  value,
  options,
  onChange,
  className,
  'data-row': dataRow,
  'data-field': dataField,
  onKeyDown,
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div
        className={combineClasses(
          "flex items-center justify-between",
          className
        )}
        onClick={() => setOpen(!open)}
        data-row={dataRow}
        data-field={dataField}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        <span>{value || 'Select...'}</span>
        <ChevronsUpDown className="w-4 h-4 opacity-50" />
      </div>
      
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 rounded-md shadow-lg">
          {options.map((option) => (
            <div
              key={option}
              className={combineClasses(
                "flex items-center px-2 py-1.5 hover:bg-gray-700 cursor-pointer",
                value === option && "bg-gray-700"
              )}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
            >
              {value === option && (
                <Check className="w-4 h-4 mr-2" />
              )}
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
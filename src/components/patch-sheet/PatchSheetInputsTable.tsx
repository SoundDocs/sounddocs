/**
 * PatchSheetInputsTable - A table component for managing audio input channels
 * 
 * Features:
 * - Dynamic input channel management with editable cells
 * - Type-specific device selection based on input type
 * - Connection routing with context-aware detail fields
 * - Phantom power and stereo channel linking
 * 
 * TODO:
 * - Add keyboard navigation support:
 *   - Tab/Enter navigation between cells
 *   - Arrow key navigation
 *   - Cell editing shortcuts
 * - Bulk operations (add, delete, copy)
 * - Row Selection
 * - Sortable and resizable columns
 * 
 * Props:
 * @param inputs - Array of InputChannel objects representing the patch sheet inputs
 * @param updateInputs - Callback function to update the inputs array
 * 
 * Usage:
 * ```tsx
 * <PatchSheetInputsTable
 *   inputs={patchSheetInputs}
 *   updateInputs={handleInputsUpdate}
 * />
 * ```
 */

import React, { useCallback, useMemo } from 'react';
import { Table, Column } from '../ui/Table';
import { InputChannel, InputTypeValues } from '../../types/patch-sheet';
import { 
  INPUT_TYPES, 
  CONNECTION_TYPES, 
  DEVICE_OPTIONS_BY_TYPE,
  ANALOG_SNAKE_TYPES,
  DIGITAL_SNAKE_TYPES,
  NETWORK_TYPES,
  CONSOLE_TYPES 
} from '../../constants/inputTypes';
import { Combobox } from '../ui/Combobox';
import { Button } from '../ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface PatchSheetInputsTableProps {
  inputs: InputChannel[];
  updateInputs: (inputs: InputChannel[]) => void;
}

export const PatchSheetInputsTable: React.FC<PatchSheetInputsTableProps> = ({
  inputs,
  updateInputs,
}) => {
  const handleAddRow = useCallback(() => {
    const newInput: InputChannel = {
      id: crypto.randomUUID(),
      channelNumber: String(inputs.length + 1),
      name: '',
      type: '',
      device: '',
      phantom: false,
      connection: 'Console Direct',
      notes: '',
    };
    updateInputs([...inputs, newInput]);
  }, [inputs, updateInputs]);

  const handleCellChange = useCallback((id: string, field: keyof InputChannel, value: any) => {
    updateInputs(
      inputs.map(input => 
        input.id === id 
          ? { ...input, [field]: value }
          : input
      )
    );
  }, [inputs, updateInputs]);

  const handleConnectionDetailChange = useCallback((
    id: string,
    field: string,
    value: any
  ) => {
    updateInputs(
      inputs.map(input => 
        input.id === id
          ? {
              ...input,
              connectionDetails: {
                ...(input.connectionDetails || {}),
                [field]: value
              }
            }
          : input
      )
    );
  }, [inputs, updateInputs]);

  const columns = useMemo<Column<InputChannel>[]>(() => [
    {
      header: '#',
      accessorKey: 'channelNumber',
      cell: (item: InputChannel) => (
        <input
          type="text"
          value={item.channelNumber}
          onChange={(e) => handleCellChange(item.id, 'channelNumber', e.target.value)}
          className="w-full bg-transparent text-white"
        />
      ),
      width: 70,
    },
    {
      header: 'Name',
      accessorKey: 'name',
      cell: (item: InputChannel) => (
        <input
          type="text"
          value={item.name}
          onChange={(e) => handleCellChange(item.id, 'name', e.target.value)}
          className="w-full bg-transparent text-white"
        />
      ),
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: (item: InputChannel) => (
        <Combobox
          value={item.type}
          options={INPUT_TYPES}
          onChange={(value) => handleCellChange(item.id, 'type', value)}
          className="w-full bg-transparent text-white"
        />
      ),
    },
    {
      header: 'Device',
      accessorKey: 'device',
      cell: (item: InputChannel) => {
        const inputType = item.type as InputTypeValues;
        const deviceOptions = inputType ? DEVICE_OPTIONS_BY_TYPE[inputType] || [] : [];
        
        return (
          <Combobox
            value={item.device}
            options={deviceOptions}
            onChange={(value) => handleCellChange(item.id, 'device', value)}
            className="w-full bg-transparent text-white"
          />
        );
      },
    },
    {
      header: 'Connection',
      accessorKey: 'connection',
      cell: (item: InputChannel) => (
        <Combobox
          value={item.connection}
          options={CONNECTION_TYPES}
          onChange={(value) => handleCellChange(item.id, 'connection', value)}
          className="w-full bg-transparent text-white"
        />
      ),
    },
    {
      header: 'Connection Details',
      accessorKey: 'connectionDetails',
      cell: (item: InputChannel) => {
        const details = item.connectionDetails || {};
        switch (item.connection) {
          case 'Console Direct':
            return (
              <div className="flex gap-2">
                <Combobox
                  value={details.consoleType || ''}
                  options={CONSOLE_TYPES}
                  onChange={(value) => handleConnectionDetailChange(item.id, 'consoleType', value)}
                  className="w-full bg-transparent text-white"
                />
                <input
                  type="text"
                  value={details.consoleInputNumber || ''}
                  onChange={(e) => handleConnectionDetailChange(item.id, 'consoleInputNumber', e.target.value)}
                  className="w-16 bg-transparent text-white border-b border-gray-600"
                  placeholder="#"
                />
              </div>
            );
          case 'Analog Snake':
          case 'Digital Snake':
            return (
              <div className="flex gap-2">
                <Combobox
                  value={details.snakeType || ''}
                  options={item.connection === 'Analog Snake' ? ANALOG_SNAKE_TYPES : DIGITAL_SNAKE_TYPES}
                  onChange={(value) => handleConnectionDetailChange(item.id, 'snakeType', value)}
                  className="w-full bg-transparent text-white"
                />
                <input
                  type="text"
                  value={details.inputNumber || ''}
                  onChange={(e) => handleConnectionDetailChange(item.id, 'inputNumber', e.target.value)}
                  className="w-16 bg-transparent text-white border-b border-gray-600"
                  placeholder="#"
                />
              </div>
            );
          case 'Digital Network':
            return (
              <div className="flex gap-2">
                <Combobox
                  value={details.networkType || ''}
                  options={NETWORK_TYPES}
                  onChange={(value) => handleConnectionDetailChange(item.id, 'networkType', value)}
                  className="w-full bg-transparent text-white"
                />
                <input
                  type="text"
                  value={details.networkPatch || ''}
                  onChange={(e) => handleConnectionDetailChange(item.id, 'networkPatch', e.target.value)}
                  className="w-16 bg-transparent text-white border-b border-gray-600"
                  placeholder="#"
                />
              </div>
            );
          default:
            return null;
        }
      },
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
      cell: (item: InputChannel) => (
        <input
          type="text"
          value={item.notes}
          onChange={(e) => handleCellChange(item.id, 'notes', e.target.value)}
          className="w-full bg-transparent text-white"
        />
      ),
    },
    {
      header: 'Stereo',
      accessorKey: 'isStereo',
      cell: (item: InputChannel) => (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.isStereo}
            onChange={(e) => handleCellChange(item.id, 'isStereo', e.target.checked)}
            className="h-4 w-4 rounded border-gray-600"
          />
          {item.isStereo && (
            <input
              type="text"
              value={item.stereoChannelNumber || ''}
              onChange={(e) => handleCellChange(item.id, 'stereoChannelNumber', e.target.value)}
              className="w-12 bg-transparent text-white border-b border-gray-600"
              placeholder="Ch#"
            />
          )}
        </div>
      ),
    },
    {
      header: '48V',
      accessorKey: 'phantom',
      cell: (item: InputChannel) => (
        <input
          type="checkbox"
          checked={item.phantom}
          onChange={(e) => handleCellChange(item.id, 'phantom', e.target.checked)}
          className="h-4 w-4 rounded border-gray-600"
        />
      ),
    },
    {
      header: '',
      accessorKey: 'id',
      cell: (item: InputChannel) => (
        <button
          onClick={() => {
            const newInputs = inputs.filter(input => input.id !== item.id);
            updateInputs(newInputs);
          }}
          className="p-1 text-red-400 hover:text-red-500 transition-colors hover:bg-gray-700 rounded-full"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      width: 50,
    }
  ], [handleCellChange, handleConnectionDetailChange, inputs, updateInputs]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={handleAddRow}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </Button>
      </div>

      <div className="rounded-md border border-gray-700">
        <Table
          data={inputs}
          columns={columns}
        />
      </div>
    </div>
  );
};

export default PatchSheetInputsTable;
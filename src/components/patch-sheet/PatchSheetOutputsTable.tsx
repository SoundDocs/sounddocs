/**
 * PatchSheetOutputsTable
 * - A table component for managing audio outputs channels.
 * - Just like inputs... but for outputs.
 * 
 * 
 * Features:
 * - Dynamic output management with editable cells
 * - Type-specific device selection based on input type
 * 
 * TODO:
 * - Solidify and potentially re-work patching process and flow.
 * - Add keyboard navigation support:
 *   - Tab/Enter navigation between cells
 *   - Arrow key navigation
 *   - Cell editing shortcuts
 * - Bulk operations (add, delete, copy)
 * - Row Selection
 * - Sortable and resizable columns
 * 
 * Props:
 * @param outputs - Array of OutputChannel objects representing the patch sheet inputs
 * @param updateOutputs - Callback function to update the inputs array
 * 
 * Usage:
 * ```tsx
 * <PatchSheetOutputsTable
 *   inputs={patchSheetOutputs}
 *   updateOutputs={handleOutputsUpdate}
 * />
 * ```
 */


import React, { useCallback, useMemo } from 'react';
import { Table, Column } from '../ui/Table';
import { OutputChannel } from '../../types/patch-sheet';
import { DESTINATION_TYPES } from '../../constants/outputTypes'; 
import { Combobox } from '../ui/Combobox';
import { Button } from '../ui/Button';
import { PlusCircle, Trash2 } from 'lucide-react';

interface PatchSheetOutputsTableProps {
  outputs: OutputChannel[];
  updateOutputs: (outputs: OutputChannel[]) => void;
}

export const PatchSheetOutputsTable: React.FC<PatchSheetOutputsTableProps> = ({
  outputs,
  updateOutputs,
}) => {
  const handleAddRow = useCallback(() => {
    const newOutput: OutputChannel = {
      id: crypto.randomUUID(),
      channelNumber: String(outputs.length + 1),
      name: '',
      sourceType: "",
      destinationType: "",
      destinationGear: "",
      notes: ""
    };
    updateOutputs([...outputs, newOutput]);
  }, [outputs, updateOutputs]);

  const handleCellChange = useCallback((id: string, field: keyof OutputChannel, value: any) => {
    updateOutputs(
      outputs.map(output => 
        output.id === id 
          ? { ...output, [field]: value }
          : output
      )
    );
  }, [outputs, updateOutputs]);

  // const handleConnectionDetailChange = useCallback((
  //   id: string,
  //   field: string,
  //   value: any
  // ) => {
  //   updateOutputs(
  //     outputs.map(output => 
  //       output.id === id
  //         ? {
  //             ...output,
  //             connectionDetails: {
  //               ...(output.connectionDetails || {}),
  //               [field]: value
  //             }
  //           }
  //         : output
  //     )
  //   );
  // }, [outputs, updateOutputs]);

  const columns = useMemo<Column<OutputChannel>[]>(() => [
    {
      header: '#',
      accessorKey: 'channelNumber',
      cell: (item: OutputChannel) => (
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
      cell: (item: OutputChannel) => (
        <input
          type="text"
          value={item.name}
          onChange={(e) => handleCellChange(item.id, 'name', e.target.value)}
          className="w-full bg-transparent text-white"
        />
      ),
    },
    {
      header: 'Destination Type',
      accessorKey: 'destinationType',
      cell: (item: OutputChannel) => (
        <Combobox
          value={item.destinationType}
          options={DESTINATION_TYPES}
          onChange={(value) => handleCellChange(item.id, 'destinationType', value)}
          className="w-full bg-transparent text-white"
        />
      ),
    },
    {
      header: 'Destination Gear',
      accessorKey: 'destinationGear',
      cell: (item: OutputChannel) => (
        <input
          type="text"
          value={item.destinationGear}
          onChange={(e) => handleCellChange(item.id, 'destinationGear', e.target.value)}
          className="w-full bg-transparent text-white"
        />
      )
    },
    {
      header: 'Notes',
      accessorKey: 'notes',
      cell: (item: OutputChannel) => (
        <input
          type="text"
          value={item.notes}
          onChange={(e) => handleCellChange(item.id, 'notes', e.target.value)}
          className="w-full bg-transparent text-white"
        />
      ),
    },
    
    
    {
      header: '',
      accessorKey: 'id',
      cell: (item: OutputChannel) => (
        <button
          onClick={() => {
            const newOutputs = outputs.filter(output => output.id !== item.id);
            updateOutputs(newOutputs);
          }}
          className="p-1 text-red-400 hover:text-red-500 transition-colors hover:bg-gray-700 rounded-full"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
      width: 50,
    }
  ], [handleCellChange, outputs, updateOutputs]);
  // removed handelConnectionDetailChange for now.

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
          <Button
            onClick={handleAddRow}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Output
          </Button>
      </div>

      <div className="rounded-md border border-gray-700">
        <Table
          data={outputs}
          columns={columns}
        />
      </div>
    </div>
  );
};

export default PatchSheetOutputsTable;
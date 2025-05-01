import React, { useState } from 'react';
import { TableIcon, ListIcon } from 'lucide-react';
import PatchSheetOutputsTable from './PatchSheetOutputsTable';
import { OutputChannel } from '../../types/patch-sheet';
import PatchSheetOutputs from './PatchSheetOutputs';

interface PatchSheetOutputsWrapperProps {
  outputs: OutputChannel[];
  updateOutputs: (outputs: OutputChannel[]) => void;
}

const PatchSheetOutputsWrapper: React.FC<PatchSheetOutputsWrapperProps> = ({
  outputs,
  updateOutputs,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Ouput List</h2>
        <div className="flex items-center space-x-2 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title="List View"
          >
            <ListIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-gray-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Table View"
          >
            <TableIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <PatchSheetOutputs outputs={outputs} updateOutputs={updateOutputs} />
      ) : (
        <PatchSheetOutputsTable outputs={outputs} updateOutputs={updateOutputs} />
      )}
    </div>
  );
};

export default PatchSheetOutputsWrapper;
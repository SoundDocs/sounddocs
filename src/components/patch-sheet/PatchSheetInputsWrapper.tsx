import React, { useState } from 'react';
import { TableIcon, ListIcon } from 'lucide-react';
import PatchSheetInputs from './PatchSheetInputs';
import PatchSheetInputsTable from './PatchSheetInputsTable';
import { InputChannel } from '../../types/patch-sheet';

interface PatchSheetInputsWrapperProps {
  inputs: InputChannel[];
  updateInputs: (inputs: InputChannel[]) => void;
}

const PatchSheetInputsWrapper: React.FC<PatchSheetInputsWrapperProps> = ({
  inputs,
  updateInputs,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'table'>('list');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Input List</h2>
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
        <PatchSheetInputs inputs={inputs} updateInputs={updateInputs} />
      ) : (
        <PatchSheetInputsTable inputs={inputs} updateInputs={updateInputs} />
      )}
    </div>
  );
};

export default PatchSheetInputsWrapper;
import React, { useState, useEffect, useMemo } from "react";
import { X, Trash2, Eye, EyeOff, Search, Calculator } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { Measurement } from "../../lib/types";

interface SavedMeasurementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  measurements: Measurement[];
  visibleIds: Set<string>;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  onManageMath: () => void;
}

const SavedMeasurementsModal: React.FC<SavedMeasurementsModalProps> = ({
  isOpen,
  onClose,
  measurements,
  visibleIds,
  onToggleVisibility,
  onDelete,
  onRefresh,
  onManageMath,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      onRefresh();
    }
  }, [isOpen]);

  const filteredMeasurements = useMemo(() => {
    return measurements.filter((m) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [measurements, searchTerm]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">Saved Measurements</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </header>
        <div className="p-4 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search measurements..."
              className="bg-gray-700 text-white w-full pl-10 pr-4 py-2 rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <main className="flex-grow p-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredMeasurements.map((m) => (
              <li
                key={m.id}
                className="bg-gray-700 p-3 rounded-md flex justify-between items-center"
              >
                <div className="flex items-center space-x-2">
                  {m.isMathTrace && <Calculator className="h-5 w-5 text-cyan-400" />}
                  <div>
                    <p className="font-semibold text-white">{m.name}</p>
                    <p className="text-sm text-gray-400">
                      {m.isMathTrace ? "Math Trace" : new Date(m.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onToggleVisibility(m.id)}
                    className="p-2 hover:bg-gray-600 rounded-full"
                  >
                    {visibleIds.has(m.id) ? (
                      <Eye className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(m.id)}
                    className="p-2 hover:bg-gray-600 rounded-full"
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </main>
        <footer className="p-4 border-t border-gray-700 flex justify-between">
          <button
            onClick={onManageMath}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Manage Math Traces
          </button>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default SavedMeasurementsModal;

import React from 'react';
import { FileImage, Printer, X } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportImage: () => void;
  onExportPdf: () => void;
  title: string;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportImage,
  onExportPdf,
  title,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Export {title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div
            className="bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-colors flex items-center cursor-pointer"
            onClick={onExportImage}
          >
            <div className="bg-indigo-600/20 p-3 rounded-md mr-4">
              <FileImage className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Image Export</h4>
              <p className="text-gray-300 text-sm">
                Export as a PNG image with the current design and colors
              </p>
            </div>
          </div>

          <div
            className="bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-colors flex items-center cursor-pointer"
            onClick={onExportPdf}
          >
            <div className="bg-indigo-600/20 p-3 rounded-md mr-4">
              <Printer className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Print-friendly Image</h4>
              <p className="text-gray-300 text-sm">
                Export as a PNG with minimal colors, ideal for printing in black & white
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-right">
          <button
            className="px-4 py-2 text-gray-300 hover:text-white"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
import React from "react";
import { FileImage, Printer, X, Loader } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportColor: () => void;
  onExportPrintFriendly: () => void;
  title: string;
  isExporting?: boolean;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportColor,
  onExportPrintFriendly,
  title,
  isExporting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Export {title} as PDF</h3>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <button
            className="w-full bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-colors flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onExportColor}
            disabled={isExporting}
          >
            <div className="bg-indigo-600/20 p-3 rounded-md mr-4">
              {isExporting ? (
                <Loader className="h-6 w-6 text-indigo-400 animate-spin" />
              ) : (
                <FileImage className="h-6 w-6 text-indigo-400" />
              )}
            </div>
            <div>
              <h4 className="text-white font-medium mb-1 text-left">Color PDF</h4>
              <p className="text-gray-300 text-sm text-left">
                Export as a color PDF with the original design. Best for digital sharing.
              </p>
            </div>
          </button>

          <button
            className="w-full bg-gray-700 p-4 rounded-lg hover:bg-gray-650 transition-colors flex items-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onExportPrintFriendly}
            disabled={isExporting}
          >
            <div className="bg-indigo-600/20 p-3 rounded-md mr-4">
              {isExporting ? (
                <Loader className="h-6 w-6 text-indigo-400 animate-spin" />
              ) : (
                <Printer className="h-6 w-6 text-indigo-400" />
              )}
            </div>
            <div>
              <h4 className="text-white font-medium mb-1 text-left">Print-friendly PDF</h4>
              <p className="text-gray-300 text-sm text-left">
                Export as a PDF with minimal colors, ideal for printing.
              </p>
            </div>
          </button>
        </div>

        <div className="mt-6 text-right">
          <button
            className="px-4 py-2 text-gray-300 hover:text-white disabled:opacity-50"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;

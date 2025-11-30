import React from "react";
import { X, ExternalLink, Download, Server } from "lucide-react";

interface DeprecationNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeprecationNoticeModal: React.FC<DeprecationNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-950/95 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl shadow-indigo-900/20 max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center">
            <img src="/eventools-logo.png" alt="eventools" className="h-16 w-16 mb-6" />

            <h2 className="text-2xl font-bold text-white mb-4">We're Building Something New!</h2>

            <div className="space-y-4 text-gray-300">
              <p>
                We're excited to announce that we're working on{" "}
                <span className="text-indigo-400 font-semibold">eventools</span> — the next
                generation of event production tools.
              </p>

              <p>SoundDocs will be transitioning to eventools in the near future.</p>

              <div className="bg-gray-800/50 rounded-lg p-4 text-left">
                <p className="text-white font-medium mb-3">Don't worry — we'll provide:</p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Download className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Instructions for downloading your data</span>
                  </li>
                  <li className="flex items-start">
                    <Server className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Self-hosting documentation for SoundDocs</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full">
              <a
                href="https://eventools.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
              >
                Sign Up for eventools Beta
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Got it, thanks
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeprecationNoticeModal;

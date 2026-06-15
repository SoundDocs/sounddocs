import React from "react";
import { useNavigate } from "react-router-dom";
import { X, ExternalLink, Download, Server, CalendarClock } from "lucide-react";

interface DeprecationNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SELF_HOSTING_GUIDE_URL =
  "https://github.com/SoundDocs/sounddocs/blob/main/self-host/EASY-START.md";

const DeprecationNoticeModal: React.FC<DeprecationNoticeModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const goToExport = () => {
    onClose();
    navigate("/profile");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-950/95 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl shadow-indigo-900/20 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center">
            <img src="/eventools-logo.png" alt="eventools" className="h-16 w-16 mb-6" />

            <h2 className="text-2xl font-bold text-white mb-4">eventools is now in free beta</h2>

            <div className="space-y-4 text-gray-300">
              <p>
                SoundDocs is becoming{" "}
                <a
                  href="https://eventools.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 font-semibold hover:text-indigo-300"
                >
                  eventools
                </a>{" "}
                — one platform with all the tools for your whole production team. It's live now in{" "}
                <span className="text-white font-semibold">free beta</span>, with every tool
                unlocked while the beta runs.
              </p>

              <div className="flex items-start bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-left">
                <CalendarClock className="h-5 w-5 text-amber-400 mr-3 mt-0.5 flex-shrink-0" />
                <p className="text-amber-100">
                  SoundDocs will be retired on{" "}
                  <span className="font-semibold text-white">September 1, 2026</span>. After that
                  date the hosted version goes offline — so grab your data before then.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-4 text-left">
                <p className="text-white font-medium mb-3">Your work is yours to keep:</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Download className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="text-white font-medium">Download your data</span> — export
                      everything from your{" "}
                      <button
                        onClick={goToExport}
                        className="text-indigo-400 underline hover:text-indigo-300"
                      >
                        Profile
                      </button>{" "}
                      as a single backup file.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Server className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <span className="text-white font-medium">Self-host SoundDocs</span> — it's
                      free and open-source. Our{" "}
                      <a
                        href={SELF_HOSTING_GUIDE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 underline hover:text-indigo-300"
                      >
                        setup guide
                      </a>{" "}
                      gets you running in minutes, and a first-run wizard imports your backup.
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 w-full">
              <a
                href="https://eventools.io/?mode=signup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors"
              >
                Try eventools free beta
                <ExternalLink className="h-4 w-4 ml-2" />
              </a>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={goToExport}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download my data
                </button>
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
    </div>
  );
};

export default DeprecationNoticeModal;

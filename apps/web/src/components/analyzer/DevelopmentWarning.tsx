import React from "react";

interface DevelopmentWarningProps {
  onAcknowledge: () => void;
}

const DevelopmentWarning: React.FC<DevelopmentWarningProps> = ({ onAcknowledge }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold text-white mb-4">Under Development</h2>
        <p className="text-gray-300 mb-6">
          SoundDocs AcoustIQ is currently under active development. Features may change, and you
          might encounter bugs. This message will be removed once the platform is stable.
        </p>
        <button
          onClick={onAcknowledge}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Acknowledge
        </button>
      </div>
    </div>
  );
};

export default DevelopmentWarning;

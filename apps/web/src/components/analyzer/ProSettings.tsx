import React from "react";
import { Device } from "@sounddocs/analyzer-protocol";

interface ProSettingsProps {
  devices: Device[];
  onStartCapture: (config: any) => void;
  onStopCapture: () => void;
}

export const ProSettings: React.FC<ProSettingsProps> = ({
  devices,
  onStartCapture,
  onStopCapture,
}) => {
  // This component will be complex. For now, we will just draw a placeholder.
  // The full implementation will follow in subsequent steps.

  return (
    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-3">Pro Mode Settings</h3>
      <p className="text-sm text-gray-400 mb-4">
        Select your audio device and channels to begin a dual-channel measurement.
      </p>
      {/* Placeholder for device and channel selectors */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Audio Device</label>
          <select className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white">
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onStartCapture({})}
          className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
        >
          Start Capture
        </button>
      </div>
    </div>
  );
};

export default ProSettings;

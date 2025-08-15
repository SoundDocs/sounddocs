import React, { useState, useEffect } from "react";
import { Device, CaptureConfig } from "@sounddocs/analyzer-protocol";

interface ProSettingsProps {
  devices: Device[];
  onStartCapture: (config: Omit<CaptureConfig, "type">) => void;
  onStopCapture: () => void;
}

export const ProSettings: React.FC<ProSettingsProps> = ({
  devices,
  onStartCapture,
  onStopCapture,
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [refChan, setRefChan] = useState<number>(1);
  const [measChan, setMeasChan] = useState<number>(2);

  useEffect(() => {
    // Default to the first available device
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  const handleStart = () => {
    if (!selectedDeviceId) {
      alert("Please select an audio device.");
      return;
    }
    const config = {
      deviceId: selectedDeviceId,
      sampleRate: 48000, // Default values for now
      blockSize: 1024,
      nfft: 8192,
      refChan,
      measChan,
      window: "hann" as const,
      avg: "exp" as const,
      smoothing: "1/6" as const,
    };
    onStartCapture(config);
    setIsCapturing(true);
  };

  const handleStop = () => {
    onStopCapture();
    setIsCapturing(false);
  };

  const renderChannelOptions = (numChannels: number) => {
    return Array.from({ length: numChannels }, (_, i) => i + 1).map((chan) => (
      <option key={chan} value={chan}>
        Input {chan}
      </option>
    ));
  };

  return (
    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-3">Pro Mode Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        {/* Audio Device */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">Audio Device</label>
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            disabled={isCapturing}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reference Channel */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">Reference Channel</label>
          <select
            value={refChan}
            onChange={(e) => setRefChan(Number(e.target.value))}
            disabled={isCapturing || !selectedDevice}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            {selectedDevice && renderChannelOptions(selectedDevice.inputs)}
          </select>
        </div>

        {/* Measurement Channel */}
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Measurement Channel
          </label>
          <select
            value={measChan}
            onChange={(e) => setMeasChan(Number(e.target.value))}
            disabled={isCapturing || !selectedDevice}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            {selectedDevice && renderChannelOptions(selectedDevice.inputs)}
          </select>
        </div>
      </div>
      <div className="mt-4">
        {!isCapturing ? (
          <button
            onClick={handleStart}
            disabled={!selectedDevice}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors disabled:bg-gray-500"
          >
            Start Capture
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            Stop Capture
          </button>
        )}
      </div>
    </div>
  );
};

export default ProSettings;

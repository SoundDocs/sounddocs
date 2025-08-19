import React, { useState, useEffect } from "react";
import { Device, CaptureConfig } from "@sounddocs/analyzer-protocol";
import { Snowflake } from "lucide-react";

interface ProSettingsProps {
  devices: Device[];
  onStartCapture: (config: CaptureConfig) => void;
  onStopCapture: () => void;
  onFreezeDelay: (enabled: boolean) => void;
  delayMode?: string;
  appliedDelayMs?: number;
  isCapturing: boolean;
}

export const ProSettings: React.FC<ProSettingsProps> = ({
  devices,
  onStartCapture,
  onStopCapture,
  onFreezeDelay,
  delayMode,
  appliedDelayMs,
  isCapturing,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [refChan, setRefChan] = useState<number>(1);
  const [measChan, setMeasChan] = useState<number>(2);
  const [nfft, setNfft] = useState<number>(8192);
  const [smoothFrac, setSmoothFrac] = useState<number>(12);
  const [smoothMethod, setSmoothMethod] = useState<"complex" | "power">("complex");
  const [smoothCohPow, setSmoothCohPow] = useState<number>(1.0);

  useEffect(() => {
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
    const config: CaptureConfig = {
      deviceId: selectedDeviceId,
      sampleRate: 48000,
      blockSize: 1024,
      refChan,
      measChan,
      nfft,
      avg: "power",
      avgCount: 0,
      window: "hann",
      smoothFrac,
      smoothMethod,
      smoothCohPow,
    };
    onStartCapture(config);
  };

  const handleStop = () => {
    onStopCapture();
  };

  const handleFreezeClick = () => {
    const enable = delayMode !== "frozen";
    onFreezeDelay(enable); // must send { type: "delay_freeze", enabled: true/false }
  };

  const isFrozen = delayMode === "frozen";
  const canFreeze = delayMode === "auto" ? (appliedDelayMs ?? 0) !== 0 : true;

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        {/* Row 1 */}
        <div className="col-span-2">
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
        <div>
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
        <div>
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

        {/* Row 2 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Smoothing</label>
          <select
            value={smoothFrac}
            onChange={(e) => setSmoothFrac(Number(e.target.value))}
            disabled={isCapturing}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            <option value={48}>1/48 oct</option>
            <option value={24}>1/24 oct</option>
            <option value={12}>1/12 oct</option>
            <option value={6}>1/6 oct</option>
            <option value={3}>1/3 oct</option>
            <option value={1}>1 oct</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Method</label>
          <select
            value={smoothMethod}
            onChange={(e) => setSmoothMethod(e.target.value as "complex" | "power")}
            disabled={isCapturing}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            <option value="complex">Complex</option>
            <option value="power">Power</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Coherence Weighting (0-2)
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={smoothCohPow}
            onChange={(e) => setSmoothCohPow(Number(e.target.value))}
            disabled={isCapturing}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div>
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
        {isCapturing && (
          <div>
            <button
              onClick={handleFreezeClick}
              disabled={!isCapturing || (!canFreeze && !isFrozen)}
              className={`px-4 py-2 flex items-center rounded-lg transition-colors ${
                isFrozen ? "bg-blue-600 hover:bg-blue-500" : "bg-gray-600 hover:bg-gray-500"
              } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Snowflake className="h-4 w-4 mr-2" />
              {isFrozen ? "Unfreeze Delay" : "Freeze Delay"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProSettings;

import React, { useState, useEffect } from "react";
import { Device, CaptureConfig, WindowType } from "@sounddocs/analyzer-protocol";
import { useAnalyzerStore } from "@/stores/analyzerStore";

interface ProSettingsProps {
  devices: Device[];
  onStartCapture: (config: CaptureConfig) => void;
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
  const [nfft, setNfft] = useState<number>(8192);

  const {
    averageType,
    lpfFrequency,
    averageCount,
    transformMode,
    windowFunction,
    setAverageType,
    setLpfFrequency,
    setAverageCount,
    setTransformMode,
    setWindowFunction,
  } = useAnalyzerStore();

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
      avg: "power", // This is not directly used in the new DSP code, but required by the type
      avgCount: averageCount,
      window: windowFunction,
      lpfMode: averageType === "lpf" ? "lpf" : "none",
      lpfFreq: lpfFrequency,
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
          <label className="block text-sm font-medium text-gray-300 mb-1">Average Type</label>
          <select
            value={averageType}
            onChange={(e) => setAverageType(e.target.value as "off" | "lpf" | "fifo")}
            disabled={isCapturing}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            <option value="off">Off</option>
            <option value="lpf">LPF</option>
            <option value="fifo">FIFO</option>
          </select>
        </div>
        {averageType === "lpf" && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">LPF Freq</label>
            <select
              value={lpfFrequency}
              onChange={(e) => setLpfFrequency(Number(e.target.value))}
              disabled={isCapturing}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
            >
              <option value={0.25}>0.25 Hz</option>
              <option value={0.5}>0.5 Hz</option>
              <option value={1}>1 Hz</option>
            </select>
          </div>
        )}
        {averageType === "fifo" && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Average Count</label>
            <select
              value={averageCount}
              onChange={(e) => setAverageCount(Number(e.target.value))}
              disabled={isCapturing}
              className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
              <option value={16}>16</option>
              <option value={32}>32</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Transform Mode</label>
          <select
            value={transformMode}
            onChange={(e) => setTransformMode(e.target.value as "fast" | "log")}
            disabled={isCapturing}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            <option value="fast">Fast</option>
            <option value="log">Log</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Window Function</label>
          <select
            value={windowFunction}
            onChange={(e) => setWindowFunction(e.target.value as "hann" | "kaiser" | "blackman")}
            disabled={isCapturing}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            <option value="hann">Hann</option>
            <option value="kaiser">Kaiser</option>
            <option value="blackman">Blackman</option>
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

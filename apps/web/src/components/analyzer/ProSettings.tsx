import React, { useState, useEffect } from "react";
import { Device, CaptureConfig } from "@sounddocs/analyzer-protocol";
import { Snowflake } from "lucide-react";
import { SignalGenerator, GeneratorConfig } from "./SignalGenerator";

interface ProSettingsProps {
  devices: Device[];
  onStartCapture: (config: CaptureConfig) => void;
  onStopCapture: () => void;
  onFreezeDelay: (enabled: boolean) => void;
  onGeneratorConfigChange: (config: GeneratorConfig) => void;
  delayMode?: string;
  appliedDelayMs?: number;
  isCapturing: boolean;
}

export const ProSettings: React.FC<ProSettingsProps> = ({
  devices,
  onStartCapture,
  onStopCapture,
  onFreezeDelay,
  onGeneratorConfigChange,
  delayMode,
  appliedDelayMs,
  isCapturing,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [refChan, setRefChan] = useState<number>(1);
  const [measChan, setMeasChan] = useState<number>(2);
  const [nfft, setNfft] = useState<number>(8192);
  const [generatorConfig, setGeneratorConfig] = useState<GeneratorConfig>({
    signalType: "off",
    outputChannel: 1,
    loopback: false,
  });

  const handleGeneratorConfigChange = (newConfig: Partial<GeneratorConfig>) => {
    const updatedConfig = { ...generatorConfig, ...newConfig };
    setGeneratorConfig(updatedConfig);
    onGeneratorConfigChange(updatedConfig);

    // When loopback is enabled, the ref channel is internal
    if (newConfig.loopback === true) {
      setRefChan(0); // Use 0 to signify loopback
    } else if (newConfig.loopback === false) {
      setRefChan(1); // Reset to default when loopback is off
    }
  };

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
      lpfMode: "none",
      lpfFreq: 0,
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
            disabled={isCapturing || !selectedDevice || generatorConfig.loopback}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            {generatorConfig.loopback ? (
              <option value={0}>Loopback</option>
            ) : (
              selectedDevice && renderChannelOptions(selectedDevice.inputs)
            )}
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
      <SignalGenerator
        config={generatorConfig}
        deviceOutputs={selectedDevice?.outputs ?? 0}
        isCapturing={isCapturing}
        onConfigChange={handleGeneratorConfigChange}
      />
    </div>
  );
};

export default ProSettings;

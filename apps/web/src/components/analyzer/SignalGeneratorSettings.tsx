import React, { useState, useEffect } from "react";
import { Volume2, Waves, Activity, TrendingUp } from "lucide-react";

export interface SignalGeneratorConfig {
  enabled: boolean;
  signalType: "sine" | "white" | "pink" | "brown" | "blue" | "violet" | "sine_sweep";
  outputChannels: number[] | null;
  frequency: number;
  startFreq: number;
  endFreq: number;
  sweepDuration: number;
  amplitude: number;
}

interface SignalGeneratorSettingsProps {
  deviceChannels: number;
  onConfigChange: (config: SignalGeneratorConfig) => void;
  isCapturing: boolean;
}

const SignalGeneratorSettings: React.FC<SignalGeneratorSettingsProps> = ({
  deviceChannels,
  onConfigChange,
  isCapturing,
}) => {
  const [config, setConfig] = useState<SignalGeneratorConfig>({
    enabled: false,
    signalType: "sine",
    outputChannels: null, // null means all channels
    frequency: 1000,
    startFreq: 20,
    endFreq: 20000,
    sweepDuration: 1,
    amplitude: 0.5,
  });

  const [selectedChannels, setSelectedChannels] = useState<Set<number>>(new Set());
  const [useAllChannels, setUseAllChannels] = useState(true);

  useEffect(() => {
    onConfigChange({
      ...config,
      outputChannels: useAllChannels ? null : Array.from(selectedChannels),
    });
  }, [config, selectedChannels, useAllChannels, onConfigChange]);

  const handleSignalTypeChange = (type: SignalGeneratorConfig["signalType"]) => {
    setConfig((prev) => ({ ...prev, signalType: type }));
  };

  const handleToggleChannel = (channel: number) => {
    setSelectedChannels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(channel)) {
        newSet.delete(channel);
      } else {
        newSet.add(channel);
      }
      return newSet;
    });
  };

  const handleToggleAllChannels = () => {
    if (useAllChannels) {
      // Switch to individual selection, select first channel by default
      setUseAllChannels(false);
      setSelectedChannels(new Set([1]));
    } else {
      setUseAllChannels(true);
      setSelectedChannels(new Set());
    }
  };

  const signalTypes = [
    { value: "sine", label: "Sine", icon: Waves },
    { value: "sine_sweep", label: "Sweep", icon: TrendingUp },
    { value: "white", label: "White", icon: Activity },
    { value: "pink", label: "Pink", icon: Activity },
    { value: "brown", label: "Brown", icon: Activity },
    { value: "blue", label: "Blue", icon: Activity },
    { value: "violet", label: "Violet", icon: Activity },
  ];

  return (
    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Volume2 className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-white">Signal Generator</h3>
        </div>

        {/* Power Toggle */}
        <button
          onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
          disabled={isCapturing}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            config.enabled ? "bg-indigo-600" : "bg-gray-600"
          } ${isCapturing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-4">
          {/* Signal Type Grid */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Signal Type</label>
            <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
              {signalTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = config.signalType === type.value;
                return (
                  <button
                    key={type.value}
                    onClick={() =>
                      handleSignalTypeChange(type.value as SignalGeneratorConfig["signalType"])
                    }
                    disabled={isCapturing}
                    className={`
                      px-2 py-2 rounded-md text-xs font-medium transition-colors
                      border flex flex-col items-center justify-center space-y-1
                      ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-500"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600 border-gray-600"
                      }
                      ${isCapturing ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Controls Based on Signal Type */}
          <div className="bg-gray-700/30 rounded-md p-3 border border-gray-600">
            {config.signalType === "sine" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Frequency</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={(() => {
                      // Convert frequency to logarithmic scale (0-100)
                      const minLog = Math.log10(20);
                      const maxLog = Math.log10(20000);
                      const scale = (Math.log10(config.frequency) - minLog) / (maxLog - minLog);
                      return scale * 100;
                    })()}
                    onChange={(e) => {
                      // Convert logarithmic scale back to frequency
                      const value = Number(e.target.value);
                      const minLog = Math.log10(20);
                      const maxLog = Math.log10(20000);
                      const frequency = Math.pow(10, minLog + (value / 100) * (maxLog - minLog));
                      setConfig((prev) => ({ ...prev, frequency: Math.round(frequency) }));
                    }}
                    disabled={isCapturing}
                    className="flex-1 h-2 bg-gray-600 rounded appearance-none cursor-pointer disabled:opacity-50"
                  />
                  <div className="w-20">
                    <input
                      type="number"
                      min="20"
                      max="20000"
                      step="1"
                      value={config.frequency}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, frequency: Number(e.target.value) }))
                      }
                      disabled={isCapturing}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <span className="text-sm text-gray-400">Hz</span>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>20 Hz</span>
                  <span>200 Hz</span>
                  <span>2 kHz</span>
                  <span>20 kHz</span>
                </div>
              </div>
            )}

            {config.signalType === "sine_sweep" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      Start Frequency
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="20000"
                        step="1"
                        value={config.startFreq}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, startFreq: Number(e.target.value) }))
                        }
                        disabled={isCapturing}
                        className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50 focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-gray-400">Hz</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">
                      End Frequency
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="20000"
                        step="1"
                        value={config.endFreq}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, endFreq: Number(e.target.value) }))
                        }
                        disabled={isCapturing}
                        className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50 focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-gray-400">Hz</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Duration</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={config.sweepDuration}
                        onChange={(e) =>
                          setConfig((prev) => ({ ...prev, sweepDuration: Number(e.target.value) }))
                        }
                        disabled={isCapturing}
                        className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm disabled:opacity-50 focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-gray-400">sec</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  Logarithmic sweep: {config.startFreq} Hz → {config.endFreq} Hz (
                  {config.sweepDuration}s)
                </div>
              </div>
            )}

            {!["sine", "sine_sweep"].includes(config.signalType) && (
              <div className="text-center py-2">
                <p className="text-sm text-gray-400">
                  {config.signalType === "white" && "Equal power at all frequencies"}
                  {config.signalType === "pink" && "1/f spectrum, equal power per octave"}
                  {config.signalType === "brown" && "1/f² spectrum, -6 dB per octave"}
                  {config.signalType === "blue" && "f spectrum, +3 dB per octave"}
                  {config.signalType === "violet" && "f² spectrum, +6 dB per octave"}
                </p>
              </div>
            )}
          </div>

          {/* Amplitude Control */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Output Level</label>
              <span className="text-sm text-gray-400">{Math.round(config.amplitude * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={config.amplitude * 100}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, amplitude: Number(e.target.value) / 100 }))
              }
              disabled={isCapturing}
              className="w-full h-2 bg-gray-600 rounded appearance-none cursor-pointer disabled:opacity-50"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Silent</span>
              <span>Full Scale</span>
            </div>
          </div>

          {/* Output Channel Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300">Output Channels</label>
              <button
                onClick={handleToggleAllChannels}
                disabled={isCapturing}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  useAllChannels
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                } ${isCapturing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {useAllChannels ? "All Channels" : "Select Channels"}
              </button>
            </div>

            {!useAllChannels && deviceChannels > 0 && (
              <div className="bg-gray-700/30 rounded p-3 border border-gray-600">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {Array.from({ length: deviceChannels }, (_, i) => i + 1).map((channel) => (
                    <label
                      key={channel}
                      className="flex items-center justify-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedChannels.has(channel)}
                        onChange={() => handleToggleChannel(channel)}
                        disabled={isCapturing}
                        className="sr-only"
                      />
                      <span
                        className={`
                          px-2 py-1 rounded text-xs font-medium transition-colors
                          ${
                            selectedChannels.has(channel)
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-600 text-gray-300 hover:bg-gray-500"
                          }
                          ${isCapturing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        `}
                      >
                        Ch {channel}
                      </span>
                    </label>
                  ))}
                </div>
                {selectedChannels.size === 0 && (
                  <p className="text-xs text-yellow-500 mt-2 text-center">
                    Select at least one channel
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Status Indicator */}
          {isCapturing && config.enabled && (
            <div className="flex items-center space-x-2 py-1.5 px-3 bg-green-900/20 border border-green-800 rounded text-sm">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400">Signal Active</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SignalGeneratorSettings;

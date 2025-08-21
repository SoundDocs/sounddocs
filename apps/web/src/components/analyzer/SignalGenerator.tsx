import React from "react";
import { SignalType } from "@sounddocs/analyzer-protocol";
import { Waves, Repeat } from "lucide-react";

export interface GeneratorConfig {
  signalType: SignalType;
  outputChannel: number;
  loopback: boolean;
}

interface SignalGeneratorProps {
  config: GeneratorConfig;
  deviceOutputs: number;
  isCapturing: boolean;
  onConfigChange: (config: Partial<GeneratorConfig>) => void;
}

export const SignalGenerator: React.FC<SignalGeneratorProps> = ({
  config,
  deviceOutputs,
  isCapturing,
  onConfigChange,
}) => {
  const renderChannelOptions = (numChannels: number) => {
    return Array.from({ length: numChannels }, (_, i) => i + 1).map((chan) => (
      <option key={chan} value={chan}>
        Output {chan}
      </option>
    ));
  };

  return (
    <div className="p-4 rounded-lg bg-gray-700 border border-gray-600 mt-4">
      <h4 className="text-md font-semibold text-white mb-3 flex items-center">
        <Waves className="h-5 w-5 mr-2 text-indigo-400" />
        Signal Generator
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Signal Type</label>
          <select
            value={config.signalType}
            onChange={(e) => onConfigChange({ signalType: e.target.value as SignalType })}
            disabled={isCapturing}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            <option value="off">Off</option>
            <option value="pink">Pink Noise</option>
            <option value="white">White Noise</option>
            <option value="sine">Sine Sweep</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Output Channel</label>
          <select
            value={config.outputChannel}
            onChange={(e) => onConfigChange({ outputChannel: Number(e.target.value) })}
            disabled={isCapturing || deviceOutputs === 0}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white disabled:opacity-50"
          >
            {deviceOutputs > 0 ? renderChannelOptions(deviceOutputs) : <option>N/A</option>}
          </select>
        </div>
        <div className="flex items-center justify-self-start mt-6">
          <input
            type="checkbox"
            id="loopback"
            checked={config.loopback}
            onChange={(e) => onConfigChange({ loopback: e.target.checked })}
            disabled={isCapturing}
            className="h-4 w-4 text-indigo-600 bg-gray-700 border-gray-500 rounded focus:ring-indigo-500 disabled:opacity-50"
          />
          <label htmlFor="loopback" className="ml-2 block text-sm text-gray-300 flex items-center">
            <Repeat className="h-4 w-4 mr-1" />
            Loopback
          </label>
        </div>
      </div>
    </div>
  );
};

export default SignalGenerator;

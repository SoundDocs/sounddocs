import React, { useEffect, useState, useRef } from "react";
import type { FrequencyData } from "./useRta";

export interface SplMeterProps {
  frequencyData: FrequencyData | null;
  className?: string;
  calibrationOffset?: number;
  onCalibrationChange?: (offset: number) => void;
  isLogging?: boolean;
  onStartLogging?: () => void;
  onStopLogging?: () => void;
  onDownloadCsv?: () => void;
}

export const SplMeter: React.FC<SplMeterProps> = ({
  frequencyData,
  className = "",
  calibrationOffset = 0,
  onCalibrationChange,
  isLogging = false,
  onStartLogging,
  onStopLogging,
  onDownloadCsv,
}) => {
  const [showCalibration, setShowCalibration] = useState(false);

  // State for smoothed SPL and Leq values for slower display
  const [displaySpl, setDisplaySpl] = useState(0);
  const [displayLeq, setDisplayLeq] = useState(0);

  // Ref to hold the latest data to avoid stale closures in setInterval
  const latestDataRef = useRef<FrequencyData | null>(null);

  useEffect(() => {
    latestDataRef.current = frequencyData;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      if (latestDataRef.current) {
        setDisplaySpl(latestDataRef.current.spl);
        setDisplayLeq(latestDataRef.current.leq);
      }
    }, 250); // Update display every 250ms

    return () => clearInterval(interval);
  }, []); // Empty dependency array ensures this runs only once

  const handleCalibrate = (targetDb: number) => {
    if (frequencyData) {
      const uncalibratedSpl = frequencyData.spl - calibrationOffset;
      const newOffset = targetDb - uncalibratedSpl;
      if (onCalibrationChange) {
        onCalibrationChange(newOffset);
      }
    }
  };

  const getSPLColor = (spl: number): string => {
    if (spl < 60) return "text-green-400";
    if (spl < 80) return "text-yellow-400";
    if (spl < 100) return "text-orange-400";
    return "text-red-400";
  };

  return (
    <div className={`bg-gray-800 p-6 rounded-xl border border-gray-600 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">SPL Meter</h3>
        <button
          onClick={() => setShowCalibration(!showCalibration)}
          className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
        >
          Calibrate
        </button>
      </div>

      {/* Calibration Panel */}
      {showCalibration && (
        <div className="mb-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Auto Calibration</h4>
          <div className="space-y-3">
            <p className="text-xs text-gray-400">
              Play a pink noise signal through your system and use a reference SPL meter to measure
              the level. Then, click the corresponding button below to set the calibration.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => handleCalibrate(94)}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                Calibrate to 94 dB
              </button>
              <button
                onClick={() => handleCalibrate(114)}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              >
                Calibrate to 114 dB
              </button>
            </div>
            <div className="text-xs text-gray-300">
              Current Offset: <span className="font-mono">{calibrationOffset.toFixed(2)} dB</span>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SPL Display */}
        <div className="space-y-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Current SPL</div>
          <div className={`text-5xl font-mono font-bold ${getSPLColor(displaySpl)}`}>
            {displaySpl.toFixed(1)}
            <span className="text-2xl ml-2">dB</span>
          </div>
        </div>

        {/* Leq Display */}
        <div className="space-y-4 text-center">
          <div className="text-sm text-gray-400 mb-1">Leq (30m)</div>
          <div className={`text-5xl font-mono font-bold ${getSPLColor(displayLeq)}`}>
            {displayLeq.toFixed(1)}
            <span className="text-2xl ml-2">dB</span>
          </div>
        </div>
      </div>

      {/* Logging Controls */}
      <div className="mt-6 text-center space-y-3">
        <div className="flex justify-center space-x-4">
          {!isLogging ? (
            <button
              onClick={onStartLogging}
              disabled={!frequencyData}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              Start Logging
            </button>
          ) : (
            <button
              onClick={onStopLogging}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
            >
              Stop Logging
            </button>
          )}

          <button
            onClick={onDownloadCsv}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
          >
            Download CSV
          </button>
        </div>

        {/* Status Info */}
        <div className="space-y-1">
          <div className="text-xs text-gray-400">
            {frequencyData ? "Active" : "No Signal"}
            {isLogging && <span className="ml-2 text-green-400">● Logging</span>}
          </div>
          {frequencyData && (
            <div className="text-xs text-gray-500">
              Sample Rate: {(frequencyData.sampleRate / 1000).toFixed(1)} kHz
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SplMeter;

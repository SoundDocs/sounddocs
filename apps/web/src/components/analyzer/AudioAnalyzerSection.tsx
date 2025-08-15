import React, { useState, useEffect, useRef } from "react";
import { Activity, Play, Square, Settings } from "lucide-react";
import {
  DevicePicker,
  type AudioDevice,
  useRta,
  RtaVisualizer,
  SplMeter,
  type RtaConfig,
} from "@sounddocs/analyzer-lite";
import { useAnalyzerStore } from "../../stores/analyzerStore";
import { useCalibrationStore } from "../../stores/calibrationStore";
import { supabase } from "../../lib/supabase";
import { generateLeqCsv, downloadCsv, generateLeqCsvFilename } from "../../utils/csv";

export const AudioAnalyzerSection: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [resetViewKey, setResetViewKey] = useState(0);
  const [isLogging, setIsLogging] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const {
    selectedDevice,
    audioStream,
    isConnected,
    error,
    setSelectedDevice,
    setAudioStream,
    setConnected,
    setError,
  } = useAnalyzerStore();

  // Calibration store
  const { calibrationOffset, setCalibrationOffset } = useCalibrationStore();

  // RTA functionality
  const rta = useRta(audioStream);

  // Logging interval ref
  const loggingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ref to hold latest frequency data for logging (fixes stale closure bug)
  const latestFrequencyDataRef = useRef<typeof rta.frequencyData>(null);

  const handleDeviceSelected = (device: AudioDevice, stream: MediaStream) => {
    setSelectedDevice(device);
    setAudioStream(stream);
    setConnected(true);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setConnected(false);
  };

  const handleStartAnalysis = async () => {
    try {
      await rta.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start analysis");
    }
  };

  const handleStopAnalysis = () => {
    rta.stop();
  };

  const handleConfigChange = (newConfig: Partial<RtaConfig>) => {
    rta.updateConfig(newConfig);
  };

  const handleStartLogging = () => {
    if (!rta.frequencyData) {
      setError("Cannot start logging: No frequency data available");
      return;
    }

    if (!rta.frequencyData.leq || isNaN(rta.frequencyData.leq)) {
      setError("Cannot start logging: LEQ value is invalid");
      return;
    }

    const newSessionId = crypto.randomUUID();
    setSessionId(newSessionId);
    setIsLogging(true);

    console.log("Starting LEQ logging with session ID:", newSessionId);
    console.log("Initial LEQ value:", rta.frequencyData.leq);

    // Start logging interval (every 30 seconds for LEQ 30m) - Using ref to fix stale closure bug
    loggingIntervalRef.current = setInterval(async () => {
      const currentData = latestFrequencyDataRef.current;
      if (currentData && typeof currentData.leq === "number" && !isNaN(currentData.leq)) {
        try {
          console.log("Attempting to log LEQ measurement:", {
            leq: currentData.leq,
            sampleRate: currentData.sampleRate,
            calibrationOffset,
            sessionId: newSessionId,
          });

          const { error } = await supabase.rpc("insert_leq_measurement", {
            p_leq_value: currentData.leq,
            p_duration_seconds: 1800, // 30 minutes in seconds
            p_calibration_offset: calibrationOffset,
            p_sample_rate: currentData.sampleRate,
            p_session_id: newSessionId,
            p_location: null,
            p_notes: `RTA Session - ${selectedDevice?.label || "Unknown Device"}`,
          });

          if (error) {
            console.error("Supabase RPC error:", error);
            setError(`Logging error: ${error.message}`);
          } else {
            console.log("Successfully logged LEQ measurement:", currentData.leq, "dB");
          }
        } catch (err) {
          console.error("Failed to log LEQ measurement:", err);
          setError(`Logging failed: ${err instanceof Error ? err.message : "Unknown error"}`);
        }
      } else {
        console.warn("Skipping log entry - invalid LEQ data:", currentData?.leq);
      }
    }, 30000); // 30 seconds
  };

  const handleStopLogging = () => {
    setIsLogging(false);
    setSessionId(null);

    if (loggingIntervalRef.current) {
      clearInterval(loggingIntervalRef.current);
      loggingIntervalRef.current = null;
    }
  };

  const handleDownloadCsv = async () => {
    if (!sessionId) {
      setError("No active logging session to download.");
      return;
    }

    try {
      console.log(`Attempting to fetch LEQ measurements for session ID: ${sessionId}`);

      const { data, error } = await supabase
        .from("leq_measurements")
        .select("*")
        .eq("session_id", sessionId)
        .order("measured_at", { ascending: true });

      if (error) {
        console.error("Supabase query error:", error);
        if (error.code === "PGRST103") {
          setError(
            "Database query failed: No access to measurements table. Please check authentication.",
          );
        } else if (error.message.includes("406")) {
          setError("Database query failed: Invalid request format. Please try again.");
        } else {
          setError(
            `Failed to fetch measurements: ${error.message} (Code: ${error.code || "unknown"})`,
          );
        }
        return;
      }

      if (!data || data.length === 0) {
        console.log("No measurements found for export");
        setError("No measurements available for export. Start logging some measurements first.");
        return;
      }

      console.log(`Found ${data.length} measurements for export`);

      const csvContent = generateLeqCsv(data);
      const filename = generateLeqCsvFilename();
      downloadCsv(csvContent, filename);

      console.log("CSV download completed successfully");
    } catch (err) {
      console.error("CSV export error:", err);
      setError(`Failed to export CSV: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Cleanup logging interval on unmount or when analysis stops
  useEffect(() => {
    return () => {
      if (loggingIntervalRef.current) {
        clearInterval(loggingIntervalRef.current);
      }
    };
  }, []);

  // Stop logging when analysis stops
  useEffect(() => {
    if (!rta.isActive && isLogging) {
      handleStopLogging();
    }
  }, [rta.isActive, isLogging]);

  // Update the ref with latest frequency data (fixes stale closure in logging)
  useEffect(() => {
    latestFrequencyDataRef.current = rta.frequencyData;
  }, [rta.frequencyData]);

  // Send calibration offset changes to the worklet
  useEffect(() => {
    rta.updateConfig({ calibrationOffset });
  }, [calibrationOffset]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Audio Analyzer</h2>
          <p className="text-gray-400">Real-time audio analysis and measurement tools</p>
        </div>
        <Activity className="h-8 w-8 text-green-400" />
      </div>

      <div className="space-y-6">
        {/* Error Banner */}
        {(error || rta.error) && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-300 text-sm">{error || rta.error}</p>
          </div>
        )}

        {/* Device Picker */}
        <DevicePicker
          onDeviceSelected={handleDeviceSelected}
          onError={handleError}
          className="w-full"
        />

        {/* Analysis Controls */}
        {isConnected && selectedDevice && (
          <div className="space-y-4">
            {/* Status and Controls */}
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-green-400">
                  <Activity className="h-5 w-5 mr-2" />
                  <span className="font-medium">{rta.isActive ? "Analyzing" : "Ready"}</span>
                </div>
                <div className="text-sm text-gray-300">{selectedDevice.label}</div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-600"
                  title="Settings"
                >
                  <Settings className="h-5 w-5" />
                </button>

                {!rta.isActive ? (
                  <button
                    onClick={handleStartAnalysis}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                  >
                    <Play className="h-4 w-4" />
                    <span>Start</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopAnalysis}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                  >
                    <Square className="h-4 w-4" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="p-4 bg-gray-700 rounded-lg space-y-4">
                <h3 className="text-white font-medium mb-3">RTA Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* FFT Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">FFT Size</label>
                    <select
                      value={rta.config.fftSize}
                      onChange={(e) =>
                        handleConfigChange({
                          fftSize: parseInt(e.target.value) as RtaConfig["fftSize"],
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value={256}>256</option>
                      <option value={512}>512</option>
                      <option value={1024}>1024</option>
                      <option value={2048}>2048</option>
                      <option value={4096}>4096</option>
                      <option value={8192}>8192</option>
                    </select>
                  </div>

                  {/* Update Rate */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Update Rate (Hz)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={rta.config.updateRate}
                      onChange={(e) => handleConfigChange({ updateRate: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  {/* Smoothing */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Smoothing ({(rta.config.smoothing * 100).toFixed(0)}%)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.95"
                      step="0.05"
                      value={rta.config.smoothing}
                      onChange={(e) =>
                        handleConfigChange({ smoothing: parseFloat(e.target.value) })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {/* A-weighting toggle */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aWeighting"
                      checked={rta.config.useAWeighting}
                      onChange={(e) => handleConfigChange({ useAWeighting: e.target.checked })}
                      className="mr-3 w-4 h-4 text-green-600 bg-gray-600 border-gray-500 rounded focus:ring-green-500"
                    />
                    <label htmlFor="aWeighting" className="text-sm font-medium text-gray-300">
                      A-weighting Filter
                    </label>
                  </div>

                  {/* Response Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Response Time
                    </label>
                    <select
                      value={rta.config.responseTime}
                      onChange={(e) =>
                        handleConfigChange({ responseTime: e.target.value as "fast" | "slow" })
                      }
                      className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="fast">Fast</option>
                      <option value="slow">Slow</option>
                    </select>
                  </div>

                  {/* Reset View button */}
                  <div className="flex justify-end items-end">
                    <button
                      onClick={() => setResetViewKey((prev) => prev + 1)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-lg transition-colors"
                    >
                      Reset View
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Tools Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* RTA Visualizer */}
              <div className="lg:col-span-2">
                <RtaVisualizer
                  frequencyData={rta.frequencyData}
                  width={800}
                  height={400}
                  className="w-full"
                  key={resetViewKey}
                />
              </div>

              {/* SPL Meter */}
              <SplMeter
                frequencyData={rta.frequencyData}
                calibrationOffset={calibrationOffset}
                onCalibrationChange={setCalibrationOffset}
                isLogging={isLogging}
                onStartLogging={handleStartLogging}
                onStopLogging={handleStopLogging}
                onDownloadCsv={handleDownloadCsv}
                className="w-full"
              />

              {/* Coming Soon Features */}
              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <h3 className="text-blue-300 font-medium mb-2">🚀 More Features Coming Soon</h3>
                <ul className="text-blue-200 text-sm space-y-1 list-disc list-inside">
                  <li>Transfer function analysis (with Pro mode)</li>
                  <li>Pink noise and sweep generators</li>
                  <li>AI-powered EQ recommendations</li>
                  <li>Trace management and export</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioAnalyzerSection;

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  X,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload,
  SlidersHorizontal,
  Timer,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { TFData } from "@sounddocs/analyzer-protocol";
import Chart from "./Chart";
import { TARGET_CURVES } from "../../lib/constants";
import { EqSetting, applyEq } from "../../lib/dsp";
import EqControls from "./EqControls";

type ChartName = "magnitude" | "phase" | "impulse" | "coherence";

interface Measurement {
  id: string;
  name: string;
  created_at: string;
  tf_data: TFData;
  color?: string;
  sample_rate: number;
  eq_settings?: EqSetting[];
  capture_delay_ms?: number; // Added for alignment
  phase_flipped?: boolean;
}

interface ChartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialChart: ChartName;
  liveData: TFData | null;
  savedMeasurements: Measurement[];
  visibleIds: Set<string>;
  onToggleVisibility: (id: string) => void;
  onDelete: (id: string) => void;
  onAddMeasurements: (measurements: Omit<Measurement, "id" | "created_at">[]) => void;
  sampleRate: number;
  measurementAdjustments: {
    [id: string]: { gain: number; delay: number; phaseFlipped: boolean };
  };
  onMeasurementAdjustmentChange: (
    id: string,
    newValues: { gain?: number; delay?: number; phaseFlipped?: boolean },
  ) => void;
  eqMeasurementId: string | null;
  onEqMeasurementIdChange: (id: string | null) => void;
  onEqChange: (id: string, eq_settings: EqSetting[]) => void;
  coherenceThreshold?: number;
  coherenceAlpha?: boolean;
}

const ChartDetailModal: React.FC<ChartDetailModalProps> = ({
  isOpen,
  onClose,
  initialChart,
  liveData,
  savedMeasurements,
  visibleIds,
  onToggleVisibility,
  onDelete,
  onAddMeasurements,
  sampleRate,
  measurementAdjustments,
  onMeasurementAdjustmentChange,
  eqMeasurementId,
  onEqMeasurementIdChange,
  onEqChange,
  coherenceThreshold = 0.5,
  coherenceAlpha = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedChart, setSelectedChart] = useState<ChartName>(initialChart);
  const [magnitudeRange, setMagnitudeRange] = useState({ min: -20, max: 20 });
  const [isLiveTraceVisible, setIsLiveTraceVisible] = useState(true);
  const [selectedTargetCurve, setSelectedTargetCurve] = useState<string>("none");
  const [isTargetCurveVisible, setIsTargetCurveVisible] = useState(true);
  const [showOriginalTrace, setShowOriginalTrace] = useState(false);

  // State for AI Alignment
  const [isAlignMode, setIsAlignMode] = useState(false);
  const [alignmentPair, setAlignmentPair] = useState<[string | null, string | null]>([null, null]);
  const [alignmentResult, setAlignmentResult] = useState<{
    delayMs: number;
    targetId: string;
    targetName: string;
  } | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [alignmentType, setAlignmentType] = useState("ff_mains");

  useEffect(() => {
    setSelectedChart(initialChart);
  }, [initialChart]);

  const handleSelectForAlignment = (trace: "trace1" | "trace2", id: string) => {
    const [first, second] = alignmentPair;
    const newPair: [string | null, string | null] = [...alignmentPair];

    if (trace === "trace1") {
      newPair[0] = id === "none" ? null : id;
    } else {
      newPair[1] = id === "none" ? null : id;
    }

    setAlignmentPair(newPair);
    setAlignmentResult(null); // Reset result when selection changes
  };

  const handleCalculateAlignment = async () => {
    if (!alignmentPair[0] || !alignmentPair[1]) return;

    setIsCalculating(true);
    setAlignmentResult(null);

    try {
      const measurement1 = savedMeasurements.find((m) => m.id === alignmentPair[0]);
      const measurement2 = savedMeasurements.find((m) => m.id === alignmentPair[1]);

      if (!measurement1 || !measurement2) {
        throw new Error("Could not find selected measurements.");
      }
      if (
        typeof measurement1.capture_delay_ms !== "number" ||
        typeof measurement2.capture_delay_ms !== "number"
      ) {
        throw new Error(
          "Selected measurements are missing capture delay data. Please re-measure and save.",
        );
      }

      const { data, error } = await supabase.functions.invoke("ai-align-systems", {
        body: {
          measurement1: {
            ir: measurement1.tf_data.ir,
            capture_delay_ms: measurement1.capture_delay_ms,
          },
          measurement2: {
            ir: measurement2.tf_data.ir,
            capture_delay_ms: measurement2.capture_delay_ms,
          },
          sampleRate: measurement1.sample_rate, // Assume they are the same
        },
      });

      if (error) throw error;

      const { alignment_delay_ms } = data;

      // The function now returns the exact delay to be applied to measurement2.
      setAlignmentResult({
        delayMs: alignment_delay_ms,
        targetId: measurement2.id,
        targetName: measurement2.name,
      });
    } catch (err) {
      console.error("Error calculating alignment:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert(`Alignment calculation failed: ${errorMessage}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleApplyAlignment = () => {
    if (!alignmentResult) return;
    onMeasurementAdjustmentChange(alignmentResult.targetId, { delay: alignmentResult.delayMs });
    // Reset after applying
    setIsAlignMode(false);
    setAlignmentPair([null, null]);
    setAlignmentResult(null);
  };

  const chartData = useMemo(() => {
    const datasets = [];
    const wantsCohShading =
      coherenceAlpha && (selectedChart === "magnitude" || selectedChart === "phase");

    const getCoherenceStyledDataset = (
      data: number[],
      coh: number[],
      label: string,
      color: string,
      applyCohShading: boolean,
    ) => {
      const dataset: any = {
        label,
        data,
        borderWidth: 4,
      };
      if (applyCohShading) {
        dataset.segment = {
          borderColor: (context: any) => {
            const c = coh[context.p1DataIndex];
            if (c >= 0.9) return color;
            if (c < coherenceThreshold) return "rgba(255, 255, 255, 0)";
            const alpha = Math.pow(2.5 * (c - 0.5), 2);
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          },
        };
      } else {
        // IMPORTANT: explicitly clear any prior segment callback
        dataset.segment = undefined;
      }
      dataset.borderColor = color;
      dataset.backgroundColor = color;
      return dataset;
    };

    if (liveData && isLiveTraceVisible) {
      const data =
        liveData[
          selectedChart === "impulse"
            ? "ir"
            : selectedChart === "magnitude"
              ? "mag_db"
              : selectedChart === "phase"
                ? "phase_deg"
                : "coh"
        ];
      // Only shade on magnitude/phase; NEVER on impulse or coherence
      datasets.push(
        getCoherenceStyledDataset(data, liveData.coh, "Live", "#FFFFFF", wantsCohShading),
      );
    }
    if (selectedChart === "magnitude" && selectedTargetCurve !== "none" && isTargetCurveVisible) {
      const curve = TARGET_CURVES[selectedTargetCurve];
      const measurementFreqs = liveData?.freqs || savedMeasurements[0]?.tf_data.freqs;

      if (measurementFreqs?.length) {
        const targetCurveData = measurementFreqs.map((f) => ({
          x: f,
          y: curve.evalDb(f, sampleRate),
        }));

        datasets.push({
          label: curve.name,
          data: targetCurveData,
          borderColor: "#A0A0A0",
          backgroundColor: "#A0A0A0",
          borderWidth: 1,
          borderDash: [5, 5],
          parsing: false,
        });
      }
    }
    savedMeasurements.forEach((trace) => {
      const series =
        selectedChart === "impulse"
          ? "ir"
          : selectedChart === "magnitude"
            ? "mag_db"
            : selectedChart === "phase"
              ? "phase_deg"
              : "coh";

      if (!visibleIds.has(trace.id)) return;
      if (!trace.tf_data[series]) return;

      const adjustments = measurementAdjustments[trace.id] || {
        gain: 0,
        delay: 0,
        phaseFlipped: false,
      };
      let data = trace.tf_data[series];

      if (selectedChart === "magnitude") {
        // baseMag = original measurement + gain trim (no EQ)
        const baseMag = data.map((d: number) => d + adjustments.gain);

        // eqApplied = baseMag with EQ (if any)
        const hasEq = Array.isArray(trace.eq_settings) && trace.eq_settings.length > 0;
        const eqApplied = hasEq
          ? applyEq(baseMag, trace.tf_data.freqs, trace.sample_rate, trace.eq_settings!)
          : baseMag;

        const isCurrentEqTarget = showOriginalTrace && eqMeasurementId === trace.id && hasEq;

        // 1) Optional overlay: original (pre-EQ)
        if (isCurrentEqTarget) {
          const dataset = getCoherenceStyledDataset(
            baseMag,
            trace.tf_data.coh,
            `${trace.name} (orig)`,
            trace.color || "#F472B6",
            wantsCohShading,
          );
          dataset.borderDash = [5, 5];
          datasets.push(dataset);
        }

        // 2) Active/EQ’d line
        datasets.push(
          getCoherenceStyledDataset(
            eqApplied,
            trace.tf_data.coh,
            `${trace.name}${hasEq ? " (EQ)" : ""}`,
            trace.color || "#F472B6",
            wantsCohShading,
          ),
        );
        return;
      }

      if (selectedChart === "phase" && trace.tf_data.freqs) {
        const phased = (data as number[]).map((d, i) => {
          const freq = trace.tf_data.freqs[i];
          const phaseShift = (adjustments.delay / 1000) * freq * 360;
          let phase = d - phaseShift;
          if (adjustments.phaseFlipped) {
            phase += 180;
          }
          while (phase <= -180) phase += 360;
          while (phase > 180) phase -= 360;
          return phase;
        });
        datasets.push(
          getCoherenceStyledDataset(
            phased,
            trace.tf_data.coh,
            trace.name,
            trace.color || "#F472B6",
            wantsCohShading,
          ),
        );
        return;
      }

      if (selectedChart === "impulse") {
        const delayInSamples = Math.round((adjustments.delay / 1000) * trace.sample_rate);
        const shifted = new Array((data as number[]).length).fill(0);
        for (let i = 0; i < (data as number[]).length; i++) {
          const newIndex = i + delayInSamples;
          if (newIndex >= 0 && newIndex < shifted.length) shifted[newIndex] = (data as number[])[i];
        }
        datasets.push({
          label: trace.name,
          data: shifted,
          borderColor: trace.color || "#F472B6",
          backgroundColor: trace.color || "#F472B6",
          borderWidth: 4,
        } as any);
        return;
      }

      // coherence (or anything else unchanged)
      datasets.push({
        label: trace.name,
        data,
        borderColor: trace.color || "#F472B6",
        backgroundColor: trace.color || "#F472B6",
        borderWidth: 4,
      } as any);
    });

    let labels: (string | number)[] = liveData?.freqs || savedMeasurements[0]?.tf_data.freqs || [];
    if (selectedChart === "impulse") {
      const irData = liveData?.ir || savedMeasurements.find((m) => m.tf_data.ir)?.tf_data.ir;
      const sr = liveData ? sampleRate : savedMeasurements.find((m) => m.tf_data.ir)?.sample_rate;
      if (irData && sr) {
        labels = irData.map((_, i) => {
          const center = Math.floor(irData.length / 2);
          return ((i - center) / sr) * 1000;
        });
      }
    }

    return {
      labels,
      datasets,
    };
  }, [
    liveData,
    savedMeasurements,
    visibleIds,
    selectedChart,
    isLiveTraceVisible,
    sampleRate,
    measurementAdjustments,
    selectedTargetCurve,
    isTargetCurveVisible,
    eqMeasurementId,
    showOriginalTrace,
  ]);

  const chartOptions = useMemo(() => {
    const baseOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false as const,
      scales: {
        x: {
          type: "logarithmic",
          min: 20,
          max: 20000,
          ticks: {
            color: "#9CA3AF",
            maxTicksLimit: 10,
          },
          grid: {
            color: "#4B5563",
          },
        },
        y: {
          ticks: { color: "#9CA3AF" },
          grid: { color: "#4B5563" },
        },
      },
      plugins: {
        legend: {
          labels: { color: "#D1D5DB" },
        },
        tooltip: {
          mode: "index" as const,
          intersect: false,
        },
      },
      elements: {
        point: {
          radius: 0,
        },
      },
    };

    if (selectedChart === "magnitude") {
      baseOptions.scales.y.min = magnitudeRange.min;
      baseOptions.scales.y.max = magnitudeRange.max;
    } else if (selectedChart === "phase") {
      baseOptions.scales.y.min = -180;
      baseOptions.scales.y.max = 180;
    } else if (selectedChart === "impulse") {
      baseOptions.scales.x.type = "linear";
      baseOptions.scales.x.min = -8;
      baseOptions.scales.x.max = 8;
      baseOptions.scales.y.min = -1;
      baseOptions.scales.y.max = 1;
    } else if (selectedChart === "coherence") {
      baseOptions.scales.y.min = 0;
      baseOptions.scales.y.max = 1;
    }

    return baseOptions;
  }, [selectedChart, magnitudeRange]);

  if (!isOpen) {
    return null;
  }

  const handleExport = (measurement: Measurement) => {
    const data = {
      fileType: "sounddocs/acoustic-data",
      version: "1.0",
      measurements: [measurement],
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${measurement.name}.sdat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== "string") {
          throw new Error("File is not readable");
        }
        const data = JSON.parse(text);
        if (data.fileType !== "sounddocs/acoustic-data" || !Array.isArray(data.measurements)) {
          throw new Error("Invalid .sdat file format");
        }
        onAddMeasurements(data.measurements);
        alert(`${data.measurements.length} measurement(s) imported successfully!`);
      } catch (error) {
        console.error("Import failed:", error);
        alert(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col z-50 backdrop-blur-sm">
      <header className="p-4 bg-gray-900 bg-opacity-50 border-b border-gray-700 flex justify-between items-center">
        <select
          value={selectedChart}
          onChange={(e) => setSelectedChart(e.target.value as ChartName)}
          className="bg-gray-700 text-white font-semibold py-2 px-4 rounded-md"
        >
          <option value="magnitude">Magnitude</option>
          <option value="phase">Phase</option>
          <option value="impulse">Impulse Response</option>
          <option value="coherence">Coherence</option>
        </select>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors duration-200 p-2 rounded-full hover:bg-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </header>
      <div className="flex-grow flex overflow-hidden">
        <aside className="w-80 flex-shrink-0 bg-gray-900 bg-opacity-50 p-4 border-r border-gray-700 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">Controls</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setIsAlignMode(!isAlignMode);
                  setAlignmentPair([null, null]); // Reset on toggle
                  setAlignmentResult(null);
                }}
                className={`p-2 hover:bg-gray-600 rounded-full ${
                  isAlignMode ? "bg-indigo-500 text-white" : "text-indigo-400"
                }`}
                title="Align Two Measurements"
              >
                <Timer className="h-5 w-5" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".sdat"
                onChange={handleFileChange}
              />
              <button
                onClick={handleImportClick}
                className="p-2 hover:bg-gray-600 rounded-full"
                title="Import Measurement"
              >
                <Upload className="h-5 w-5 text-indigo-400" />
              </button>
            </div>
          </div>
          {selectedChart === "magnitude" && (
            <div className="space-y-2 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-300">Target Curve</label>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedTargetCurve}
                    onChange={(e) => setSelectedTargetCurve(e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                  >
                    <option value="none">None</option>
                    {Object.entries(TARGET_CURVES).map(([key, curve]) => (
                      <option key={key} value={key}>
                        {curve.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setIsTargetCurveVisible(!isTargetCurveVisible)}
                    className="p-2 hover:bg-gray-600 rounded-full"
                  >
                    {isTargetCurveVisible ? (
                      <Eye className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300">Magnitude Range (dB)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={magnitudeRange.min}
                    onChange={(e) =>
                      setMagnitudeRange((prev) => ({ ...prev, min: Number(e.target.value) }))
                    }
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                  />
                  <input
                    type="number"
                    value={magnitudeRange.max}
                    onChange={(e) =>
                      setMagnitudeRange((prev) => ({ ...prev, max: Number(e.target.value) }))
                    }
                    className="w-full bg-gray-700 text-white p-2 rounded-md"
                  />
                </div>
              </div>
            </div>
          )}
          {isAlignMode && (
            <div className="bg-gray-800 p-3 rounded-md mb-4 space-y-3 border border-indigo-500">
              <h4 className="font-semibold text-white">System Alignment</h4>
              <div>
                <label className="text-sm font-medium text-gray-300">Alignment Type</label>
                <select
                  value={alignmentType}
                  onChange={(e) => setAlignmentType(e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded-md mt-1"
                >
                  <option value="ff_mains">Front Fill & Mains</option>
                  <option value="mains_delays">Mains & Delays</option>
                </select>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Trace 1 ({alignmentType.split("_")[0].replace("ff", "Front Fill")})
                  </label>
                  <select
                    value={alignmentPair[0] || "none"}
                    onChange={(e) => handleSelectForAlignment("trace1", e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-md mt-1"
                  >
                    <option value="none">-- Select Measurement --</option>
                    {savedMeasurements.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300">
                    Trace 2 (
                    {alignmentType
                      .split("_")[1]
                      .replace("mains", "Mains")
                      .replace("delays", "Delays")}
                    )
                  </label>
                  <select
                    value={alignmentPair[1] || "none"}
                    onChange={(e) => handleSelectForAlignment("trace2", e.target.value)}
                    className="w-full bg-gray-700 text-white p-2 rounded-md mt-1"
                  >
                    <option value="none">-- Select Measurement --</option>
                    {savedMeasurements.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleCalculateAlignment}
                disabled={!alignmentPair[0] || !alignmentPair[1] || isCalculating}
                className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              >
                {isCalculating ? "Calculating..." : "Calculate Delay"}
              </button>
              {alignmentResult && (
                <div className="text-center bg-gray-900 p-3 rounded-md space-y-2">
                  <div>
                    <p className="text-sm text-gray-300">Recommended Delay:</p>
                    <p className="text-2xl font-bold text-green-400">
                      {Math.abs(alignmentResult.delayMs).toFixed(2)} ms
                    </p>
                    <p className="text-sm text-gray-300">
                      to{" "}
                      <span className="font-semibold text-white">{alignmentResult.targetName}</span>
                    </p>
                  </div>
                  <button
                    onClick={handleApplyAlignment}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-1 px-3 rounded-md text-sm transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}
          <h3 className="text-lg font-semibold text-white mb-4">Measurements</h3>
          <ul className="space-y-2">
            <li className="bg-gray-700 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-white">Live</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsLiveTraceVisible(!isLiveTraceVisible)}
                    className="p-2 hover:bg-gray-600 rounded-full"
                  >
                    {isLiveTraceVisible ? (
                      <Eye className="h-5 w-5 text-indigo-400" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </li>
            {savedMeasurements.map((m) => {
              const adjustments = measurementAdjustments[m.id] || {
                gain: 0,
                delay: 0,
                phaseFlipped: false,
              };
              return (
                <li key={m.id} className="bg-gray-700 p-3 rounded-md space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{m.name}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {selectedChart === "phase" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMeasurementAdjustmentChange(m.id, {
                              phaseFlipped: !adjustments.phaseFlipped,
                            });
                          }}
                          className={`p-2 hover:bg-gray-600 rounded-full ${
                            adjustments.phaseFlipped ? "bg-sky-500" : ""
                          }`}
                          title="Flip Phase"
                        >
                          <RefreshCw
                            className={`h-5 w-5 ${
                              adjustments.phaseFlipped ? "text-white" : "text-gray-400"
                            }`}
                          />
                        </button>
                      )}
                      {selectedChart === "magnitude" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (eqMeasurementId === m.id) {
                              onEqMeasurementIdChange(null);
                            } else {
                              onEqMeasurementIdChange(m.id);
                              // ensure it's visible so the overlay actually renders
                              if (!visibleIds.has(m.id)) {
                                onToggleVisibility(m.id);
                              }
                            }
                          }}
                          className={`p-2 hover:bg-gray-600 rounded-full ${
                            eqMeasurementId === m.id ? "bg-indigo-500" : ""
                          }`}
                          title="Toggle EQ"
                        >
                          <SlidersHorizontal
                            className={`h-5 w-5 ${
                              eqMeasurementId === m.id ? "text-white" : "text-gray-400"
                            }`}
                          />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleVisibility(m.id);
                        }}
                        className="p-2 hover:bg-gray-600 rounded-full"
                      >
                        {visibleIds.has(m.id) ? (
                          <Eye className="h-5 w-5 text-indigo-400" />
                        ) : (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(m.id);
                        }}
                        className="p-2 hover:bg-gray-600 rounded-full"
                        title="Delete Measurement"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExport(m);
                        }}
                        className="p-2 hover:bg-gray-600 rounded-full"
                        title="Export Measurement"
                      >
                        <Download className="h-5 w-5 text-green-500" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs font-medium text-gray-400">Gain (dB)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={adjustments.gain}
                        onChange={(e) =>
                          onMeasurementAdjustmentChange(m.id, { gain: Number(e.target.value) })
                        }
                        className="w-full bg-gray-800 text-white p-1 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-400">Delay (ms)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={adjustments.delay}
                        onChange={(e) =>
                          onMeasurementAdjustmentChange(m.id, { delay: Number(e.target.value) })
                        }
                        className="w-full bg-gray-800 text-white p-1 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
        <main className="flex-grow p-6 flex flex-col min-w-0">
          <div className="w-full flex-grow bg-gray-800 rounded-lg shadow-2xl min-h-0">
            <Chart data={chartData} options={chartOptions} />
          </div>
          {selectedChart === "magnitude" && eqMeasurementId && (
            <div className="w-full mt-4 flex-shrink-0 bg-gray-800 rounded-lg shadow-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-white font-semibold">EQ Controls</h3>
                <button
                  onClick={() => setShowOriginalTrace(!showOriginalTrace)}
                  className="p-1 hover:bg-gray-600 rounded-full"
                  title={showOriginalTrace ? "Hide Original Trace" : "Show Original Trace"}
                >
                  {showOriginalTrace ? (
                    <Eye className="h-5 w-5 text-indigo-400" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              <EqControls
                measurement={savedMeasurements.find((m) => m.id === eqMeasurementId) || null}
                onEqChange={onEqChange}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ChartDetailModal;

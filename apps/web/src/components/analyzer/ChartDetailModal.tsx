import React, { useState, useMemo, useEffect, useRef } from "react";
import { X, Eye, EyeOff, Trash2, Download, Upload, SlidersHorizontal } from "lucide-react";
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
    [id: string]: { gain: number; delay: number };
  };
  onMeasurementAdjustmentChange: (id: string, newValues: { gain?: number; delay?: number }) => void;
  eqMeasurementId: string | null;
  onEqMeasurementIdChange: (id: string | null) => void;
  onEqChange: (id: string, eq_settings: EqSetting[]) => void;
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedChart, setSelectedChart] = useState<ChartName>(initialChart);
  const [magnitudeRange, setMagnitudeRange] = useState({ min: -20, max: 20 });
  const [isLiveTraceVisible, setIsLiveTraceVisible] = useState(true);
  const [selectedTargetCurve, setSelectedTargetCurve] = useState<string>("none");
  const [isTargetCurveVisible, setIsTargetCurveVisible] = useState(true);
  const [showOriginalTrace, setShowOriginalTrace] = useState(false);

  useEffect(() => {
    setSelectedChart(initialChart);
  }, [initialChart]);

  const chartData = useMemo(() => {
    const datasets = [];
    if (liveData && isLiveTraceVisible) {
      datasets.push({
        label: "Live",
        data: liveData[
          selectedChart === "impulse"
            ? "ir"
            : selectedChart === "magnitude"
              ? "mag_db"
              : selectedChart === "phase"
                ? "phase_deg"
                : "coh"
        ],
        borderColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
        borderWidth: 4,
      });
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

      const adjustments = measurementAdjustments[trace.id] || { gain: 0, delay: 0 };
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
          datasets.push({
            label: `${trace.name} (orig)`,
            data: baseMag,
            borderColor: trace.color || "#F472B6",
            backgroundColor: trace.color || "#F472B6",
            borderWidth: 2,
            borderDash: [6, 4],
            order: 0,
          } as any);
        }

        // 2) Active/EQ’d line
        datasets.push({
          label: `${trace.name}${hasEq ? " (EQ)" : ""}`,
          data: eqApplied,
          borderColor: trace.color || "#F472B6",
          backgroundColor: trace.color || "#F472B6",
          borderWidth: 4,
          order: 1,
        } as any);
        return;
      }

      if (selectedChart === "phase" && trace.tf_data.freqs) {
        const phased = (data as number[]).map((d, i) => {
          const freq = trace.tf_data.freqs[i];
          const phaseShift = (adjustments.delay / 1000) * freq * 360;
          let phase = d - phaseShift;
          while (phase <= -180) phase += 360;
          while (phase > 180) phase -= 360;
          return phase;
        });
        datasets.push({
          label: trace.name,
          data: phased,
          borderColor: trace.color || "#F472B6",
          backgroundColor: trace.color || "#F472B6",
          borderWidth: 4,
        } as any);
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
            <div>
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
              const adjustments = measurementAdjustments[m.id] || { gain: 0, delay: 0 };
              return (
                <li key={m.id} className="bg-gray-700 p-3 rounded-md space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-white">{m.name}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(m.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
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
                      <button
                        onClick={() => onToggleVisibility(m.id)}
                        className="p-2 hover:bg-gray-600 rounded-full"
                      >
                        {visibleIds.has(m.id) ? (
                          <Eye className="h-5 w-5 text-indigo-400" />
                        ) : (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(m.id)}
                        className="p-2 hover:bg-gray-600 rounded-full"
                        title="Delete Measurement"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                      </button>
                      <button
                        onClick={() => handleExport(m)}
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

import React, { useState, useMemo, useEffect } from "react";
import { X, Eye, EyeOff, Trash2 } from "lucide-react";
import { TFData } from "@sounddocs/analyzer-protocol";
import Chart from "./Chart";

type ChartName = "magnitude" | "phase" | "impulse" | "coherence";

interface Measurement {
  id: string;
  name: string;
  created_at: string;
  tf_data: TFData;
  color?: string;
  sample_rate: number;
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
  sampleRate: number;
  measurementAdjustments: {
    [id: string]: { gain: number; delay: number };
  };
  onMeasurementAdjustmentChange: (id: string, newValues: { gain?: number; delay?: number }) => void;
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
  sampleRate,
  measurementAdjustments,
  onMeasurementAdjustmentChange,
}) => {
  const [selectedChart, setSelectedChart] = useState<ChartName>(initialChart);
  const [magnitudeRange, setMagnitudeRange] = useState({ min: -20, max: 20 });
  const [isLiveTraceVisible, setIsLiveTraceVisible] = useState(true);

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
        borderWidth: 2,
      });
    }
    savedMeasurements.forEach((trace) => {
      if (
        visibleIds.has(trace.id) &&
        trace.tf_data[
          selectedChart === "impulse"
            ? "ir"
            : selectedChart === "magnitude"
              ? "mag_db"
              : selectedChart === "phase"
                ? "phase_deg"
                : "coh"
        ]
      ) {
        const adjustments = measurementAdjustments[trace.id] || { gain: 0, delay: 0 };
        let data =
          trace.tf_data[
            selectedChart === "impulse"
              ? "ir"
              : selectedChart === "magnitude"
                ? "mag_db"
                : selectedChart === "phase"
                  ? "phase_deg"
                  : "coh"
          ];

        if (selectedChart === "magnitude") {
          data = data.map((d) => d + adjustments.gain);
        } else if (selectedChart === "phase" && trace.tf_data.freqs) {
          data = data.map((d, i) => {
            const freq = trace.tf_data.freqs[i];
            const phaseShift = (adjustments.delay / 1000) * freq * 360;
            let phase = d - phaseShift;
            while (phase <= -180) phase += 360;
            while (phase > 180) phase -= 360;
            return phase;
          });
        } else if (selectedChart === "impulse") {
          const delayInSamples = Math.round((adjustments.delay / 1000) * trace.sample_rate);
          const shiftedData = new Array(data.length).fill(0);
          for (let i = 0; i < data.length; i++) {
            const newIndex = i + delayInSamples;
            if (newIndex >= 0 && newIndex < data.length) {
              shiftedData[newIndex] = data[i];
            }
          }
          data = shiftedData;
        }

        datasets.push({
          label: trace.name,
          data,
          borderColor: trace.color || "#F472B6",
          backgroundColor: trace.color || "#F472B6",
          borderWidth: 1,
        });
      }
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
        <aside className="w-80 bg-gray-900 bg-opacity-50 p-4 border-r border-gray-700 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Controls</h3>
          {selectedChart === "magnitude" && (
            <div className="space-y-2 mb-4">
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
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
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
        <main className="flex-grow p-6 flex items-center justify-center">
          <div className="w-full h-full bg-gray-800 rounded-lg shadow-2xl">
            <Chart data={chartData} options={chartOptions} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChartDetailModal;

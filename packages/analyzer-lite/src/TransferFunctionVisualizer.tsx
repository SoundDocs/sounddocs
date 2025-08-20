import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
} from "chart.js";
import type { TFData } from "@sounddocs/analyzer-protocol";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
);

export interface TransferFunctionVisualizerProps {
  tfData: TFData | null;
  sampleRate: number;
  saved?: Array<{
    id: string;
    tf: TFData;
    label: string;
    color?: string;
    offsetDb?: number;
    offsetMs?: number;
    sample_rate: number;
  }>;
  className?: string;
  onChartClick?: (chartName: "magnitude" | "phase" | "impulse" | "coherence") => void;
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false as const,
  scales: {
    x: {
      type: "logarithmic" as const,
      min: 20,
      max: 20000,
      ticks: {
        color: "#9CA3AF",
        callback: (value: any) => {
          const numValue = Number(value);
          if (numValue < 1000) {
            if (numValue > 500) return "";
            return numValue % 100 === 0 || numValue === 20 || numValue === 50 ? `${numValue}` : "";
          }
          const freqs = [1000, 2000, 5000, 10000, 20000];
          return freqs.includes(numValue) ? `${numValue / 1000}k` : "";
        },
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

export const TransferFunctionVisualizer: React.FC<TransferFunctionVisualizerProps> = ({
  tfData,
  sampleRate,
  saved = [],
  className = "",
  onChartClick = () => {},
}) => {
  const magnitudeChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: -20,
        max: 20,
      },
    },
  };

  const phaseChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        min: -180,
        max: 180,
      },
    },
  };

  const magnitudeData = React.useMemo(() => {
    const datasets = [];
    if (tfData) {
      datasets.push({
        label: "Live",
        data: tfData.mag_db,
        borderColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
      });
    }
    saved.forEach((trace) => {
      datasets.push({
        label: trace.label,
        data: trace.tf.mag_db, // Note: offset logic will be added later
        borderColor: trace.color || "#F472B6",
        backgroundColor: trace.color || "#F472B6",
        borderWidth: 1,
      });
    });
    return {
      labels: tfData?.freqs || saved[0]?.tf.freqs || [],
      datasets,
    };
  }, [tfData, saved]);

  const phaseData = React.useMemo(() => {
    const datasets = [];
    if (tfData) {
      datasets.push({
        label: "Live",
        data: tfData.phase_deg,
        borderColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
      });
    }
    saved.forEach((trace) => {
      datasets.push({
        label: trace.label,
        data: trace.tf.phase_deg, // Note: offset logic will be added later
        borderColor: trace.color || "#F472B6",
        backgroundColor: trace.color || "#F472B6",
        borderWidth: 1,
      });
    });
    return {
      labels: tfData?.freqs || saved[0]?.tf.freqs || [],
      datasets,
    };
  }, [tfData, saved]);

  const coherenceData = React.useMemo(() => {
    const datasets = [];
    if (tfData) {
      datasets.push({
        label: "Live",
        data: tfData.coh,
        borderColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
      });
    }
    saved.forEach((trace) => {
      if (trace.tf.coh) {
        datasets.push({
          label: trace.label,
          data: trace.tf.coh,
          borderColor: trace.color || "#F472B6",
          backgroundColor: trace.color || "#F472B6",
          borderWidth: 1,
        });
      }
    });
    return {
      labels: tfData?.freqs || saved[0]?.tf.freqs || [],
      datasets,
    };
  }, [tfData, saved]);

  const impulseData = React.useMemo(() => {
    const datasets = [];
    if (tfData?.ir) {
      datasets.push({
        label: "Live",
        data: tfData.ir,
        borderColor: "#FFFFFF",
        backgroundColor: "#FFFFFF",
        borderWidth: 2,
      });
    }
    saved.forEach((trace) => {
      if (trace.tf.ir) {
        datasets.push({
          label: trace.label,
          data: trace.tf.ir,
          borderColor: trace.color || "#F472B6",
          backgroundColor: trace.color || "#F472B6",
          borderWidth: 1,
        });
      }
    });

    const irDataSource = tfData?.ir
      ? { data: tfData.ir, rate: sampleRate }
      : saved.find((t) => t.tf.ir)?.tf.ir
        ? {
            data: saved.find((t) => t.tf.ir)!.tf.ir!,
            rate: saved.find((t) => t.tf.ir)!.sample_rate,
          }
        : null;

    const labels = irDataSource
      ? irDataSource.data.map((_, i) => {
          const center = Math.floor(irDataSource.data.length / 2);
          return ((i - center) / irDataSource.rate) * 1000;
        })
      : [];

    return {
      labels,
      datasets,
    };
  }, [tfData, saved, sampleRate]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div onClick={() => onChartClick("magnitude")} className="cursor-pointer">
        <p className="text-lg font-bold text-white">Magnitude</p>
        <div className="h-64 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <Line options={magnitudeChartOptions} data={magnitudeData} />
        </div>
      </div>
      <div onClick={() => onChartClick("phase")} className="cursor-pointer">
        <p className="text-lg font-bold text-white">Phase</p>
        <div className="h-64 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <Line options={phaseChartOptions} data={phaseData} />
        </div>
      </div>
      <div onClick={() => onChartClick("impulse")} className="cursor-pointer">
        <p className="text-lg font-bold text-white">Impulse Response</p>
        <div className="h-64 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <Line
            options={{
              ...chartOptions,
              scales: {
                ...chartOptions.scales,
                x: {
                  type: "linear",
                  min: -8,
                  max: 8,
                  ticks: { color: "#9CA3AF" },
                  grid: { color: "#4B5563" },
                },
                y: {
                  min: -1,
                  max: 1,
                  ticks: { color: "#9CA3AF" },
                  grid: { color: "#4B5563" },
                },
              },
            }}
            data={impulseData}
          />
        </div>
      </div>
      <div onClick={() => onChartClick("coherence")} className="cursor-pointer">
        <p className="text-lg font-bold text-white">Coherence</p>
        <div className="h-64 p-4 bg-gray-800 rounded-lg border border-gray-600">
          <Line
            options={{
              ...chartOptions,
              scales: { ...chartOptions.scales, y: { ...chartOptions.scales.y, min: 0, max: 1 } },
            }}
            data={coherenceData}
          />
        </div>
      </div>
    </div>
  );
};

export default TransferFunctionVisualizer;

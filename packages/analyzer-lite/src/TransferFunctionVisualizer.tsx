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
  className?: string;
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
          const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
          return freqs.includes(Number(value)) ? `${Number(value) / 1000}k` : "";
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
  },
  elements: {
    point: {
      radius: 0,
    },
  },
};

export const TransferFunctionVisualizer: React.FC<TransferFunctionVisualizerProps> = ({
  tfData,
  className = "",
}) => {
  const magnitudeData = {
    labels: tfData?.freqs,
    datasets: [
      {
        label: "Magnitude (dB)",
        data: tfData?.mag_db || [],
        borderColor: "#8DA2FB",
        backgroundColor: "#8DA2FB",
      },
    ],
  };

  const phaseData = {
    labels: tfData?.freqs,
    datasets: [
      {
        label: "Phase (°)",
        data: tfData?.phase_deg || [],
        borderColor: "#A78BFA",
        backgroundColor: "#A78BFA",
      },
    ],
  };

  const coherenceData = {
    labels: tfData?.freqs,
    datasets: [
      {
        label: "Coherence",
        data: tfData?.coh || [],
        borderColor: "#F472B6",
        backgroundColor: "#F472B6",
      },
    ],
  };

  const impulseData = {
    labels: tfData?.ir?.map((_, i) => i),
    datasets: [
      {
        label: "Impulse Response",
        data: tfData?.ir || [],
        borderColor: "#34D399",
        backgroundColor: "#34D399",
      },
    ],
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="h-64 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <Line options={chartOptions} data={magnitudeData} />
      </div>
      <div className="h-64 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <Line options={chartOptions} data={phaseData} />
      </div>
      <div className="h-64 p-4 bg-gray-800 rounded-lg border border-gray-600">
        <Line
          options={{
            ...chartOptions,
            scales: {
              ...chartOptions.scales,
              x: {
                type: "linear",
                ticks: { color: "#9CA3AF" },
                grid: { color: "#4B5563" },
              },
            },
          }}
          data={impulseData}
        />
      </div>
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
  );
};

export default TransferFunctionVisualizer;

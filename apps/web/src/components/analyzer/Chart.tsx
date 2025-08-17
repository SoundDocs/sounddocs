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
import { TFData } from "@sounddocs/analyzer-protocol";

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

interface ChartProps {
  data: any;
  options: any;
}

const Chart: React.FC<ChartProps> = ({ data, options }) => {
  return <Line data={data} options={options} />;
};

export default Chart;

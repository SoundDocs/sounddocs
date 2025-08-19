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
  Decimation,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  LogarithmicScale,
  Decimation,
);

interface ChartProps {
  data: any;
  options: any;
  className?: string;
}

const Chart: React.FC<ChartProps> = ({ data, options, className }) => {
  return (
    <div className={className}>
      <Line data={data} options={options} />
    </div>
  );
};

export default Chart;

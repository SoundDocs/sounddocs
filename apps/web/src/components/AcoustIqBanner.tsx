import { Link } from "react-router-dom";
import { BarChart2, ChevronRight } from "lucide-react";

const AcoustIqBanner = () => {
  return (
    <div className="mb-10 bg-gray-800/50 border border-indigo-500/30 rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-shadow duration-300">
      <Link to="/analyzer" className="block p-6 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-indigo-500/20 p-3 rounded-lg mr-4">
              <BarChart2 className="h-8 w-8 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Introducing AcoustIQ</h2>
              <p className="text-gray-400 text-sm sm:text-base">
                Advanced audio analysis tools are here. Measure, analyze, and optimize your sound
                systems.
              </p>
            </div>
          </div>
          <ChevronRight className="h-7 w-7 text-gray-500 group-hover:text-indigo-400 transition-colors hidden sm:block" />
        </div>
      </Link>
    </div>
  );
};

export default AcoustIqBanner;

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftCircle, Activity, Mic, Server } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";

const AnalyzerPage: React.FC = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onSignOut={handleSignOut} />

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4 group"
          >
            <ArrowLeftCircle className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            Back
          </button>
          <div className="flex items-center mb-4">
            <Activity className="h-8 w-8 text-green-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">AcoustIQ Audio Analyzer</h1>
          </div>
          <p className="text-lg text-gray-300">Choose an analysis mode to get started.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Analyzer Lite Card */}
          <div
            onClick={() => navigate("/analyzer/lite")}
            className="bg-gray-800/50 p-8 rounded-xl shadow-lg hover:bg-gray-800/80 hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <Mic className="h-8 w-8 text-blue-400 mr-4" />
              <h2 className="text-3xl font-semibold text-white">AcoustIQ Lite</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Quick single-channel analysis using your browser's microphone.
            </p>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>✓ Real-time Spectrogram (RTA)</li>
              <li>✓ SPL Meter with Calibration</li>
              <li>✓ No Setup Required</li>
            </ul>
          </div>

          {/* Analyzer Pro Card */}
          <div
            onClick={() => navigate("/analyzer/pro")}
            className="bg-gray-800/50 p-8 rounded-xl shadow-lg hover:bg-gray-800/80 hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center mb-4">
              <Server className="h-8 w-8 text-indigo-400 mr-4" />
              <h2 className="text-3xl font-semibold text-white">AcoustIQ Pro</h2>
            </div>
            <p className="text-gray-400 mb-4">
              Powerful dual-channel analysis using our local capture agent.
            </p>
            <ul className="text-sm text-gray-300 space-y-2">
              <li>✓ Dual-Channel Transfer Function</li>
              <li>✓ Coherence & Phase Measurement</li>
              <li>✓ Requires Local Agent Download</li>
            </ul>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AnalyzerPage;

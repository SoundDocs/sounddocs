import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeftCircle, Activity } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AudioAnalyzerSection from "../components/analyzer/AudioAnalyzerSection";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

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
            <h1 className="text-4xl font-bold text-white">Audio Analyzer</h1>
          </div>
          <p className="text-lg text-gray-300">
            Professional real-time audio analysis and measurement tools for live sound applications.
          </p>
        </div>

        {/* Analyzer Section */}
        <div className="max-w-4xl mx-auto">
          <AudioAnalyzerSection />

          {/* Additional Information Card */}
          <div className="mt-8 bg-gray-800 p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-semibold text-white mb-4">About the Analyzer</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-300">
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Current Features</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    Professional audio device selection and management
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    Browser-based microphone permission handling
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-400 mr-2">•</span>
                    Real-time device detection and hot-swapping
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-white mb-2">Coming Soon</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    Real-time spectrum analyzer (RTA) with 1/3 octave bands
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    SPL meter with Leq measurement and calibration
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    Transfer function analysis (with Pro mode capture agent)
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    Pink noise and sweep test signal generation
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-400 mr-2">•</span>
                    AI-powered EQ recommendations and room correction
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <h4 className="text-yellow-300 font-medium mb-2">Browser Requirements</h4>
              <p className="text-yellow-200 text-sm">
                For optimal performance, use a modern browser with Web Audio API support. Chrome and
                Edge are recommended for the best experience with real-time audio processing.
              </p>
            </div>

            <div className="mt-4 p-4 bg-purple-500/20 border border-purple-500/30 rounded-lg">
              <h4 className="text-purple-300 font-medium mb-2">Pro Mode Coming Soon</h4>
              <p className="text-purple-200 text-sm">
                A companion desktop application will provide enhanced features including
                multi-channel capture, dual-channel transfer functions, and professional DSP
                capabilities that require direct hardware access beyond browser limitations.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AnalyzerPage;

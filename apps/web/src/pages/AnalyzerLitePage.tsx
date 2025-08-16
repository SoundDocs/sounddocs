import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftCircle, Mic } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AudioAnalyzerSection from "../components/analyzer/AudioAnalyzerSection";
import { supabase } from "../lib/supabase";

const AnalyzerLitePage: React.FC = () => {
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
            onClick={() => navigate("/analyzer")}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4 group"
          >
            <ArrowLeftCircle className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Analyzer Hub
          </button>
          <div className="flex items-center mb-4">
            <Mic className="h-8 w-8 text-blue-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">AcoustIQ Lite</h1>
          </div>
          <p className="text-lg text-gray-300">
            Use your browser's microphone for basic single-channel measurements. Ideal for quick
            checks without any setup.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <AudioAnalyzerSection />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AnalyzerLitePage;

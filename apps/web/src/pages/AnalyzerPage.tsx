import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import DevelopmentWarning from "../components/analyzer/DevelopmentWarning";
import { ArrowLeftCircle, Activity, Mic, Server } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { supabase } from "../lib/supabase";
import { getCanonicalUrl } from "../utils/canonical-url";
import { generateBreadcrumbSchema, createBreadcrumbs } from "../utils/breadcrumb-schema";

const AnalyzerPage: React.FC = () => {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(true);

  const handleAcknowledge = () => {
    setShowWarning(false);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const breadcrumbs = createBreadcrumbs.analyzer();

  return (
    <>
      <Helmet>
        <title>AcoustIQ Audio Analyzer | Free Browser-Based FFT & RTA | SoundDocs</title>
        <meta
          name="description"
          content="Professional browser-based audio analyzer with FFT analysis, transfer functions, and coherence-weighted averaging. Choose AcoustIQ Lite for quick analysis or Pro for advanced measurements. Free forever."
        />
        <meta
          name="keywords"
          content="audio analyzer online, FFT analyzer, RTA analyzer, transfer function, browser audio analyzer, free audio analyzer, acoustic measurement, AcoustIQ"
        />

        {/* Canonical URL */}
        <link rel="canonical" href={getCanonicalUrl()} />

        {/* Open Graph - Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sounddocs.org/analyzer" />
        <meta property="og:title" content="AcoustIQ Audio Analyzer | SoundDocs" />
        <meta
          property="og:description"
          content="Professional browser-based audio analyzer with FFT analysis and transfer functions. Free forever."
        />
        <meta property="og:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AcoustIQ Audio Analyzer | SoundDocs" />
        <meta
          name="twitter:description"
          content="Professional browser-based audio analyzer with FFT analysis and transfer functions. Free forever."
        />
        <meta name="twitter:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />

        {/* Structured Data - Breadcrumbs */}
        <script type="application/ld+json">
          {JSON.stringify(generateBreadcrumbSchema(breadcrumbs))}
        </script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 flex flex-col relative">
        <div
          className={`flex flex-col flex-grow ${
            showWarning ? "opacity-50 pointer-events-none" : ""
          } transition-opacity duration-300`}
        >
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
        {showWarning && <DevelopmentWarning onAcknowledge={handleAcknowledge} />}
      </div>
    </>
  );
};

export default AnalyzerPage;

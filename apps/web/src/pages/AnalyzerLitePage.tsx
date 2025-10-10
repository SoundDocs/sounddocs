import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeftCircle, Mic } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AudioAnalyzerSection from "../components/analyzer/AudioAnalyzerSection";
import { supabase } from "../lib/supabase";
import { getCanonicalUrl } from "../utils/canonical-url";
import { generateBreadcrumbSchema, createBreadcrumbs } from "../utils/breadcrumb-schema";
import { acoustiqLiteSchema } from "../schemas/software-schemas";

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

  const breadcrumbs = createBreadcrumbs.analyzer("lite");

  return (
    <>
      <Helmet>
        <title>AcoustIQ Lite - Free Browser Audio Analyzer | FFT & RTA | SoundDocs</title>
        <meta
          name="description"
          content="Free browser-based audio analyzer using your microphone. Real-time spectrogram (RTA), SPL meter with calibration, and instant FFT analysis. No installation required."
        />
        <meta
          name="keywords"
          content="free audio analyzer, browser FFT analyzer, online RTA, SPL meter, spectrogram analyzer, mic level meter, audio measurement tool"
        />

        {/* Canonical URL */}
        <link rel="canonical" href={getCanonicalUrl()} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sounddocs.org/analyzer/lite" />
        <meta property="og:title" content="AcoustIQ Lite - Free Browser Audio Analyzer" />
        <meta
          property="og:description"
          content="Free browser-based audio analyzer with real-time spectrogram, SPL meter, and FFT analysis. No installation required."
        />
        <meta property="og:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AcoustIQ Lite - Free Browser Audio Analyzer" />
        <meta
          name="twitter:description"
          content="Free browser-based audio analyzer with real-time spectrogram, SPL meter, and FFT analysis."
        />
        <meta name="twitter:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(generateBreadcrumbSchema(breadcrumbs))}
        </script>
        <script type="application/ld+json">{JSON.stringify(acoustiqLiteSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header onSignOut={handleSignOut} />

        <main className="flex-grow container mx-auto px-4 py-12 mt-12">
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4 group"
            >
              <ArrowLeftCircle className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
              Back to AcoustIQ Hub
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
    </>
  );
};

export default AnalyzerLitePage;

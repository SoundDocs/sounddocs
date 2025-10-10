import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Lightbulb, Construction } from "lucide-react";
import { supabase } from "../lib/supabase";
import { getCanonicalUrl } from "../utils/canonical-url";

const LightingPage = () => {
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
    <>
      <Helmet>
        <title>Lighting Documentation Tools | SoundDocs</title>
        <meta
          name="description"
          content="Professional lighting documentation tools for theaters, concerts, and events. Create lighting plots, DMX charts, and manage lighting equipment documentation. Free forever for lighting designers."
        />
        <meta
          name="keywords"
          content="lighting documentation, lighting plot, DMX chart, lighting designer tools, theater lighting, concert lighting, lighting equipment"
        />

        {/* Canonical URL */}
        <link rel="canonical" href={getCanonicalUrl()} />

        {/* Open Graph - Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sounddocs.org/lighting" />
        <meta property="og:title" content="Lighting Documentation Tools | SoundDocs" />
        <meta
          property="og:description"
          content="Professional lighting documentation tools for theaters, concerts, and events. Create lighting plots and DMX charts. Free forever."
        />
        <meta property="og:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Lighting Documentation Tools | SoundDocs" />
        <meta
          name="twitter:description"
          content="Professional lighting documentation tools for theaters, concerts, and events. Create lighting plots and DMX charts. Free forever."
        />
        <meta name="twitter:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />
      </Helmet>

      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header onSignOut={handleSignOut} />
        <main className="flex-grow container mx-auto px-4 py-12 mt-12 flex flex-col items-center justify-center">
          <div className="text-center">
            <Construction className="h-24 w-24 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">Lighting Features</h1>
            <p className="text-2xl text-yellow-300 mb-2">Coming Soon!</p>
            <p className="text-lg text-gray-300 mb-8">
              Powerful tools for lighting design and control are under construction. Check back
              soon!
            </p>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-300"
            >
              Back to Dashboard
            </button>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LightingPage;

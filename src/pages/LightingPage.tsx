import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Lightbulb, Construction } from "lucide-react";
import { supabase } from "../lib/supabase";

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
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onSignOut={handleSignOut} />
      <main className="flex-grow container mx-auto px-4 py-12 mt-12 flex flex-col items-center justify-center">
        <div className="text-center">
          <Construction className="h-24 w-24 text-yellow-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Lighting Features</h1>
          <p className="text-2xl text-yellow-300 mb-2">Coming Soon!</p>
          <p className="text-lg text-gray-300 mb-8">
            Powerful tools for lighting design and control are under construction.
            Check back soon!
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
  );
};

export default LightingPage;

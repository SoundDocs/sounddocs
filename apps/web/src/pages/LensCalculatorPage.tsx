import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import LensCalculatorV2 from "../components/lens-calculator/LensCalculatorV2";
import { ArrowLeftCircle, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

// Future imports for calculation history feature
// import type { ScreenData, ProjectorRequirements, InstallationConstraints } from '../lib/lensCalculatorTypes';

// Interface for future calculation history feature
// interface Calculation {
//   screen_data: ScreenData;
//   projector_requirements: ProjectorRequirements;
//   installation_constraints: InstallationConstraints;
// }

const LensCalculatorPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  // const [calculation, setCalculation] = useState<Calculation | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (data.user) {
          if (id && id !== "new") {
            await loadCalculation(id);
          }
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate, id]);

  const loadCalculation = async (calcId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lens_calculations")
        .select("*")
        .eq("id", calcId)
        .single();

      if (error) throw error;
      // setCalculation(data); // Will be used for calculation history feature
      console.log("Loaded calculation:", data);
    } catch (error) {
      console.error("Error loading calculation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleSave = (calculationId: string) => {
    // If this was a new calculation, update the URL
    if (id === "new") {
      navigate(`/video/lens-calculator/${calculationId}`, { replace: true });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onSignOut={handleSignOut} />

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-8">
          <Link
            to="/video"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4 group"
          >
            <ArrowLeftCircle className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Video
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Projection Lens Calculator</h1>
          <p className="text-lg text-gray-300">
            Calculate optimal lens options for professional projection systems
          </p>
        </div>

        <LensCalculatorV2 onSave={handleSave} />
      </main>

      <Footer />
    </div>
  );
};

export default LensCalculatorPage;

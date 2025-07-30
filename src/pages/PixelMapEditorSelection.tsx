import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Monitor, Grid, ArrowLeftCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PixelMapEditorSelection = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSelection = (type: 'standard') => {
    if (type === 'standard') {
      navigate('/pixel-map/standard/new');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onSignOut={handleSignOut} />
      <main className="flex-grow container mx-auto px-4 py-12 mt-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl">
          <Link
            to="/video"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-8 group"
          >
            <ArrowLeftCircle className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Video Documents
          </Link>
          <h1 className="text-4xl font-bold text-white text-center mb-4">Create a New Pixel Map</h1>
          <p className="text-lg text-gray-300 text-center mb-12">
            Choose the type of display you are creating a pixel map for.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Option 1: Projection/LCD Screen */}
            <div
              onClick={() => handleSelection('standard')}
              className="bg-gray-800 p-8 rounded-xl shadow-lg border-2 border-transparent hover:border-indigo-500 transition-all duration-300 cursor-pointer flex flex-col items-center text-center group"
            >
              <Monitor className="h-16 w-16 text-indigo-400 mb-6 transition-transform duration-300 group-hover:scale-110" />
              <h2 className="text-2xl font-semibold text-white mb-3">
                Projection or LCD Screen
              </h2>
              <p className="text-gray-400">
                For standard displays with known resolutions like 1920x1080 (16:9), 4K, etc. Ideal for presentations and standard video playback.
              </p>
            </div>

            {/* Option 2: LED Wall - Disabled */}
            <div
              className="relative bg-gray-800 p-8 rounded-xl shadow-lg border-2 border-transparent flex flex-col items-center text-center opacity-60 cursor-not-allowed"
            >
              <div className="absolute top-4 right-4 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                COMING SOON
              </div>
              <Grid className="h-16 w-16 text-gray-500 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-400 mb-3">
                LED Video Wall
              </h2>
              <p className="text-gray-500">
                For custom-sized video walls built from individual LED tiles. Define your canvas by the number of tiles and their pixel pitch.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PixelMapEditorSelection;

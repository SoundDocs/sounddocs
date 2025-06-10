{
      /*
      src/pages/AudioFormulasPage.tsx
      - This page now acts as a navigation hub for formula categories.
      - Removed all audio formula calculation logic and UI.
      - Cards for "Audio", "Video", and "Lighting" are now Links to dedicated pages.
      - Page title changed to "Technical Formula Categories".
      */
    }
    import React from "react";
    import Header from "../components/Header";
    import Footer from "../components/Footer";
    import { Link as RouterLink } from "react-router-dom";
    import { ArrowLeft, Music, Clapperboard, Sun } from "lucide-react";

    const FormulaCard: React.FC<{ title: string; description: string; icon: React.ElementType; linkTo: string; borderColor: string; textColor: string; iconColor: string }> = ({ title, description, icon: Icon, linkTo, borderColor, textColor, iconColor }) => (
      <RouterLink 
        to={linkTo} 
        className={`block bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl border ${borderColor} hover:shadow-indigo-500/50 hover:-translate-y-1 transition-all duration-300 ease-in-out group`}
      >
        <div className="flex items-center mb-4">
          <Icon className={`mr-4 h-10 w-10 ${iconColor} transition-transform duration-300 group-hover:scale-110`} />
          <h2 className={`text-3xl font-semibold ${textColor}`}>{title}</h2>
        </div>
        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{description}</p>
        <div className="mt-6 text-right">
          <span className={`text-sm font-medium ${textColor} group-hover:underline`}>
            Explore Formulas &rarr;
          </span>
        </div>
      </RouterLink>
    );

    const AudioFormulasPage: React.FC = () => {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-16 sm:py-24">
            <div className="mb-8">
              <RouterLink
                to="/resources"
                className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 group"
              >
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Back to Resources
              </RouterLink>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-16 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
              Technical Formula Categories
            </h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FormulaCard
                title="Audio Formulas"
                description="Calculators for sound waves, decibels, Ohm's law, digital audio, and more."
                icon={Music}
                linkTo="/resources/formulas/audio"
                borderColor="border-indigo-700/50"
                textColor="text-indigo-400"
                iconColor="text-indigo-500"
              />
              <FormulaCard
                title="Video Formulas"
                description="Explore aspect ratios, resolutions, bitrates, and other video calculations."
                icon={Clapperboard}
                linkTo="/resources/formulas/video"
                borderColor="border-green-700/50"
                textColor="text-green-400"
                iconColor="text-green-500"
              />
              <FormulaCard
                title="Lighting Formulas"
                description="Calculators for lumens, lux, inverse square law for light, and DMX."
                icon={Sun}
                linkTo="/resources/formulas/lighting"
                borderColor="border-yellow-700/50"
                textColor="text-yellow-400"
                iconColor="text-yellow-500"
              />
            </div>
          </main>
          <Footer />
        </div>
      );
    };

    export default AudioFormulasPage;

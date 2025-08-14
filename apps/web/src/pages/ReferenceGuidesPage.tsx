import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link as RouterLink } from "react-router-dom";
import { ArrowRight, Cable, Radio, BarChart3, BookText, ChevronLeft } from "lucide-react";

const SubResourceCard: React.FC<{
  title: string;
  description: string;
  link: string;
  icon: React.ReactNode;
}> = ({ title, description, link, icon }) => {
  return (
    <RouterLink
      to={link}
      className="block bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1 group"
    >
      <div className="flex items-center mb-4">
        <div className="p-3 bg-sky-500 rounded-full mr-4 group-hover:bg-sky-600 transition-colors duration-300">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-sky-300 group-hover:text-sky-200 transition-colors duration-300">
          {title}
        </h2>
      </div>
      <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">
        {description}
      </p>
      <div className="flex items-center text-sky-400 group-hover:text-sky-300 transition-colors duration-300">
        View Guide
        <ArrowRight className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </RouterLink>
  );
};

const ReferenceGuidesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16">
        <div className="mb-12">
          <RouterLink
            to="/resources"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-300 group"
          >
            <ChevronLeft className="mr-2 h-5 w-5 transform transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Resources
          </RouterLink>
        </div>
        <h1 className="text-4xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-500">
          Reference Guides
        </h1>
        <p className="text-lg text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Quick access to essential technical information, pinouts, frequency details, decibel
          charts, and industry terminology.
        </p>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <SubResourceCard
            title="Common Connector Pinouts"
            description="Visual diagrams and pin assignments for frequently used audio, video, and data connectors."
            link="/resources/guides/pinouts"
            icon={<Cable className="h-6 w-6 text-white" />}
          />
          <SubResourceCard
            title="Wireless Mic Frequency Bands"
            description="Information on legal and usable wireless microphone frequency ranges (U.S. FCC) and coordination tips."
            link="/resources/guides/frequency-bands"
            icon={<Radio className="h-6 w-6 text-white" />}
          />
          <SubResourceCard
            title="Decibel (dB) Reference Chart"
            description="Understand different dB scales (dBu, dBV, dBFS, dBSPL) and common sound level examples. Includes OSHA guidelines."
            link="/resources/guides/db-chart"
            icon={<BarChart3 className="h-6 w-6 text-white" />}
          />
          <SubResourceCard
            title="Glossaries"
            description="Definitions of common terms and acronyms used in the audio, video, and lighting industries."
            link="/resources/guides/glossaries" // Updated link
            icon={<BookText className="h-6 w-6 text-white" />}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReferenceGuidesPage;

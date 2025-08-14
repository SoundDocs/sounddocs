import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Link as RouterLink } from "react-router-dom";
import { ArrowRight, DollarSign, Calculator, BookOpen } from "lucide-react";

const ResourceCard: React.FC<{
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
        <div className="p-3 bg-indigo-500 rounded-full mr-4 group-hover:bg-indigo-600 transition-colors duration-300">
          {icon}
        </div>
        <h2 className="text-2xl font-semibold text-indigo-300 group-hover:text-indigo-200 transition-colors duration-300">
          {title}
        </h2>
      </div>
      <p className="text-gray-400 mb-4 group-hover:text-gray-300 transition-colors duration-300">
        {description}
      </p>
      <div className="flex items-center text-indigo-400 group-hover:text-indigo-300 transition-colors duration-300">
        Explore {title}
        <ArrowRight className="ml-2 h-5 w-5 transform transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </RouterLink>
  );
};

const Resources: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-24">
        <h1 className="text-5xl font-bold mb-12 pb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
          Knowledge Hub
        </h1>
        <p className="text-xl text-gray-400 text-center mb-16 max-w-3xl mx-auto">
          Access valuable tools, rate information, technical formulas, and reference guides for
          audio, video, and lighting to streamline your production workflow.
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <ResourceCard
            title="Typical Rates"
            description="Explore common freelance rates for various audio engineering roles and services. Get insights for quoting your projects."
            link="/resources/rates"
            icon={<DollarSign className="h-6 w-6 text-white" />}
          />
          <ResourceCard
            title="Technical Formulas"
            description="Access essential formulas and calculators for Audio, Video, and Lighting, including Ohm's Law, aspect ratios, lux levels, and more."
            link="/resources/audio-formulas" // This links to the formula category hub
            icon={<Calculator className="h-6 w-6 text-white" />}
          />
          <ResourceCard
            title="Reference Guides"
            description="Find quick reference materials like connector pinouts, frequency band info, dB charts, and industry glossaries."
            link="/resources/reference-guides"
            icon={<BookOpen className="h-6 w-6 text-white" />}
          />
        </div>

        <div className="text-center mt-20 text-gray-500">
          <p>More resources coming soon. Stay tuned!</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Resources;

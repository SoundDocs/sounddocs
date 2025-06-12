import React from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ArrowLeft, Briefcase, Drama, ArrowRight } from "lucide-react"; // Using Drama for theater

const AllMicPlots: React.FC = () => {
  const navigate = useNavigate();

  const cardSections = [
    {
      title: "Corporate Mic Plots",
      description: "Manage mic plots for corporate events, conferences, and presentations.",
      icon: Briefcase,
      path: "/all-corporate-mic-plots", // Placeholder for future page
      actionText: "View Corporate Plots",
    },
    {
      title: "Theater Mic Plots",
      description: "Manage mic plots for theatrical productions, musicals, and stage plays.",
      icon: Drama, // Using Drama icon for theater
      path: "/all-theater-mic-plots", // Placeholder for future page
      actionText: "View Theater Plots",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/audio")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Audio
          </button>
          {/* No "New" button here as this is a directory page */}
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">All Mic Plots</h1>
            <p className="text-gray-400">Select a mic plot type to view and manage.</p>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {cardSections.map((section) => (
              <Link
                key={section.title}
                to={section.path}
                className="group block bg-gray-750 hover:bg-gray-700 p-6 rounded-xl shadow-md transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-indigo-500 rounded-lg mb-4 group-hover:bg-indigo-600 transition-colors">
                  <section.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  {section.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">{section.description}</p>
                <div className="text-indigo-400 group-hover:text-indigo-300 font-medium flex items-center transition-colors">
                  {section.actionText} <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AllMicPlots;

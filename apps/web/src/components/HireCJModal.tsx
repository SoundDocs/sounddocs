import React from "react";
import {
  X,
  Mail,
  Briefcase,
  MapPin,
  Calendar,
  Mic,
  Radio,
  Volume2,
  Headphones,
  Settings,
  Cable,
} from "lucide-react";

interface HireCJModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HireCJModal: React.FC<HireCJModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const skills = [
    { icon: Mic, text: "FOH & Monitors A1 - Front of House & Monitor Mix Engineering" },
    { icon: Volume2, text: "A2 & Stage Support - Audio Assistant, Patch, RF Coordination" },
    {
      icon: Settings,
      text: "System Design & Deployment - PA Architecture, Setup, Tuning & Optimization",
    },
    { icon: Radio, text: "RF & Intercom Systems - Wireless Coordination, Clear-Com, RTS" },
    { icon: Cable, text: "Festival & Tour Production - Signal Flow, System Integration" },
    {
      icon: Briefcase,
      text: "Production Management - Technical Director, Project Manager, Show Coordination",
    },
  ];

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="bg-gray-950/95 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl shadow-indigo-900/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Hire CJ - Professional Audio Engineer
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-indigo-900/30 border border-indigo-700/50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-indigo-300 mb-3 flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  Get In Touch
                </h3>
                <p className="text-white mb-2">
                  Ready to elevate your event's audio experience? Contact me at:
                </p>
                <a
                  href="mailto:cj@sounddocs.org"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold text-lg transition-colors"
                >
                  cj@sounddocs.org
                </a>
                <p className="text-gray-300 mt-3">Please include:</p>
                <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                  <li>Event dates and location</li>
                  <li>Type of event (concert, corporate, festival, theater, etc.)</li>
                  <li>Specific role needed (FOH, Monitors, System Tech, RF, etc.)</li>
                  <li>Venue size and expected attendance</li>
                  <li>Equipment details if available</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-indigo-400" />
                  Skills & Services
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {skills.map((skill, index) => {
                    const Icon = skill.icon;
                    return (
                      <div
                        key={index}
                        className="flex items-start p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                      >
                        <Icon className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-200 text-sm">{skill.text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-indigo-400" />
                  Availability
                </h3>
                <p className="text-gray-300">
                  Available for events worldwide. Based in the United States with extensive touring
                  experience. Passport ready for international events.
                </p>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-400" />
                  Booking Information
                </h3>
                <p className="text-gray-300">
                  For the best chance of securing your dates, please reach out as early as possible.
                  I work with a production company full time, and my schedule fills up quickly
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HireCJModal;

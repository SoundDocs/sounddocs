import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  Headphones,
  Music,
  Bookmark,
  Calendar,
  Mic,
  ChevronsRight,
  Github,
  Heart,
  ListChecks, // Added for Run of Show example
  CalendarClock, // Added for Production Schedule example
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const Hero: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Set current date
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };
    setCurrentDate(today.toLocaleDateString(undefined, options));

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <section className="pt-32 pb-20 px-4 min-h-screen flex items-center bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 md:pr-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Pro Audio & Event <span className="text-indigo-400">Documentation, Simplified</span>
            </h1>

            <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
              The ultimate tool for event professionals to create, organize, and share
              <span className="text-indigo-300 font-medium">
                {" "}
                patch lists, stage plots, run of shows, production schedules,{" "}
              </span>
              and more for live events and studio sessions. 100% free and open source.
            </p>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {user ? (
                <Link
                  to="/dashboard"
                  className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-medium transition-all duration-200 text-center flex items-center justify-center"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <Link
                  to="/signup"
                  className="btn-primary bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-md font-medium transition-all duration-200 text-center flex items-center justify-center"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              )}
              <Link
                to="/login"
                className="bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-md font-medium transition-all duration-200 text-center"
              >
                Log In
              </Link>
            </div>

            <div className="flex items-center space-x-6">
              <a
                href="https://github.com/SoundDocs/sounddocs"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors duration-200"
              >
                <Github className="h-5 w-5 mr-2" />
                <span>Open source on GitHub</span>
              </a>
              <a
                href="https://buy.stripe.com/7sIaFxgFu7ulawEbIJ"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-pink-400 hover:text-pink-300 transition-colors duration-200"
              >
                <Heart className="h-5 w-5 mr-2" />
                <span>Support the Project</span>
              </a>
            </div>
          </div>

          {/* Visual representation - could be a carousel or a more abstract design later */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl transition-all duration-300 relative overflow-hidden">
            <div className="absolute -right-20 -top-20 w-40 h-40 bg-indigo-500 opacity-20 rounded-full blur-2xl"></div>
            <div className="absolute -left-20 -bottom-20 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-2xl"></div>

            <div
              className="relative mb-6 flex justify-between items-center pb-4"
              style={{ borderBottom: "2px solid rgba(99, 102, 241, 0.4)" }}
            >
              <div className="flex items-center">
                <div className="p-2 rounded-lg mr-3 bg-indigo-600 shadow-lg">
                  {/* Cycle through icons or use a generic one */}
                  <Bookmark className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Event Documentation</h2>
                  <p className="text-indigo-400 text-sm">Patch Lists, Stage Plots & More</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-gray-300 text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>{currentDate}</span>
                </div>
              </div>
            </div>

            {/* Simplified representation of different document types */}
            <div className="space-y-4">
              <div className="bg-gray-850 rounded-lg p-3 border border-gray-700/50 flex items-center">
                <Mic className="text-indigo-400 mr-3 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold text-sm">Detailed Patch Sheets</h3>
                  <p className="text-gray-400 text-xs">Input/output mapping, mics, notes.</p>
                </div>
              </div>
              <div className="bg-gray-850 rounded-lg p-3 border border-gray-700/50 flex items-center">
                <Music className="text-indigo-400 mr-3 h-5 w-5 flex-shrink-0" />{" "}
                {/* Using Music icon for Stage Plot */}
                <div>
                  <h3 className="text-white font-semibold text-sm">Visual Stage Plots</h3>
                  <p className="text-gray-400 text-xs">Instrument placement, monitor setup.</p>
                </div>
              </div>
              <div className="bg-gray-850 rounded-lg p-3 border border-gray-700/50 flex items-center">
                <ListChecks className="text-indigo-400 mr-3 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold text-sm">Run of Shows & Cues</h3>
                  <p className="text-gray-400 text-xs">Event timelines, show mode ready.</p>
                </div>
              </div>
              <div className="bg-gray-850 rounded-lg p-3 border border-gray-700/50 flex items-center">
                <CalendarClock className="text-indigo-400 mr-3 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold text-sm">Production Schedules</h3>
                  <p className="text-gray-400 text-xs">Task management, deadlines.</p>
                </div>
              </div>
              <div className="bg-gray-850 rounded-lg p-3 border border-gray-700/50 flex items-center">
                <Headphones className="text-indigo-400 mr-3 h-5 w-5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold text-sm">AcoustIQ Audio Analyzer</h3>
                  <p className="text-gray-400 text-xs">
                    The first professional, browser-based FFT audio analyzer.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-gray-700/30 flex justify-between items-center">
              <div className="flex items-center">
                <Bookmark className="h-4 w-4 text-indigo-400 mr-2" />
                <span className="text-indigo-400 text-xs font-medium">SoundDocs</span>
              </div>
              <span className="text-gray-400 text-xs">All-in-One Documentation</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

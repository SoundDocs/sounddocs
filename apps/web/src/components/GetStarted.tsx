import React from "react";
import { ChevronRight, Zap, ArrowLeftCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

const GetStarted: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isBeta, setIsBeta] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Check hostname
    if (typeof window !== "undefined") {
      setIsBeta(window.location.hostname === "beta.sounddocs.org");
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isBeta) {
    return (
      <section id="beta-info" className="py-20 bg-gradient-to-b from-gray-900 to-gray-950 px-4">
        <div className="container mx-auto text-center">
          <div className="bg-sky-800/70 backdrop-blur-sm p-8 rounded-xl max-w-2xl mx-auto border border-sky-700 shadow-lg">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-sky-600/20 rounded-full text-sky-300">
                <Zap className="h-8 w-8" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              You're on the Beta Version!
            </h2>
            <p className="text-gray-300 max-w-xl mx-auto text-lg mb-8">
              You're currently experiencing the latest updates and features on SoundDocs Beta.
            </p>
            <a
              href="https://sounddocs.org"
              className="inline-flex items-center bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-md font-medium transition-all duration-200 text-lg shadow-md hover:shadow-lg"
            >
              <ArrowLeftCircle className="mr-2 h-5 w-5" />
              Switch to Stable Site
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="get-started" className="py-20 bg-gradient-to-b from-gray-900 to-gray-950 px-4">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 mt-8">
          Ready to Simplify Your Documentation?
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-lg mb-10">
          Start creating professional patch lists and stage plots with SoundDocs.
        </p>

        <div className="bg-gray-800/70 backdrop-blur-sm p-8 rounded-xl max-w-3xl mx-auto border border-gray-700 mb-12 shadow-lg hover:shadow-xl transition-all duration-300 hover:border-indigo-500/30">
          <div className="flex flex-col items-center justify-center space-y-6">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-md font-medium transition-all duration-200 text-xl shadow-md hover:shadow-lg"
              >
                Go to Dashboard
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-md font-medium transition-all duration-200 text-xl shadow-md hover:shadow-lg"
                >
                  Get Started Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
                <p className="text-gray-400">
                  Already have an account?{" "}
                  <Link to="/login" className="text-indigo-400 hover:text-indigo-300">
                    Log in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>

        {/* "Try the Beta" button section - this will only show on sounddocs.org */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-md p-8 rounded-xl border border-teal-500/30 shadow-lg hover:shadow-teal-500/20 transition-all duration-300 hover:border-teal-500/50">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-teal-600/20 rounded-full text-teal-400">
                <Zap className="h-8 w-8" />
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">Want a Sneak Peek?</h3>
            <p className="text-gray-400 max-w-lg mx-auto mt-2 mb-6 text-md">
              Try out the beta version. Get early access to new features and help shape the future
              of SoundDocs!
            </p>
            <a
              href="https://beta.sounddocs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 rounded-md font-medium transition-all duration-200 text-lg shadow-md hover:shadow-lg"
            >
              Try the Beta Version
              <ChevronRight className="ml-2 h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetStarted;

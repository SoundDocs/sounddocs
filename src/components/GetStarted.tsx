import React from "react";
import { Bookmark, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

const GetStarted: React.FC = () => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };

    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <section id="get-started" className="py-20 bg-gradient-to-b from-gray-900 to-gray-950 px-4">
      <div className="container mx-auto text-center">
        <div className="bg-gradient-to-r from-indigo-600/20 via-indigo-400/20 to-indigo-600/20 p-1 rounded-3xl mb-8 max-w-md mx-auto">
          <div className="bg-gray-850/80 p-6 rounded-3xl flex items-center justify-center">
            <Bookmark className="h-16 w-16 text-indigo-400" />
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
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
      </div>
    </section>
  );
};

export default GetStarted;

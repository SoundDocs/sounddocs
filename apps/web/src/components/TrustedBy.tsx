import React, { useEffect, useState } from "react";
import { Users, Building2, Briefcase, Radio, Globe } from "lucide-react";
import { fetchUserCount } from "../lib/supabase";

const TrustedBy: React.FC = () => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [displayCount, setDisplayCount] = useState<number>(0);

  useEffect(() => {
    const loadUserCount = async () => {
      const count = await fetchUserCount();
      if (count !== null) {
        setUserCount(count);
      }
    };

    loadUserCount();
  }, []);

  // Animated counter effect using requestAnimationFrame for smoother animation
  useEffect(() => {
    if (userCount === null) return;

    const duration = 2000; // 2 seconds
    let animationFrameId: number;
    let startTime: number | undefined;

    const animate = (timestamp: number) => {
      if (startTime === undefined) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentDisplayCount = Math.floor(progress * userCount);

      setDisplayCount(currentDisplayCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [userCount]);

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <section className="py-20 bg-gray-850 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Production Companies & Event Professionals{" "}
            <span className="text-indigo-400">Worldwide</span>
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto text-lg">
            Join thousands of professionals who rely on SoundDocs for their event documentation
            needs
          </p>
        </div>

        {/* User Count Stat */}
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 backdrop-blur-sm p-8 rounded-xl border border-indigo-500/30 text-center">
            <div className="flex items-center justify-center mb-4">
              <Globe className="h-12 w-12 text-indigo-400" />
            </div>
            <div className="text-5xl md:text-6xl font-bold text-white mb-2">
              {userCount !== null ? `${formatNumber(displayCount)}+` : "Loading..."}
            </div>
            <p className="text-xl text-gray-300">
              Event Professionals and Production Companies Worldwide
            </p>
          </div>
        </div>

        {/* Use Cases Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-600/20 rounded-lg">
                <Building2 className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
            <h3 className="text-white font-semibold mb-2">Production Companies</h3>
            <p className="text-gray-400 text-sm">
              National tours, regional events, and multi-venue productions
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-600/20 rounded-lg">
                <Briefcase className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
            <h3 className="text-white font-semibold mb-2">Corporate Events</h3>
            <p className="text-gray-400 text-sm">
              Conferences, trade shows, and corporate presentations
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-600/20 rounded-lg">
                <Radio className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
            <h3 className="text-white font-semibold mb-2">Broadcast & Theater</h3>
            <p className="text-gray-400 text-sm">
              Live broadcasts, theatrical productions, and studio sessions
            </p>
          </div>

          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 text-center hover:border-indigo-500/30 transition-all duration-300">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-indigo-600/20 rounded-lg">
                <Users className="h-8 w-8 text-indigo-400" />
              </div>
            </div>
            <h3 className="text-white font-semibold mb-2">Freelancers</h3>
            <p className="text-gray-400 text-sm">
              Independent engineers, designers, and production professionals
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;

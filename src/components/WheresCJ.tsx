import React, { useState, useEffect } from "react";
import { MapPin, Loader2, WifiOff } from "lucide-react";
import { fetchCurrentCJLocation } from "../lib/supabase";

interface LocationData {
  location_name: string;
  description: string | null;
}

const WheresCJ: React.FC = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const getLocation = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCurrentCJLocation();
        setLocation(data);
      } catch (error) {
        console.error("Failed to fetch CJ's location:", error);
        setLocation(null);
      } finally {
        setIsLoading(false);
      }
    };

    getLocation();
  }, []);

  const PopoverContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
        </div>
      );
    }

    if (!location) {
      return (
        <div className="p-4 text-center">
          <WifiOff className="h-8 w-8 mx-auto mb-2 text-gray-500" />
          <h3 className="font-bold text-white mb-1">Off The Grid</h3>
          <p className="text-sm text-gray-400">
            CJ is currently unavailable. Check back later!
          </p>
        </div>
      );
    }

    return (
      <div className="p-4">
        <h3 className="font-bold text-white mb-2 text-lg border-b border-gray-700 pb-2">
          Where's CJ?
        </h3>
        <div className="flex items-start mt-3">
          <MapPin className="h-5 w-5 text-indigo-400 mr-3 mt-1 flex-shrink-0" />
          <div>
            <p className="font-semibold text-white">{location.location_name}</p>
            {location.description && (
              <p className="text-sm text-gray-300 mt-1 italic">
                "{location.description}"
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-700">
          <p className="text-xs text-center text-indigo-300 bg-indigo-900/50 rounded-md p-2">
            Find me and say hi to get some exclusive SoundDocs stickers!
          </p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/80 text-indigo-400 hover:text-indigo-300 transition-all duration-200 cursor-pointer">
        <MapPin className="h-5 w-5" />
      </div>

      {isHovered && (
        <div
          className="absolute bottom-full right-0 mb-3 w-72 bg-gray-950/90 backdrop-blur-lg border border-gray-700 rounded-lg shadow-2xl shadow-indigo-900/20 z-50"
          style={{ animation: "fadeInUp 0.3s ease-out forwards" }}
        >
          <PopoverContent />
        </div>
      )}
    </div>
  );
};

export default WheresCJ;

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSharedResource, SharedLink } from "../lib/shareUtils";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RiderExport from "../components/rider/RiderExport";
import { RiderForExport } from "../lib/types";
import { Loader, AlertTriangle, Share2 } from "lucide-react";

const SharedTechnicalRider: React.FC = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const [rider, setRider] = useState<RiderForExport | null>(null);
  const [shareLinkInfo, setShareLinkInfo] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSharedRider = async () => {
      if (!shareCode) {
        setError("Share code is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const { resource, shareLink } = await getSharedResource(shareCode);

        if (shareLink.resource_type !== "technical_rider") {
          throw new Error("Invalid resource type for this share link.");
        }

        const riderData = {
          ...resource,
          band_members: resource.band_members || [],
          input_list: resource.input_list || [],
          backline_requirements: resource.backline_requirements || [],
          artist_provided_gear: resource.artist_provided_gear || [],
          required_staff: resource.required_staff || [],
        } as RiderForExport;

        setRider(riderData);
        setShareLinkInfo(shareLink);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to load shared technical rider.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedRider();
  }, [shareCode, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin mb-4" />
        <p className="text-lg text-gray-300">Loading Shared Technical Rider...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 mt-24">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied or Error</h1>
          <p className="text-lg text-red-400 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  if (!rider) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 mt-24">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Technical Rider Not Found</h1>
          <p className="text-lg text-gray-400 mb-6">
            The requested technical rider could not be loaded.
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
          >
            Go to Homepage
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-2 py-8 sm:px-4 mt-24">
        <div className="bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 pb-4 border-b border-gray-700">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{rider.name}</h1>
              <p className="text-sm text-indigo-400 flex items-center mt-1">
                <Share2 className="h-4 w-4 mr-2" /> Shared for viewing
              </p>
            </div>
            {shareLinkInfo && shareLinkInfo.expires_at && (
              <p className="text-xs text-yellow-400 mt-2 sm:mt-0">
                Link expires on: {new Date(shareLinkInfo.expires_at).toLocaleDateString()}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-400 mb-6">
            This is a shared, view-only version of a technical rider.
          </p>
        </div>
        <div className="bg-slate-900 p-0 sm:p-0 rounded-lg shadow-lg overflow-x-auto">
          <RiderExport ref={exportRef} rider={rider} forDisplay={true} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SharedTechnicalRider;

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import {
  Bookmark,
  Share2,
  ExternalLink,
  Edit,
  AlertTriangle,
  Info,
  Calendar,
  Clock,
} from "lucide-react";
import { getSharedResource } from "../lib/shareUtils";
import StageElementStatic from "../components/stage-plot/StageElementStatic";

// Empty Header component for shared views
const SharedHeader = ({ docName }: { docName: string }) => (
  <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 shadow-md backdrop-blur-sm">
    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Bookmark className="h-8 w-8 text-indigo-400" />
        <span className="text-white text-xl font-bold">SoundDocs</span>
      </div>
      <div className="flex items-center">
        <span className="text-gray-300 mr-2 hidden sm:inline">Viewing:</span>
        <span className="text-white font-medium truncate max-w-[200px]">{docName}</span>
      </div>
    </div>
  </header>
);

const SharedStagePlot = () => {
  const { shareCode } = useParams<{ shareCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stagePlot, setStagePlot] = useState<any | null>(null);
  const [shareLink, setShareLink] = useState<any | null>(null);
  const [expiryDays, setExpiryDays] = useState<number | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadSharedStagePlot = async () => {
      if (!shareCode) {
        setError("Invalid share code");
        setLoading(false);
        return;
      }

      try {
        const { resource, shareLink } = await getSharedResource(shareCode);
        setStagePlot(resource);
        setShareLink(shareLink);

        // Calculate days until expiry if applicable
        if (shareLink.expires_at) {
          const expiryDate = new Date(shareLink.expires_at);
          const now = new Date();
          const diffTime = expiryDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setExpiryDays(diffDays > 0 ? diffDays : 0);
        }
      } catch (error: any) {
        console.error("Error loading shared stage plot:", error);
        setError(error.message || "Failed to load shared stage plot");
      } finally {
        setLoading(false);
      }
    };

    loadSharedStagePlot();
  }, [shareCode]);

  const handleEditRedirect = () => {
    // If this is an edit link, redirect to the editor
    if (shareLink?.link_type === "edit") {
      window.location.href = `https://sounddocs.org/shared/stage-plot/edit/${shareCode}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error || !stagePlot) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Error Loading Document</h1>
        <p className="text-gray-300 mb-6">{error || "This shared document could not be loaded"}</p>
        <button
          onClick={() => (window.location.href = "https://sounddocs.org/")}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  // Safely get stage size
  const stageSize =
    stagePlot.stage_size && stagePlot.stage_size.includes("-")
      ? stagePlot.stage_size
      : `${stagePlot.stage_size || "medium"}-wide`;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Helmet>
        <title>{stagePlot.name} | Shared Stage Plot - SoundDocs</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <SharedHeader docName={stagePlot.name} />

      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        {/* Sharing Info Banner */}
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4 mb-6 flex items-start">
          <Info className="h-5 w-5 text-indigo-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-indigo-300 text-sm">
              <span className="font-medium">Shared document:</span> You are viewing a shared stage
              plot.
              {shareLink?.link_type === "edit" && " You have edit permissions for this document."}
            </p>
            {expiryDays !== null && (
              <p className="text-indigo-300 text-sm mt-1">
                <Clock className="h-3.5 w-3.5 inline mr-1" />
                {expiryDays > 0
                  ? `This shared link expires in ${expiryDays} day${expiryDays !== 1 ? "s" : ""}`
                  : "This shared link has expired"}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{stagePlot.name}</h1>
            <div className="flex items-center text-gray-400 text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                Last edited:{" "}
                {new Date(stagePlot.last_edited || stagePlot.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            {shareLink?.link_type === "edit" && (
              <button
                onClick={handleEditRedirect}
                className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm"
              >
                <Edit className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edit Document</span>
                <span className="sm:hidden">Edit</span>
              </button>
            )}
            <button
              onClick={() => (window.location.href = "https://sounddocs.org/")}
              className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm"
            >
              <ExternalLink className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">SoundDocs Home</span>
              <span className="sm:hidden">Home</span>
            </button>
          </div>
        </div>

        {/* Stage plot container */}
        <div className="bg-gray-850 rounded-xl shadow-xl overflow-hidden mb-8 max-w-full">
          <div className="p-4 bg-gray-800 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Stage Plot Viewer</h2>
          </div>
          <div className="p-4 overflow-auto max-h-[80vh]" ref={canvasRef}>
            <div className="flex justify-center flex-col items-center">
              {/* Back of stage label - OUTSIDE THE STAGE */}
              <div className="mb-2">
                <div className="bg-gray-800/80 text-white text-sm px-4 py-1.5 rounded-full shadow-md">
                  Back of Stage
                </div>
              </div>

              <div
                className="relative bg-grid-pattern overflow-hidden"
                style={{
                  // Use same dimensions as the actual editor
                  width: getStageDimensions(stageSize).width,
                  height: getStageDimensions(stageSize).height,
                  backgroundSize: "20px 20px",
                  backgroundColor: "#1a202c",
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                  borderRadius: "4px",
                  border: "1px solid rgba(75, 85, 99, 0.5)",
                }}
              >
                {/* Background image if present */}
                {stagePlot.backgroundImage && (
                  <div
                    className="absolute inset-0 bg-center bg-no-repeat bg-contain pointer-events-none"
                    style={{
                      backgroundImage: `url(${stagePlot.backgroundImage})`,
                      opacity:
                        (stagePlot.backgroundOpacity !== undefined
                          ? stagePlot.backgroundOpacity
                          : 50) / 100,
                      zIndex: 1,
                    }}
                  />
                )}

                {/* Stage elements */}
                {stagePlot.elements &&
                  stagePlot.elements.map((element: any) => (
                    <StageElementStatic
                      key={element.id}
                      id={element.id}
                      type={element.type}
                      label={element.label}
                      x={element.x}
                      y={element.y}
                      rotation={element.rotation}
                      color={element.color}
                      width={element.width}
                      height={element.height}
                    />
                  ))}
              </div>

              {/* Front of stage label - OUTSIDE THE STAGE */}
              <div className="mt-2">
                <div className="bg-gray-800/80 text-white text-sm px-4 py-1.5 rounded-full shadow-md">
                  Front of Stage / Audience
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Sign up banner */}
      <div className="bg-indigo-600 py-6 px-4">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <h3 className="text-lg font-medium text-white">Create Your Own Audio Documentation</h3>
            <p className="text-indigo-200">
              Sign up for free and start creating professional patch sheets and stage plots.
            </p>
          </div>
          <a
            href="https://sounddocs.org/"
            className="inline-flex items-center bg-white text-indigo-700 px-5 py-2 rounded-md font-medium transition-all duration-200 hover:bg-indigo-100"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Get Started for Free
          </a>
        </div>
      </div>

      {/* Footer with attribution */}
      <footer className="bg-gray-950 py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-4 md:mb-0">
            <Bookmark className="h-6 w-6 text-indigo-400 mr-2" />
            <span className="text-white font-bold">SoundDocs</span>
          </div>
          <div className="text-gray-400 text-sm text-center md:text-right">
            <p>{new Date().getFullYear()} SoundDocs.</p>
            <p className="mt-1">Professional audio and event documentation made simple.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Helper function to get stage dimensions
const getStageDimensions = (stageSize: string) => {
  // Using fixed pixel values for consistency
  switch (stageSize) {
    case "x-small-narrow":
      return { width: 300, height: 300 };
    case "x-small-wide":
      return { width: 500, height: 300 };
    case "small-narrow":
      return { width: 400, height: 400 };
    case "small-wide":
      return { width: 600, height: 400 };
    case "medium-narrow":
      return { width: 500, height: 500 };
    case "medium-wide":
      return { width: 800, height: 500 };
    case "large-narrow":
      return { width: 600, height: 600 };
    case "large-wide":
      return { width: 1000, height: 600 };
    case "x-large-narrow":
      return { width: 700, height: 700 };
    case "x-large-wide":
      return { width: 1200, height: 700 };
    default:
      return { width: 800, height: 500 };
  }
};

export default SharedStagePlot;

import React, { useEffect, useState, useRef } from "react";
    import { useParams } from "react-router-dom";
    import { Helmet } from "react-helmet";
    import {
      Share2,
      ExternalLink,
      Edit,
      AlertTriangle,
      Info,
      Calendar,
      Clock,
      Users,
      Mic,
      Drama, // Theater icon
      User,
      Palette, // For element color
      Tv, // For scene numbers
      Scissors, // For wig/hair notes
      Shirt, // For costume notes
      Link as LinkIcon,
    } from "lucide-react";
    import { getSharedResource } from "../lib/shareUtils";
    import { ActorEntry } from "../components/theater-mic-plot/ActorEntryCard"; // Assuming this type is exported

    interface SharedTheaterMicPlotData {
      id: string;
      name: string;
      actors: ActorEntry[]; // Array of actor entries
      created_at: string;
      last_edited: string | null;
      // Add any other fields specific to theater_mic_plots table
    }

    // Empty Header component for shared views
    const SharedHeader = ({ docName }: { docName: string }) => (
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 shadow-md backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Drama className="h-8 w-8 text-purple-400" />
            <span className="text-white text-xl font-bold">SoundDocs</span>
          </div>
          <div className="flex items-center">
            <span className="text-gray-300 mr-2 hidden sm:inline">Viewing:</span>
            <span className="text-white font-medium truncate max-w-[200px]">{docName}</span>
          </div>
        </div>
      </header>
    );

    const SharedTheaterMicPlot = () => {
      const { shareCode } = useParams<{ shareCode: string }>();
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);
      const [micPlot, setMicPlot] = useState<SharedTheaterMicPlotData | null>(null);
      const [shareLinkInfo, setShareLinkInfo] = useState<any | null>(null);
      const [expiryDays, setExpiryDays] = useState<number | null>(null);
      
      const viewerRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        const loadSharedMicPlot = async () => {
          if (!shareCode) {
            setError("Invalid share code");
            setLoading(false);
            return;
          }

          try {
            const { resource, shareLink } = await getSharedResource(shareCode);
            if (shareLink.resource_type !== 'theater_mic_plot') {
              setError("Invalid resource type for this link.");
              setLoading(false);
              return;
            }
            setMicPlot(resource as SharedTheaterMicPlotData);
            setShareLinkInfo(shareLink);

            if (shareLink.expires_at) {
              const expiryDate = new Date(shareLink.expires_at);
              const now = new Date();
              const diffTime = expiryDate.getTime() - now.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              setExpiryDays(diffDays > 0 ? diffDays : 0);
            }
          } catch (error: any) {
            console.error("Error loading shared theater mic plot:", error);
            setError(error.message || "Failed to load shared theater mic plot");
          } finally {
            setLoading(false);
          }
        };

        loadSharedMicPlot();
      }, [shareCode]);

      const handleEditRedirect = () => {
        if (shareLinkInfo?.link_type === "edit" && shareCode) {
          window.location.href = `/shared/theater-mic-plot/edit/${shareCode}`;
        }
      };

      const renderMicPlotContent = () => {
        if (!micPlot) return null;
        const actors = micPlot.actors || [];

        return (
          <div className="theater-mic-plot-display">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="p-3 bg-purple-600 rounded-lg mr-4">
                    <Drama className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{micPlot.name}</h2>
                    <p className="text-purple-400">Theater Mic Plot</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-300 text-sm flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(micPlot.last_edited || micPlot.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {actors.length > 0 ? (
              <div className="space-y-6">
                {actors.map((actor, index) => (
                  <div key={actor.id || index} className="bg-gray-800 rounded-lg p-6 shadow-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
                      {actor.photo_url && (
                        <img
                          src={actor.photo_url}
                          alt={actor.actor_name || 'Actor'}
                          className="w-32 h-32 rounded-md object-cover mr-0 sm:mr-6 mb-4 sm:mb-0 border-2 border-purple-500"
                        />
                      )}
                      {!actor.photo_url && (
                        <div className="w-32 h-32 rounded-md bg-gray-700 flex items-center justify-center mr-0 sm:mr-6 mb-4 sm:mb-0 border-2 border-gray-600">
                          <User className="h-16 w-16 text-gray-500" />
                        </div>
                      )}
                      <div className="flex-grow">
                        <h3 className="text-xl font-semibold text-white mb-1">{actor.actor_name || "Unnamed Actor"}</h3>
                        {actor.character_names && <p className="text-purple-400 text-sm">{actor.character_names}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      {actor.element_channel_number && (
                        <div className="bg-gray-700/50 p-3 rounded-md">
                          <p className="text-gray-400 font-medium flex items-center"><Mic className="h-4 w-4 mr-2 text-purple-400" />Element/Channel</p>
                          <p className="text-white">{actor.element_channel_number}</p>
                        </div>
                      )}
                      {actor.element_color && (
                        <div className="bg-gray-700/50 p-3 rounded-md">
                          <p className="text-gray-400 font-medium flex items-center"><Palette className="h-4 w-4 mr-2 text-purple-400" />Element Color</p>
                          <p className="text-white">{actor.element_color}</p>
                        </div>
                      )}
                      {actor.transmitter_location && (
                        <div className="bg-gray-700/50 p-3 rounded-md">
                          <p className="text-gray-400 font-medium flex items-center"><LinkIcon className="h-4 w-4 mr-2 text-purple-400" />Transmitter Location</p>
                          <p className="text-white">{actor.transmitter_location}</p>
                        </div>
                      )}
                      {actor.element_location && (
                        <div className="bg-gray-700/50 p-3 rounded-md">
                          <p className="text-gray-400 font-medium flex items-center"><Mic className="h-4 w-4 mr-2 text-purple-400" />Element Location</p>
                          <p className="text-white">{actor.element_location}</p>
                        </div>
                      )}
                      {actor.backup_element && (
                        <div className="bg-gray-700/50 p-3 rounded-md">
                          <p className="text-gray-400 font-medium flex items-center"><Mic className="h-4 w-4 mr-2 text-purple-400" />Backup Element</p>
                          <p className="text-white">{actor.backup_element}</p>
                        </div>
                      )}
                       {actor.scene_numbers && (
                        <div className="bg-gray-700/50 p-3 rounded-md">
                          <p className="text-gray-400 font-medium flex items-center"><Tv className="h-4 w-4 mr-2 text-purple-400" />Scene Numbers</p>
                          <p className="text-white">{actor.scene_numbers}</p>
                        </div>
                      )}
                    </div>
                    {actor.costume_notes && (
                      <div className="mt-4 bg-gray-700/50 p-3 rounded-md">
                        <p className="text-gray-400 font-medium flex items-center"><Shirt className="h-4 w-4 mr-2 text-purple-400" />Costume Notes</p>
                        <p className="text-white whitespace-pre-wrap">{actor.costume_notes}</p>
                      </div>
                    )}
                    {actor.wig_hair_notes && (
                      <div className="mt-4 bg-gray-700/50 p-3 rounded-md">
                        <p className="text-gray-400 font-medium flex items-center"><Scissors className="h-4 w-4 mr-2 text-purple-400" />Wig/Hair Notes</p>
                        <p className="text-white whitespace-pre-wrap">{actor.wig_hair_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-800 rounded-lg">
                <Users size={48} className="mx-auto text-gray-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-300">No Actors in this Mic Plot</h3>
                <p className="text-sm text-gray-400">This theater mic plot currently has no actors listed.</p>
              </div>
            )}
          </div>
        );
      };

      if (loading) {
        return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        );
      }

      if (error || !micPlot) {
        return (
          <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Error Loading Document</h1>
            <p className="text-gray-300 mb-6">{error || "This shared document could not be loaded"}</p>
            <button
              onClick={() => (window.location.href = "https://sounddocs.org/")}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
            >
              Go to Homepage
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-gray-900 flex flex-col">
          <Helmet>
            <title>{micPlot.name} | Shared Theater Mic Plot - SoundDocs</title>
            <meta name="robots" content="noindex" />
          </Helmet>

          <SharedHeader docName={micPlot.name} />

          <main className="flex-grow container mx-auto px-4 py-12 mt-16">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6 flex items-start">
              <Info className="h-5 w-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-purple-300 text-sm">
                  <span className="font-medium">Shared document:</span> You are viewing a shared theater mic plot.
                  {shareLinkInfo?.link_type === "edit" && " You have edit permissions for this document."}
                </p>
                {expiryDays !== null && (
                  <p className="text-purple-300 text-sm mt-1">
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
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">{micPlot.name}</h1>
                <div className="flex items-center text-gray-400 text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>
                    Last edited:{" "}
                    {new Date(micPlot.last_edited || micPlot.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                {shareLinkInfo?.link_type === "edit" && (
                  <button
                    onClick={handleEditRedirect}
                    className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-3 sm:px-4 py-2 rounded-md font-medium transition-all duration-200 text-sm"
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

            <div className="bg-gray-850 rounded-xl shadow-xl overflow-hidden mb-8 max-w-full">
              <div className="p-4 bg-gray-800">
                <h2 className="text-xl font-semibold text-white">Theater Mic Plot Viewer</h2>
              </div>
              <div className="p-4 md:p-6 overflow-auto max-h-[80vh]" ref={viewerRef}>
                {renderMicPlotContent()}
              </div>
            </div>
          </main>

          <div className="bg-purple-600 py-6 px-4">
            <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
              <div className="mb-4 sm:mb-0">
                <h3 className="text-lg font-medium text-white">Create Your Own Audio Documentation</h3>
                <p className="text-purple-200">
                  Sign up for free and start creating professional mic plots, patch sheets, and more.
                </p>
              </div>
              <a
                href="https://sounddocs.org/"
                className="inline-flex items-center bg-white text-purple-700 px-5 py-2 rounded-md font-medium transition-all duration-200 hover:bg-purple-100"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Get Started for Free
              </a>
            </div>
          </div>

          <footer className="bg-gray-950 py-6 px-4">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <Drama className="h-6 w-6 text-purple-400 mr-2" />
                <span className="text-white font-bold">SoundDocs</span>
              </div>
              <div className="text-gray-400 text-sm text-center md:text-right">
                <p>&copy; {new Date().getFullYear()} SoundDocs.</p>
                <p className="mt-1">Professional audio and event documentation made simple.</p>
              </div>
            </div>
          </footer>
        </div>
      );
    };

    export default SharedTheaterMicPlot;

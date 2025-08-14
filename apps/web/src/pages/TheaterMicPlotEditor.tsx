import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ActorEntryCard, { ActorEntry } from "../components/theater-mic-plot/ActorEntryCard";
import {
  Loader,
  ArrowLeft,
  Save,
  PlusCircle,
  AlertCircle,
  Users,
  Drama,
  Share2,
} from "lucide-react";
import {
  getSharedResource,
  updateSharedResource,
  verifyShareLink,
  SharedLink,
} from "../lib/shareUtils"; // Import share utilities

interface TheaterMicPlot {
  id: string;
  user_id?: string; // Optional for shared edits where user_id might not be the current user
  name: string;
  created_at: string;
  last_edited: string;
  actors: ActorEntry[];
}

const TheaterMicPlotEditor: React.FC = () => {
  const { id: routeId, shareCode } = useParams<{ id?: string; shareCode?: string }>(); // id can be 'new' or actual id, shareCode for shared edits
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [micPlot, setMicPlot] = useState<TheaterMicPlot | null>(null);
  const [user, setUser] = useState<any>(null); // Current authenticated user
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [sharedLinkInfo, setSharedLinkInfo] = useState<SharedLink | null>(null);

  useEffect(() => {
    const initializeEditor = async () => {
      setLoading(true);
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser); // Set current user regardless of shared or owned

      if (shareCode) {
        // Handling shared edit link
        setIsSharedEdit(true);
        try {
          const { resource, shareLink } = await getSharedResource(shareCode);
          if (shareLink.resource_type !== "theater_mic_plot" || shareLink.link_type !== "edit") {
            setSaveError("Invalid or unauthorized share link for editing.");
            setLoading(false);
            return;
          }
          setMicPlot(resource as TheaterMicPlot);
          setSharedLinkInfo(shareLink);
        } catch (error: any) {
          console.error("Error loading shared theater mic plot for editing:", error);
          setSaveError(error.message || "Failed to load shared document for editing.");
        } finally {
          setLoading(false);
        }
      } else {
        // Handling owned document or new document
        setIsSharedEdit(false);
        if (!currentUser) {
          navigate("/login", { state: { from: location.pathname } });
          return;
        }
        if (routeId === "new") {
          setMicPlot({
            id: uuidv4(),
            user_id: currentUser.id,
            name: "Untitled Theater Mic Plot",
            created_at: new Date().toISOString(),
            last_edited: new Date().toISOString(),
            actors: [],
          });
          setLoading(false);
        } else if (routeId) {
          try {
            const { data, error } = await supabase
              .from("theater_mic_plots")
              .select("*")
              .eq("id", routeId)
              .eq("user_id", currentUser.id) // Ensure ownership for direct edits
              .single();

            if (error && error.code !== "PGRST116") throw error; // PGRST116: single row not found
            if (data) {
              setMicPlot(data as TheaterMicPlot);
            } else {
              // If not found under user_id, it might be an old link or an attempt to access non-owned.
              // For this path (non-shareCode), we assume it should be owned.
              navigate("/audio", {
                replace: true,
                state: { error: "Theater mic plot not found or access denied." },
              });
            }
          } catch (error) {
            console.error("Error fetching theater mic plot:", error);
            navigate("/audio", {
              replace: true,
              state: { error: "Failed to load theater mic plot." },
            });
          } finally {
            setLoading(false);
          }
        }
      }
    };
    initializeEditor();
  }, [routeId, shareCode, navigate, location.pathname]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (micPlot) setMicPlot({ ...micPlot, name: e.target.value });
  };

  const handleAddActor = () => {
    if (micPlot) {
      const newActor: ActorEntry = {
        id: uuidv4(),
        photo_url: null,
        actor_name: "",
        character_names: "",
        element_channel_number: "",
        element_color: "",
        transmitter_location: "",
        element_location: "",
        backup_element: "",
        scene_numbers: "",
        costume_notes: "",
        wig_hair_notes: "",
      };
      setMicPlot({ ...micPlot, actors: [...micPlot.actors, newActor] });
    }
  };

  const handleUpdateActor = (id: string, field: keyof ActorEntry, value: any) => {
    if (micPlot) {
      setMicPlot({
        ...micPlot,
        actors: micPlot.actors.map((a) => (a.id === id ? { ...a, [field]: value } : a)),
      });
    }
  };

  const handleDeleteActor = (id: string) => {
    if (micPlot) {
      setMicPlot({ ...micPlot, actors: micPlot.actors.filter((a) => a.id !== id) });
    }
  };

  const handleSave = async () => {
    if (!micPlot) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const dataToSave = { ...micPlot, last_edited: new Date().toISOString() };
    // Remove user_id if it's a shared edit, as updateSharedResource handles context
    if (isSharedEdit) {
      delete dataToSave.user_id;
    } else if (user) {
      dataToSave.user_id = user.id;
    }

    try {
      if (isSharedEdit && shareCode) {
        const updatedResource = await updateSharedResource(
          shareCode,
          "theater_mic_plot",
          dataToSave,
        );
        setMicPlot(updatedResource as TheaterMicPlot);
      } else if (user) {
        // Standard save for owned document
        if (routeId === "new") {
          const { data, error } = await supabase
            .from("theater_mic_plots")
            .insert(dataToSave)
            .select()
            .single();
          if (error) throw error;
          if (data) {
            navigate(`/theater-mic-plot/${data.id}`, { replace: true, state: location.state });
            setMicPlot(data as TheaterMicPlot);
          }
        } else {
          const { data, error } = await supabase
            .from("theater_mic_plots")
            .update(dataToSave)
            .eq("id", micPlot.id)
            .eq("user_id", user.id)
            .select()
            .single();
          if (error) throw error;
          if (data) setMicPlot(data as TheaterMicPlot);
        }
      } else {
        throw new Error("Cannot save: User not authenticated or invalid context.");
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Error saving theater mic plot:", error);
      setSaveError(`Failed to save: ${error.message}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const handleBackNavigation = () => {
    if (isSharedEdit && shareCode) {
      navigate(`/shared/theater-mic-plot/${shareCode}`); // Go back to shared view
    } else {
      const fromPath = location.state?.from as string | undefined;
      navigate(fromPath || "/audio");
    }
  };

  if (loading || !micPlot) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  // If it's a shared edit and there's no current user, but we have sharedLinkInfo, allow editing.
  // Otherwise, if not sharedEdit and no user, it's an error (handled in useEffect).
  if (!isSharedEdit && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-red-500">Authentication required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={!isSharedEdit} /> {/* Show dashboard header only if not shared edit */}
      {isSharedEdit && (
        <div className="fixed top-0 left-0 right-0 z-40 bg-gray-900/95 shadow-md backdrop-blur-sm py-3">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Drama className="h-7 w-7 text-purple-400" />
              <span className="text-white text-lg font-bold">SoundDocs</span>
            </div>
            <div className="text-sm text-purple-300">Editing Shared Document</div>
          </div>
        </div>
      )}
      <main
        className={`flex-grow container mx-auto px-4 py-6 md:py-12 ${isSharedEdit ? "mt-20 md:mt-20" : "mt-16 md:mt-12"}`}
      >
        {isSharedEdit && sharedLinkInfo && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-6 flex items-start">
            <Share2 className="h-5 w-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-purple-300 text-sm">
                You are editing a shared Theater Mic Plot. Changes will be saved to the shared
                version.
              </p>
              {sharedLinkInfo.expires_at && (
                <p className="text-purple-300 text-xs mt-1">
                  Link expires: {new Date(sharedLinkInfo.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
          <div className="flex items-center flex-grow min-w-0">
            <button
              onClick={handleBackNavigation}
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-grow min-w-0">
              <input
                type="text"
                value={micPlot.name}
                onChange={handleNameChange}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                placeholder="Enter Theater Mic Plot Name"
              />
              <p className="text-xs sm:text-sm text-gray-400 truncate">
                Last edited: {new Date(micPlot.last_edited).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 fixed bottom-4 right-4 z-20 md:static md:z-auto sm:ml-auto flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg md:shadow-none"
            >
              {saving ? (
                <Loader className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {saving ? "Saving..." : "Save Plot"}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        )}
        {saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start">
            <Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-400 text-sm">Theater mic plot saved successfully!</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg p-4 md:p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <Drama className="h-6 w-6 mr-3 text-purple-400" />
              <h2 className="text-xl font-semibold text-white">Actors & Microphones</h2>
            </div>
            <button
              onClick={handleAddActor}
              className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors text-sm"
            >
              <PlusCircle className="h-5 w-5 mr-2" /> Add Actor
            </button>
          </div>

          {micPlot.actors.length === 0 && (
            <div className="text-center py-10 bg-gray-700/50 rounded-lg">
              <Users size={48} className="mx-auto text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-300">No Actors Added Yet</h3>
              <p className="text-sm text-gray-400 mb-4">Click "Add Actor" to get started.</p>
            </div>
          )}

          {micPlot.actors.map((entry) => (
            <ActorEntryCard
              key={entry.id}
              entry={entry}
              onUpdate={handleUpdateActor}
              onDelete={handleDeleteActor}
            />
          ))}
        </div>

        <div className="flex justify-center py-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg text-base"
          >
            {saving ? (
              <Loader className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            {saving ? "Saving Mic Plot..." : "Save Mic Plot"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TheaterMicPlotEditor;

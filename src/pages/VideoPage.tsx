import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  Grid,
  PlusCircle,
  ArrowLeftCircle,
  Loader,
  Edit,
  Trash2,
  List,
  AlertTriangle,
  Info,
} from "lucide-react";
import { supabase } from "../lib/supabase";

interface PixelMap {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  map_type: 'standard' | 'led';
}

const VideoPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pixelMaps, setPixelMaps] = useState<PixelMap[]>([]);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (data.user) {
          setUser(data.user);
          await fetchPixelMaps(data.user.id);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setSupabaseError(
          "Failed to connect to Supabase. Please check your configuration."
        );
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUserAndFetchData();
  }, [navigate]);

  const fetchPixelMaps = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("pixel_maps")
        .select("id, project_name, created_at, last_edited, map_type")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) {
        const formattedData = data.map((item) => ({
          ...item,
          name: item.project_name,
        }));
        setPixelMaps(formattedData as PixelMap[]);
      }
    } catch (error) {
      console.error("Error fetching pixel maps:", error);
      setSupabaseError("Failed to fetch pixel maps.");
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleCreatePixelMap = () => {
    navigate("/pixel-map/new", { state: { from: "/video" } });
  };

  const handleEditPixelMap = (id: string) => {
    const map = pixelMaps.find((m) => m.id === id);
    if (map) {
      const from = { state: { from: "/video" } };
      if (map.map_type === 'led') {
        navigate(`/pixel-map/led/${id}`, from);
      } else {
        navigate(`/pixel-map/standard/${id}`, from);
      }
    }
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDocumentToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      const { error } = await supabase
        .from("pixel_maps")
        .delete()
        .eq("id", documentToDelete.id);
      if (error) throw error;
      setPixelMaps(pixelMaps.filter((item) => item.id !== documentToDelete.id));
    } catch (error) {
      console.error("Error deleting document:", error);
      setSupabaseError("Failed to delete pixel map. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onSignOut={handleSignOut} />

      {supabaseError && (
        <div className="bg-red-500 text-white px-4 py-3 shadow-sm">
          <div className="container mx-auto flex items-center">
            <Info className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{supabaseError}</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4 group"
          >
            <ArrowLeftCircle className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">
            Video Documents
          </h1>
          <p className="text-lg text-gray-300">
            Manage your pixel maps and other video-related documents.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 w-full md:max-w-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  My Pixel Maps
                </h2>
                <p className="text-gray-400">
                  Design and manage your LED wall pixel maps
                </p>
              </div>
              <Grid className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="space-y-4">
              {pixelMaps.length > 0 ? (
                <div className="space-y-3">
                  {pixelMaps.slice(0, 3).map((map) => (
                    <div
                      key={map.id}
                      className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h3 className="text-white font-medium">{map.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {map.last_edited
                            ? `Edited ${new Date(
                                map.last_edited
                              ).toLocaleDateString()}`
                            : `Created ${new Date(
                                map.created_at
                              ).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Edit"
                          onClick={() => handleEditPixelMap(map.id)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-400"
                          title="Delete"
                          onClick={() => handleDeleteRequest(map.id, map.name)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">
                    You haven't created any pixel maps yet
                  </p>
                </div>
              )}
              <div className="pt-3 text-center">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-center">
                  <button
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={handleCreatePixelMap}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Pixel Map
                  </button>
                  {pixelMaps.length > 0 && (
                    <button
                      className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                      onClick={() => navigate("/all-pixel-maps")}
                    >
                      <List className="h-5 w-5 mr-2" />
                      View All ({pixelMaps.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showDeleteConfirm && documentToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle
                  className="h-6 w-6 text-red-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-4 text-left">
                <h3
                  className="text-lg font-medium text-white"
                  id="modal-title"
                >
                  Delete Pixel Map
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    Are you sure you want to delete "{documentToDelete.name}"?
                    This action cannot be undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                onClick={confirmDelete}
              >
                Delete
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                onClick={cancelDelete}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default VideoPage;

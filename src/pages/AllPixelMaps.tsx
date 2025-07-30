import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileScreenWarning from "../components/MobileScreenWarning";
import { useScreenSize } from "../hooks/useScreenSize";
import {
  ArrowLeft,
  PlusCircle,
  Grid,
  Trash2,
  Edit,
  Search,
  SortAsc,
  SortDesc,
  AlertTriangle,
} from "lucide-react";

// Define type for our pixel maps
interface PixelMap {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  map_type: 'standard' | 'led';
}

const AllPixelMaps = () => {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [pixelMaps, setPixelMaps] = useState<PixelMap[]>([]);
  const [filteredPixelMaps, setFilteredPixelMaps] = useState<PixelMap[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "created_at" | "last_edited">("last_edited");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(
    null,
  );

  useEffect(() => {
    const fetchPixelMaps = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          navigate("/login");
          return;
        }

        const { data, error } = await supabase
          .from("pixel_maps")
          .select("id, project_name, created_at, last_edited, map_type")
          .eq("user_id", userData.user.id)
          .order(sortField === 'name' ? 'project_name' : sortField, { ascending: sortDirection === "asc" });

        if (error) throw error;

        if (data) {
          const formattedData = data.map(item => ({ ...item, name: item.project_name })) as PixelMap[];
          setPixelMaps(formattedData);
          setFilteredPixelMaps(formattedData);
        }
      } catch (error) {
        console.error("Error fetching pixel maps:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPixelMaps();
  }, [navigate, sortField, sortDirection]);

  // Filter pixel maps when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPixelMaps(pixelMaps);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = pixelMaps.filter((map) =>
        map.name.toLowerCase().includes(lowercaseSearch),
      );
      setFilteredPixelMaps(filtered);
    }
  }, [searchTerm, pixelMaps]);

  const handleSort = (field: "name" | "created_at" | "last_edited") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDocumentToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      const { error } = await supabase.from("pixel_maps").delete().eq("id", documentToDelete.id);

      if (error) throw error;

      setPixelMaps(pixelMaps.filter((item) => item.id !== documentToDelete.id));
      setFilteredPixelMaps(filteredPixelMaps.filter((item) => item.id !== documentToDelete.id));
    } catch (error) {
      console.error("Error deleting pixel map:", error);
      alert("Failed to delete pixel map. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleEditPixelMap = (id: string) => {
    const map = pixelMaps.find((m) => m.id === id);
    if (map) {
      const from = { state: { from: "/all-pixel-maps" } };
      if (map.map_type === 'led') {
        navigate(`/pixel-map/led/${id}`, from);
      } else {
        navigate(`/pixel-map/standard/${id}`, from);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (screenSize === "mobile" || screenSize === "tablet") {
    return (
      <MobileScreenWarning
        title="Screen Size Too Small"
        description="Pixel Map management requires a larger screen. Please use a desktop or laptop."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/video")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Video
          </button>

          <button
            onClick={() => navigate("/pixel-map/new", { state: { from: "/all-pixel-maps" } })}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Pixel Map
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">All Pixel Maps</h1>
            <p className="text-gray-400">Manage all your pixel maps in one place</p>
          </div>

          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-700 text-white w-full pl-10 pr-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Search by name..."
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleSort("name")}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    sortField === "name"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Name
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4 ml-1" />
                    ) : (
                      <SortDesc className="h-4 w-4 ml-1" />
                    ))}
                </button>

                <button
                  onClick={() => handleSort("created_at")}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    sortField === "created_at"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Created
                  {sortField === "created_at" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4 ml-1" />
                    ) : (
                      <SortDesc className="h-4 w-4 ml-1" />
                    ))}
                </button>

                <button
                  onClick={() => handleSort("last_edited")}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    sortField === "last_edited"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Last Edited
                  {sortField === "last_edited" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4 ml-1" />
                    ) : (
                      <SortDesc className="h-4 w-4 ml-1" />
                    ))}
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="text-left py-3 px-6 text-indigo-400 font-medium">Name</th>
                  <th className="text-left py-3 px-6 text-indigo-400 font-medium">Created</th>
                  <th className="text-left py-3 px-6 text-indigo-400 font-medium">Last Edited</th>
                  <th className="text-right py-3 px-6 text-indigo-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredPixelMaps.length > 0 ? (
                  filteredPixelMaps.map((map) => (
                    <tr key={map.id} className="hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <Grid className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                          <span className="text-white font-medium">{map.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {new Date(map.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {map.last_edited
                          ? new Date(map.last_edited).toLocaleDateString()
                          : new Date(map.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Edit"
                            onClick={() => handleEditPixelMap(map.id)}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                            onClick={() => handleDeleteRequest(map.id, map.name)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      {searchTerm
                        ? "No pixel maps match your search criteria"
                        : "You haven't created any pixel maps yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredPixelMaps.length > 0 && (
            <div className="p-4 border-t border-gray-700 text-gray-400 text-sm">
              Showing {filteredPixelMaps.length} of {pixelMaps.length} pixel maps
            </div>
          )}
        </div>
      </main>

      {showDeleteConfirm && documentToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-white" id="modal-title">
                  Delete Pixel Map
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    Are you sure you want to delete "{documentToDelete.name}"? This action cannot be
                    undone.
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

export default AllPixelMaps;

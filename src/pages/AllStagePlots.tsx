import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileScreenWarning from "../components/MobileScreenWarning";
import { useScreenSize } from "../hooks/useScreenSize";
import {
  ArrowLeft,
  PlusCircle,
  Layout,
  Trash2,
  Edit,
  Download,
  Search,
  SortAsc,
  SortDesc,
  Copy,
  Share2,
  AlertTriangle,
} from "lucide-react";
import html2canvas from "html2canvas";
import StagePlotExport from "../components/StagePlotExport";
import PrintStagePlotExport from "../components/PrintStagePlotExport";
import ShareModal from "../components/ShareModal";
import ExportModal from "../components/ExportModal";

// Define type for our stage plots
interface StagePlot {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  stage_size?: string;
  elements?: any[];
  [key: string]: any; // Allow any additional properties
}

const AllStagePlots = () => {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [stagePlots, setStagePlots] = useState<StagePlot[]>([]);
  const [filteredStagePlots, setFilteredStagePlots] = useState<StagePlot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "created_at" | "last_edited">("last_edited");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentExportStagePlot, setCurrentExportStagePlot] = useState<StagePlot | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareStagePlot, setSelectedShareStagePlot] = useState<StagePlot | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStagePlotId, setExportStagePlotId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(
    null,
  );

  // Refs for the exportable components
  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchStagePlots = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          navigate("/login");
          return;
        }

        const { data, error } = await supabase
          .from("stage_plots")
          .select("*")
          .eq("user_id", userData.user.id)
          .order(sortField, { ascending: sortDirection === "asc" });

        if (error) throw error;

        if (data) {
          setStagePlots(data);
          setFilteredStagePlots(data);
        }
      } catch (error) {
        console.error("Error fetching stage plots:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStagePlots();
  }, [navigate, sortField, sortDirection]);

  // Filter stage plots when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStagePlots(stagePlots);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = stagePlots.filter((plot) =>
        plot.name.toLowerCase().includes(lowercaseSearch),
      );
      setFilteredStagePlots(filtered);
    }
  }, [searchTerm, stagePlots]);

  const handleSort = (field: "name" | "created_at" | "last_edited") => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending for dates, ascending for name
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
      const { error } = await supabase.from("stage_plots").delete().eq("id", documentToDelete.id);

      if (error) throw error;

      // Update the local state
      setStagePlots(stagePlots.filter((item) => item.id !== documentToDelete.id));
      setFilteredStagePlots(filteredStagePlots.filter((item) => item.id !== documentToDelete.id));
    } catch (error) {
      console.error("Error deleting stage plot:", error);
      alert("Failed to delete stage plot. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleEditStagePlot = (id: string) => {
    navigate(`/stage-plot/${id}`);
  };

  const handleShareStagePlot = (stagePlot: StagePlot) => {
    setSelectedShareStagePlot(stagePlot);
    setShowShareModal(true);
  };

  const handleDuplicateStagePlot = async (stagePlot: StagePlot) => {
    try {
      setDuplicatingId(stagePlot.id);

      // Fetch complete stage plot data if needed
      let fullStagePlot = stagePlot;
      if (!stagePlot.elements) {
        const { data, error } = await supabase
          .from("stage_plots")
          .select("*")
          .eq("id", stagePlot.id)
          .single();

        if (error) throw error;
        fullStagePlot = data;
      }

      // Create new stage plot with the same data
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      // Create a duplicate stage plot with "Copy of" prefix
      const { data: newStagePlot, error: insertError } = await supabase
        .from("stage_plots")
        .insert([
          {
            name: `Copy of ${fullStagePlot.name}`,
            user_id: userData.user.id,
            stage_size: fullStagePlot.stage_size || "medium-wide",
            elements: fullStagePlot.elements || [],
            created_at: new Date().toISOString(),
            last_edited: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) throw insertError;

      if (newStagePlot && newStagePlot[0]) {
        // Add the new stage plot to the local state
        setStagePlots([newStagePlot[0], ...stagePlots]);
        setFilteredStagePlots([newStagePlot[0], ...filteredStagePlots]);

        // Navigate to the editor for the new stage plot
        navigate(`/stage-plot/${newStagePlot[0].id}`);
      }
    } catch (error) {
      console.error("Error duplicating stage plot:", error);
      alert("Failed to duplicate stage plot. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleExportStagePlotClick = (stagePlot: StagePlot) => {
    setExportStagePlotId(stagePlot.id);
    setShowExportModal(true);
  };

  const handleExportStagePlotImage = async (stagePlotId: string) => {
    try {
      setDownloadingId(stagePlotId);

      // Close the export modal
      setShowExportModal(false);

      // Fetch complete stage plot data if needed
      let fullStagePlot = stagePlots.find((p) => p.id === stagePlotId);
      if (!fullStagePlot || !fullStagePlot.elements) {
        const { data, error } = await supabase
          .from("stage_plots")
          .select("*")
          .eq("id", stagePlotId)
          .single();

        if (error) throw error;
        fullStagePlot = data;
      }

      // Set the current stage plot to be exported
      setCurrentExportStagePlot(fullStagePlot);

      // Wait for the component to render
      setTimeout(async () => {
        if (exportRef.current) {
          const canvas = await html2canvas(exportRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: "#111827", // Match the background color
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: exportRef.current.scrollHeight,
            width: exportRef.current.offsetWidth,
          });

          // Convert canvas to a data URL and trigger download
          const imageURL = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageURL;
          link.download = `${fullStagePlot!.name.replace(/\s+/g, "-").toLowerCase()}-stage-plot.png`;
          link.click();

          // Clean up
          setCurrentExportStagePlot(null);
          setDownloadingId(null);
          setExportStagePlotId(null);
        }
      }, 100);
    } catch (error) {
      console.error("Error downloading stage plot:", error);
      alert("Failed to download stage plot. Please try again.");
      setDownloadingId(null);
      setExportStagePlotId(null);
    }
  };

  const handlePrintStagePlot = async (stagePlotId: string) => {
    try {
      setDownloadingId(stagePlotId);

      // Close the export modal
      setShowExportModal(false);

      // Fetch complete stage plot data if needed
      let fullStagePlot = stagePlots.find((p) => p.id === stagePlotId);
      if (!fullStagePlot || !fullStagePlot.elements) {
        const { data, error } = await supabase
          .from("stage_plots")
          .select("*")
          .eq("id", stagePlotId)
          .single();

        if (error) throw error;
        fullStagePlot = data;
      }

      // Set the current stage plot to be exported
      setCurrentExportStagePlot(fullStagePlot);

      // Wait for the component to render
      setTimeout(async () => {
        if (printExportRef.current) {
          const canvas = await html2canvas(printExportRef.current, {
            scale: 2, // Higher scale for better quality
            backgroundColor: "#ffffff", // White background
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: printExportRef.current.scrollHeight,
            width: printExportRef.current.offsetWidth,
          });

          // Convert canvas to a data URL and trigger download
          const imageURL = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageURL;
          link.download = `${fullStagePlot!.name.replace(/\s+/g, "-").toLowerCase()}-stage-plot-print.png`;
          link.click();

          // Clean up
          setCurrentExportStagePlot(null);
          setDownloadingId(null);
          setExportStagePlotId(null);
        }
      }, 100);
    } catch (error) {
      console.error("Error exporting print-friendly stage plot:", error);
      alert("Failed to export stage plot. Please try again.");
      setDownloadingId(null);
      setExportStagePlotId(null);
    }
  };

  const handleCreateNewStagePlot = () => {
    navigate("/dashboard");
    // Use setTimeout to wait for navigation to complete
    setTimeout(() => {
      const newPlotButton = document.querySelector('[data-show-new-plot-modal="true"]');
      if (newPlotButton) {
        (newPlotButton as HTMLButtonElement).click();
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show warning on mobile screens
  if (screenSize === "mobile" || screenSize === "tablet") {
    return (
      <MobileScreenWarning
        title="Screen Size Too Small"
        description="The Stage Plot management requires a larger screen to provide the best experience. Please use a desktop or laptop computer."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/audio")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Audio
          </button>

          <button
            onClick={handleCreateNewStagePlot}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Stage Plot
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">All Stage Plots</h1>
            <p className="text-gray-400">Manage all your stage plots in one place</p>
          </div>

          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Search */}
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

              {/* Sort Controls */}
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
                {filteredStagePlots.length > 0 ? (
                  filteredStagePlots.map((plot) => (
                    <tr key={plot.id} className="hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <Layout className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                          <span className="text-white font-medium">{plot.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {new Date(plot.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {plot.last_edited
                          ? new Date(plot.last_edited).toLocaleDateString()
                          : new Date(plot.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Share"
                            onClick={() => handleShareStagePlot(plot)}
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Duplicate"
                            onClick={() => handleDuplicateStagePlot(plot)}
                            disabled={duplicatingId === plot.id}
                          >
                            <Copy
                              className={`h-5 w-5 ${duplicatingId === plot.id ? "animate-pulse" : ""}`}
                            />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Download"
                            onClick={() => handleExportStagePlotClick(plot)}
                            disabled={downloadingId === plot.id}
                          >
                            <Download
                              className={`h-5 w-5 ${downloadingId === plot.id ? "animate-pulse" : ""}`}
                            />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Edit"
                            onClick={() => handleEditStagePlot(plot.id)}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                            onClick={() => handleDeleteRequest(plot.id, plot.name)}
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
                        ? "No stage plots match your search criteria"
                        : "You haven't created any stage plots yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredStagePlots.length > 0 && (
            <div className="p-4 border-t border-gray-700 text-gray-400 text-sm">
              Showing {filteredStagePlots.length} of {stagePlots.length} stage plots
            </div>
          )}
        </div>
      </main>

      {/* Share Modal */}
      {showShareModal && selectedShareStagePlot && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedShareStagePlot(null);
          }}
          resourceId={selectedShareStagePlot.id}
          resourceType="stage_plot"
          resourceName={selectedShareStagePlot.name}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportImage={() => exportStagePlotId && handleExportStagePlotImage(exportStagePlotId)}
        onExportPdf={() => exportStagePlotId && handlePrintStagePlot(exportStagePlotId)}
        title="Stage Plot"
      />

      {/* Hidden Export Components */}
      {currentExportStagePlot && (
        <>
          <StagePlotExport ref={exportRef} stagePlot={currentExportStagePlot} />
          <PrintStagePlotExport ref={printExportRef} stagePlot={currentExportStagePlot} />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && documentToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-white" id="modal-title">
                  Delete Stage Plot
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

export default AllStagePlots;

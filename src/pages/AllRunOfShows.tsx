import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import RunOfShowExport from "../components/run-of-show/RunOfShowExport";
import PrintRunOfShowExport from "../components/run-of-show/PrintRunOfShowExport";
import ExportModal from "../components/ExportModal";
import ShareModal from "../components/ShareModal"; // Import ShareModal
import html2canvas from "html2canvas";
import { RunOfShowItem, CustomColumnDefinition } from "./RunOfShowEditor";
import {
  PlusCircle,
  Edit,
  Trash2,
  ArrowLeft,
  Loader,
  AlertTriangle,
  ClipboardList,
  Search,
  SortAsc,
  SortDesc,
  FileText,
  Download,
  Copy,
  Share2, // Added Share2 icon
} from "lucide-react";

interface RunOfShowSummary {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
}

export interface FullRunOfShowData {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  user_id: string;
  items: RunOfShowItem[];
  custom_column_definitions: CustomColumnDefinition[];
  live_show_data?: any; // Added for consistency, though not directly used in this component's primary display
}

type SortField = "name" | "created_at" | "last_edited";
type SortDirection = "asc" | "desc";

const AllRunOfShows: React.FC = () => {
  const navigate = useNavigate();
  const [runOfShows, setRunOfShows] = useState<RunOfShowSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RunOfShowSummary | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("last_edited");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRunOfShowId, setExportRunOfShowId] = useState<string | null>(null);
  const [currentExportRunOfShowData, setCurrentExportRunOfShowData] = useState<FullRunOfShowData | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const [showShareModal, setShowShareModal] = useState(false);
  const [sharingRunOfShow, setSharingRunOfShow] = useState<RunOfShowSummary | null>(null);


  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserAndRunOfShows = async () => {
      setLoading(true);
      setError(null);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        navigate("/login");
        return;
      }
      setUser(userData.user);

      try {
        const { data, error: dbError } = await supabase
          .from("run_of_shows")
          .select("id, name, created_at, last_edited") // live_show_data not needed for summary
          .eq("user_id", userData.user.id);
        
        if (dbError) throw dbError;
        setRunOfShows(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch run of shows.");
        console.error("Error fetching run of shows:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndRunOfShows();
  }, [navigate]);

  const filteredAndSortedRunOfShows = useMemo(() => {
    let processedRunOfShows = [...runOfShows];
    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedRunOfShows = processedRunOfShows.filter((ros) =>
        ros.name.toLowerCase().includes(lowerSearchTerm),
      );
    }
    processedRunOfShows.sort((a, b) => {
      const valA = a[sortField] || (sortField === "last_edited" ? a.created_at : "");
      const valB = b[sortField] || (sortField === "last_edited" ? b.created_at : "");

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return processedRunOfShows;
  }, [runOfShows, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const handleDeleteRequest = (ros: RunOfShowSummary) => {
    setItemToDelete(ros);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !user) return;
    try {
      const { error: deleteError } = await supabase
        .from("run_of_shows")
        .delete()
        .eq("id", itemToDelete.id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;
      setRunOfShows(runOfShows.filter((s) => s.id !== itemToDelete.id));
    } catch (err: any) {
      setError(err.message || "Failed to delete run of show.");
      console.error("Error deleting run of show:", err);
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const openExportModalForItem = (runOfShowId: string) => {
    setExportRunOfShowId(runOfShowId);
    setShowExportModal(true);
  };

  const handleOpenShareModal = (ros: RunOfShowSummary) => {
    setSharingRunOfShow(ros);
    setShowShareModal(true);
  };

  const handleCloseShareModal = () => {
    setShowShareModal(false);
    setSharingRunOfShow(null);
  };


  const fetchFullRunOfShowDataForExport = async (runOfShowId: string): Promise<FullRunOfShowData | null> => {
    const { data, error } = await supabase
      .from("run_of_shows")
      .select("*, live_show_data") // Fetch all columns including items, custom_column_definitions, and live_show_data
      .eq("id", runOfShowId)
      .single();
    if (error) {
      console.error("Error fetching full run of show data for export:", error);
      setError("Failed to fetch run of show details for export.");
      return null;
    }
    return {
      ...data,
      items: data.items || [],
      custom_column_definitions: data.custom_column_definitions || [],
      live_show_data: data.live_show_data || null,
    } as FullRunOfShowData;
  };

  const handleDuplicateRunOfShow = async (rosToDuplicate: RunOfShowSummary) => {
    if (!user) return;
    setDuplicatingId(rosToDuplicate.id);
    setError(null);

    try {
      const fullRunOfShow = await fetchFullRunOfShowDataForExport(rosToDuplicate.id);
      if (!fullRunOfShow) {
        throw new Error("Could not fetch original run of show data for duplication.");
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, last_edited, user_id, live_show_data, ...restOfRunOfShow } = fullRunOfShow;
      
      const newRunOfShowData = {
        ...restOfRunOfShow,
        name: `Copy of ${fullRunOfShow.name}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        last_edited: new Date().toISOString(),
        live_show_data: null, // Reset live_show_data for duplicated item
      };

      const { data: newRunOfShow, error: insertError } = await supabase
        .from("run_of_shows")
        .insert(newRunOfShowData)
        .select("id, name, created_at, last_edited")
        .single();

      if (insertError) throw insertError;

      if (newRunOfShow) {
        setRunOfShows(prevRunOfShows => [newRunOfShow, ...prevRunOfShows]);
      }

    } catch (err: any) {
      setError(err.message || "Failed to duplicate run of show.");
      console.error("Error duplicating run of show:", err);
    } finally {
      setDuplicatingId(null);
    }
  };

  const exportImageWithCanvas = async (
    targetRef: React.RefObject<HTMLDivElement>,
    runOfShowData: FullRunOfShowData,
    fileNameSuffix: string,
    backgroundColor: string,
    font: string
  ) => {
    if (!targetRef.current) {
      console.error("Export component ref not ready.");
      setError("Export component not ready. Please try again.");
      return;
    }
    setIsExporting(true);
    setShowExportModal(false);

    await new Promise(resolve => setTimeout(resolve, 100));

    if (document.fonts && typeof document.fonts.ready === 'function') {
      try {
        await document.fonts.ready;
      } catch (fontError) {
        console.warn("Error waiting for document fonts to be ready:", fontError);
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    try {
      const canvas = await html2canvas(targetRef.current!, {
        scale: 2,
        backgroundColor: backgroundColor,
        useCORS: true,
        logging: process.env.NODE_ENV === 'development',
        letterRendering: true,
        onclone: (clonedDoc) => {
          const styleGlobal = clonedDoc.createElement('style');
          styleGlobal.innerHTML = `
            * {
              font-family: ${font}, sans-serif !important;
              vertical-align: baseline !important;
            }
          `;
          clonedDoc.head.appendChild(styleGlobal);
          clonedDoc.body.style.fontFamily = `${font}, sans-serif`;
          Array.from(clonedDoc.querySelectorAll('*')).forEach((el: any) => {
            if (el.style) {
              el.style.fontFamily = `${font}, sans-serif`;
              el.style.verticalAlign = 'baseline';
            }
          });
        }
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${runOfShowData.name || "run-of-show"}-${fileNameSuffix}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error(`Error exporting ${fileNameSuffix}:`, error);
      setError(`Failed to export ${fileNameSuffix}. See console for details.`);
    } finally {
      setIsExporting(false);
      setCurrentExportRunOfShowData(null);
      setExportRunOfShowId(null);
    }
  };

  const prepareAndExecuteExport = async (
    runOfShowIdToExport: string,
    exportType: 'image' | 'print'
  ) => {
    if (!runOfShowIdToExport) return;
    setIsExporting(true);
    const fullData = await fetchFullRunOfShowDataForExport(runOfShowIdToExport);
    if (!fullData) {
      setIsExporting(false);
      return;
    }
    setCurrentExportRunOfShowData(fullData);
    await new Promise(resolve => setTimeout(resolve, 50));
    if (exportType === 'image') {
      exportImageWithCanvas(exportRef, fullData, "image", '#0f172a', 'Inter');
    } else if (exportType === 'print') {
      exportImageWithCanvas(printExportRef, fullData, "print-friendly", '#ffffff', 'Arial');
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />
      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>

          <button
            onClick={() => navigate("/run-of-show/new")}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Run of Show
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">All Run of Shows</h1>
            <p className="text-gray-400">Manage all your run of shows in one place</p>
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
                { (["name", "created_at", "last_edited"] as SortField[]).map(field => (
                    <button
                        key={field}
                        onClick={() => handleSort(field)}
                        className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                            sortField === field
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                    >
                        {field.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                        {sortField === field &&
                            (sortDirection === "asc" ? (
                            <SortAsc className="h-4 w-4 ml-1" />
                            ) : (
                            <SortDesc className="h-4 w-4 ml-1" />
                            ))}
                    </button>
                ))}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="m-6 bg-red-500/20 text-red-300 p-4 rounded-lg">
              <p>Error: {error}</p>
            </div>
          )}

          {loading && user && runOfShows.length === 0 && (
             <div className="py-12 text-center text-gray-400">
                <Loader className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
             </div>
          )}

          {!loading && filteredAndSortedRunOfShows.length === 0 && (
            <div className="text-center py-12 px-6">
              <ClipboardList className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-xl text-gray-300 mb-2">
                {searchTerm ? "No run of shows match your search." : "No run of shows found."}
              </p>
              <p className="text-gray-400 mb-6">
                {searchTerm ? "Try a different search term or clear the search." : "Get started by creating a new one."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate("/run-of-show/new")}
                  className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-colors text-lg"
                >
                  <PlusCircle className="h-6 w-6 mr-2" />
                  Create Run of Show
                </button>
              )}
            </div>
          )}

          {filteredAndSortedRunOfShows.length > 0 && (
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
                  {filteredAndSortedRunOfShows.map((ros) => (
                    <tr key={ros.id} className="hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                          <span
                            className="text-white font-medium hover:text-indigo-400 cursor-pointer"
                            onClick={() => navigate(`/run-of-show/${ros.id}`)}
                          >
                            {ros.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {new Date(ros.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {ros.last_edited
                          ? new Date(ros.last_edited).toLocaleDateString()
                          : new Date(ros.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end space-x-2">
                           <button
                            onClick={() => handleOpenShareModal(ros)}
                            className="p-2 text-gray-400 hover:text-teal-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Share Run of Show (View-Only)"
                            disabled={isExporting || duplicatingId === ros.id}
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                           <button
                            onClick={() => handleDuplicateRunOfShow(ros)}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Duplicate Run of Show"
                            disabled={duplicatingId === ros.id || isExporting}
                          >
                            <Copy className={`h-5 w-5 ${duplicatingId === ros.id ? "animate-pulse" : ""}`} />
                          </button>
                           <button
                            onClick={() => openExportModalForItem(ros.id)}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Export Run of Show"
                            disabled={isExporting && exportRunOfShowId === ros.id || duplicatingId === ros.id}
                          >
                            <Download className={`h-5 w-5 ${(isExporting && exportRunOfShowId === ros.id) ? "animate-pulse" : ""}`} />
                          </button>
                          <button
                            onClick={() => navigate(`/run-of-show/${ros.id}`)}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Edit"
                            disabled={isExporting || duplicatingId === ros.id}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(ros)}
                            className="p-2 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Delete"
                            disabled={isExporting || duplicatingId === ros.id}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredAndSortedRunOfShows.length > 0 && (
            <div className="p-4 border-t border-gray-700 text-gray-400 text-sm">
              Showing {filteredAndSortedRunOfShows.length} of {runOfShows.length} run of shows
            </div>
          )}
        </div>
      </main>

      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-white" id="modal-title">
                  Delete Run of Show
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    Are you sure you want to delete "{itemToDelete.name}"? This action cannot be undone.
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

      <ExportModal
        isOpen={showExportModal}
        onClose={() => {
            if (!isExporting) {
                setShowExportModal(false);
                setExportRunOfShowId(null); 
            }
        }}
        onExportImage={() => exportRunOfShowId && prepareAndExecuteExport(exportRunOfShowId, 'image')}
        onExportPdf={() => exportRunOfShowId && prepareAndExecuteExport(exportRunOfShowId, 'print')}
        title="Run of Show"
        isExporting={isExporting && !!exportRunOfShowId} 
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={handleCloseShareModal}
        resourceId={sharingRunOfShow?.id || null}
        resourceName={sharingRunOfShow?.name || null}
        resourceType="run_of_show"
      />

      {currentExportRunOfShowData && (
        <>
          <RunOfShowExport 
            key={`export-${currentExportRunOfShowData.id}-${currentExportRunOfShowData.last_edited || currentExportRunOfShowData.created_at}`}
            ref={exportRef} 
            schedule={currentExportRunOfShowData} 
          />
          <PrintRunOfShowExport 
            key={`print-export-${currentExportRunOfShowData.id}-${currentExportRunOfShowData.last_edited || currentExportRunOfShowData.created_at}`}
            ref={printExportRef} 
            schedule={currentExportRunOfShowData} 
          />
        </>
      )}
      <Footer />
    </div>
  );
};

export default AllRunOfShows;

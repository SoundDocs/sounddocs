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
  Mic,
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
import CorporateMicPlotExport from "../components/CorporateMicPlotExport";
import PrintCorporateMicPlotExport from "../components/PrintCorporateMicPlotExport";
import ShareModal from "../components/ShareModal";
import ExportModal from "../components/ExportModal";

// Define type for Corporate Mic Plots
interface CorporateMicPlot {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  presenters?: any[];
  [key: string]: any;
}

const AllCorporateMicPlots = () => {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [micPlots, setMicPlots] = useState<CorporateMicPlot[]>([]);
  const [filteredMicPlots, setFilteredMicPlots] = useState<CorporateMicPlot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "created_at" | "last_edited">("last_edited");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  const [downloadingId, setDownloadingId] = useState<string | null>(null); // ID of the plot being downloaded/exported
  const [currentExportMicPlot, setCurrentExportMicPlot] = useState<CorporateMicPlot | null>(null); // Full data for export component
  const [exportType, setExportType] = useState<'image' | 'print' | null>(null); // To control which export to run in useEffect

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareMicPlot, setSelectedShareMicPlot] = useState<CorporateMicPlot | null>(null);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMicPlotIdForModal, setExportMicPlotIdForModal] = useState<string | null>(null); // ID for modal context

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMicPlots = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          navigate("/login");
          return;
        }
        const { data, error } = await supabase
          .from("corporate_mic_plots")
          .select("*")
          .eq("user_id", userData.user.id)
          .order(sortField, { ascending: sortDirection === "asc" });
        if (error) throw error;
        if (data) {
          setMicPlots(data);
          setFilteredMicPlots(data);
        }
      } catch (error) {
        console.error("Error fetching corporate mic plots:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMicPlots();
  }, [navigate, sortField, sortDirection]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredMicPlots(micPlots);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = micPlots.filter((plot) =>
        plot.name.toLowerCase().includes(lowercaseSearch),
      );
      setFilteredMicPlots(filtered);
    }
  }, [searchTerm, micPlots]);

  // Effect for handling the actual export after states are set
  useEffect(() => {
    if (!currentExportMicPlot || !exportType || !downloadingId) {
      return;
    }

    const performExportAsync = async () => {
      const targetRef = exportType === 'image' ? exportRef : printExportRef;
      const backgroundColor = exportType === 'image' ? '#111827' : '#ffffff';
      const fileNameSuffix = exportType === 'image' ? 'corporate-mic-plot.png' : 'corporate-mic-plot-print.png';

      if (targetRef.current) {
        // Wait for the next browser paint to ensure the component is fully rendered and laid out
        await new Promise(resolve => requestAnimationFrame(resolve));

        if (targetRef.current.offsetWidth === 0 || targetRef.current.offsetHeight === 0) {
          console.error("Export target element has no dimensions. Aborting export.", targetRef.current.offsetWidth, targetRef.current.offsetHeight);
          alert("Failed to export: The export component could not be rendered correctly (zero dimensions).");
        } else {
          try {
            const canvas = await html2canvas(targetRef.current, {
              scale: 2,
              backgroundColor: backgroundColor,
              logging: false, // Set to true for debugging html2canvas
              useCORS: true,
              allowTaint: true,
              width: targetRef.current.scrollWidth, // Capture full scrollable width
              height: targetRef.current.scrollHeight, // Capture full scrollable height
            });
            const imageURL = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = imageURL;
            link.download = `${currentExportMicPlot.name.replace(/\s+/g, "-").toLowerCase()}-${fileNameSuffix}`;
            document.body.appendChild(link); // Required for Firefox
            link.click();
            document.body.removeChild(link);
          } catch (error) {
            console.error(`Error during ${exportType} html2canvas export:`, error);
            alert(`Failed to export ${exportType}. An error occurred during image generation.`);
          }
        }
      } else {
        console.error("Export target ref is not available.");
        alert("Failed to export: The export component reference was not found.");
      }

      // Cleanup after export attempt (success or failure)
      setCurrentExportMicPlot(null);
      setDownloadingId(null);
      setExportType(null);
      setShowExportModal(false); // Close modal after attempt
      // setExportMicPlotIdForModal(null); // Already cleared when modal closes or export starts
    };

    // Delay slightly to ensure React has rendered currentExportMicPlot and the off-screen component
    const timerId = setTimeout(performExportAsync, 150); 
    return () => clearTimeout(timerId);

  }, [currentExportMicPlot, exportType, downloadingId]);


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
      const { error } = await supabase.from("corporate_mic_plots").delete().eq("id", documentToDelete.id);
      if (error) throw error;
      setMicPlots(micPlots.filter((item) => item.id !== documentToDelete.id));
      setFilteredMicPlots(filteredMicPlots.filter((item) => item.id !== documentToDelete.id));
    } catch (error) {
      console.error("Error deleting corporate mic plot:", error);
      alert("Failed to delete corporate mic plot. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleEditMicPlot = (id: string) => {
    navigate(`/corporate-mic-plot/${id}`, { state: { from: "/all-corporate-mic-plots" } });
  };

  const handleShareMicPlot = (micPlot: CorporateMicPlot) => {
    setSelectedShareMicPlot(micPlot);
    setShowShareModal(true);
  };

  const handleDuplicateMicPlot = async (micPlot: CorporateMicPlot) => {
    if (duplicatingId) return;
    try {
      setDuplicatingId(micPlot.id);
      let fullMicPlot = micPlot;
      if (!fullMicPlot.presenters) {
        const { data, error } = await supabase.from("corporate_mic_plots").select("*").eq("id", micPlot.id).single();
        if (error) throw error;
        fullMicPlot = data;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");
      const { data: newMicPlotData, error: insertError } = await supabase
        .from("corporate_mic_plots")
        .insert([{
          name: `Copy of ${fullMicPlot.name}`,
          user_id: userData.user.id,
          presenters: fullMicPlot.presenters,
          created_at: new Date().toISOString(),
          last_edited: new Date().toISOString(),
        }])
        .select();
      if (insertError) throw insertError;
      if (newMicPlotData && newMicPlotData[0]) {
        const newPlot = newMicPlotData[0];
        const sortFn = (a: CorporateMicPlot, b: CorporateMicPlot) => new Date(b.last_edited || b.created_at).getTime() - new Date(a.last_edited || a.created_at).getTime();
        setMicPlots((prevPlots) => [newPlot, ...prevPlots].sort(sortFn));
        setFilteredMicPlots((prevPlots) => [newPlot, ...prevPlots].sort(sortFn));
      }
    } catch (error) {
      console.error("Error duplicating corporate mic plot:", error);
      alert("Failed to duplicate corporate mic plot. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleExportMicPlotClick = (micPlot: CorporateMicPlot) => {
    if (downloadingId) return; // Prevent opening modal if another export is in progress
    setExportMicPlotIdForModal(micPlot.id); // Set ID for modal context
    setShowExportModal(true);
  };

  // Triggered by ExportModal's "Image Export" button
  const startImageExport = async (plotId: string) => {
    if (downloadingId) return;
    setDownloadingId(plotId); // Mark as downloading
    // setShowExportModal(false); // Modal will be closed by useEffect on completion
    try {
      let fullMicPlot = micPlots.find((p) => p.id === plotId) || filteredMicPlots.find((p) => p.id === plotId);
      if (!fullMicPlot || !fullMicPlot.presenters) { // Fetch if not detailed enough
        const { data, error } = await supabase.from("corporate_mic_plots").select("*").eq("id", plotId).single();
        if (error) throw error;
        fullMicPlot = data;
      }
      if (!fullMicPlot) throw new Error("Mic plot data not found for export.");
      
      setCurrentExportMicPlot(fullMicPlot); // Render the export component
      setExportType('image'); // Trigger useEffect for actual export
    } catch (error) {
      console.error("Error preparing for image export:", error);
      alert("Failed to prepare for image export. Please try again.");
      setDownloadingId(null); // Reset if preparation fails
      setShowExportModal(false);
    }
  };

  // Triggered by ExportModal's "Print-friendly Image" button
  const startPrintExport = async (plotId: string) => {
    if (downloadingId) return;
    setDownloadingId(plotId);
    // setShowExportModal(false);
    try {
      let fullMicPlot = micPlots.find((p) => p.id === plotId) || filteredMicPlots.find((p) => p.id === plotId);
      if (!fullMicPlot || !fullMicPlot.presenters) {
        const { data, error } = await supabase.from("corporate_mic_plots").select("*").eq("id", plotId).single();
        if (error) throw error;
        fullMicPlot = data;
      }
      if (!fullMicPlot) throw new Error("Mic plot data not found for export.");

      setCurrentExportMicPlot(fullMicPlot);
      setExportType('print');
    } catch (error) {
      console.error("Error preparing for print export:", error);
      alert("Failed to prepare for print export. Please try again.");
      setDownloadingId(null);
      setShowExportModal(false);
    }
  };


  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div></div>;
  }
  if (screenSize === "mobile" || screenSize === "tablet") {
    return <MobileScreenWarning title="Screen Size Too Small" description="Corporate Mic Plot management requires a larger screen. Please use a desktop or laptop." />;
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />
      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate("/all-mic-plots")} className="flex items-center text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Mic Plot Types
          </button>
          <button onClick={() => navigate("/corporate-mic-plot/new", { state: { from: "/all-corporate-mic-plots" } })} className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200">
            <PlusCircle className="h-5 w-5 mr-2" /> New Corporate Mic Plot
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">All Corporate Mic Plots</h1>
            <p className="text-gray-400">Manage all your corporate mic plots in one place</p>
          </div>
          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="h-5 w-5 text-gray-400" /></div>
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-gray-700 text-white w-full pl-10 pr-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Search by name..." />
              </div>
              <div className="flex space-x-2">
                {['name', 'created_at', 'last_edited'].map((field) => (
                  <button key={field} onClick={() => handleSort(field as "name" | "created_at" | "last_edited")}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${sortField === field ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
                    {field.charAt(0).toUpperCase() + field.slice(1).replace('_', ' ')}
                    {sortField === field && (sortDirection === "asc" ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />)}
                  </button>
                ))}
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
                {filteredMicPlots.length > 0 ? (
                  filteredMicPlots.map((plot) => (
                    <tr key={plot.id} className="hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-6"><div className="flex items-center"><Mic className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" /><span className="text-white font-medium">{plot.name}</span></div></td>
                      <td className="py-4 px-6 text-gray-300">{new Date(plot.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-gray-300">{plot.last_edited ? new Date(plot.last_edited).toLocaleDateString() : new Date(plot.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end space-x-2">
                          <button className="p-2 text-gray-400 hover:text-indigo-400 transition-colors" title="Share" onClick={() => handleShareMicPlot(plot)}><Share2 className="h-5 w-5" /></button>
                          <button className="p-2 text-gray-400 hover:text-indigo-400 transition-colors" title="Duplicate" onClick={() => handleDuplicateMicPlot(plot)} disabled={duplicatingId === plot.id}><Copy className={`h-5 w-5 ${duplicatingId === plot.id ? "animate-pulse" : ""}`} /></button>
                          <button className="p-2 text-gray-400 hover:text-indigo-400 transition-colors" title="Download" onClick={() => handleExportMicPlotClick(plot)} disabled={!!downloadingId}><Download className={`h-5 w-5 ${downloadingId === plot.id ? "animate-pulse" : ""}`} /></button>
                          <button className="p-2 text-gray-400 hover:text-indigo-400 transition-colors" title="Edit" onClick={() => handleEditMicPlot(plot.id)}><Edit className="h-5 w-5" /></button>
                          <button className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Delete" onClick={() => handleDeleteRequest(plot.id, plot.name)}><Trash2 className="h-5 w-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} className="py-12 text-center text-gray-400">{searchTerm ? "No corporate mic plots match your search criteria" : "You haven't created any corporate mic plots yet"}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredMicPlots.length > 0 && <div className="p-4 border-t border-gray-700 text-gray-400 text-sm">Showing {filteredMicPlots.length} of {micPlots.length} corporate mic plots</div>}
        </div>
      </main>

      {showShareModal && selectedShareMicPlot && (
        <ShareModal isOpen={showShareModal} onClose={() => { setShowShareModal(false); setSelectedShareMicPlot(null); }} resourceId={selectedShareMicPlot.id} resourceType="corporate_mic_plot" resourceName={selectedShareMicPlot.name} />
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => { if (!downloadingId) { setShowExportModal(false); setExportMicPlotIdForModal(null); }}}
        onExportImage={() => exportMicPlotIdForModal && startImageExport(exportMicPlotIdForModal)}
        onExportPdf={() => exportMicPlotIdForModal && startPrintExport(exportMicPlotIdForModal)}
        title="Corporate Mic Plot"
        isExporting={!!downloadingId}
      />

      {/* Off-screen container for export components */}
      {(currentExportMicPlot && exportType) && (
        <div style={{ position: 'absolute', left: '-9999px', top: '0px', zIndex: -100, width: '1400px' /* Ensure it has a width */ }}>
          {exportType === 'image' && <CorporateMicPlotExport ref={exportRef} micPlot={currentExportMicPlot} />}
          {exportType === 'print' && <PrintCorporateMicPlotExport ref={printExportRef} micPlot={currentExportMicPlot} />}
        </div>
      )}

      {showDeleteConfirm && documentToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10"><AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" /></div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-white" id="modal-title">Delete Corporate Mic Plot</h3>
                <div className="mt-2"><p className="text-sm text-gray-300">Are you sure you want to delete "{documentToDelete.name}"? This action cannot be undone.</p></div>
              </div>
            </div>
            <div className="mt-6 sm:mt-8 sm:flex sm:flex-row-reverse">
              <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors" onClick={confirmDelete}>Delete</button>
              <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default AllCorporateMicPlots;

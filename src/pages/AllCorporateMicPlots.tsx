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
  Loader,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
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
  
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [currentExportMicPlot, setCurrentExportMicPlot] = useState<CorporateMicPlot | null>(null);
  
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareMicPlot, setSelectedShareMicPlot] = useState<CorporateMicPlot | null>(null);
  
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMicPlotIdForModal, setExportMicPlotIdForModal] = useState<string | null>(null);

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
          .select("id, name, created_at, last_edited, user_id") // Select only necessary fields for list view
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
      const { data: fullMicPlot, error: fetchError } = await supabase.from("corporate_mic_plots").select("*").eq("id", micPlot.id).single();
      if (fetchError) throw fetchError;
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { presenters, name, user_id } = fullMicPlot;
      const newPlotPayload = {
        name: `Copy of ${name}`,
        user_id: user_id,
        presenters: presenters,
        created_at: new Date().toISOString(),
        last_edited: new Date().toISOString(),
      };

      const { data: newMicPlotData, error: insertError } = await supabase
        .from("corporate_mic_plots")
        .insert([newPlotPayload])
        .select();

      if (insertError) throw insertError;
      if (newMicPlotData && newMicPlotData[0]) {
        const newPlot = newMicPlotData[0];
        const sortFn = (a: CorporateMicPlot, b: CorporateMicPlot) => new Date(b.last_edited || b.created_at).getTime() - new Date(a.last_edited || a.created_at).getTime();
        setMicPlots((prevPlots) => [newPlot, ...prevPlots].sort(sortFn));
      }
    } catch (error) {
      console.error("Error duplicating corporate mic plot:", error);
      alert("Failed to duplicate corporate mic plot. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleExportMicPlotClick = (micPlot: CorporateMicPlot) => {
    if (exportingId) return;
    setExportMicPlotIdForModal(micPlot.id);
    setShowExportModal(true);
  };

  const exportAsPdf = async (
    targetRef: React.RefObject<HTMLDivElement>,
    itemName: string,
    fileNameSuffix: string,
    backgroundColor: string,
    font: string
  ) => {
    if (!targetRef.current) {
      console.error("Export component ref not ready.");
      alert("Export component not ready. Please try again.");
      return;
    }

    if (document.fonts && typeof document.fonts.ready === 'function') {
      try { await document.fonts.ready; } 
      catch (fontError) { console.warn("Error waiting for document fonts to be ready:", fontError); }
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        backgroundColor,
        useCORS: true,
        allowTaint: true,
        letterRendering: true,
        onclone: (clonedDoc) => {
          const styleGlobal = clonedDoc.createElement('style');
          styleGlobal.innerHTML = `* { font-family: ${font}, sans-serif !important; vertical-align: baseline !important; }`;
          clonedDoc.head.appendChild(styleGlobal);
          clonedDoc.body.style.fontFamily = `${font}, sans-serif`;
          Array.from(clonedDoc.querySelectorAll('*')).forEach((el: any) => {
            if (el.style) { el.style.fontFamily = `${font}, sans-serif`; el.style.verticalAlign = 'baseline';}
          });
        },
        windowHeight: targetRef.current.scrollHeight,
        windowWidth: targetRef.current.offsetWidth,
        height: targetRef.current.scrollHeight,
        width: targetRef.current.offsetWidth,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "l" : "p",
        unit: "px",
        format: [canvas.width, canvas.height],
        hotfixes: ["px_scaling"],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${itemName.replace(/\s+/g, "-").toLowerCase()}-${fileNameSuffix}.pdf`);
    } catch (error) {
      console.error(`Error exporting ${fileNameSuffix}:`, error);
      alert(`Failed to export ${fileNameSuffix}. See console for details.`);
    }
  };

  const prepareAndExecuteExport = async (plotId: string, format: 'color' | 'print') => {
    setExportingId(plotId);
    setShowExportModal(false);

    try {
      const { data: fullMicPlot, error } = await supabase.from("corporate_mic_plots").select("*").eq("id", plotId).single();
      if (error) throw error;
      if (!fullMicPlot) throw new Error("Mic plot data not found for export.");

      setCurrentExportMicPlot(fullMicPlot);
      await new Promise(resolve => setTimeout(resolve, 150)); // Wait for render

      if (format === 'color') {
        await exportAsPdf(exportRef, fullMicPlot.name, 'corporate-mic-plot-color', '#111827', 'Inter');
      } else if (format === 'print') {
        await exportAsPdf(printExportRef, fullMicPlot.name, 'corporate-mic-plot-print', '#ffffff', 'Arial');
      }
    } catch (error) {
      console.error("Error preparing for export:", error);
      alert("Failed to prepare for export. Please try again.");
    } finally {
      setExportingId(null);
      setCurrentExportMicPlot(null);
      setExportMicPlotIdForModal(null);
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
                {(['name', 'created_at', 'last_edited'] as const).map((field) => (
                  <button key={field} onClick={() => handleSort(field)}
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
                          <button className="p-2 text-gray-400 hover:text-indigo-400 transition-colors" title="Download" onClick={() => handleExportMicPlotClick(plot)} disabled={!!exportingId}>
                            {exportingId === plot.id ? <Loader className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                          </button>
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
        onClose={() => { if (!exportingId) { setShowExportModal(false); setExportMicPlotIdForModal(null); }}}
        onExportColor={() => exportMicPlotIdForModal && prepareAndExecuteExport(exportMicPlotIdForModal, 'color')}
        onExportPrintFriendly={() => exportMicPlotIdForModal && prepareAndExecuteExport(exportMicPlotIdForModal, 'print')}
        title="Corporate Mic Plot"
        isExporting={!!exportingId}
      />

      {/* Off-screen container for export components */}
      {currentExportMicPlot && (
        <div style={{ position: 'absolute', left: '-9999px', top: '0px', zIndex: -100, width: '1400px' }}>
          <CorporateMicPlotExport ref={exportRef} micPlot={currentExportMicPlot} />
          <PrintCorporateMicPlotExport ref={printExportRef} micPlot={currentExportMicPlot} />
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

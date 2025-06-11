import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  PlusCircle,
  FileText,
  Layout,
  Trash2,
  Edit,
  Download,
  List,
  AlertTriangle,
  Loader,
  Info,
  ArrowLeftCircle,
} from "lucide-react";
import html2canvas from "html2canvas";
import PatchSheetExport from "../components/PatchSheetExport";
import StagePlotExport from "../components/StagePlotExport";
import PrintPatchSheetExport from "../components/PrintPatchSheetExport";
import PrintStagePlotExport from "../components/PrintStagePlotExport";
import ExportModal from "../components/ExportModal";

// Define types for our documents
interface PatchList {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  [key: string]: any;
}

interface StagePlot {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  stage_size: string;
  elements: any[];
  backgroundImage?: string;
  backgroundOpacity?: number;
}

const AudioPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [patchLists, setPatchLists] = useState<PatchList[]>([]);
  const [stagePlots, setStagePlots] = useState<StagePlot[]>([]);

  const [exportingItemId, setExportingItemId] = useState<string | null>(null);

  const [currentExportPatchSheet, setCurrentExportPatchSheet] = useState<PatchList | null>(null);
  const [showPatchSheetExportModal, setShowPatchSheetExportModal] = useState(false);
  const [exportPatchSheetId, setExportPatchSheetId] = useState<string | null>(null);

  const [currentExportStagePlot, setCurrentExportStagePlot] = useState<StagePlot | null>(null);
  const [showStagePlotExportModal, setShowStagePlotExportModal] = useState(false);
  const [exportStagePlotId, setExportStagePlotId] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    type: "patch" | "stage";
    name: string;
  } | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const patchSheetExportRef = useRef<HTMLDivElement>(null);
  const printPatchSheetExportRef = useRef<HTMLDivElement>(null);
  const stagePlotExportRef = useRef<HTMLDivElement>(null);
  const printStagePlotExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (data.user) {
          setUser(data.user);
          await Promise.all([
            fetchPatchLists(data.user.id),
            fetchStagePlots(data.user.id),
          ]);
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setSupabaseError("Failed to connect to Supabase. Please check your configuration.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [navigate]);

  const fetchPatchLists = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("patch_sheets")
        .select("id, name, created_at, last_edited")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setPatchLists(data);
    } catch (error) {
      console.error("Error fetching patch lists:", error);
      setSupabaseError("Failed to fetch patch lists.");
    }
  };

  const fetchStagePlots = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("stage_plots")
        .select("id, name, created_at, last_edited")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setStagePlots(data);
    } catch (error) {
      console.error("Error fetching stage plots:", error);
      setSupabaseError("Failed to fetch stage plots.");
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

  const handleCreatePatchList = () => navigate("/patch-sheet/new", { state: { from: "/audio" } });
  const handleCreateStagePlot = async () => navigate("/stage-plot/new", { state: { from: "/audio" } });

  const handleDeleteRequest = (id: string, type: "patch" | "stage", name: string) => {
    setDocumentToDelete({ id, type, name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      let tableName = "";
      if (documentToDelete.type === "patch") tableName = "patch_sheets";
      else if (documentToDelete.type === "stage") tableName = "stage_plots";

      if (tableName) {
        const { error } = await supabase.from(tableName).delete().eq("id", documentToDelete.id);
        if (error) throw error;

        if (documentToDelete.type === "patch") {
          setPatchLists(patchLists.filter((item) => item.id !== documentToDelete.id));
        } else if (documentToDelete.type === "stage") {
          setStagePlots(stagePlots.filter((item) => item.id !== documentToDelete.id));
        }
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      setSupabaseError("Failed to delete document. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleEditPatchList = (id: string) => navigate(`/patch-sheet/${id}`, { state: { from: "/audio" } });
  const handleEditStagePlot = (id: string) => navigate(`/stage-plot/${id}`, { state: { from: "/audio" } });

  const handleExportClick = (id: string, type: 'patch' | 'stage') => {
    if (type === 'patch') {
      setExportPatchSheetId(id);
      setShowPatchSheetExportModal(true);
    } else if (type === 'stage') {
      setExportStagePlotId(id);
      setShowStagePlotExportModal(true);
    }
  };

  const exportImageWithCanvas = async (
    targetRef: React.RefObject<HTMLDivElement>,
    itemName: string,
    fileNameSuffix: string,
    backgroundColor: string,
    font: string
  ) => {
    if (!targetRef.current) {
      console.error("Export component ref not ready.");
      setSupabaseError("Export component not ready. Please try again.");
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));

    if (document.fonts && typeof document.fonts.ready === 'function') {
      try { await document.fonts.ready; } 
      catch (fontError) { console.warn("Error waiting for document fonts to be ready:", fontError); }
    } else {
      await new Promise(resolve => setTimeout(resolve, 400));
    }

    try {
      const canvas = await html2canvas(targetRef.current!, {
        scale: 2, backgroundColor, useCORS: true, logging: process.env.NODE_ENV === 'development', letterRendering: true,
        onclone: (clonedDoc) => {
          const styleGlobal = clonedDoc.createElement('style');
          styleGlobal.innerHTML = `* { font-family: ${font}, sans-serif !important; vertical-align: baseline !important; }`;
          clonedDoc.head.appendChild(styleGlobal);
          clonedDoc.body.style.fontFamily = `${font}, sans-serif`;
          Array.from(clonedDoc.querySelectorAll('*')).forEach((el: any) => {
            if (el.style) { el.style.fontFamily = `${font}, sans-serif`; el.style.verticalAlign = 'baseline';}
          });
        }
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${itemName.replace(/\s+/g, "-").toLowerCase()}-${fileNameSuffix}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error(`Error exporting ${fileNameSuffix}:`, error);
      setSupabaseError(`Failed to export ${fileNameSuffix}. See console for details.`);
    }
  };

  const prepareAndExecutePatchSheetExport = async (patchSheetId: string, type: 'image' | 'print') => {
    setExportingItemId(patchSheetId);
    setShowPatchSheetExportModal(false);
    try {
      const { data, error } = await supabase.from("patch_sheets").select("*").eq("id", patchSheetId).single();
      if (error || !data) throw error || new Error("Patch sheet not found");
      setCurrentExportPatchSheet(data);
      await new Promise(resolve => setTimeout(resolve, 50));

      if (type === 'image') {
        await exportImageWithCanvas(patchSheetExportRef, data.name, "patch-sheet", "#111827", "Inter");
      } else {
        await exportImageWithCanvas(printPatchSheetExportRef, data.name, "patch-sheet-print", "#ffffff", "Arial");
      }
    } catch (err) {
      console.error("Error preparing patch sheet export:", err);
      setSupabaseError("Failed to prepare patch sheet for export.");
    } finally {
      setCurrentExportPatchSheet(null);
      setExportingItemId(null);
      setExportPatchSheetId(null);
    }
  };

  const prepareAndExecuteStagePlotExport = async (stagePlotId: string, type: 'image' | 'print') => {
    setExportingItemId(stagePlotId);
    setShowStagePlotExportModal(false);
    try {
      const { data, error } = await supabase.from("stage_plots").select("*").eq("id", stagePlotId).single();
      if (error || !data) throw error || new Error("Stage plot not found");
      const fullStagePlot = { ...data, stage_size: data.stage_size || "medium-wide", elements: data.elements || [] };
      setCurrentExportStagePlot(fullStagePlot);
      await new Promise(resolve => setTimeout(resolve, 50));

      if (type === 'image') {
        await exportImageWithCanvas(stagePlotExportRef, fullStagePlot.name, "stage-plot", "#111827", "Inter");
      } else {
        await exportImageWithCanvas(printStagePlotExportRef, fullStagePlot.name, "stage-plot-print", "#ffffff", "Arial");
      }
    } catch (err) {
      console.error("Error preparing stage plot export:", err);
      setSupabaseError("Failed to prepare stage plot for export.");
    } finally {
      setCurrentExportStagePlot(null);
      setExportingItemId(null);
      setExportStagePlotId(null);
    }
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
          <h1 className="text-4xl font-bold text-white mb-4">Audio Documents</h1>
          <p className="text-lg text-gray-300">Manage your patch lists and stage plots.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* My Patch Lists Card */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">My Patch Lists</h2>
                <p className="text-gray-400">Manage your input lists and signal routing</p>
              </div>
              <FileText className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="space-y-4">
              {patchLists.length > 0 ? (
                <div className="space-y-3">
                  {patchLists.slice(0, 3).map((patchList) => (
                    <div
                      key={patchList.id}
                      className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h3 className="text-white font-medium">{patchList.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {patchList.last_edited
                            ? `Edited ${new Date(patchList.last_edited).toLocaleDateString()}`
                            : `Created ${new Date(patchList.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Download"
                          onClick={(e) => { e.stopPropagation(); handleExportClick(patchList.id, "patch"); }}
                          disabled={exportingItemId === patchList.id}
                        >
                          {exportingItemId === patchList.id ? <Loader className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Edit"
                          onClick={() => handleEditPatchList(patchList.id)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-400"
                          title="Delete"
                          onClick={(e) => { e.stopPropagation(); handleDeleteRequest(patchList.id, "patch", patchList.name); }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">You haven't created any patch lists yet</p>
                </div>
              )}
              <div className="pt-3 text-center">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-center">
                  <button
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={handleCreatePatchList}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Patch List
                  </button>
                  {patchLists.length > 0 && (
                    <button
                      className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                      onClick={() => navigate("/all-patch-sheets")}
                    >
                      <List className="h-5 w-5 mr-2" />
                      View All {patchLists.length > 0 && `(${patchLists.length})`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* My Stage Plots Card */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">My Stage Plots</h2>
                <p className="text-gray-400">Design and manage your stage layouts</p>
              </div>
              <Layout className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="space-y-4">
              {stagePlots.length > 0 ? (
                <div className="space-y-3">
                  {stagePlots.slice(0, 3).map((stagePlot) => (
                    <div
                      key={stagePlot.id}
                      className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h3 className="text-white font-medium">{stagePlot.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {stagePlot.last_edited
                            ? `Edited ${new Date(stagePlot.last_edited).toLocaleDateString()}`
                            : `Created ${new Date(stagePlot.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Download"
                          onClick={(e) => { e.stopPropagation(); handleExportClick(stagePlot.id, "stage"); }}
                          disabled={exportingItemId === stagePlot.id}
                        >
                          {exportingItemId === stagePlot.id ? <Loader className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Edit"
                          onClick={() => handleEditStagePlot(stagePlot.id)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-400"
                          title="Delete"
                          onClick={() => handleDeleteRequest(stagePlot.id, "stage", stagePlot.name)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">You haven't created any stage plots yet</p>
                </div>
              )}
              <div className="pt-3 text-center">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-center">
                  <button
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={handleCreateStagePlot}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Stage Plot
                  </button>
                  {stagePlots.length > 0 && (
                    <button
                      className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                      onClick={() => navigate("/all-stage-plots")}
                    >
                      <List className="h-5 w-5 mr-2" />
                      View All {stagePlots.length > 0 && `(${stagePlots.length})`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ExportModal
        isOpen={showPatchSheetExportModal}
        onClose={() => { if(!(exportingItemId && exportPatchSheetId)) setShowPatchSheetExportModal(false);}}
        onExportImage={() => exportPatchSheetId && prepareAndExecutePatchSheetExport(exportPatchSheetId, 'image')}
        onExportPdf={() => exportPatchSheetId && prepareAndExecutePatchSheetExport(exportPatchSheetId, 'print')}
        title="Patch Sheet"
        isExporting={!!(exportingItemId && exportPatchSheetId)}
      />

      <ExportModal
        isOpen={showStagePlotExportModal}
        onClose={() => {if(!(exportingItemId && exportStagePlotId)) setShowStagePlotExportModal(false);}}
        onExportImage={() => exportStagePlotId && prepareAndExecuteStagePlotExport(exportStagePlotId, 'image')}
        onExportPdf={() => exportStagePlotId && prepareAndExecuteStagePlotExport(exportStagePlotId, 'print')}
        title="Stage Plot"
        isExporting={!!(exportingItemId && exportStagePlotId)}
      />

      {currentExportPatchSheet && (
        <>
          <PatchSheetExport ref={patchSheetExportRef} patchSheet={currentExportPatchSheet} />
          <PrintPatchSheetExport ref={printPatchSheetExportRef} patchSheet={currentExportPatchSheet} />
        </>
      )}

      {currentExportStagePlot && (
        <>
          <StagePlotExport ref={stagePlotExportRef} stagePlot={currentExportStagePlot} />
          <PrintStagePlotExport ref={printStagePlotExportRef} stagePlot={currentExportStagePlot} />
        </>
      )}

      {showDeleteConfirm && documentToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-white" id="modal-title">
                  Delete {documentToDelete.type === "patch" ? "Patch List" : "Stage Plot"}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    Are you sure you want to delete "{documentToDelete.name}"? This action cannot be undone.
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

export default AudioPage;

import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  PlusCircle,
  FileText,
  Layout,
  Info,
  Trash2,
  Edit,
  Download,
  List,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
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
  [key: string]: any; // Allow any additional properties
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

interface ProductionSchedule {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  // Add other fields if needed for display on dashboard, but typically just name/dates
}

interface RunOfShow {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [patchLists, setPatchLists] = useState<PatchList[]>([]);
  const [stagePlots, setStagePlots] = useState<StagePlot[]>([]);
  const [productionSchedules, setProductionSchedules] = useState<ProductionSchedule[]>([]);
  const [runOfShows, setRunOfShows] = useState<RunOfShow[]>([]);
  const [showNewPatchModal, setShowNewPatchModal] = useState(false);
  const [showNewPlotModal, setShowNewPlotModal] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [recentDocuments, setRecentDocuments] = useState<PatchList[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentExportPatchSheet, setCurrentExportPatchSheet] = useState<PatchList | null>(null);
  const [currentExportStagePlot, setCurrentExportStagePlot] = useState<StagePlot | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPatchSheetId, setExportPatchSheetId] = useState<string | null>(null);
  const [showStagePlotExportModal, setShowStagePlotExportModal] = useState(false);
  const [exportStagePlotId, setExportStagePlotId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    type: "patch" | "stage" | "schedule" | "runofshow";
    name: string;
  } | null>(null);
  const [supabaseWarning, setSupabaseWarning] = useState(false);
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
            fetchRecentDocuments(data.user.id),
            fetchStagePlots(data.user.id),
            fetchProductionSchedules(data.user.id),
            // fetchRunOfShows(data.user.id), // Placeholder for future
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
    }
  };

  const fetchProductionSchedules = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("production_schedules")
        .select("id, name, created_at, last_edited")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setProductionSchedules(data);
    } catch (error) {
      console.error("Error fetching production schedules:", error);
    }
  };

  // const fetchRunOfShows = async (userId: string) => {
  //   // Placeholder
  // };

  const fetchRecentDocuments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("patch_sheets")
        .select("id, name, created_at, last_edited")
        .eq("user_id", userId)
        .order("last_edited", { ascending: false })
        .limit(2);
      if (error) throw error;
      if (data) setRecentDocuments(data);
    } catch (error) {
      console.error("Error fetching recent documents:", error);
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

  const handleCreatePatchList = () => {
    // Modal logic is removed, direct navigation
    navigate("/patch-sheet/new");
  };

  const handleCreateStagePlot = async () => {
    // Modal logic is removed, direct navigation
    navigate("/stage-plot/new");
  };
  
  const handleCreateProductionSchedule = () => {
    navigate("/production-schedule/new");
  };

  const handleCreateRunOfShow = () => {
    alert("Functionality to create Run of Show not yet implemented.");
  };

  const handleDeleteRequest = (id: string, type: "patch" | "stage" | "schedule" | "runofshow", name: string) => {
    setDocumentToDelete({ id, type, name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      let tableName = "";
      if (documentToDelete.type === "patch") tableName = "patch_sheets";
      else if (documentToDelete.type === "stage") tableName = "stage_plots";
      else if (documentToDelete.type === "schedule") tableName = "production_schedules";
      // else if (documentToDelete.type === "runofshow") tableName = "run_of_shows"; // Placeholder

      if (tableName) {
        const { error } = await supabase.from(tableName).delete().eq("id", documentToDelete.id);
        if (error) throw error;

        if (documentToDelete.type === "patch") {
          setPatchLists(patchLists.filter((item) => item.id !== documentToDelete.id));
          setRecentDocuments(recentDocuments.filter((item) => item.id !== documentToDelete.id));
        } else if (documentToDelete.type === "stage") {
          setStagePlots(stagePlots.filter((item) => item.id !== documentToDelete.id));
        } else if (documentToDelete.type === "schedule") {
          setProductionSchedules(productionSchedules.filter((item) => item.id !== documentToDelete.id));
        }
        // else if (documentToDelete.type === "runofshow") {
        //   setRunOfShows(runOfShows.filter((item) => item.id !== documentToDelete.id));
        // }
      } else {
         alert(`Functionality to delete ${documentToDelete.type} not yet implemented.`);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleEditPatchList = (id: string) => navigate(`/patch-sheet/${id}`);
  const handleEditStagePlot = (id: string) => navigate(`/stage-plot/${id}`);
  const handleEditProductionSchedule = (id: string) => navigate(`/production-schedule/${id}`);
  const handleEditRunOfShow = (id: string) => alert(`Edit functionality for Run of Show ${id} not yet implemented.`);

  const handleExportPatchListClick = (patchSheet: PatchList) => {
    setExportPatchSheetId(patchSheet.id);
    setShowExportModal(true);
  };

  const handleExportStageplotClick = (stagePlot: StagePlot) => {
    setExportStagePlotId(stagePlot.id);
    setShowStagePlotExportModal(true);
  };

  const handleExportProductionScheduleClick = (schedule: ProductionSchedule) => {
    alert(`Export functionality for Production Schedule ${schedule.name} not yet implemented.`);
  };

  const handleExportRunOfShowClick = (runOfShow: RunOfShow) => {
    alert(`Export functionality for Run of Show ${runOfShow.name} not yet implemented.`);
  };

  const handleExportDownload = async (patchSheetId: string) => {
    try {
      setDownloadingId(patchSheetId);
      setShowExportModal(false);
      const { data, error } = await supabase.from("patch_sheets").select("*").eq("id", patchSheetId).single();
      if (error) throw error;
      const fullPatchSheet = data;

      setCurrentExportPatchSheet(fullPatchSheet);
      setTimeout(async () => {
        if (patchSheetExportRef.current && fullPatchSheet) {
          const canvas = await html2canvas(patchSheetExportRef.current, { scale: 2, backgroundColor: "#111827", logging: false, useCORS: true, allowTaint: true, windowHeight: document.documentElement.offsetHeight, windowWidth: document.documentElement.offsetWidth, height: patchSheetExportRef.current.scrollHeight, width: patchSheetExportRef.current.offsetWidth });
          const imageURL = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageURL;
          link.download = `${fullPatchSheet.name.replace(/\s+/g, "-").toLowerCase()}-patch-sheet.png`;
          link.click();
        }
        setCurrentExportPatchSheet(null);
        setDownloadingId(null);
        setExportPatchSheetId(null);
      }, 100);
    } catch (error) {
      console.error("Error downloading patch sheet:", error);
      alert("Failed to download patch sheet. Please try again.");
      setDownloadingId(null); setExportPatchSheetId(null);
    }
  };

  const handlePrintExport = async (patchSheetId: string) => {
    try {
      setDownloadingId(patchSheetId);
      setShowExportModal(false);
      const { data, error } = await supabase.from("patch_sheets").select("*").eq("id", patchSheetId).single();
      if (error) throw error;
      const fullPatchSheet = data;

      setCurrentExportPatchSheet(fullPatchSheet);
      setTimeout(async () => {
        if (printPatchSheetExportRef.current && fullPatchSheet) {
          const canvas = await html2canvas(printPatchSheetExportRef.current, { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true, allowTaint: true, windowHeight: document.documentElement.offsetHeight, windowWidth: document.documentElement.offsetWidth, height: printPatchSheetExportRef.current.scrollHeight, width: printPatchSheetExportRef.current.offsetWidth });
          const imageURL = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageURL;
          link.download = `${fullPatchSheet.name.replace(/\s+/g, "-").toLowerCase()}-patch-sheet-print.png`;
          link.click();
        }
        setCurrentExportPatchSheet(null);
        setDownloadingId(null);
        setExportPatchSheetId(null);
      }, 100);
    } catch (error) {
      console.error("Error exporting print-friendly patch sheet:", error);
      alert("Failed to export patch sheet. Please try again.");
      setDownloadingId(null); setExportPatchSheetId(null);
    }
  };

  const handleExportStagePlotImage = async (stagePlotId: string) => {
    try {
      setDownloadingId(stagePlotId);
      setShowStagePlotExportModal(false);
      const { data, error } = await supabase.from("stage_plots").select("*").eq("id", stagePlotId).single();
      if (error) throw error;
      if (!data) throw new Error("Stage plot not found");
      const fullStagePlot = { ...data, stage_size: data.stage_size || "medium-wide", elements: data.elements || [] };

      setCurrentExportStagePlot(fullStagePlot);
      setTimeout(async () => {
        if (stagePlotExportRef.current && fullStagePlot) {
          const canvas = await html2canvas(stagePlotExportRef.current, { scale: 2, backgroundColor: "#111827", logging: false, useCORS: true, allowTaint: true, windowHeight: document.documentElement.offsetHeight, windowWidth: document.documentElement.offsetWidth, height: stagePlotExportRef.current.scrollHeight, width: stagePlotExportRef.current.offsetWidth });
          const imageURL = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageURL;
          link.download = `${fullStagePlot.name.replace(/\s+/g, "-").toLowerCase()}-stage-plot.png`;
          link.click();
        }
        setCurrentExportStagePlot(null);
        setDownloadingId(null);
        setExportStagePlotId(null);
      }, 100);
    } catch (error) {
      console.error("Error downloading stage plot:", error);
      alert("Failed to download stage plot. Please try again.");
      setDownloadingId(null); setExportStagePlotId(null);
    }
  };

  const handlePrintStagePlot = async (stagePlotId: string) => {
    try {
      setDownloadingId(stagePlotId);
      setShowStagePlotExportModal(false);
      const { data, error } = await supabase.from("stage_plots").select("*").eq("id", stagePlotId).single();
      if (error) throw error;
      if (!data) throw new Error("Stage plot not found");
      const fullStagePlot = { ...data, stage_size: data.stage_size || "medium-wide", elements: data.elements || [] };

      setCurrentExportStagePlot(fullStagePlot);
      setTimeout(async () => {
        if (printStagePlotExportRef.current && fullStagePlot) {
          const canvas = await html2canvas(printStagePlotExportRef.current, { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true, allowTaint: true, windowHeight: document.documentElement.offsetHeight, windowWidth: document.documentElement.offsetWidth, height: printStagePlotExportRef.current.scrollHeight, width: printStagePlotExportRef.current.offsetWidth });
          const imageURL = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageURL;
          link.download = `${fullStagePlot.name.replace(/\s+/g, "-").toLowerCase()}-stage-plot-print.png`;
          link.click();
        }
        setCurrentExportStagePlot(null);
        setDownloadingId(null);
        setExportStagePlotId(null);
      }, 100);
    } catch (error) {
      console.error("Error exporting print-friendly stage plot:", error);
      alert("Failed to export stage plot. Please try again.");
      setDownloadingId(null); setExportStagePlotId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} onSignOut={handleSignOut} />

      {supabaseWarning && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-3 shadow-sm">
          <div className="container mx-auto flex items-center">
            <Info className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Supabase Configuration Required</p>
              <p className="text-sm">Please set up your Supabase environment variables.</p>
            </div>
          </div>
        </div>
      )}

      {supabaseError && (
        <div className="bg-red-500 text-white px-4 py-3 shadow-sm">
          <div className="container mx-auto flex items-center">
            <Info className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Connection Error</p>
              <p className="text-sm">{supabaseError}</p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to SoundDocs</h1>
          <p className="text-gray-300">Create and manage your professional audio documentation</p>
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
                  {patchLists.slice(0, 2).map((patchList) => (
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
                          onClick={(e) => { e.stopPropagation(); handleExportPatchListClick(patchList); }}
                          disabled={downloadingId === patchList.id}
                        >
                          <Download className={`h-5 w-5 ${downloadingId === patchList.id ? "animate-pulse" : ""}`} />
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
                  <button
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={handleCreatePatchList}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Patch List
                  </button>
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
                  <button
                    className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => navigate("/all-patch-sheets")}
                  >
                    <List className="h-5 w-5 mr-2" />
                    View All {patchLists.length > 0 && `(${patchLists.length})`}
                  </button>
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
                  {stagePlots.slice(0, 2).map((stagePlot) => (
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
                          onClick={(e) => { e.stopPropagation(); handleExportStageplotClick(stagePlot); }}
                          disabled={downloadingId === stagePlot.id}
                        >
                          <Download className={`h-5 w-5 ${downloadingId === stagePlot.id ? "animate-pulse" : ""}`} />
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
                  <button
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={handleCreateStagePlot}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Stage Plot
                  </button>
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
                  <button
                    className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => navigate("/all-stage-plots")}
                  >
                    <List className="h-5 w-5 mr-2" />
                    View All {stagePlots.length > 0 && `(${stagePlots.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* My Production Schedules Card */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">My Production Schedules</h2>
                <p className="text-gray-400">Plan and track your event timelines</p>
              </div>
              <CalendarDays className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="space-y-4">
              {productionSchedules.length > 0 ? (
                <div className="space-y-3">
                  {productionSchedules.slice(0, 2).map((schedule) => (
                    <div
                      key={schedule.id}
                      className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h3 className="text-white font-medium">{schedule.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {schedule.last_edited
                            ? `Edited ${new Date(schedule.last_edited).toLocaleDateString()}`
                            : `Created ${new Date(schedule.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Download"
                          onClick={(e) => { e.stopPropagation(); handleExportProductionScheduleClick(schedule); }}
                          disabled={downloadingId === schedule.id}
                        >
                          <Download className={`h-5 w-5 ${downloadingId === schedule.id ? "animate-pulse" : ""}`} />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Edit"
                          onClick={() => handleEditProductionSchedule(schedule.id)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-400"
                          title="Delete"
                          onClick={() => handleDeleteRequest(schedule.id, "schedule", schedule.name)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">You haven't created any production schedules yet</p>
                  <button
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={handleCreateProductionSchedule}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Production Schedule
                  </button>
                </div>
              )}
              <div className="pt-3 text-center">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-center">
                  <button
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={handleCreateProductionSchedule}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Production Schedule
                  </button>
                  <button
                    className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => navigate("/all-production-schedules")}
                  >
                    <List className="h-5 w-5 mr-2" />
                    View All {productionSchedules.length > 0 && `(${productionSchedules.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* My Run of Shows Card */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">My Run of Shows</h2>
                <p className="text-gray-400">Organize and detail your show sequences</p>
              </div>
              <ClipboardList className="h-8 w-8 text-indigo-400" />
            </div>
            <div className="space-y-4">
              {runOfShows.length > 0 ? (
                <div className="space-y-3">
                  {runOfShows.slice(0, 2).map((ros) => (
                    <div
                      key={ros.id}
                      className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                    >
                      <div>
                        <h3 className="text-white font-medium">{ros.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {ros.last_edited
                            ? `Edited ${new Date(ros.last_edited).toLocaleDateString()}`
                            : `Created ${new Date(ros.created_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Download"
                          onClick={(e) => { e.stopPropagation(); handleExportRunOfShowClick(ros); }}
                          disabled={downloadingId === ros.id}
                        >
                          <Download className={`h-5 w-5 ${downloadingId === ros.id ? "animate-pulse" : ""}`} />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-indigo-400"
                          title="Edit"
                          onClick={() => handleEditRunOfShow(ros.id)}
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          className="p-2 text-gray-400 hover:text-red-400"
                          title="Delete"
                          onClick={() => handleDeleteRequest(ros.id, "runofshow", ros.name)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">You haven't created any run of shows yet</p>
                  <button
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={handleCreateRunOfShow}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    Create Run of Show
                  </button>
                </div>
              )}
              <div className="pt-3 text-center">
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-center">
                  <button
                    className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={handleCreateRunOfShow}
                  >
                    <PlusCircle className="h-5 w-5 mr-2" />
                    New Run of Show
                  </button>
                  <button
                    className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                    onClick={() => alert("View All Run of Shows - Not Implemented")}
                  >
                    <List className="h-5 w-5 mr-2" />
                    View All {runOfShows.length > 0 && `(${runOfShows.length})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Tips</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>Create a patch list to document your input sources and routing</li>
            <li>Design a stage plot to visualize your stage setup</li>
            <li>Plan your event with Production Schedules</li>
            <li>Detail show sequences using Run of Shows</li>
            <li>Export your documents as high-quality images for sharing</li>
            <li>Share your documents with venue staff and band members</li>
          </ul>
        </div>
      </main>

      {/* Modals for creating new documents are removed as navigation handles this now */}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportImage={() => exportPatchSheetId && handleExportDownload(exportPatchSheetId)}
        onExportPdf={() => exportPatchSheetId && handlePrintExport(exportPatchSheetId)}
        title="Patch Sheet"
      />

      <ExportModal
        isOpen={showStagePlotExportModal}
        onClose={() => setShowStagePlotExportModal(false)}
        onExportImage={() => exportStagePlotId && handleExportStagePlotImage(exportStagePlotId)}
        onExportPdf={() => exportStagePlotId && handlePrintStagePlot(exportStagePlotId)}
        title="Stage Plot"
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
                  Delete {
                    documentToDelete.type === "patch" ? "Patch List" :
                    documentToDelete.type === "stage" ? "Stage Plot" :
                    documentToDelete.type === "schedule" ? "Production Schedule" :
                    "Run of Show"
                  }
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

export default Dashboard;

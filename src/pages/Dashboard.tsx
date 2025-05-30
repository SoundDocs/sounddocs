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
  Loader, 
} from "lucide-react";
import html2canvas from "html2canvas";
import PatchSheetExport from "../components/PatchSheetExport";
import StagePlotExport from "../components/StagePlotExport";
import PrintPatchSheetExport from "../components/PrintPatchSheetExport";
import PrintStagePlotExport from "../components/PrintStagePlotExport";
import ExportModal from "../components/ExportModal";
import ProductionScheduleExport from "../components/production-schedule/ProductionScheduleExport"; 
import PrintProductionScheduleExport from "../components/production-schedule/PrintProductionScheduleExport"; 
import { ScheduleForExport, DetailedScheduleItem } from "./ProductionScheduleEditor"; 
import { LaborScheduleItem } from "../components/production-schedule/ProductionScheduleLabor"; 
import { v4 as uuidv4 } from 'uuid';

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

// Updated ProductionSchedule type for summary
interface ProductionScheduleSummary {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
}

// Type for full production schedule data fetched for export
interface FullProductionScheduleData {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  user_id: string;
  show_name?: string;
  job_number?: string;
  facility_name?: string;
  project_manager?: string;
  production_manager?: string;
  account_manager?: string;
  set_datetime?: string;
  strike_datetime?: string;
  crew_key?: Array<{ id: string; name: string; color: string }>;
  detailed_schedule_items?: DetailedScheduleItem[]; // Updated from schedule_items
  labor_schedule_items?: LaborScheduleItem[]; 
}


interface RunOfShow {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
}

// Utility to parse date/time strings, similar to the editor
const parseDateTime = (dateTimeStr: string | null | undefined) => {
  if (!dateTimeStr) return { date: undefined, time: undefined, full: undefined };
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return { date: dateTimeStr, time: undefined, full: dateTimeStr };
    return {
      date: d.toISOString().split('T')[0],
      time: d.toTimeString().split(' ')[0].substring(0, 5),
      full: dateTimeStr,
    };
  } catch (e) {
    return { date: dateTimeStr, time: undefined, full: dateTimeStr };
  }
};

// Transforms raw data to the format expected by export components
const transformToScheduleForExport = (fullSchedule: FullProductionScheduleData): ScheduleForExport => {
  const setDateTimeParts = parseDateTime(fullSchedule.set_datetime);
  const strikeDateTimeParts = parseDateTime(fullSchedule.strike_datetime);

  return {
    id: fullSchedule.id || uuidv4(),
    name: fullSchedule.name,
    created_at: fullSchedule.created_at || new Date().toISOString(),
    last_edited: fullSchedule.last_edited,
    info: {
      event_name: fullSchedule.show_name,
      job_number: fullSchedule.job_number,
      venue: fullSchedule.facility_name,
      project_manager: fullSchedule.project_manager,
      production_manager: fullSchedule.production_manager,
      account_manager: fullSchedule.account_manager,
      date: setDateTimeParts.date,
      load_in: setDateTimeParts.time,
      event_start: setDateTimeParts.time, 
      event_end: strikeDateTimeParts.time, 
      strike_datetime: fullSchedule.strike_datetime,
    },
    crew_key: fullSchedule.crew_key?.map(ck => ({ ...ck })) || [],
    detailed_schedule_items: fullSchedule.detailed_schedule_items?.map(item => ({ // Updated from schedule_items
      ...item,
      assigned_crew_ids: item.assigned_crew_ids || (item.assigned_crew_id ? [item.assigned_crew_id] : [])
    })) || [],
    labor_schedule_items: fullSchedule.labor_schedule_items?.map(item => ({ ...item })) || [], 
  };
};


const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [patchLists, setPatchLists] = useState<PatchList[]>([]);
  const [stagePlots, setStagePlots] = useState<StagePlot[]>([]);
  const [productionSchedules, setProductionSchedules] = useState<ProductionScheduleSummary[]>([]);
  const [runOfShows, setRunOfShows] = useState<RunOfShow[]>([]);
  
  const [recentDocuments, setRecentDocuments] = useState<PatchList[]>([]);
  
  const [exportingItemId, setExportingItemId] = useState<string | null>(null); // Generic exporting ID

  const [currentExportPatchSheet, setCurrentExportPatchSheet] = useState<PatchList | null>(null);
  const [showPatchSheetExportModal, setShowPatchSheetExportModal] = useState(false);
  const [exportPatchSheetId, setExportPatchSheetId] = useState<string | null>(null);

  const [currentExportStagePlot, setCurrentExportStagePlot] = useState<StagePlot | null>(null);
  const [showStagePlotExportModal, setShowStagePlotExportModal] = useState(false);
  const [exportStagePlotId, setExportStagePlotId] = useState<string | null>(null);

  const [currentExportProductionSchedule, setCurrentExportProductionSchedule] = useState<ScheduleForExport | null>(null);
  const [showProductionScheduleExportModal, setShowProductionScheduleExportModal] = useState(false);
  const [exportProductionScheduleId, setExportProductionScheduleId] = useState<string | null>(null);


  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    type: "patch" | "stage" | "schedule" | "runofshow";
    name: string;
  } | null>(null);
  const [supabaseWarning, setSupabaseWarning] = useState(false); // This seems unused, consider removing
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const patchSheetExportRef = useRef<HTMLDivElement>(null);
  const printPatchSheetExportRef = useRef<HTMLDivElement>(null);
  const stagePlotExportRef = useRef<HTMLDivElement>(null);
  const printStagePlotExportRef = useRef<HTMLDivElement>(null);
  const productionScheduleExportRef = useRef<HTMLDivElement>(null); 
  const printProductionScheduleExportRef = useRef<HTMLDivElement>(null); 

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
            // fetchRunOfShows(data.user.id), 
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
      if (data) setProductionSchedules(data as ProductionScheduleSummary[]);
    } catch (error) {
      console.error("Error fetching production schedules:", error);
    }
  };

  const fetchRecentDocuments = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("patch_sheets") // Assuming recent docs are patch sheets for now
        .select("id, name, created_at, last_edited")
        .eq("user_id", userId)
        .order("last_edited", { ascending: false, nullsFirst: false })
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

  const handleCreatePatchList = () => navigate("/patch-sheet/new");
  const handleCreateStagePlot = async () => navigate("/stage-plot/new");
  const handleCreateProductionSchedule = () => navigate("/production-schedule/new");
  const handleCreateRunOfShow = () => alert("Functionality to create Run of Show not yet implemented.");

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

  // Generic Export Click Handler
  const handleExportClick = (id: string, type: 'patch' | 'stage' | 'schedule') => {
    if (type === 'patch') {
      setExportPatchSheetId(id);
      setShowPatchSheetExportModal(true);
    } else if (type === 'stage') {
      setExportStagePlotId(id);
      setShowStagePlotExportModal(true);
    } else if (type === 'schedule') {
      setExportProductionScheduleId(id);
      setShowProductionScheduleExportModal(true);
    }
  };

  const handleExportRunOfShowClick = (runOfShow: RunOfShow) => {
    alert(`Export functionality for Run of Show ${runOfShow.name} not yet implemented.`);
  };

  // Generic html2canvas export function
  const exportImageWithCanvas = async (
    targetRef: React.RefObject<HTMLDivElement>,
    itemName: string, // For filename
    fileNameSuffix: string,
    backgroundColor: string,
    font: string
  ) => {
    if (!targetRef.current) {
      console.error("Export component ref not ready.");
      setSupabaseError("Export component not ready. Please try again."); // Using supabaseError for general errors
      return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100)); // Ensure DOM update

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

  // Patch Sheet Export
  const prepareAndExecutePatchSheetExport = async (patchSheetId: string, type: 'image' | 'print') => {
    setExportingItemId(patchSheetId);
    setShowPatchSheetExportModal(false);
    try {
      const { data, error } = await supabase.from("patch_sheets").select("*").eq("id", patchSheetId).single();
      if (error || !data) throw error || new Error("Patch sheet not found");
      setCurrentExportPatchSheet(data);
      await new Promise(resolve => setTimeout(resolve, 50)); // Allow render

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

  // Stage Plot Export
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
  
  // Production Schedule Export
  const prepareAndExecuteProductionScheduleExport = async (scheduleId: string, type: 'image' | 'print') => {
    setExportingItemId(scheduleId);
    setShowProductionScheduleExportModal(false);
    try {
      const { data: rawData, error } = await supabase.from("production_schedules").select("*").eq("id", scheduleId).single();
      if (error || !rawData) throw error || new Error("Production schedule not found");
      
      const transformedData = transformToScheduleForExport(rawData as FullProductionScheduleData);
      setCurrentExportProductionSchedule(transformedData);
      await new Promise(resolve => setTimeout(resolve, 50));

      if (type === 'image') {
        await exportImageWithCanvas(productionScheduleExportRef, transformedData.name, "production-schedule", "#0f172a", "Inter");
      } else {
        await exportImageWithCanvas(printProductionScheduleExportRef, transformedData.name, "production-schedule-print", "#ffffff", "Arial");
      }
    } catch (err) {
      console.error("Error preparing production schedule export:", err);
      setSupabaseError("Failed to prepare production schedule for export.");
    } finally {
      setCurrentExportProductionSchedule(null);
      setExportingItemId(null);
      setExportProductionScheduleId(null);
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
      <Header dashboard={true} onSignOut={handleSignOut} />

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
                          onClick={(e) => { e.stopPropagation(); handleExportClick(schedule.id, "schedule"); }}
                          disabled={exportingItemId === schedule.id}
                        >
                          {exportingItemId === schedule.id ? <Loader className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
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
                          disabled={exportingItemId === ros.id}
                        >
                          {exportingItemId === ros.id ? <Loader className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
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

      <ExportModal
        isOpen={showProductionScheduleExportModal}
        onClose={() => {if(!(exportingItemId && exportProductionScheduleId)) setShowProductionScheduleExportModal(false);}}
        onExportImage={() => exportProductionScheduleId && prepareAndExecuteProductionScheduleExport(exportProductionScheduleId, 'image')}
        onExportPdf={() => exportProductionScheduleId && prepareAndExecuteProductionScheduleExport(exportProductionScheduleId, 'print')}
        title="Production Schedule"
        isExporting={!!(exportingItemId && exportProductionScheduleId)}
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

      {currentExportProductionSchedule && (
        <>
          <ProductionScheduleExport 
            key={`export-${currentExportProductionSchedule.id}-${currentExportProductionSchedule.last_edited || currentExportProductionSchedule.created_at}`}
            ref={productionScheduleExportRef} 
            schedule={currentExportProductionSchedule} 
          />
          <PrintProductionScheduleExport 
            key={`print-export-${currentExportProductionSchedule.id}-${currentExportProductionSchedule.last_edited || currentExportProductionSchedule.created_at}`}
            ref={printProductionScheduleExportRef} 
            schedule={currentExportProductionSchedule} 
          />
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

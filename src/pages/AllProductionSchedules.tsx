import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductionScheduleExport from "../components/production-schedule/ProductionScheduleExport";
import PrintProductionScheduleExport from "../components/production-schedule/PrintProductionScheduleExport";
import ExportModal from "../components/ExportModal";
import html2canvas from "html2canvas";
import {
  PlusCircle,
  Edit,
  Trash2,
  ArrowLeft,
  Loader,
  AlertTriangle,
  CalendarDays,
  Search,
  SortAsc,
  SortDesc,
  FileText,
  Download,
  Copy, // Import Copy icon
} from "lucide-react";

interface ProductionScheduleSummary {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
}

interface FullProductionSchedule extends ProductionScheduleSummary {
  info?: Record<string, any>;
  crew_key?: Array<{ id: string; name: string; color: string }>;
  schedule_items?: Array<{
    id: string;
    start_time: string;
    end_time: string;
    activity: string;
    notes: string;
    crew_ids: string[]; // Ensure this matches the editor's 'assignedCrewIds' if that's the source
  }>;
  // Add any other fields that are part of the full schedule data
  show_name?: string;
  job_number?: string;
  facility_name?: string;
  project_manager?: string;
  production_manager?: string;
  account_manager?: string;
  set_datetime?: string;
  strike_datetime?: string;
}


type SortField = "name" | "created_at" | "last_edited";
type SortDirection = "asc" | "desc";

const AllProductionSchedules: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<ProductionScheduleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<ProductionScheduleSummary | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("last_edited");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScheduleId, setExportScheduleId] = useState<string | null>(null);
  const [currentExportSchedule, setCurrentExportSchedule] = useState<FullProductionSchedule | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null); // For duplicate loading state

  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const fetchUserAndSchedules = async () => {
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
          .from("production_schedules")
          .select("id, name, created_at, last_edited") 
          .eq("user_id", userData.user.id);
        
        if (dbError) throw dbError;
        setSchedules(data || []);
      } catch (err: any) {
        setError(err.message || "Failed to fetch production schedules.");
        console.error("Error fetching production schedules:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndSchedules();
  }, [navigate]);

  const filteredAndSortedSchedules = useMemo(() => {
    let processedSchedules = [...schedules];
    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      processedSchedules = processedSchedules.filter((schedule) =>
        schedule.name.toLowerCase().includes(lowerSearchTerm),
      );
    }
    processedSchedules.sort((a, b) => {
      const valA = a[sortField] || (sortField === "last_edited" ? a.created_at : ""); 
      const valB = b[sortField] || (sortField === "last_edited" ? b.created_at : "");

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return processedSchedules;
  }, [schedules, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const handleDeleteRequest = (schedule: ProductionScheduleSummary) => {
    setScheduleToDelete(schedule);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!scheduleToDelete || !user) return;
    try {
      const { error: deleteError } = await supabase
        .from("production_schedules")
        .delete()
        .eq("id", scheduleToDelete.id)
        .eq("user_id", user.id);

      if (deleteError) throw deleteError;
      setSchedules(schedules.filter((s) => s.id !== scheduleToDelete.id));
    } catch (err: any) {
      setError(err.message || "Failed to delete production schedule.");
      console.error("Error deleting production schedule:", err);
    } finally {
      setShowDeleteConfirm(false);
      setScheduleToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setScheduleToDelete(null);
  };

  const handleExportScheduleClick = (scheduleId: string) => {
    setExportScheduleId(scheduleId);
    setShowExportModal(true);
  };

  const fetchFullScheduleData = async (scheduleId: string): Promise<FullProductionSchedule | null> => {
    const { data, error } = await supabase
      .from("production_schedules")
      .select("*") 
      .eq("id", scheduleId)
      .single();
    if (error) {
      console.error("Error fetching full schedule data:", error);
      setError("Failed to fetch schedule details.");
      return null;
    }
    return data;
  };

  const handleDuplicateSchedule = async (scheduleToDuplicate: ProductionScheduleSummary) => {
    if (!user) return;
    setDuplicatingId(scheduleToDuplicate.id);
    setError(null);

    try {
      const fullSchedule = await fetchFullScheduleData(scheduleToDuplicate.id);
      if (!fullSchedule) {
        throw new Error("Could not fetch original schedule data for duplication.");
      }

      // Prepare the new schedule data
      const { id, created_at, last_edited, user_id, ...restOfSchedule } = fullSchedule;
      
      const newScheduleData = {
        ...restOfSchedule,
        name: `Copy of ${fullSchedule.name}`,
        user_id: user.id,
        created_at: new Date().toISOString(),
        last_edited: new Date().toISOString(),
      };

      const { data: newSchedule, error: insertError } = await supabase
        .from("production_schedules")
        .insert(newScheduleData)
        .select("id, name, created_at, last_edited") // Select summary fields for the list
        .single();

      if (insertError) throw insertError;

      if (newSchedule) {
        setSchedules(prevSchedules => [newSchedule, ...prevSchedules]);
        // Optionally navigate to the new schedule's editor page
        // navigate(`/production-schedule/${newSchedule.id}`);
      }

    } catch (err: any) {
      setError(err.message || "Failed to duplicate production schedule.");
      console.error("Error duplicating production schedule:", err);
    } finally {
      setDuplicatingId(null);
    }
  };


  const handleExportDownload = async (scheduleIdToExport: string) => {
    if (!scheduleIdToExport) return;
    setDownloadingId(scheduleIdToExport);
    setShowExportModal(false);

    const fullSchedule = await fetchFullScheduleData(scheduleIdToExport);
    if (!fullSchedule) {
      setDownloadingId(null);
      return;
    }
    setCurrentExportSchedule(fullSchedule);

    setTimeout(async () => {
      if (exportRef.current) {
        try {
          const canvas = await html2canvas(exportRef.current, {
            scale: 2,
            backgroundColor: "#111827",
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: exportRef.current.scrollHeight,
            width: exportRef.current.offsetWidth,
          });
          const imageURL = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageURL;
          link.download = `${fullSchedule.name.replace(/\s+/g, "-").toLowerCase()}-production-schedule.png`;
          link.click();
        } catch (exportError) {
          console.error("Error exporting schedule as image:", exportError);
          setError("Failed to export schedule as image.");
        } finally {
          setCurrentExportSchedule(null);
          setDownloadingId(null);
          setExportScheduleId(null);
        }
      }
    }, 100); 
  };

  const handlePrintExport = async (scheduleIdToExport: string) => {
     if (!scheduleIdToExport) return;
    setDownloadingId(scheduleIdToExport);
    setShowExportModal(false);

    const fullSchedule = await fetchFullScheduleData(scheduleIdToExport);
     if (!fullSchedule) {
      setDownloadingId(null);
      return;
    }
    setCurrentExportSchedule(fullSchedule);

    setTimeout(async () => {
      if (printExportRef.current) {
         try {
          const canvas = await html2canvas(printExportRef.current, {
            scale: 2,
            backgroundColor: "#ffffff",
            logging: false,
            useCORS: true,
            allowTaint: true,
            windowHeight: document.documentElement.offsetHeight,
            windowWidth: document.documentElement.offsetWidth,
            height: printExportRef.current.scrollHeight,
            width: printExportRef.current.offsetWidth,
          });
          const imageURL = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.href = imageURL;
          link.download = `${fullSchedule.name.replace(/\s+/g, "-").toLowerCase()}-production-schedule-print.png`;
          link.click();
        } catch (exportError) {
          console.error("Error exporting schedule as print image:", exportError);
          setError("Failed to export schedule for print.");
        } finally {
          setCurrentExportSchedule(null);
          setDownloadingId(null);
          setExportScheduleId(null);
        }
      }
    }, 100);
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
            onClick={() => navigate("/production-schedule/new")}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Schedule
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">All Production Schedules</h1>
            <p className="text-gray-400">Manage all your production schedules in one place</p>
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

          {loading && user && schedules.length === 0 && (
             <div className="py-12 text-center text-gray-400">
                <Loader className="h-8 w-8 text-indigo-500 animate-spin mx-auto" />
             </div>
          )}

          {!loading && filteredAndSortedSchedules.length === 0 && (
            <div className="text-center py-12 px-6">
              <CalendarDays className="h-16 w-16 text-gray-500 mx-auto mb-4" />
              <p className="text-xl text-gray-300 mb-2">
                {searchTerm ? "No schedules match your search." : "No production schedules found."}
              </p>
              <p className="text-gray-400 mb-6">
                {searchTerm ? "Try a different search term or clear the search." : "Get started by creating a new one."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => navigate("/production-schedule/new")}
                  className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-colors text-lg"
                >
                  <PlusCircle className="h-6 w-6 mr-2" />
                  Create Production Schedule
                </button>
              )}
            </div>
          )}

          {filteredAndSortedSchedules.length > 0 && (
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
                  {filteredAndSortedSchedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                          <span
                            className="text-white font-medium hover:text-indigo-400 cursor-pointer"
                            onClick={() => navigate(`/production-schedule/${schedule.id}`)}
                          >
                            {schedule.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {new Date(schedule.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {schedule.last_edited
                          ? new Date(schedule.last_edited).toLocaleDateString()
                          : new Date(schedule.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end space-x-2">
                           <button
                            onClick={() => handleDuplicateSchedule(schedule)}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Duplicate Schedule"
                            disabled={duplicatingId === schedule.id}
                          >
                            <Copy className={`h-5 w-5 ${duplicatingId === schedule.id ? "animate-pulse" : ""}`} />
                          </button>
                           <button
                            onClick={() => handleExportScheduleClick(schedule.id)}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Export Schedule"
                            disabled={downloadingId === schedule.id}
                          >
                            <Download className={`h-5 w-5 ${downloadingId === schedule.id ? "animate-pulse" : ""}`} />
                          </button>
                          <button
                            onClick={() => navigate(`/production-schedule/${schedule.id}`)}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(schedule)}
                            className="p-2 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Delete"
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
          
          {filteredAndSortedSchedules.length > 0 && (
            <div className="p-4 border-t border-gray-700 text-gray-400 text-sm">
              Showing {filteredAndSortedSchedules.length} of {schedules.length} production schedules
            </div>
          )}
        </div>
      </main>

      {showDeleteConfirm && scheduleToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-white" id="modal-title">
                  Delete Production Schedule
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    Are you sure you want to delete "{scheduleToDelete.name}"? This action cannot be undone.
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
            setShowExportModal(false);
            setExportScheduleId(null);
        }}
        onExportImage={() => exportScheduleId && handleExportDownload(exportScheduleId)}
        onExportPdf={() => exportScheduleId && handlePrintExport(exportScheduleId)}
        title="Production Schedule"
      />

      {/* Hidden Export Components */}
      {currentExportSchedule && (
        <>
          <ProductionScheduleExport ref={exportRef} schedule={currentExportSchedule} />
          <PrintProductionScheduleExport ref={printExportRef} schedule={currentExportSchedule} />
        </>
      )}

      <Footer />
    </div>
  );
};

export default AllProductionSchedules;

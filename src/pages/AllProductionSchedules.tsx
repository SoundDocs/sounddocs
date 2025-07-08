import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductionScheduleExport from "../components/production-schedule/ProductionScheduleExport";
import ExportModal from "../components/ExportModal";
import ShareModal from "../components/ShareModal";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ScheduleForExport, DetailedScheduleItem } from "./ProductionScheduleEditor"; 
import { LaborScheduleItem } from "../components/production-schedule/ProductionScheduleLabor"; 
import { v4 as uuidv4 } from 'uuid';
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
  Copy,
  Share2, 
} from "lucide-react";

interface ProductionScheduleSummary {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
}

// This will be the raw data fetched from Supabase
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
  detailed_schedule_items?: DetailedScheduleItem[]; 
  labor_schedule_items?: LaborScheduleItem[]; 
}


type SortField = "name" | "created_at" | "last_edited";
type SortDirection = "asc" | "desc";

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
    detailed_schedule_items: fullSchedule.detailed_schedule_items?.map(item => ({ 
      ...item,
      assigned_crew_ids: item.assigned_crew_ids || (item.assigned_crew_id ? [item.assigned_crew_id] : [])
    })) || [],
    labor_schedule_items: fullSchedule.labor_schedule_items?.map(item => ({ ...item })) || [], 
  };
};


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
  const [currentExportScheduleData, setCurrentExportScheduleData] = useState<ScheduleForExport | null>(null);
  const [isExporting, setIsExporting] = useState(false); 
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const [showShareModal, setShowShareModal] = useState(false); 
  const [selectedShareSchedule, setSelectedShareSchedule] = useState<ProductionScheduleSummary | null>(null); 

  const exportRef = useRef<HTMLDivElement>(null);


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

  const openExportModalForSchedule = (scheduleId: string) => {
    setExportScheduleId(scheduleId); 
    setShowExportModal(true);
  };

  const fetchFullScheduleDataForExport = async (scheduleId: string): Promise<FullProductionScheduleData | null> => {
    const { data, error } = await supabase
      .from("production_schedules")
      .select("*") 
      .eq("id", scheduleId)
      .single();
    if (error) {
      console.error("Error fetching full schedule data for export:", error);
      setError("Failed to fetch schedule details for export.");
      return null;
    }
    return data as FullProductionScheduleData;
  };

  const handleDuplicateSchedule = async (scheduleToDuplicate: ProductionScheduleSummary) => {
    if (!user) return;
    setDuplicatingId(scheduleToDuplicate.id);
    setError(null);

    try {
      const fullSchedule = await fetchFullScheduleDataForExport(scheduleToDuplicate.id);
      if (!fullSchedule) {
        throw new Error("Could not fetch original schedule data for duplication.");
      }

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
        .select("id, name, created_at, last_edited")
        .single();

      if (insertError) throw insertError;

      if (newSchedule) {
        setSchedules(prevSchedules => [newSchedule, ...prevSchedules]);
      }

    } catch (err: any) {
      setError(err.message || "Failed to duplicate production schedule.");
      console.error("Error duplicating production schedule:", err);
    } finally {
      setDuplicatingId(null);
    }
  };

  const exportScheduleAsPdf = async (
    targetRef: React.RefObject<HTMLDivElement>,
    scheduleData: ScheduleForExport,
    fileNameSuffix: string,
    backgroundColor: string
  ) => {
    if (!targetRef.current) {
      console.error("Export component ref not ready.");
      setError("Export component not ready. Please try again.");
      return;
    }

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        backgroundColor,
        useCORS: true,
        allowTaint: true,
        windowHeight: document.documentElement.offsetHeight,
        windowWidth: document.documentElement.offsetWidth,
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
      pdf.save(`${scheduleData.name || "production-schedule"}-${fileNameSuffix}.pdf`);
    } catch (error) {
      console.error(`Error exporting ${fileNameSuffix}:`, error);
      setError(`Failed to export ${fileNameSuffix}. See console for details.`);
    } finally {
      setIsExporting(false);
      setCurrentExportScheduleData(null);
      setExportScheduleId(null);
    }
  };

  const prepareAndExecuteExport = async (
    scheduleIdToExport: string,
    exportType: 'color' | 'print'
  ) => {
    if (!scheduleIdToExport) return;

    setIsExporting(true);
    setShowExportModal(false);
    
    const rawScheduleData = await fetchFullScheduleDataForExport(scheduleIdToExport);
    if (!rawScheduleData) {
      setIsExporting(false);
      return;
    }
    const transformedData = transformToScheduleForExport(rawScheduleData);
    
    if (exportType === 'color') {
      setCurrentExportScheduleData(transformedData); 
      await new Promise(resolve => setTimeout(resolve, 100)); 
      await exportScheduleAsPdf(exportRef, transformedData, "color", '#111827');
    } else if (exportType === 'print') {
      try {
        const pdf = new jsPDF("p", "pt", "letter");
        const scheduleData = transformedData;
        const info = scheduleData.info;

        const addPageHeader = (doc: jsPDF, title: string) => {
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text("SoundDocs", 40, 50);
            doc.setFontSize(16);
            doc.setFont("helvetica", "normal");
            doc.text(title, 40, 75);
            doc.setDrawColor(221, 221, 221); // #ddd
            doc.line(40, 85, doc.internal.pageSize.width - 40, 85);
        };

        const addPageFooter = (doc: jsPDF) => {
            const pageCount = doc.getNumberOfPages();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                // Footer line
                doc.setDrawColor(221, 221, 221); // #ddd
                doc.line(40, pageHeight - 35, pageWidth - 40, pageHeight - 35);

                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128); // gray

                // Left side: Branding
                doc.setFont('helvetica', 'bold');
                doc.text('SoundDocs', 40, pageHeight - 20);
                
                doc.setFont('helvetica', 'normal');
                doc.text('| Professional Audio Documentation', 95, pageHeight - 20);

                // Center: Page number
                const pageNumText = `Page ${i} of ${pageCount}`;
                doc.text(pageNumText, pageWidth / 2, pageHeight - 20, { align: 'center' });

                // Right side: Date
                const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
                doc.text(dateStr, pageWidth - 40, pageHeight - 20, { align: 'right' });
            }
        };

        addPageHeader(pdf, scheduleData.name);

        let lastY = 105;

        const createInfoBlock = (title: string, data: [string, string][]) => {
            if (!data.some(row => row[1] && row[1] !== 'N/A')) return;
            
            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text(title, 40, lastY);
            
            (pdf as any).autoTable({
                body: data,
                startY: lastY + 5,
                theme: 'plain',
                styles: { font: 'helvetica', fontSize: 9, cellPadding: { top: 2, right: 5, bottom: 2, left: 0 } },
                columnStyles: {
                    0: { fontStyle: 'bold', cellWidth: 120 },
                },
                margin: { left: 40 },
            });
            lastY = (pdf as any).lastAutoTable.finalY + 15;
        };

        const eventDetails: [string, string][] = [
            ['Event Name:', info.event_name || 'N/A'],
            ['Job Number:', info.job_number || 'N/A'],
            ['Venue:', info.venue || 'N/A'],
        ];
        createInfoBlock("Event Details", eventDetails);

        const personnelDetails: [string, string][] = [
            ['Project Manager:', info.project_manager || 'N/A'],
            ['Production Manager:', info.production_manager || 'N/A'],
            ['Account Manager:', info.account_manager || 'N/A'],
        ];
        createInfoBlock("Key Personnel", personnelDetails);
        
        const timeDetails: [string, string][] = [
            ['Date:', info.date ? new Date(info.date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : 'N/A'],
            ['Load In:', info.load_in || 'N/A'],
            ['Strike:', parseDateTime(info.strike_datetime).time || 'N/A'],
        ];
        createInfoBlock("Key Times", timeDetails);

        lastY += 15;

        // --- Detailed Schedule Table ---
        if (scheduleData.detailed_schedule_items && scheduleData.detailed_schedule_items.length > 0) {
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text("Detailed Production Schedule", 40, lastY);
            lastY += 20;

            const detailedScheduleHead = [['Date', 'Start', 'End', 'Activity', 'Notes', 'Crew']];
            const detailedScheduleBody = scheduleData.detailed_schedule_items.map(item => {
                const crewNames = item.assigned_crew_ids
                    .map(id => scheduleData.crew_key.find(c => c.id === id)?.name)
                    .filter(Boolean)
                    .join(', ');
                return [
                    item.date ? new Date(item.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', timeZone: 'UTC' }) : 'N/A',
                    item.start_time || 'N/A',
                    item.end_time || 'N/A',
                    item.activity || '',
                    item.notes || '',
                    crewNames || 'N/A'
                ];
            });

            (pdf as any).autoTable({
                head: detailedScheduleHead,
                body: detailedScheduleBody,
                startY: lastY,
                theme: 'grid',
                headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineColor: [221, 221, 221], lineWidth: 0.5 },
                alternateRowStyles: { fillColor: [248, 249, 250] },
                margin: { left: 40, right: 40 },
            });
            lastY = (pdf as any).lastAutoTable.finalY + 30;
        }

        // --- Labor Schedule Table ---
        if (scheduleData.labor_schedule_items && scheduleData.labor_schedule_items.length > 0) {
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text("Labor Schedule", 40, lastY);
            lastY += 20;

            const laborScheduleHead = [['Name', 'Position', 'Date', 'Time In', 'Time Out', 'Notes']];
            const laborScheduleBody = scheduleData.labor_schedule_items.map(item => [
                item.name || '',
                item.position || '',
                item.date ? new Date(item.date + 'T00:00:00Z').toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', timeZone: 'UTC' }) : 'N/A',
                item.time_in || 'N/A',
                item.time_out || 'N/A',
                item.notes || ''
            ]);

            (pdf as any).autoTable({
                head: laborScheduleHead,
                body: laborScheduleBody,
                startY: lastY,
                theme: 'grid',
                headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: 'bold' },
                styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineColor: [221, 221, 221], lineWidth: 0.5 },
                alternateRowStyles: { fillColor: [248, 249, 250] },
                margin: { left: 40, right: 40 },
            });
        }

        addPageFooter(pdf);
        pdf.save(`${scheduleData.name || "production-schedule"}-print-friendly.pdf`);

      } catch (error) {
          console.error("Error exporting print-friendly PDF:", error);
          setError("Failed to export print-friendly PDF. See console for details.");
      } finally {
          setIsExporting(false);
          setCurrentExportScheduleData(null);
          setExportScheduleId(null);
      }
    }
  };

  const handleShareSchedule = (schedule: ProductionScheduleSummary) => {
    setSelectedShareSchedule(schedule);
    setShowShareModal(true);
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
            onClick={() => navigate("/production")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Production
          </button>

          <button
            onClick={() => navigate("/production-schedule/new", { state: { from: "/all-production-schedules" } })}
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
                  onClick={() => navigate("/production-schedule/new", { state: { from: "/all-production-schedules" } })}
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
                            onClick={() => navigate(`/production-schedule/${schedule.id}`, { state: { from: "/all-production-schedules" } })}
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
                            onClick={() => handleShareSchedule(schedule)}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Share Schedule"
                            disabled={isExporting || duplicatingId === schedule.id}
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                           <button
                            onClick={() => handleDuplicateSchedule(schedule)}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Duplicate Schedule"
                            disabled={duplicatingId === schedule.id || isExporting}
                          >
                            <Copy className={`h-5 w-5 ${duplicatingId === schedule.id ? "animate-pulse" : ""}`} />
                          </button>
                           <button
                            onClick={() => openExportModalForSchedule(schedule.id)}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Export Schedule"
                            disabled={isExporting && exportScheduleId === schedule.id || duplicatingId === schedule.id}
                          >
                            <Download className={`h-5 w-5 ${(isExporting && exportScheduleId === schedule.id) ? "animate-pulse" : ""}`} />
                          </button>
                          <button
                            onClick={() => navigate(`/production-schedule/${schedule.id}`, { state: { from: "/all-production-schedules" } })}
                            className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Edit"
                            disabled={isExporting || duplicatingId === schedule.id}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(schedule)}
                            className="p-2 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700 transition-colors"
                            title="Delete"
                            disabled={isExporting || duplicatingId === schedule.id}
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
            if (!isExporting) {
                setShowExportModal(false);
                setExportScheduleId(null); 
            }
        }}
        onExportColor={() => exportScheduleId && prepareAndExecuteExport(exportScheduleId, 'color')}
        onExportPrintFriendly={() => exportScheduleId && prepareAndExecuteExport(exportScheduleId, 'print')}
        title="Production Schedule"
        isExporting={isExporting && !!exportScheduleId} 
      />

      {currentExportScheduleData && (
        <>
          <ProductionScheduleExport 
            key={`export-${currentExportScheduleData.id}-${currentExportScheduleData.last_edited || currentExportScheduleData.created_at}`}
            ref={exportRef} 
            schedule={currentExportScheduleData} 
          />
        </>
      )}

      {showShareModal && selectedShareSchedule && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedShareSchedule(null);
          }}
          resourceId={selectedShareSchedule.id}
          resourceType="production_schedule"
          resourceName={selectedShareSchedule.name}
        />
      )}

      <Footer />
    </div>
  );
};

export default AllProductionSchedules;

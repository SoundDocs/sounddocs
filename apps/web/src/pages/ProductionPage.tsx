import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  PlusCircle,
  Trash2,
  Edit,
  Download,
  List,
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  Loader,
  Info,
  ArrowLeftCircle,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ExportModal from "../components/ExportModal";
import ProductionScheduleExport from "../components/production-schedule/ProductionScheduleExport";
import PrintProductionScheduleExport from "../components/production-schedule/PrintProductionScheduleExport";
import RunOfShowExport from "../components/run-of-show/RunOfShowExport";
import PrintRunOfShowExport from "../components/run-of-show/PrintRunOfShowExport";
import { ScheduleForExport } from "../lib/types";
import { DetailedScheduleItem } from "../components/production-schedule/ProductionScheduleDetail";
import { LaborScheduleItem } from "../components/production-schedule/ProductionScheduleLabor";
import { RunOfShowItem, CustomColumnDefinition } from "./RunOfShowEditor";
import { v4 as uuidv4 } from "uuid";

interface ProductionScheduleSummary {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
}

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
  default_column_colors?: Record<string, string>; // Store colors for default columns
}

const isColorLight = (hexColor?: string): boolean => {
  if (!hexColor) return true;
  try {
    const color = hexColor.startsWith("#") ? hexColor.substring(1) : hexColor;
    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);
    const hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return hsp > 127.5;
  } catch (e) {
    return true;
  }
};

const parseDateTime = (dateTimeStr: string | null | undefined) => {
  if (!dateTimeStr) return { date: undefined, time: undefined, full: undefined };
  try {
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return { date: dateTimeStr, time: undefined, full: dateTimeStr };
    return {
      date: d.toISOString().split("T")[0],
      time: d.toTimeString().split(" ")[0].substring(0, 5),
      full: dateTimeStr,
    };
  } catch (e) {
    return { date: dateTimeStr, time: undefined, full: dateTimeStr };
  }
};

const transformToScheduleForExport = (
  fullSchedule: FullProductionScheduleData,
): ScheduleForExport => {
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
    crew_key: fullSchedule.crew_key?.map((ck) => ({ ...ck })) || [],
    detailed_schedule_items:
      fullSchedule.detailed_schedule_items?.map((item) => ({
        ...item,
        assigned_crew_ids: item.assigned_crew_ids || [],
      })) || [],
    labor_schedule_items: fullSchedule.labor_schedule_items?.map((item) => ({ ...item })) || [],
  };
};

const ProductionPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [_user, setUser] = useState<any>(null);
  const [productionSchedules, setProductionSchedules] = useState<ProductionScheduleSummary[]>([]);
  const [runOfShows, setRunOfShows] = useState<RunOfShowSummary[]>([]);

  const [exportingItemId, setExportingItemId] = useState<string | null>(null);

  const [currentExportProductionSchedule, setCurrentExportProductionSchedule] =
    useState<ScheduleForExport | null>(null);
  const [showProductionScheduleExportModal, setShowProductionScheduleExportModal] = useState(false);
  const [exportProductionScheduleId, setExportProductionScheduleId] = useState<string | null>(null);

  const [currentExportRunOfShow, setCurrentExportRunOfShow] = useState<FullRunOfShowData | null>(
    null,
  );
  const [showRunOfShowExportModal, setShowRunOfShowExportModal] = useState(false);
  const [exportRunOfShowId, setExportRunOfShowId] = useState<string | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    type: "schedule" | "runofshow";
    name: string;
  } | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const productionScheduleExportRef = useRef<HTMLDivElement>(null);
  const printProductionScheduleExportRef = useRef<HTMLDivElement>(null);
  const runOfShowExportRef = useRef<HTMLDivElement>(null);
  const printRunOfShowExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (data.user) {
          setUser(data.user);
          await Promise.all([
            fetchProductionSchedules(data.user.id),
            fetchRunOfShows(data.user.id),
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
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
      setSupabaseError("Failed to fetch production schedules.");
    }
  };

  const fetchRunOfShows = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("run_of_shows")
        .select("id, name, created_at, last_edited")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setRunOfShows(data as RunOfShowSummary[]);
    } catch (error) {
      console.error("Error fetching run of shows:", error);
      setSupabaseError("Failed to fetch run of shows.");
    }
  };

  const handleCreateProductionSchedule = () =>
    navigate("/production-schedule/new", { state: { from: "/production" } });
  const handleCreateRunOfShow = () =>
    navigate("/run-of-show/new", { state: { from: "/production" } });

  const handleDeleteRequest = (id: string, type: "schedule" | "runofshow", name: string) => {
    setDocumentToDelete({ id, type, name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      let tableName = "";
      if (documentToDelete.type === "schedule") tableName = "production_schedules";
      else if (documentToDelete.type === "runofshow") tableName = "run_of_shows";

      if (tableName) {
        const { error } = await supabase.from(tableName).delete().eq("id", documentToDelete.id);
        if (error) throw error;

        if (documentToDelete.type === "schedule") {
          setProductionSchedules(
            productionSchedules.filter((item) => item.id !== documentToDelete.id),
          );
        } else if (documentToDelete.type === "runofshow") {
          setRunOfShows(runOfShows.filter((item) => item.id !== documentToDelete.id));
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

  const handleEditProductionSchedule = (id: string) =>
    navigate(`/production-schedule/${id}`, { state: { from: "/production" } });
  const handleEditRunOfShow = (id: string) =>
    navigate(`/run-of-show/${id}`, { state: { from: "/production" } });

  const handleExportClick = (id: string, type: "schedule" | "runofshow") => {
    if (type === "schedule") {
      setExportProductionScheduleId(id);
      setShowProductionScheduleExportModal(true);
    } else if (type === "runofshow") {
      setExportRunOfShowId(id);
      setShowRunOfShowExportModal(true);
    }
  };

  const exportAsPdf = async (
    targetRef: React.RefObject<HTMLDivElement>,
    itemName: string,
    fileNameSuffix: string,
    backgroundColor: string,
    font: string,
  ) => {
    if (!targetRef.current) {
      console.error("Export component ref not ready.");
      setSupabaseError("Export component not ready. Please try again.");
      return;
    }

    if (document.fonts && typeof document.fonts.ready === "function") {
      try {
        await document.fonts.ready;
      } catch (fontError) {
        console.warn("Error waiting for document fonts to be ready:", fontError);
      }
    } else {
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    try {
      const canvas = await html2canvas(targetRef.current, {
        scale: 2,
        backgroundColor,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const styleGlobal = clonedDoc.createElement("style");
          styleGlobal.innerHTML = `* { font-family: ${font}, sans-serif !important; vertical-align: baseline !important; }`;
          clonedDoc.head.appendChild(styleGlobal);
          clonedDoc.body.style.fontFamily = `${font}, sans-serif`;
          Array.from(clonedDoc.querySelectorAll("*")).forEach((el: any) => {
            if (el.style) {
              el.style.fontFamily = `${font}, sans-serif`;
              el.style.verticalAlign = "baseline";
            }
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
      setSupabaseError(`Failed to export ${fileNameSuffix}. See console for details.`);
    }
  };

  const prepareAndExecuteProductionScheduleExport = async (
    scheduleId: string,
    type: "color" | "print",
  ) => {
    setExportingItemId(scheduleId);
    setShowProductionScheduleExportModal(false);
    try {
      const { data: rawData, error } = await supabase
        .from("production_schedules")
        .select("*")
        .eq("id", scheduleId)
        .single();
      if (error || !rawData) throw error || new Error("Production schedule not found");

      const transformedData = transformToScheduleForExport(rawData as FullProductionScheduleData);

      if (type === "color") {
        setCurrentExportProductionSchedule(transformedData);
        await new Promise((resolve) => setTimeout(resolve, 50));
        await exportAsPdf(
          productionScheduleExportRef,
          transformedData.name,
          "production-schedule-color",
          "#0f172a",
          "Inter",
        );
      } else {
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
              doc.setDrawColor(221, 221, 221);
              doc.line(40, pageHeight - 35, pageWidth - 40, pageHeight - 35);
              doc.setFontSize(8);
              doc.setTextColor(128, 128, 128);
              doc.setFont("helvetica", "bold");
              doc.text("SoundDocs", 40, pageHeight - 20);
              doc.setFont("helvetica", "normal");
              doc.text("| Professional Audio Documentation", 95, pageHeight - 20);
              const pageNumText = `Page ${i} of ${pageCount}`;
              doc.text(pageNumText, pageWidth / 2, pageHeight - 20, { align: "center" });
              const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
              doc.text(dateStr, pageWidth - 40, pageHeight - 20, { align: "right" });
            }
          };

          addPageHeader(pdf, scheduleData.name);

          let lastY = 105;

          const createInfoBlock = (title: string, data: [string, string][]) => {
            if (!data.some((row) => row[1] && row[1] !== "N/A")) return;

            pdf.setFontSize(11);
            pdf.setFont("helvetica", "bold");
            pdf.text(title, 40, lastY);

            (pdf as any).autoTable({
              body: data,
              startY: lastY + 5,
              theme: "plain",
              styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: { top: 2, right: 5, bottom: 2, left: 0 },
              },
              columnStyles: {
                0: { fontStyle: "bold", cellWidth: 120 },
              },
              margin: { left: 40 },
            });
            lastY = (pdf as any).lastAutoTable.finalY + 15;
          };

          const eventDetails: [string, string][] = [
            ["Event Name:", info.event_name || "N/A"],
            ["Job Number:", info.job_number || "N/A"],
            ["Venue:", info.venue || "N/A"],
          ];
          createInfoBlock("Event Details", eventDetails);

          const personnelDetails: [string, string][] = [
            ["Project Manager:", info.project_manager || "N/A"],
            ["Production Manager:", info.production_manager || "N/A"],
            ["Account Manager:", info.account_manager || "N/A"],
          ];
          createInfoBlock("Key Personnel", personnelDetails);

          const timeDetails: [string, string][] = [
            [
              "Date:",
              info.date
                ? new Date(info.date + "T00:00:00Z").toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })
                : "N/A",
            ],
            ["Load In:", info.load_in || "N/A"],
            ["Strike:", parseDateTime(info.strike_datetime).time || "N/A"],
          ];
          createInfoBlock("Key Times", timeDetails);

          lastY += 15;

          if (
            scheduleData.detailed_schedule_items &&
            scheduleData.detailed_schedule_items.length > 0
          ) {
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text("Detailed Production Schedule", 40, lastY);
            lastY += 20;

            // Group items by date while preserving user-defined order within each group
            const groupedItems: Record<string, typeof scheduleData.detailed_schedule_items> = {};
            scheduleData.detailed_schedule_items.forEach((item) => {
              const dateKey = item.date || "No Date Assigned";
              if (!groupedItems[dateKey]) {
                groupedItems[dateKey] = [];
              }
              groupedItems[dateKey].push(item);
            });

            // Sort groups by date (earliest first)
            const sortedGroups = Object.entries(groupedItems).sort(([dateA], [dateB]) => {
              if (dateA === "No Date Assigned") return 1;
              if (dateB === "No Date Assigned") return -1;
              try {
                return (
                  new Date(dateA + "T00:00:00Z").getTime() -
                  new Date(dateB + "T00:00:00Z").getTime()
                );
              } catch (e) {
                return 0;
              }
            });

            // Render each date group with its own header and table
            sortedGroups.forEach(([dateKey, items]) => {
              // Add date header
              pdf.setFontSize(11);
              pdf.setFont("helvetica", "bold");
              pdf.setFillColor(226, 232, 240); // Light blue-gray background
              pdf.rect(40, lastY - 5, pdf.internal.pageSize.width - 80, 20, "F");
              pdf.setTextColor(0, 0, 0);

              const dateDisplay =
                dateKey === "No Date Assigned"
                  ? "No Date Assigned"
                  : new Date(dateKey + "T00:00:00Z").toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    });
              pdf.text(dateDisplay, 50, lastY + 5);
              lastY += 20;

              // Create table for this date group (without date column)
              const detailedScheduleHead = [["Start", "End", "Activity", "Notes", "Crew"]];
              const detailedScheduleBody = items.map((item) => {
                const crewNames = item.assigned_crew_ids
                  .map((id) => scheduleData.crew_key.find((c) => c.id === id)?.name)
                  .filter(Boolean)
                  .join(", ");
                return [
                  item.start_time || "-",
                  item.end_time || "-",
                  item.activity || "",
                  item.notes || "",
                  crewNames || "-",
                ];
              });

              (pdf as any).autoTable({
                head: detailedScheduleHead,
                body: detailedScheduleBody,
                startY: lastY,
                theme: "grid",
                headStyles: {
                  fillColor: [30, 30, 30],
                  textColor: 255,
                  fontStyle: "bold",
                  fontSize: 9,
                },
                styles: {
                  font: "helvetica",
                  fontSize: 9,
                  cellPadding: 5,
                  lineColor: [221, 221, 221],
                  lineWidth: 0.5,
                },
                columnStyles: {
                  0: { cellWidth: 50 }, // Start time
                  1: { cellWidth: 50 }, // End time
                  2: { cellWidth: 150 }, // Activity
                  3: { cellWidth: 180 }, // Notes
                  4: { cellWidth: 100 }, // Crew
                },
                alternateRowStyles: { fillColor: [248, 249, 250] },
                margin: { left: 40, right: 40 },
              });
              lastY = (pdf as any).lastAutoTable.finalY + 15;
            });

            lastY += 15; // Extra space after all detailed schedule items
          }

          if (scheduleData.labor_schedule_items && scheduleData.labor_schedule_items.length > 0) {
            pdf.setFontSize(14);
            pdf.setFont("helvetica", "bold");
            pdf.text("Labor Schedule", 40, lastY);
            lastY += 20;

            // Sort labor items by date and time
            const sortedLaborItems = [...scheduleData.labor_schedule_items].sort((a, b) => {
              const dateA = a.date || "";
              const dateB = b.date || "";
              if (dateA < dateB) return -1;
              if (dateA > dateB) return 1;
              const timeInA = a.time_in || "";
              const timeInB = b.time_in || "";
              if (timeInA < timeInB) return -1;
              if (timeInA > timeInB) return 1;
              return (a.name || "").localeCompare(b.name || "");
            });

            // Group items by date
            const laborGroupedItems: Record<string, typeof sortedLaborItems> = {};
            sortedLaborItems.forEach((item) => {
              const dateKey = item.date || "No Date Assigned";
              if (!laborGroupedItems[dateKey]) {
                laborGroupedItems[dateKey] = [];
              }
              laborGroupedItems[dateKey].push(item);
            });

            // Sort groups by date
            const sortedLaborGroups = Object.entries(laborGroupedItems).sort(([dateA], [dateB]) => {
              if (dateA === "No Date Assigned") return 1;
              if (dateB === "No Date Assigned") return -1;
              try {
                return (
                  new Date(dateA + "T00:00:00Z").getTime() -
                  new Date(dateB + "T00:00:00Z").getTime()
                );
              } catch (e) {
                return 0;
              }
            });

            // Render each date group with its own header and table
            sortedLaborGroups.forEach(([dateKey, items]) => {
              // Add date header
              pdf.setFontSize(11);
              pdf.setFont("helvetica", "bold");
              pdf.setFillColor(226, 232, 240); // Light blue-gray background
              pdf.rect(40, lastY - 5, pdf.internal.pageSize.width - 80, 20, "F");
              pdf.setTextColor(0, 0, 0);

              const dateDisplay =
                dateKey === "No Date Assigned"
                  ? "No Date Assigned"
                  : new Date(dateKey + "T00:00:00Z").toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    });
              pdf.text(dateDisplay, 50, lastY + 5);
              lastY += 20;

              // Create table for this date group (without date column)
              const laborScheduleHead = [["Name", "Position", "Time In", "Time Out", "Notes"]];
              const laborScheduleBody = items.map((item) => [
                item.name || "",
                item.position || "",
                item.time_in || "-",
                item.time_out || "-",
                item.notes || "",
              ]);

              (pdf as any).autoTable({
                head: laborScheduleHead,
                body: laborScheduleBody,
                startY: lastY,
                theme: "grid",
                headStyles: {
                  fillColor: [30, 30, 30],
                  textColor: 255,
                  fontStyle: "bold",
                  fontSize: 9,
                },
                styles: {
                  font: "helvetica",
                  fontSize: 9,
                  cellPadding: 5,
                  lineColor: [221, 221, 221],
                  lineWidth: 0.5,
                },
                columnStyles: {
                  0: { cellWidth: 120 }, // Name
                  1: { cellWidth: 120 }, // Position
                  2: { cellWidth: 60 }, // Time In
                  3: { cellWidth: 60 }, // Time Out
                  4: { cellWidth: 170 }, // Notes
                },
                alternateRowStyles: { fillColor: [248, 249, 250] },
                margin: { left: 40, right: 40 },
              });
              lastY = (pdf as any).lastAutoTable.finalY + 15;
            });
          }

          addPageFooter(pdf);
          pdf.save(`${scheduleData.name || "production-schedule"}-print-friendly.pdf`);
        } catch (error) {
          console.error("Error exporting print-friendly PDF:", error);
          setSupabaseError("Failed to export print-friendly PDF. See console for details.");
        }
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

  const prepareAndExecuteRunOfShowExport = async (runOfShowId: string, type: "color" | "print") => {
    setExportingItemId(runOfShowId);
    setShowRunOfShowExportModal(false);
    try {
      const { data, error } = await supabase
        .from("run_of_shows")
        .select("*")
        .eq("id", runOfShowId)
        .single();
      if (error || !data) throw error || new Error("Run of Show not found");

      const fullData = {
        ...data,
        items: data.items || [],
        custom_column_definitions: data.custom_column_definitions || [],
        default_column_colors: data.default_column_colors || {},
      } as FullRunOfShowData;

      if (type === "color") {
        setCurrentExportRunOfShow(fullData);
        await new Promise((resolve) => setTimeout(resolve, 50));
        await exportAsPdf(
          runOfShowExportRef,
          fullData.name,
          "run-of-show-color",
          "#0f172a",
          "Inter",
        );
      } else {
        try {
          const pdf = new jsPDF("l", "pt", "letter"); // Landscape orientation

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
              doc.setDrawColor(221, 221, 221);
              doc.line(40, pageHeight - 35, pageWidth - 40, pageHeight - 35);
              doc.setFontSize(8);
              doc.setTextColor(128, 128, 128);
              doc.setFont("helvetica", "bold");
              doc.text("SoundDocs", 40, pageHeight - 20);
              doc.setFont("helvetica", "normal");
              doc.text("| Professional Audio Documentation", 95, pageHeight - 20);
              const pageNumText = `Page ${i} of ${pageCount}`;
              doc.text(pageNumText, pageWidth / 2, pageHeight - 20, { align: "center" });
              const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
              doc.text(dateStr, pageWidth - 40, pageHeight - 20, { align: "right" });
            }
          };

          addPageHeader(pdf, fullData.name);

          const defaultCols = [
            { key: "itemNumber", label: "Item #" },
            { key: "startTime", label: "Start" },
            { key: "preset", label: "Preset / Scene" },
            { key: "duration", label: "Duration" },
            { key: "productionNotes", label: "Production Notes" },
            { key: "audio", label: "Audio" },
            { key: "video", label: "Video" },
            { key: "lights", label: "Lights" },
          ];

          const customCols = fullData.custom_column_definitions || [];
          const head = [defaultCols.map((c) => c.label).concat(customCols.map((c) => c.name))];

          const body: any[] = [];

          fullData.items.forEach((item) => {
            if (item.type === "header") {
              body.push([
                {
                  content: `${item.headerTitle || "Header"} (Start: ${item.startTime || "N/A"})`,
                  colSpan: head[0].length,
                  styles: {
                    fontStyle: "bold",
                    fillColor: [230, 230, 230],
                    textColor: 0,
                    halign: "left",
                  },
                },
              ]);
            } else {
              const rowData = defaultCols.map((col) => item[col.key as keyof RunOfShowItem] || "");
              const customData = customCols.map((cc) => item[cc.name] || "");
              body.push([...rowData, ...customData]);
            }
          });

          (pdf as any).autoTable({
            head: head,
            body: body,
            startY: 95,
            theme: "grid",
            headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
            styles: {
              font: "helvetica",
              fontSize: 8,
              cellPadding: 5,
              lineColor: [221, 221, 221],
              lineWidth: 0.5,
            },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { left: 40, right: 40 },
            didParseCell: (data: any) => {
              if (data.section === "body") {
                const item = fullData.items[data.row.index];
                if (item && item.type !== "header" && item.highlightColor) {
                  data.cell.styles.fillColor = item.highlightColor;
                  data.cell.styles.textColor = isColorLight(item.highlightColor) ? "#111" : "#FFF";
                }
              }
            },
          });

          addPageFooter(pdf);
          pdf.save(`${fullData.name.replace(/\s+/g, "-").toLowerCase()}-run-of-show-print.pdf`);
        } catch (error) {
          console.error("Error exporting print-friendly PDF:", error);
          setSupabaseError("Failed to export print-friendly PDF. See console for details.");
        }
      }
    } catch (err) {
      console.error("Error preparing Run of Show export:", err);
      setSupabaseError("Failed to prepare Run of Show for export.");
    } finally {
      setCurrentExportRunOfShow(null);
      setExportingItemId(null);
      setExportRunOfShowId(null);
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
          <h1 className="text-4xl font-bold text-white mb-4">Production Documents</h1>
          <p className="text-lg text-gray-300">
            Manage your production schedules and run of shows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
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
                  {productionSchedules.slice(0, 3).map((schedule) => (
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportClick(schedule.id, "schedule");
                          }}
                          disabled={exportingItemId === schedule.id}
                        >
                          {exportingItemId === schedule.id ? (
                            <Loader className="h-5 w-5 animate-spin" />
                          ) : (
                            <Download className="h-5 w-5" />
                          )}
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
                          onClick={() =>
                            handleDeleteRequest(schedule.id, "schedule", schedule.name)
                          }
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-700 rounded-lg text-center">
                  <p className="text-gray-300 mb-4">
                    You haven't created any production schedules yet
                  </p>
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
                  {productionSchedules.length > 0 && (
                    <button
                      className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                      onClick={() => navigate("/all-production-schedules")}
                    >
                      <List className="h-5 w-5 mr-2" />
                      View All {productionSchedules.length > 0 && `(${productionSchedules.length})`}
                    </button>
                  )}
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
                  {runOfShows.slice(0, 3).map((ros) => (
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportClick(ros.id, "runofshow");
                          }}
                          disabled={exportingItemId === ros.id}
                        >
                          {exportingItemId === ros.id ? (
                            <Loader className="h-5 w-5 animate-spin" />
                          ) : (
                            <Download className="h-5 w-5" />
                          )}
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
                  {runOfShows.length > 0 && (
                    <button
                      className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                      onClick={() => navigate("/all-run-of-shows")}
                    >
                      <List className="h-5 w-5 mr-2" />
                      View All {runOfShows.length > 0 && `(${runOfShows.length})`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ExportModal
        isOpen={showProductionScheduleExportModal}
        onClose={() => {
          if (!exportingItemId) setShowProductionScheduleExportModal(false);
        }}
        onExportColor={() =>
          exportProductionScheduleId &&
          prepareAndExecuteProductionScheduleExport(exportProductionScheduleId, "color")
        }
        onExportPrintFriendly={() =>
          exportProductionScheduleId &&
          prepareAndExecuteProductionScheduleExport(exportProductionScheduleId, "print")
        }
        title="Production Schedule"
        isExporting={!!exportingItemId && !!exportProductionScheduleId}
      />

      <ExportModal
        isOpen={showRunOfShowExportModal}
        onClose={() => {
          if (!exportingItemId) setShowRunOfShowExportModal(false);
        }}
        onExportColor={() =>
          exportRunOfShowId && prepareAndExecuteRunOfShowExport(exportRunOfShowId, "color")
        }
        onExportPrintFriendly={() =>
          exportRunOfShowId && prepareAndExecuteRunOfShowExport(exportRunOfShowId, "print")
        }
        title="Run of Show"
        isExporting={!!exportingItemId && !!exportRunOfShowId}
      />

      {currentExportProductionSchedule && (
        <>
          <ProductionScheduleExport
            key={`export-ps-${currentExportProductionSchedule.id}-${currentExportProductionSchedule.last_edited || currentExportProductionSchedule.created_at}`}
            ref={productionScheduleExportRef}
            schedule={currentExportProductionSchedule}
          />
          <PrintProductionScheduleExport
            key={`print-export-ps-${currentExportProductionSchedule.id}-${currentExportProductionSchedule.last_edited || currentExportProductionSchedule.created_at}`}
            ref={printProductionScheduleExportRef}
            schedule={currentExportProductionSchedule}
          />
        </>
      )}

      {currentExportRunOfShow && (
        <>
          <RunOfShowExport
            key={`export-ros-${currentExportRunOfShow.id}-${currentExportRunOfShow.last_edited || currentExportRunOfShow.created_at}`}
            ref={runOfShowExportRef}
            schedule={currentExportRunOfShow}
          />
          <PrintRunOfShowExport
            key={`print-export-ros-${currentExportRunOfShow.id}-${currentExportRunOfShow.last_edited || currentExportRunOfShow.created_at}`}
            ref={printRunOfShowExportRef}
            schedule={currentExportRunOfShow}
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
                  Delete{" "}
                  {documentToDelete.type === "schedule" ? "Production Schedule" : "Run of Show"}
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

export default ProductionPage;

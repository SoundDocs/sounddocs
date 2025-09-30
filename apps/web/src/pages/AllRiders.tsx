import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import RiderExport from "../components/rider/RiderExport";
import PrintRiderExport from "../components/rider/PrintRiderExport";
import ExportModal from "../components/ExportModal";
import ShareModal from "../components/ShareModal";
import { RiderForExport } from "../lib/types";
import {
  PlusCircle,
  Edit,
  Trash2,
  ArrowLeft,
  Loader,
  AlertTriangle,
  FileText,
  Search,
  SortAsc,
  SortDesc,
  Download,
  Share2,
} from "lucide-react";

interface RiderSummary {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  artist_name?: string;
}

type SortField = "name" | "created_at" | "last_edited" | "artist_name";
type SortDirection = "asc" | "desc";

const AllRiders: React.FC = () => {
  const navigate = useNavigate();
  const [riders, setRiders] = useState<RiderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [riderToDelete, setRiderToDelete] = useState<RiderSummary | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>("last_edited");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRiderId, setExportRiderId] = useState<string | null>(null);
  const [currentExportRider, setCurrentExportRider] = useState<RiderForExport | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareRider, setSelectedShareRider] = useState<RiderSummary | null>(null);

  const riderExportRef = useRef<HTMLDivElement>(null);
  const printRiderExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserAndRiders = async () => {
      setLoading(true);
      setError(null);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        navigate("/login");
        return;
      }
      setUser(userData.user);

      const { data, error: fetchError } = await supabase
        .from("technical_riders")
        .select("id, name, created_at, last_edited, artist_name")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching technical riders:", fetchError);
        setError("Failed to load technical riders. Please try again.");
      } else if (data) {
        setRiders(data as RiderSummary[]);
      }
      setLoading(false);
    };

    fetchUserAndRiders();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteRequest = (rider: RiderSummary) => {
    setRiderToDelete(rider);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!riderToDelete) return;

    try {
      const { error: deleteError } = await supabase
        .from("technical_riders")
        .delete()
        .eq("id", riderToDelete.id);

      if (deleteError) throw deleteError;

      setRiders(riders.filter((r) => r.id !== riderToDelete.id));
      setShowDeleteConfirm(false);
      setRiderToDelete(null);
    } catch (error) {
      console.error("Error deleting technical rider:", error);
      setError("Failed to delete technical rider. Please try again.");
      setShowDeleteConfirm(false);
      setRiderToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setRiderToDelete(null);
  };

  const handleExportClick = (id: string) => {
    setExportRiderId(id);
    setShowExportModal(true);
  };

  const handleShareRider = (rider: RiderSummary) => {
    setSelectedShareRider(rider);
    setShowShareModal(true);
  };

  const exportAsPdf = async (
    targetRef: React.RefObject<HTMLDivElement>,
    itemName: string,
    fileNameSuffix: string,
    backgroundColor: string,
  ) => {
    if (!targetRef.current) {
      console.error("Export component ref not ready.");
      setError("Export component not ready. Please try again.");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const canvas = await html2canvas(targetRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "letter");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`${itemName}-${fileNameSuffix}.pdf`);
  };

  const prepareAndExecuteRiderExport = async (riderId: string, type: "color" | "print") => {
    setIsExporting(true);
    setShowExportModal(false);
    try {
      const { data, error: fetchError } = await supabase
        .from("technical_riders")
        .select("*")
        .eq("id", riderId)
        .single();

      if (fetchError || !data) throw fetchError || new Error("Technical Rider not found");

      const riderData = {
        ...data,
        band_members: data.band_members || [],
        input_list: data.input_list || [],
        backline_requirements: data.backline_requirements || [],
        artist_provided_gear: data.artist_provided_gear || [],
        required_staff: data.required_staff || [],
      } as RiderForExport;

      if (type === "color") {
        setCurrentExportRider(riderData);
        await new Promise((resolve) => setTimeout(resolve, 50));
        await exportAsPdf(riderExportRef, riderData.name, "technical-rider-color", "#111827");
      } else {
        // Use jsPDF directly with autoTable for print-friendly version
        try {
          const pdf = new jsPDF("p", "pt", "letter");

          const addPageHeader = (doc: jsPDF, title: string) => {
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text("SoundDocs", 40, 50);
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100, 100, 100);
            doc.text("Technical Rider", 40, 68);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(0, 0, 0);
            doc.text(title, 40, 90);
            doc.setDrawColor(221, 221, 221);
            doc.line(40, 100, doc.internal.pageSize.width - 40, 100);
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
              doc.text("| Professional Event Documentation", 95, pageHeight - 20);
              const pageNumText = `Page ${i} of ${pageCount}`;
              doc.text(pageNumText, pageWidth / 2, pageHeight - 20, { align: "center" });
              const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
              doc.text(dateStr, pageWidth - 40, pageHeight - 20, { align: "right" });
            }
          };

          addPageHeader(pdf, riderData.artist_name || "Artist Name");

          let lastY = 120;

          // Contact Information
          const contactInfo: [string, string][] = [
            ["Contact Name:", riderData.contact_name || "N/A"],
            ["Email:", riderData.contact_email || "N/A"],
            ["Phone:", riderData.contact_phone || "N/A"],
            ["Genre:", riderData.genre || "N/A"],
          ];

          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text("Primary Contact", 40, lastY);

          (
            pdf as unknown as {
              autoTable: (opts: unknown) => void;
              lastAutoTable: { finalY: number };
            }
          ).autoTable({
            body: contactInfo,
            startY: lastY + 10,
            theme: "plain",
            styles: {
              font: "helvetica",
              fontSize: 10,
              cellPadding: { top: 3, right: 5, bottom: 3, left: 0 },
            },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 100 },
            },
            margin: { left: 40 },
          });
          lastY =
            (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;

          // Band Members
          if (riderData.band_members && riderData.band_members.length > 0) {
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Band Members", 40, lastY);

            (
              pdf as unknown as {
                autoTable: (opts: unknown) => void;
                lastAutoTable: { finalY: number };
              }
            ).autoTable({
              head: [["Name", "Instrument", "Input Needs"]],
              body: riderData.band_members.map((m) => [
                m.name || "-",
                m.instrument || "-",
                m.input_needs || "-",
              ]),
              startY: lastY + 10,
              theme: "grid",
              headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
              styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: 5,
              },
              margin: { left: 40, right: 40 },
            });
            lastY =
              (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
          }

          // Input List
          if (riderData.input_list && riderData.input_list.length > 0) {
            if (lastY > 600) {
              pdf.addPage();
              lastY = 60;
            }

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Input/Channel List", 40, lastY);

            (
              pdf as unknown as {
                autoTable: (opts: unknown) => void;
                lastAutoTable: { finalY: number };
              }
            ).autoTable({
              head: [["Ch", "Name", "Type", "Mic", "48V", "DI", "Notes"]],
              body: riderData.input_list.map((input) => [
                input.channel_number || "-",
                input.name || "-",
                input.type || "-",
                input.mic_type || "-",
                input.phantom_power ? "✓" : "",
                input.di_needed ? "✓" : "",
                input.notes || "",
              ]),
              startY: lastY + 10,
              theme: "grid",
              headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
              styles: {
                font: "helvetica",
                fontSize: 8,
                cellPadding: 4,
              },
              columnStyles: {
                0: { cellWidth: 30 },
                4: { halign: "center", cellWidth: 30 },
                5: { halign: "center", cellWidth: 30 },
              },
              margin: { left: 40, right: 40 },
            });
            lastY =
              (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
          }

          // Sound System Requirements
          if (lastY > 650) {
            pdf.addPage();
            lastY = 60;
          }

          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text("Sound System Requirements", 40, lastY);
          lastY += 15;

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text("PA System:", 40, lastY);
          pdf.setFont("helvetica", "normal");
          const paLines = pdf.splitTextToSize(
            riderData.pa_requirements || "Not specified",
            pdf.internal.pageSize.width - 80,
          );
          pdf.text(paLines, 40, lastY + 15);
          lastY += 15 + paLines.length * 12 + 10;

          pdf.setFont("helvetica", "bold");
          pdf.text("Monitor System:", 40, lastY);
          pdf.setFont("helvetica", "normal");
          const monitorLines = pdf.splitTextToSize(
            riderData.monitor_requirements || "Not specified",
            pdf.internal.pageSize.width - 80,
          );
          pdf.text(monitorLines, 40, lastY + 15);
          lastY += 15 + monitorLines.length * 12 + 10;

          pdf.setFont("helvetica", "bold");
          pdf.text("Console Requirements:", 40, lastY);
          pdf.setFont("helvetica", "normal");
          const consoleLines = pdf.splitTextToSize(
            riderData.console_requirements || "Not specified",
            pdf.internal.pageSize.width - 80,
          );
          pdf.text(consoleLines, 40, lastY + 15);
          lastY += 15 + consoleLines.length * 12 + 20;

          // Backline Requirements
          if (riderData.backline_requirements && riderData.backline_requirements.length > 0) {
            if (lastY > 650) {
              pdf.addPage();
              lastY = 60;
            }

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Venue Provided Backline", 40, lastY);

            (
              pdf as unknown as {
                autoTable: (opts: unknown) => void;
                lastAutoTable: { finalY: number };
              }
            ).autoTable({
              head: [["Item", "Quantity", "Specifications"]],
              body: riderData.backline_requirements.map((item) => [
                item.item || "-",
                item.quantity || "-",
                item.notes || "-",
              ]),
              startY: lastY + 10,
              theme: "grid",
              headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
              styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: 5,
              },
              margin: { left: 40, right: 40 },
            });
            lastY =
              (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
          }

          // Artist Provided Gear
          if (riderData.artist_provided_gear && riderData.artist_provided_gear.length > 0) {
            if (lastY > 650) {
              pdf.addPage();
              lastY = 60;
            }

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Artist Provided Equipment", 40, lastY);

            (
              pdf as unknown as {
                autoTable: (opts: unknown) => void;
                lastAutoTable: { finalY: number };
              }
            ).autoTable({
              head: [["Item", "Quantity", "Specifications"]],
              body: riderData.artist_provided_gear.map((item) => [
                item.item || "-",
                item.quantity || "-",
                item.notes || "-",
              ]),
              startY: lastY + 10,
              theme: "grid",
              headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
              styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: 5,
              },
              margin: { left: 40, right: 40 },
            });
            lastY =
              (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
          }

          // Required Staff
          if (riderData.required_staff && riderData.required_staff.length > 0) {
            if (lastY > 650) {
              pdf.addPage();
              lastY = 60;
            }

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Required Technical Staff", 40, lastY);

            (
              pdf as unknown as {
                autoTable: (opts: unknown) => void;
                lastAutoTable: { finalY: number };
              }
            ).autoTable({
              head: [["Role", "Quantity", "Requirements"]],
              body: riderData.required_staff.map((staff) => [
                staff.role || "-",
                staff.quantity || "-",
                staff.notes || "-",
              ]),
              startY: lastY + 10,
              theme: "grid",
              headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
              styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: 5,
              },
              margin: { left: 40, right: 40 },
            });
            lastY =
              (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 20;
          }

          // Special Requirements
          if (lastY > 650) {
            pdf.addPage();
            lastY = 60;
          }

          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text("Special Requirements", 40, lastY);
          lastY += 15;

          if (riderData.special_requirements) {
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            pdf.text("Stage & Production:", 40, lastY);
            pdf.setFont("helvetica", "normal");
            const specialLines = pdf.splitTextToSize(
              riderData.special_requirements,
              pdf.internal.pageSize.width - 80,
            );
            pdf.text(specialLines, 40, lastY + 15);
            lastY += 15 + specialLines.length * 12 + 10;
          }

          if (riderData.power_requirements) {
            pdf.setFont("helvetica", "bold");
            pdf.text("Power Requirements:", 40, lastY);
            pdf.setFont("helvetica", "normal");
            const powerLines = pdf.splitTextToSize(
              riderData.power_requirements,
              pdf.internal.pageSize.width - 80,
            );
            pdf.text(powerLines, 40, lastY + 15);
            lastY += 15 + powerLines.length * 12 + 10;
          }

          if (riderData.lighting_notes) {
            pdf.setFont("helvetica", "bold");
            pdf.text("Lighting:", 40, lastY);
            pdf.setFont("helvetica", "normal");
            const lightingLines = pdf.splitTextToSize(
              riderData.lighting_notes,
              pdf.internal.pageSize.width - 80,
            );
            pdf.text(lightingLines, 40, lastY + 15);
            lastY += 15 + lightingLines.length * 12 + 10;
          }

          // Hospitality
          if (riderData.hospitality_notes) {
            if (lastY > 650) {
              pdf.addPage();
              lastY = 60;
            }

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Hospitality", 40, lastY);
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            const hospitalityLines = pdf.splitTextToSize(
              riderData.hospitality_notes,
              pdf.internal.pageSize.width - 80,
            );
            pdf.text(hospitalityLines, 40, lastY + 15);
            lastY += 15 + hospitalityLines.length * 12 + 10;
          }

          // Additional Notes
          if (riderData.additional_notes) {
            if (lastY > 650) {
              pdf.addPage();
              lastY = 60;
            }

            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            pdf.text("Additional Notes", 40, lastY);
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "normal");
            const additionalLines = pdf.splitTextToSize(
              riderData.additional_notes,
              pdf.internal.pageSize.width - 80,
            );
            pdf.text(additionalLines, 40, lastY + 15);
          }

          addPageFooter(pdf);
          pdf.save(
            `${riderData.name.replace(/\s+/g, "-").toLowerCase()}-technical-rider-print.pdf`,
          );
        } catch (pdfError) {
          console.error("Error generating print-friendly PDF:", pdfError);
          setError("Failed to generate print-friendly PDF. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error exporting technical rider:", error);
      setError("Failed to export technical rider. Please try again.");
    } finally {
      setIsExporting(false);
      setCurrentExportRider(null);
      setExportRiderId(null);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedRiders = useMemo(() => {
    let filtered = riders;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = riders.filter(
        (rider) =>
          rider.name.toLowerCase().includes(lowerSearch) ||
          (rider.artist_name && rider.artist_name.toLowerCase().includes(lowerSearch)),
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let aVal: string | number | undefined;
      let bVal: string | number | undefined;

      if (sortField === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortField === "artist_name") {
        aVal = a.artist_name?.toLowerCase() || "";
        bVal = b.artist_name?.toLowerCase() || "";
      } else if (sortField === "created_at") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      } else if (sortField === "last_edited") {
        aVal = a.last_edited ? new Date(a.last_edited).getTime() : 0;
        bVal = b.last_edited ? new Date(b.last_edited).getTime() : 0;
      }

      if (aVal === undefined) aVal = "";
      if (bVal === undefined) bVal = "";

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [riders, searchTerm, sortField, sortDirection]);

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

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-8">
          <button
            onClick={() => navigate("/production")}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Production Documents
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">All Technical Riders</h1>
              <p className="text-gray-400">
                {riders.length} {riders.length === 1 ? "rider" : "riders"} total
              </p>
            </div>
            <button
              onClick={() => navigate("/rider/new")}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-md font-medium transition-colors"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              New Technical Rider
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-md flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by rider name or artist..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded-md pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block bg-gray-800 rounded-lg overflow-hidden shadow-md">
          <table className="w-full">
            <thead className="bg-gray-750">
              <tr>
                <th className="p-4 text-left">
                  <button
                    onClick={() => handleSort("name")}
                    className="flex items-center text-gray-300 hover:text-white font-semibold"
                  >
                    Rider Name
                    {sortField === "name" &&
                      (sortDirection === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-2 h-4 w-4" />
                      ))}
                  </button>
                </th>
                <th className="p-4 text-left">
                  <button
                    onClick={() => handleSort("artist_name")}
                    className="flex items-center text-gray-300 hover:text-white font-semibold"
                  >
                    Artist
                    {sortField === "artist_name" &&
                      (sortDirection === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-2 h-4 w-4" />
                      ))}
                  </button>
                </th>
                <th className="p-4 text-left">
                  <button
                    onClick={() => handleSort("last_edited")}
                    className="flex items-center text-gray-300 hover:text-white font-semibold"
                  >
                    Last Edited
                    {sortField === "last_edited" &&
                      (sortDirection === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-2 h-4 w-4" />
                      ))}
                  </button>
                </th>
                <th className="p-4 text-left">
                  <button
                    onClick={() => handleSort("created_at")}
                    className="flex items-center text-gray-300 hover:text-white font-semibold"
                  >
                    Created
                    {sortField === "created_at" &&
                      (sortDirection === "asc" ? (
                        <SortAsc className="ml-2 h-4 w-4" />
                      ) : (
                        <SortDesc className="ml-2 h-4 w-4" />
                      ))}
                  </button>
                </th>
                <th className="p-4 text-right text-gray-300 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRiders.map((rider) => (
                <tr
                  key={rider.id}
                  className="border-t border-gray-700 hover:bg-gray-750/50 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-indigo-400 mr-3" />
                      <span className="text-white font-medium">{rider.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-300">{rider.artist_name || "-"}</td>
                  <td className="p-4 text-gray-400">
                    {rider.last_edited ? new Date(rider.last_edited).toLocaleString() : "Never"}
                  </td>
                  <td className="p-4 text-gray-400">
                    {new Date(rider.created_at).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleShareRider(rider)}
                        className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                        title="Share Rider"
                        disabled={isExporting}
                      >
                        <Share2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleExportClick(rider.id)}
                        className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                        title="Download"
                        disabled={isExporting}
                      >
                        {isExporting && exportRiderId === rider.id ? (
                          <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                          <Download className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/rider/${rider.id}`)}
                        className="p-2 text-gray-400 hover:text-indigo-400 rounded-md hover:bg-gray-700 transition-colors"
                        title="Edit"
                        disabled={isExporting}
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(rider)}
                        className="p-2 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700 transition-colors"
                        title="Delete"
                        disabled={isExporting}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAndSortedRiders.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    {searchTerm ? "No riders match your search." : "No technical riders found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredAndSortedRiders.map((rider) => (
            <div key={rider.id} className="bg-gray-800 p-6 rounded-lg shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <FileText className="h-6 w-6 text-indigo-400 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold text-lg">{rider.name}</h3>
                    {rider.artist_name && (
                      <p className="text-gray-400 text-sm">{rider.artist_name}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Edited:</span>
                  <span className="text-white">
                    {rider.last_edited ? new Date(rider.last_edited).toLocaleDateString() : "Never"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Created:</span>
                  <span className="text-white">
                    {new Date(rider.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/rider/${rider.id}`)}
                  className="flex-1 inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                <button
                  onClick={() => handleExportClick(rider.id)}
                  className="inline-flex items-center justify-center bg-gray-700 hover:bg-indigo-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  title="Download"
                  disabled={isExporting}
                >
                  {isExporting && exportRiderId === rider.id ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDeleteRequest(rider)}
                  className="inline-flex items-center justify-center bg-gray-700 hover:bg-red-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredAndSortedRiders.length === 0 && (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchTerm ? "No riders match your search." : "No technical riders found."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && riderToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-white">Delete Technical Rider</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-300">
                    Are you sure you want to delete "{riderToDelete.name}"? This action cannot be
                    undone.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                onClick={cancelDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => {
          if (!isExporting) setShowExportModal(false);
        }}
        onExportColor={() => exportRiderId && prepareAndExecuteRiderExport(exportRiderId, "color")}
        onExportPrintFriendly={() =>
          exportRiderId && prepareAndExecuteRiderExport(exportRiderId, "print")
        }
        title="Technical Rider"
        isExporting={isExporting}
      />

      {/* Hidden Export Components */}
      {currentExportRider && (
        <>
          <RiderExport ref={riderExportRef} rider={currentExportRider} />
          <PrintRiderExport ref={printRiderExportRef} rider={currentExportRider} />
        </>
      )}

      {/* Share Modal */}
      {showShareModal && selectedShareRider && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedShareRider(null);
          }}
          resourceId={selectedShareRider.id}
          resourceType="technical_rider"
          resourceName={selectedShareRider.name}
        />
      )}

      <Footer />
    </div>
  );
};

export default AllRiders;

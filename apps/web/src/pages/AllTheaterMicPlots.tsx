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
  Trash2,
  Edit,
  Download,
  Search,
  SortAsc,
  SortDesc,
  Copy,
  Share2,
  AlertTriangle,
  Drama, // Icon for Theater
  Loader,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ShareModal from "../components/ShareModal";
import ExportModal from "../components/ExportModal";
import TheaterMicPlotExport from "../components/theater-mic-plot/TheaterMicPlotExport";
import PrintTheaterMicPlotExport from "../components/theater-mic-plot/PrintTheaterMicPlotExport";
import { ActorEntry } from "../components/theater-mic-plot/ActorEntryCard";

// Define type for Theater Mic Plots
interface TheaterMicPlot {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  actors?: ActorEntry[]; // Added actors field
  [key: string]: any;
}

const AllTheaterMicPlots = () => {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [micPlots, setMicPlots] = useState<TheaterMicPlot[]>([]);
  const [filteredMicPlots, setFilteredMicPlots] = useState<TheaterMicPlot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "created_at" | "last_edited">("last_edited");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [exportingId, setExportingId] = useState<string | null>(null);
  const [currentExportMicPlot, setCurrentExportMicPlot] = useState<TheaterMicPlot | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMicPlotIdForModal, setExportMicPlotIdForModal] = useState<string | null>(null);

  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareMicPlot, setSelectedShareMicPlot] = useState<TheaterMicPlot | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(
    null,
  );

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
          .from("theater_mic_plots")
          .select("*")
          .eq("user_id", userData.user.id)
          .order(sortField, { ascending: sortDirection === "asc" });
        if (error) throw error;
        if (data) {
          setMicPlots(data as TheaterMicPlot[]);
          setFilteredMicPlots(data as TheaterMicPlot[]);
        }
      } catch (error) {
        console.error("Error fetching theater mic plots:", error);
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
      const filtered = micPlots.filter((plot) => plot.name.toLowerCase().includes(lowercaseSearch));
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
      const { error } = await supabase
        .from("theater_mic_plots")
        .delete()
        .eq("id", documentToDelete.id);
      if (error) throw error;
      setMicPlots(micPlots.filter((item) => item.id !== documentToDelete.id));
      setFilteredMicPlots(filteredMicPlots.filter((item) => item.id !== documentToDelete.id));
    } catch (error) {
      console.error("Error deleting theater mic plot:", error);
      alert("Failed to delete theater mic plot. Please try again.");
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
    navigate(`/theater-mic-plot/${id}`, { state: { from: "/all-theater-mic-plots" } });
  };

  const handleShareMicPlot = (micPlot: TheaterMicPlot) => {
    setSelectedShareMicPlot(micPlot);
    setShowShareModal(true);
  };

  const handleDuplicateMicPlot = async (micPlotToDuplicate: TheaterMicPlot) => {
    if (duplicatingId) return;
    try {
      setDuplicatingId(micPlotToDuplicate.id);
      const { data: fullMicPlot, error: fetchError } = await supabase
        .from("theater_mic_plots")
        .select("*")
        .eq("id", micPlotToDuplicate.id)
        .single();

      if (fetchError) throw fetchError;
      if (!fullMicPlot) throw new Error("Failed to fetch full mic plot data for duplication.");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("User not authenticated");

      const { id, created_at, last_edited, ...plotDataToCopy } = fullMicPlot;
      const newPlotPayload = {
        ...plotDataToCopy,
        name: `Copy of ${fullMicPlot.name}`,
        user_id: userData.user.id,
        created_at: new Date().toISOString(),
        last_edited: new Date().toISOString(),
      };

      const { data: newMicPlotData, error: insertError } = await supabase
        .from("theater_mic_plots")
        .insert([newPlotPayload])
        .select()
        .single();

      if (insertError) throw insertError;
      if (newMicPlotData) {
        const newPlot = newMicPlotData as TheaterMicPlot;
        const sortFn = (a: TheaterMicPlot, b: TheaterMicPlot) => {
          const valA = a[sortField] || a.created_at;
          const valB = b[sortField] || b.created_at;
          if (sortDirection === "asc") {
            return valA > valB ? 1 : -1;
          }
          return valA < valB ? 1 : -1;
        };
        setMicPlots((prevPlots) => [...prevPlots, newPlot].sort(sortFn));
        setFilteredMicPlots((prevPlots) => [...prevPlots, newPlot].sort(sortFn));
      }
    } catch (error) {
      console.error("Error duplicating theater mic plot:", error);
      alert("Failed to duplicate theater mic plot. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleExportMicPlotClick = (plot: TheaterMicPlot) => {
    if (exportingId) return;
    setExportMicPlotIdForModal(plot.id);
    setShowExportModal(true);
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
      alert("Export component not ready. Please try again.");
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
        letterRendering: true,
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
      alert(`Failed to export ${fileNameSuffix}. See console for details.`);
    }
  };

  const prepareAndExecuteExport = async (plotId: string, format: "color" | "print") => {
    setExportingId(plotId);
    setShowExportModal(false);

    try {
      const { data: fullMicPlot, error } = await supabase
        .from("theater_mic_plots")
        .select("*")
        .eq("id", plotId)
        .single();
      if (error) throw error;
      if (!fullMicPlot) throw new Error("Mic plot data not found for export.");

      if (format === "color") {
        setCurrentExportMicPlot(fullMicPlot);
        await new Promise((resolve) => setTimeout(resolve, 150)); // Wait for render
        await exportAsPdf(
          exportRef,
          fullMicPlot.name,
          "theater-mic-plot-color",
          "#111827",
          "Inter",
        );
      } else if (format === "print") {
        const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
        const brandColor = [45, 55, 72]; // A dark slate for headers

        const pageHeader = () => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
          doc.text("SoundDocs", 14, 15);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
          doc.text(fullMicPlot.name, doc.internal.pageSize.getWidth() - 14, 15, { align: "right" });
          doc.setDrawColor(200);
          doc.line(14, 20, doc.internal.pageSize.getWidth() - 14, 20);
        };

        const pageFooter = (data: any) => {
          const pageCount = doc.internal.pages.length;
          const pageWidth = doc.internal.pageSize.getWidth();
          const pageHeight = doc.internal.pageSize.getHeight();

          doc.setDrawColor(221, 221, 221);
          doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

          doc.setFontSize(8);
          doc.setTextColor(128, 128, 128);

          doc.setFont("helvetica", "bold");
          doc.text("SoundDocs", 14, pageHeight - 9);
          doc.setFont("helvetica", "normal");
          doc.text("| Professional Event Documentation", 32, pageHeight - 9);

          if (pageCount > 2) {
            doc.text(`Page ${data.pageNumber} of ${pageCount - 1}`, pageWidth / 2, pageHeight - 9, {
              align: "center",
            });
          }

          const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
          doc.text(dateStr, pageWidth - 14, pageHeight - 9, { align: "right" });
        };

        const head = [
          [
            "Photo",
            "Actor",
            "Character(s)",
            "Channel",
            "Mic Location",
            "TX Location",
            "Backup Mic",
            "Scenes",
            "Notes",
          ],
        ];

        const body = (fullMicPlot.actors || []).map((actor: ActorEntry) => {
          const notes = [actor.costume_notes, actor.wig_hair_notes].filter(Boolean).join(" | ");
          return [
            "", // Placeholder for photo. Will be drawn in `didDrawCell`.
            actor.actor_name || "-",
            actor.character_names || "-",
            actor.element_channel_number || "-",
            actor.element_location || "-",
            actor.transmitter_location || "-",
            actor.backup_element || "-",
            actor.scene_numbers || "-",
            notes || "-",
          ];
        });

        const actorsTitle = [
          [
            {
              content: "Actors & Mics",
              colSpan: 9,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fontSize: 12,
                fillColor: [255, 255, 255],
                textColor: brandColor,
                cellPadding: { top: 4, bottom: 2 },
              },
            },
          ],
        ];

        autoTable(doc, {
          head: actorsTitle.concat(head),
          body: body,
          startY: 25,
          didDrawPage: (data) => {
            pageHeader();
            pageFooter(data);
          },
          margin: { top: 22, bottom: 20 },
          styles: {
            cellPadding: 1.5,
            fontSize: 8,
            overflow: "linebreak",
            valign: "middle",
            minCellHeight: 18,
          },
          headStyles: {
            fillColor: brandColor,
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
            valign: "middle",
          },
          columnStyles: {
            0: { cellWidth: 18, halign: "center" }, // Photo
            1: { cellWidth: 35 }, // Actor
            2: { cellWidth: 35 }, // Character(s)
            3: { cellWidth: 15, halign: "center" }, // Channel
            4: { cellWidth: 30 }, // Mic Location
            5: { cellWidth: 30 }, // TX Location
            6: { cellWidth: 30 }, // Backup Mic
            7: { cellWidth: 20 }, // Scenes
            // 8: Notes (auto)
          },
          didDrawCell: (data) => {
            if (data.section === "body" && data.column.index === 0) {
              const actor = (fullMicPlot.actors || [])[data.row.index];
              if (actor && actor.photo_url && actor.photo_url.startsWith("data:image/")) {
                const imgData = actor.photo_url;
                const formatMatch = imgData.match(/data:image\/(.*?);/);
                const format = formatMatch ? formatMatch[1].toUpperCase() : "PNG";

                doc.setFillColor(255, 255, 255);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");

                const imgDim = 16;
                const x = data.cell.x + (data.cell.width - imgDim) / 2;
                const y = data.cell.y + (data.cell.height - imgDim) / 2;
                try {
                  doc.addImage(imgData, format, x, y, imgDim, imgDim);
                } catch (e) {
                  console.error(`Failed to add image to PDF cell. Format: ${format}`, e);
                }
              }
            }
          },
        });

        doc.save(
          `${fullMicPlot.name.replace(/\s+/g, "-").toLowerCase()}-theater-mic-plot-print.pdf`,
        );
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
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  if (screenSize === "mobile" || screenSize === "tablet") {
    return (
      <MobileScreenWarning
        title="Screen Size Too Small"
        description="Theater Mic Plot management requires a larger screen. Please use a desktop or laptop."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />
      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/all-mic-plots")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" /> Back to Mic Plot Types
          </button>
          <button
            onClick={() =>
              navigate("/theater-mic-plot/new", { state: { from: "/all-theater-mic-plots" } })
            }
            className="inline-flex items-center bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
          >
            <PlusCircle className="h-5 w-5 mr-2" /> New Theater Mic Plot
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">All Theater Mic Plots</h1>
            <p className="text-gray-400">Manage all your theater mic plots in one place</p>
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
                  className="bg-gray-700 text-white w-full pl-10 pr-3 py-2 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Search by name..."
                />
              </div>
              <div className="flex space-x-2">
                {["name", "created_at", "last_edited"].map((field) => (
                  <button
                    key={field}
                    onClick={() => handleSort(field as "name" | "created_at" | "last_edited")}
                    className={`flex items-center px-3 py-2 rounded-md transition-colors ${sortField === field ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
                  >
                    {field.charAt(0).toUpperCase() + field.slice(1).replace("_", " ")}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-750">
                <tr>
                  <th className="text-left py-3 px-6 text-purple-400 font-medium">Name</th>
                  <th className="text-left py-3 px-6 text-purple-400 font-medium">Created</th>
                  <th className="text-left py-3 px-6 text-purple-400 font-medium">Last Edited</th>
                  <th className="text-right py-3 px-6 text-purple-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredMicPlots.length > 0 ? (
                  filteredMicPlots.map((plot) => (
                    <tr key={plot.id} className="hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <Drama className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0" />
                          <span className="text-white font-medium">{plot.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {new Date(plot.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {plot.last_edited
                          ? new Date(plot.last_edited).toLocaleDateString()
                          : new Date(plot.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                            title="Share"
                            onClick={() => handleShareMicPlot(plot)}
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                            title="Duplicate"
                            onClick={() => handleDuplicateMicPlot(plot)}
                            disabled={duplicatingId === plot.id}
                          >
                            <Copy
                              className={`h-5 w-5 ${duplicatingId === plot.id ? "animate-pulse" : ""}`}
                            />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                            title="Download"
                            onClick={() => handleExportMicPlotClick(plot)}
                            disabled={!!exportingId}
                          >
                            {exportingId === plot.id ? (
                              <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                            title="Edit"
                            onClick={() => handleEditMicPlot(plot.id)}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                            onClick={() => handleDeleteRequest(plot.id, plot.name)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-400">
                      {searchTerm
                        ? "No theater mic plots match your search criteria"
                        : "You haven't created any theater mic plots yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredMicPlots.length > 0 && (
            <div className="p-4 border-t border-gray-700 text-gray-400 text-sm">
              Showing {filteredMicPlots.length} of {micPlots.length} theater mic plots
            </div>
          )}
        </div>
      </main>

      {showShareModal && selectedShareMicPlot && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedShareMicPlot(null);
          }}
          resourceId={selectedShareMicPlot.id}
          resourceType="theater_mic_plot"
          resourceName={selectedShareMicPlot.name}
        />
      )}

      <ExportModal
        isOpen={showExportModal}
        onClose={() => {
          if (!exportingId) {
            setShowExportModal(false);
            setExportMicPlotIdForModal(null);
          }
        }}
        onExportColor={() =>
          exportMicPlotIdForModal && prepareAndExecuteExport(exportMicPlotIdForModal, "color")
        }
        onExportPrintFriendly={() =>
          exportMicPlotIdForModal && prepareAndExecuteExport(exportMicPlotIdForModal, "print")
        }
        title="Theater Mic Plot"
        isExporting={!!exportingId}
      />

      {/* Off-screen container for export components */}
      {currentExportMicPlot && (
        <div
          style={{
            position: "absolute",
            left: "-9999px",
            top: "0px",
            zIndex: -100,
            width: "1400px",
          }}
        >
          <TheaterMicPlotExport ref={exportRef} micPlot={currentExportMicPlot} />
          <PrintTheaterMicPlotExport ref={printExportRef} micPlot={currentExportMicPlot} />
        </div>
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
                  Delete Theater Mic Plot
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
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
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

export default AllTheaterMicPlots;

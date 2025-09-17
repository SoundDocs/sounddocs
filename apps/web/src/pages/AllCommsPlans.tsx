import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  PlusCircle,
  ArrowLeft,
  Loader,
  Edit,
  Trash2,
  Download,
  Search,
  SortAsc,
  SortDesc,
  FileText,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CommsPlanExport from "../components/CommsPlanExport";
import PrintCommsPlanExport from "../components/PrintCommsPlanExport";
import ExportModal from "../components/ExportModal";
import { CommsPlan } from "../lib/commsTypes";

interface CommsPlanSummary {
  id: string;
  name: string;
  last_edited: string;
  created_at: string;
}

const AllCommsPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<CommsPlanSummary[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<CommsPlanSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "created_at" | "last_edited">("last_edited");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Export state
  const [exportingItemId, setExportingItemId] = useState<string | null>(null);
  const [currentExportCommsPlan, setCurrentExportCommsPlan] = useState<CommsPlan | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportCommsPlanId, setExportCommsPlanId] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to view comms plans.");
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("comms_plans")
          .select("id, name, last_edited, created_at")
          .eq("user_id", user.id)
          .order(sortField, { ascending: sortDirection === "asc" });

        if (error) throw error;
        setPlans(data || []);
        setFilteredPlans(data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [sortField, sortDirection]);

  // Filter plans when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPlans(plans);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = plans.filter((plan) => plan.name.toLowerCase().includes(lowercaseSearch));
      setFilteredPlans(filtered);
    }
  }, [searchTerm, plans]);

  const handleSort = (field: "name" | "created_at" | "last_edited") => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending for dates, ascending for name
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const handleExportClick = (plan: CommsPlanSummary) => {
    setExportCommsPlanId(plan.id);
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
      setError("Export component not ready. Please try again.");
      return;
    }

    // Additional check to ensure the component has rendered content
    if (!targetRef.current.children || targetRef.current.children.length === 0) {
      console.error("Export component has no content.");
      setError("Export component has no content. Please try again.");
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

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
      setError(`Failed to export ${fileNameSuffix}. See console for details.`);
    }
  };

  const prepareAndExecuteExport = async (commsPlanId: string, exportFormat: "color" | "print") => {
    setExportingItemId(commsPlanId);
    setShowExportModal(false);

    try {
      // Fetch complete comms plan data for export
      const { data: planData, error: planError } = await supabase
        .from("comms_plans")
        .select("*")
        .eq("id", commsPlanId)
        .single();

      if (planError) throw planError;

      // Fetch related transceivers
      const { data: transceiverData, error: transceiverError } = await supabase
        .from("comms_transceivers")
        .select("*")
        .eq("plan_id", commsPlanId);

      if (transceiverError) throw transceiverError;

      // Fetch related beltpacks
      const { data: beltpackData, error: beltpackError } = await supabase
        .from("comms_beltpacks")
        .select("*")
        .eq("plan_id", commsPlanId);

      if (beltpackError) throw beltpackError;

      // Combine the data
      const data = {
        ...planData,
        transceivers: transceiverData || [],
        beltpacks: beltpackData || [],
      };

      if (!planData) throw new Error("Comms plan not found");

      // Transform database data to match expected CommsPlan format
      const commsPlanData: CommsPlan = {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        venueGeometry: {
          width: data.venue_geometry?.width || 100,
          height: data.venue_geometry?.height || 80,
          shape: "rectangle" as const,
        },
        zones: data.zones || [],
        transceivers: (data.transceivers || []).map((tx: any) => ({
          id: tx.id,
          zoneId: tx.zone_id || "zone-1",
          systemType: tx.system_type,
          model: tx.model,
          x: tx.x,
          y: tx.y,
          z: tx.z || 8,
          label: tx.label,
          band: tx.band,
          channels: tx.channel_set,
          dfsEnabled: tx.dfs_enabled,
          poeClass: tx.poe_class,
          coverageRadius: tx.coverage_radius,
          currentBeltpacks: tx.current_beltpacks || 0,
          maxBeltpacks: tx.max_beltpacks || 5,
          overrideFlags: tx.override_flags,
        })),
        beltpacks: (data.beltpacks || []).map((bp: any) => ({
          id: bp.id,
          label: bp.label,
          x: bp.x,
          y: bp.y,
          transceiverRef: bp.transceiverRef || bp.transceiver_ref,
          signalStrength: bp.signalStrength || bp.signal_strength || 100,
          batteryLevel: bp.batteryLevel || bp.battery_level || 100,
          online: bp.online !== false,
          channelAssignments: bp.channelAssignments || bp.channel_assignments || [],
        })),
        switches: data.switches || [],
        interopConfigs: data.interop_configs || [],
        roles: data.roles || [],
        channels: data.channels || [],
        createdAt: new Date(data.created_at),
        lastEdited: data.last_edited ? new Date(data.last_edited) : undefined,
      };

      if (exportFormat === "color") {
        setCurrentExportCommsPlan(commsPlanData);
        // Wait for component to render
        await new Promise((resolve) => setTimeout(resolve, 500));
        await exportAsPdf(exportRef, commsPlanData.name, "comms-plan-color", "#111827", "Inter");
      } else if (exportFormat === "print") {
        // Print-friendly export using jsPDF directly
        const doc = new jsPDF("p", "pt", "letter");

        const addPageHeader = (doc: jsPDF, title: string) => {
          doc.setFontSize(24);
          doc.setFont("helvetica", "bold");
          doc.text("SoundDocs", 40, 50);
          doc.setFontSize(16);
          doc.setFont("helvetica", "normal");
          doc.text(title, 40, 75);
          doc.setDrawColor(221, 221, 221);
          doc.line(40, 85, doc.internal.pageSize.width - 40, 85);
        };

        const addPageFooter = (doc: jsPDF) => {
          const pageCount = doc.internal.pages.length;
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

        addPageHeader(doc, commsPlanData.name);

        let lastY = 105;

        const createInfoBlock = (title: string, data: [string, string][]) => {
          if (!data.some((row) => row[1] && row[1] !== "N/A")) return;

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(title, 40, lastY);

          const hasAutoTable = typeof (doc as any).autoTable === "function";
          if (hasAutoTable) {
            (doc as any).autoTable({
              body: data,
              startY: lastY + 5,
              theme: "plain",
              styles: {
                font: "helvetica",
                fontSize: 9,
                cellPadding: { top: 2, right: 5, bottom: 2, left: 0 },
              },
              columnStyles: { 0: { fontStyle: "bold", cellWidth: 120 } },
              margin: { left: 40 },
            });
            lastY = (doc as any).lastAutoTable.finalY + 15;
          } else {
            // Fallback simple list
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            let y = lastY + 18;
            data.forEach(([k, v]) => {
              if (v && v !== "N/A") {
                doc.text(`${k}: ${v}`, 40, y);
                y += 12;
              }
            });
            lastY = y + 10;
          }
        };

        const eventDetails: [string, string][] = [
          [
            "Venue Size:",
            `${commsPlanData.venueGeometry.width}' × ${commsPlanData.venueGeometry.height}'`,
          ],
          ["Zones:", `${commsPlanData.zones.length}`],
          ["Transceivers:", `${commsPlanData.transceivers.length}`],
          ["Beltpacks:", `${commsPlanData.beltpacks.length}`],
        ];
        createInfoBlock("Venue Overview", eventDetails);

        lastY += 15;

        if (commsPlanData.transceivers && commsPlanData.transceivers.length > 0) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Transceivers", 40, lastY);
          lastY += 20;

          const transceiversHead = [["Label", "Model", "Band", "Coverage", "Connected Beltpacks"]];
          const transceiversBody = commsPlanData.transceivers.map((tx: any) => {
            const connectedBeltpacks = commsPlanData.beltpacks.filter(
              (bp: any) => bp.transceiverRef === tx.id,
            );
            return [
              tx.label,
              tx.model,
              tx.band,
              `${tx.coverageRadius}' radius`,
              `${connectedBeltpacks.length} / ${tx.maxBeltpacks}`,
            ];
          });

          (doc as any).autoTable({
            head: transceiversHead,
            body: transceiversBody,
            startY: lastY,
            theme: "grid",
            headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
            styles: {
              font: "helvetica",
              fontSize: 9,
              cellPadding: 5,
              lineColor: [221, 221, 221],
              lineWidth: 0.5,
            },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { left: 40, right: 40 },
          });
          lastY = (doc as any).lastAutoTable.finalY + 30;
        }

        if (commsPlanData.beltpacks && commsPlanData.beltpacks.length > 0) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Beltpacks", 40, lastY);
          lastY += 20;

          const beltpacksHead = [["Label", "Connected To", "Channel Assignments"]];
          const beltpacksBody = commsPlanData.beltpacks.map((bp: any) => {
            const transceiver = commsPlanData.transceivers.find(
              (tx: any) => tx.id === bp.transceiverRef,
            );
            const assignments =
              bp.channelAssignments && bp.channelAssignments.length > 0
                ? bp.channelAssignments
                    .map((ca: any) => `${ca.channel}:${ca.assignment}`)
                    .join(", ")
                : "No assignments";

            return [bp.label, transceiver ? transceiver.label : "Not Connected", assignments];
          });

          (doc as any).autoTable({
            head: beltpacksHead,
            body: beltpacksBody,
            startY: lastY,
            theme: "grid",
            headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
            styles: {
              font: "helvetica",
              fontSize: 9,
              cellPadding: 5,
              lineColor: [221, 221, 221],
              lineWidth: 0.5,
            },
            alternateRowStyles: { fillColor: [248, 249, 250] },
            margin: { left: 40, right: 40 },
          });
        }

        addPageFooter(doc);
        doc.save(`${commsPlanData.name.replace(/\s+/g, "-").toLowerCase()}-comms-plan-print.pdf`);
      }
    } catch (err) {
      console.error("Error preparing comms plan export:", err);
      setError("Failed to prepare comms plan for export. Please try again.");
    } finally {
      setCurrentExportCommsPlan(null);
      setExportingItemId(null);
      setExportCommsPlanId(null);
    }
  };

  const deletePlan = async (planId: string) => {
    if (window.confirm("Are you sure you want to delete this comms plan?")) {
      try {
        const { error } = await supabase.from("comms_plans").delete().eq("id", planId);
        if (error) throw error;
        setPlans(plans.filter((p) => p.id !== planId));
        setFilteredPlans(filteredPlans.filter((p) => p.id !== planId));
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/audio")}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Audio
          </button>

          <button
            onClick={() => navigate("/comms-planner/new", { state: { from: "/all-comms-plans" } })}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Comms Plan
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">All Comms Plans</h1>
            <p className="text-gray-400">Manage all your communication system plans in one place</p>
          </div>

          <div className="p-6 border-b border-gray-700">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              {/* Search */}
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

              {/* Sort Controls */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleSort("name")}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    sortField === "name"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Name
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4 ml-1" />
                    ) : (
                      <SortDesc className="h-4 w-4 ml-1" />
                    ))}
                </button>

                <button
                  onClick={() => handleSort("created_at")}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    sortField === "created_at"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Created
                  {sortField === "created_at" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4 ml-1" />
                    ) : (
                      <SortDesc className="h-4 w-4 ml-1" />
                    ))}
                </button>

                <button
                  onClick={() => handleSort("last_edited")}
                  className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                    sortField === "last_edited"
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  Last Edited
                  {sortField === "last_edited" &&
                    (sortDirection === "asc" ? (
                      <SortAsc className="h-4 w-4 ml-1" />
                    ) : (
                      <SortDesc className="h-4 w-4 ml-1" />
                    ))}
                </button>
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
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center">
                      <Loader className="animate-spin h-8 w-8 text-indigo-500 mx-auto" />
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-red-400">
                      {error}
                    </td>
                  </tr>
                ) : filteredPlans.length > 0 ? (
                  filteredPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                          <span className="text-white font-medium">{plan.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {new Date(plan.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {plan.last_edited
                          ? new Date(plan.last_edited).toLocaleDateString()
                          : new Date(plan.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Download"
                            onClick={() => handleExportClick(plan)}
                            disabled={exportingItemId === plan.id}
                          >
                            {exportingItemId === plan.id ? (
                              <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Edit"
                            onClick={() =>
                              navigate(`/comms-planner/${plan.id}`, {
                                state: { from: "/all-comms-plans" },
                              })
                            }
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                            onClick={() => deletePlan(plan.id)}
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
                        ? "No comms plans match your search criteria"
                        : "You haven't created any comms plans yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredPlans.length > 0 && (
            <div className="p-4 border-t border-gray-700 text-gray-400 text-sm">
              Showing {filteredPlans.length} of {plans.length} comms plans
            </div>
          )}
        </div>
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportColor={() =>
          exportCommsPlanId && prepareAndExecuteExport(exportCommsPlanId, "color")
        }
        onExportPrintFriendly={() =>
          exportCommsPlanId && prepareAndExecuteExport(exportCommsPlanId, "print")
        }
        title="Comms Plan"
        isExporting={!!exportingItemId}
      />

      {/* Hidden Export Components */}
      {currentExportCommsPlan && (
        <>
          <CommsPlanExport ref={exportRef} commsPlan={currentExportCommsPlan} />
          <PrintCommsPlanExport ref={printExportRef} commsPlan={currentExportCommsPlan} />
        </>
      )}

      <Footer />
    </div>
  );
};

export default AllCommsPlans;

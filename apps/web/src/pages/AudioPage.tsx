import React, { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getCanonicalUrl } from "../utils/canonical-url";
import {
  PlusCircle,
  FileText,
  Layout,
  Mic,
  Trash2,
  Edit,
  Download,
  List,
  AlertTriangle,
  Loader,
  Info,
  ArrowLeftCircle,
  X,
  Briefcase,
  Drama,
  Radio,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import PatchSheetExport from "../components/PatchSheetExport";
import StagePlotExport from "../components/StagePlotExport";
import PrintPatchSheetExport from "../components/PrintPatchSheetExport";
import PrintStagePlotExport from "../components/PrintStagePlotExport";
import CorporateMicPlotExport from "../components/CorporateMicPlotExport";
import PrintCorporateMicPlotExport from "../components/PrintCorporateMicPlotExport";
import TheaterMicPlotExport from "../components/theater-mic-plot/TheaterMicPlotExport";
import PrintTheaterMicPlotExport from "../components/theater-mic-plot/PrintTheaterMicPlotExport";
import ExportModal from "../components/ExportModal";
import CommsPlanExport from "../components/CommsPlanExport";
import PrintCommsPlanExport from "../components/PrintCommsPlanExport";
import { ActorEntry } from "../components/theater-mic-plot/ActorEntryCard"; // For TheaterMicPlotFullData
import { CommsPlan } from "../lib/commsTypes";

// Type definitions for the component
interface InputEntry {
  channelNumber: string;
  name?: string;
  type?: string;
  device?: string;
  connection?: string;
  connectionDetails?: {
    snakeType?: string;
    inputNumber?: string;
    consoleType?: string;
    consoleInputNumber?: string;
    networkType?: string;
    networkPatch?: string;
  };
  phantom?: boolean;
  notes?: string;
}

interface OutputEntry {
  channelNumber: string;
  name?: string;
  sourceType?: string;
  sourceDetails?: {
    snakeType?: string;
    outputNumber?: string;
    consoleType?: string;
    consoleOutputNumber?: string;
    networkType?: string;
    networkPatch?: string;
  };
  destinationType?: string;
  destinationGear?: string;
  notes?: string;
}

interface StageElement {
  id: string;
  type: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

interface PresenterEntry {
  presenter_name?: string;
  session_segment?: string;
  mic_type?: string;
  element_channel_number?: string;
  tx_pack_location?: string;
  backup_element?: string;
  sound_check_time?: string;
  presentation_type?: string;
  remote_participation?: boolean;
  notes?: string;
  photo_url?: string;
}

interface CommsPlanEntry {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
}

interface TransceiverData {
  id: string;
  zone_id?: string;
  system_type: string;
  model: string;
  x: number;
  y: number;
  z?: number;
  label: string;
  band: string;
  channel_set: string[];
  dfs_enabled: boolean;
  poe_class: string;
  coverage_radius: number;
  current_beltpacks?: number;
  max_beltpacks?: number;
  override_flags: unknown;
}

interface BeltpackData {
  id: string;
  label: string;
  x: number;
  y: number;
  transceiverRef?: string;
  transceiver_ref?: string;
  signalStrength?: number;
  signal_strength?: number;
  batteryLevel?: number;
  battery_level?: number;
  online?: boolean;
  channelAssignments?: ChannelAssignment[];
  channel_assignments?: ChannelAssignment[];
}

interface TransceiverEntry {
  id: string;
  label: string;
  model: string;
  band: string;
  coverageRadius: number;
  maxBeltpacks: number;
}

interface BeltpackEntry {
  id: string;
  label: string;
  transceiverRef: string;
  channelAssignments: ChannelAssignment[];
}

interface ChannelAssignment {
  channel: string;
  assignment: string;
}

interface TableRow {
  content: string;
  colSpan?: number;
  styles?: {
    halign?: string;
    fontStyle?: string;
    fontSize?: number;
    fillColor?: number[];
    textColor?: number[] | number;
    cellPadding?: { top: number; bottom: number };
  };
}

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: unknown) => void;
  lastAutoTable: { finalY: number };
}

interface BaseDocument {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
}

interface PatchList extends BaseDocument {
  inputs?: InputEntry[];
  outputs?: OutputEntry[];
  [key: string]: unknown;
}

interface StagePlot extends BaseDocument {
  stage_size: string;
  elements: StageElement[];
  backgroundImage?: string;
  backgroundOpacity?: number;
}

interface MicPlotDocument extends BaseDocument {
  plot_type: "corporate" | "theater";
}

interface CorporateMicPlotFullData extends MicPlotDocument {
  presenters?: PresenterEntry[];
  // Add other fields specific to corporate_mic_plots table
}

interface TheaterMicPlotFullData extends MicPlotDocument {
  actors?: ActorEntry[];
  // Add other fields specific to theater_mic_plots table
}

const AudioPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [patchLists, setPatchLists] = useState<PatchList[]>([]);
  const [stagePlots, setStagePlots] = useState<StagePlot[]>([]);
  const [micPlots, setMicPlots] = useState<MicPlotDocument[]>([]);
  const [commsPlans, setCommsPlans] = useState<CommsPlanEntry[]>([]);

  const [exportingItemId, setExportingItemId] = useState<string | null>(null); // For patch sheets and stage plots

  const [currentExportPatchSheet, setCurrentExportPatchSheet] = useState<PatchList | null>(null);
  const [showPatchSheetExportModal, setShowPatchSheetExportModal] = useState(false);
  const [exportPatchSheetId, setExportPatchSheetId] = useState<string | null>(null);

  const [currentExportStagePlot, setCurrentExportStagePlot] = useState<StagePlot | null>(null);
  const [showStagePlotExportModal, setShowStagePlotExportModal] = useState(false);
  const [exportStagePlotId, setExportStagePlotId] = useState<string | null>(null);

  const [showMicPlotExportModal, setShowMicPlotExportModal] = useState(false);
  const [exportMicPlotId, setExportMicPlotId] = useState<string | null>(null);
  const [exportMicPlotActualType, setExportMicPlotActualType] = useState<
    "corporate" | "theater" | null
  >(null);
  const [currentExportingMicPlotData, setCurrentExportingMicPlotData] = useState<
    CorporateMicPlotFullData | TheaterMicPlotFullData | null
  >(null);
  const [exportingMicPlotItemId, setExportingMicPlotItemId] = useState<string | null>(null); // For mic plots

  const [showCommsPlanExportModal, setShowCommsPlanExportModal] = useState(false);
  const [exportCommsPlanId, setExportCommsPlanId] = useState<string | null>(null);
  const [currentExportCommsPlan, setCurrentExportCommsPlan] = useState<CommsPlan | null>(null);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{
    id: string;
    type: "patch" | "stage" | "mic" | "comms";
    name: string;
    plot_type?: "corporate" | "theater";
  } | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  const [showMicPlotTypeModal, setShowMicPlotTypeModal] = useState(false);

  const patchSheetExportRef = useRef<HTMLDivElement>(null);
  const printPatchSheetExportRef = useRef<HTMLDivElement>(null);
  const stagePlotExportRef = useRef<HTMLDivElement>(null);
  const printStagePlotExportRef = useRef<HTMLDivElement>(null);
  const corporateMicPlotExportRef = useRef<HTMLDivElement>(null);
  const printCorporateMicPlotExportRef = useRef<HTMLDivElement>(null);
  const theaterMicPlotExportRef = useRef<HTMLDivElement>(null);
  const printTheaterMicPlotExportRef = useRef<HTMLDivElement>(null);
  const commsPlanExportRef = useRef<HTMLDivElement>(null);
  const printCommsPlanExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        if (data.user) {
          await Promise.all([
            fetchPatchLists(data.user.id),
            fetchStagePlots(data.user.id),
            fetchMicPlots(data.user.id),
            fetchCommsPlans(data.user.id),
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
        .select("id, name, created_at, last_edited, stage_size, elements")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setStagePlots(data as StagePlot[]);
    } catch (error) {
      console.error("Error fetching stage plots:", error);
      setSupabaseError("Failed to fetch stage plots.");
    }
  };

  const fetchMicPlots = async (userId: string) => {
    try {
      const fetchedMicPlots: MicPlotDocument[] = [];

      const { data: corporateData, error: corporateError } = await supabase
        .from("corporate_mic_plots")
        .select("id, name, created_at, last_edited")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (corporateError) console.warn("Error fetching corporate mic plots:", corporateError);
      if (corporateData) {
        fetchedMicPlots.push(
          ...corporateData.map((p) => ({ ...p, plot_type: "corporate" as const })),
        );
      }

      const { data: theaterData, error: theaterError } = await supabase
        .from("theater_mic_plots")
        .select("id, name, created_at, last_edited")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (theaterError) console.warn("Error fetching theater mic plots:", theaterError);
      if (theaterData) {
        fetchedMicPlots.push(...theaterData.map((p) => ({ ...p, plot_type: "theater" as const })));
      }

      fetchedMicPlots.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      setMicPlots(fetchedMicPlots);
    } catch (error) {
      console.error("Error fetching mic plots:", error);
      setSupabaseError("Failed to fetch mic plots.");
    }
  };

  const fetchCommsPlans = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("comms_plans")
        .select("id, name, created_at, last_edited")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (data) setCommsPlans(data);
    } catch (error) {
      console.error("Error fetching comms plans:", error);
      setSupabaseError("Failed to fetch comms plans.");
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
  const handleCreateStagePlot = async () =>
    navigate("/stage-plot/new", { state: { from: "/audio" } });

  const handleCreateMicPlot = () => {
    setShowMicPlotTypeModal(true);
  };

  const handleSelectMicPlotType = (type: "corporate" | "theater") => {
    setShowMicPlotTypeModal(false);
    if (type === "corporate") {
      navigate(`/corporate-mic-plot/new`, { state: { from: "/audio" } });
    } else if (type === "theater") {
      navigate(`/theater-mic-plot/new`, { state: { from: "/audio" } });
    }
  };

  const handleDeleteRequest = (
    id: string,
    type: "patch" | "stage" | "mic" | "comms",
    name: string,
    plot_type?: "corporate" | "theater",
  ) => {
    setDocumentToDelete({ id, type, name, plot_type });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;
    try {
      let tableName = "";
      if (documentToDelete.type === "patch") tableName = "patch_sheets";
      else if (documentToDelete.type === "stage") tableName = "stage_plots";
      else if (documentToDelete.type === "mic") {
        if (documentToDelete.plot_type === "corporate") tableName = "corporate_mic_plots";
        else if (documentToDelete.plot_type === "theater") tableName = "theater_mic_plots";
      } else if (documentToDelete.type === "comms") tableName = "comms_plans";

      if (tableName) {
        const { error } = await supabase.from(tableName).delete().eq("id", documentToDelete.id);
        if (error) throw error;

        if (documentToDelete.type === "patch") {
          setPatchLists(patchLists.filter((item) => item.id !== documentToDelete.id));
        } else if (documentToDelete.type === "stage") {
          setStagePlots(stagePlots.filter((item) => item.id !== documentToDelete.id));
        } else if (documentToDelete.type === "mic") {
          setMicPlots(micPlots.filter((item) => item.id !== documentToDelete.id));
        } else if (documentToDelete.type === "comms") {
          setCommsPlans(commsPlans.filter((item) => item.id !== documentToDelete.id));
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

  const handleEditPatchList = (id: string) =>
    navigate(`/patch-sheet/${id}`, { state: { from: "/audio" } });
  const handleEditStagePlot = (id: string) =>
    navigate(`/stage-plot/${id}`, { state: { from: "/audio" } });
  const handleEditMicPlot = (id: string, plot_type: "corporate" | "theater") => {
    if (plot_type === "corporate") {
      navigate(`/corporate-mic-plot/${id}`, { state: { from: "/audio" } });
    } else if (plot_type === "theater") {
      navigate(`/theater-mic-plot/${id}`, { state: { from: "/audio" } });
    }
  };

  const handleExportClick = (
    id: string,
    type: "patch" | "stage" | "mic",
    actualPlotType?: "corporate" | "theater",
  ) => {
    if (type === "patch") {
      setExportPatchSheetId(id);
      setShowPatchSheetExportModal(true);
    } else if (type === "stage") {
      setExportStagePlotId(id);
      setShowStagePlotExportModal(true);
    } else if (type === "mic" && actualPlotType) {
      setExportMicPlotId(id);
      setExportMicPlotActualType(actualPlotType);
      setShowMicPlotExportModal(true);
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

    // Additional check to ensure the component has rendered content
    if (!targetRef.current.children || targetRef.current.children.length === 0) {
      console.error("Export component has no content.");
      setSupabaseError("Export component has no content. Please try again.");
      return;
    }

    // Ensure render flush before capture
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((resolve) => setTimeout(resolve, 150));

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
      const canvas = await html2canvas(targetRef.current!, {
        scale: 2,
        backgroundColor,
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc) => {
          const styleGlobal = clonedDoc.createElement("style");
          styleGlobal.innerHTML = `* { font-family: ${font}, sans-serif !important; vertical-align: baseline !important; }`;
          clonedDoc.head.appendChild(styleGlobal);
          clonedDoc.body.style.fontFamily = `${font}, sans-serif`;
          Array.from(clonedDoc.querySelectorAll("*")).forEach((el: Element) => {
            if ((el as HTMLElement).style) {
              (el as HTMLElement).style.fontFamily = `${font}, sans-serif`;
              (el as HTMLElement).style.verticalAlign = "baseline";
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

  const prepareAndExecutePatchSheetExport = async (
    patchSheetId: string,
    exportFormat: "color" | "print",
  ) => {
    setExportingItemId(patchSheetId);
    setShowPatchSheetExportModal(false);
    try {
      const { data: fullPatchSheet, error } = await supabase
        .from("patch_sheets")
        .select("*")
        .eq("id", patchSheetId)
        .single();
      if (error || !fullPatchSheet) throw error || new Error("Patch sheet not found");

      if (exportFormat === "print") {
        const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
        const brandColor = [45, 55, 72]; // A dark slate for headers

        const formatInputDetails = (input: InputEntry) => {
          const details = [];
          if (["Analog Snake", "Digital Snake"].includes(input.connection)) {
            details.push(
              `Snake: ${input.connectionDetails?.snakeType || "-"} #${input.connectionDetails?.inputNumber || "-"}`,
            );
          }
          if (["Analog Snake", "Console Direct"].includes(input.connection)) {
            details.push(
              `Console: ${input.connectionDetails?.consoleType || "-"} #${input.connectionDetails?.consoleInputNumber || "-"}`,
            );
          }
          if (["Digital Snake", "Digital Network"].includes(input.connection)) {
            details.push(
              `Network: ${input.connectionDetails?.networkType || "-"} Patch #${input.connectionDetails?.networkPatch || "-"}`,
            );
          }
          return details.join("\n");
        };

        const formatOutputDetails = (output: OutputEntry) => {
          const details = [];
          if (["Analog Snake", "Digital Snake"].includes(output.sourceType)) {
            details.push(
              `Snake: ${output.sourceDetails?.snakeType || "-"} #${output.sourceDetails?.outputNumber || "-"}`,
            );
          }
          if (["Console Output", "Analog Snake"].includes(output.sourceType)) {
            details.push(
              `Console: ${output.sourceDetails?.consoleType || "-"} #${output.sourceDetails?.consoleOutputNumber || "-"}`,
            );
          }
          if (["Digital Snake", "Digital Network"].includes(output.sourceType)) {
            details.push(
              `Network: ${output.sourceDetails?.networkType || "-"} Patch #${output.sourceDetails?.networkPatch || "-"}`,
            );
          }
          return details.join("\n");
        };

        const pageHeader = () => {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(16);
          doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
          doc.text("SoundDocs", 14, 15);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(12);
          doc.text(fullPatchSheet.name, doc.internal.pageSize.getWidth() - 14, 15, {
            align: "right",
          });
          doc.setDrawColor(200);
          doc.line(14, 20, doc.internal.pageSize.getWidth() - 14, 20);
        };

        const pageFooter = (data: { pageNumber: number }) => {
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

        const inputTitle = [
          [
            {
              content: "Inputs",
              colSpan: 8,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fontSize: 12,
                fillColor: [255, 255, 255],
                textColor: brandColor as [number, number, number],
                cellPadding: { top: 4, bottom: 2 },
              },
            },
          ],
        ];
        const inputHead = [
          [
            { content: "Ch" },
            { content: "Name" },
            { content: "Type" },
            { content: "Device" },
            { content: "Connection" },
            { content: "Details" },
            { content: "48V" },
            { content: "Notes" },
          ],
        ];
        const inputBody = (fullPatchSheet.inputs || []).map((input: InputEntry) => [
          input.channelNumber,
          input.name || "",
          input.type || "",
          input.device || "",
          input.connection || "",
          formatInputDetails(input),
          input.phantom ? "Yes" : "No",
          input.notes || "",
        ]);

        autoTable(doc, {
          head: inputTitle.concat(inputHead as TableRow[]) as TableRow[],
          body: inputBody,
          startY: 25,
          didDrawPage: (data) => {
            pageHeader();
            pageFooter(data);
          },
          margin: { top: 22, bottom: 20 },
          styles: { cellPadding: 1.5, fontSize: 7, overflow: "linebreak" },
          headStyles: {
            fillColor: brandColor as [number, number, number],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: { 0: { cellWidth: 8 }, 6: { cellWidth: 8, halign: "center" } },
        });

        const outputTitle = [
          [
            {
              content: "Outputs",
              colSpan: 6,
              styles: {
                halign: "left",
                fontStyle: "bold",
                fontSize: 12,
                fillColor: [255, 255, 255],
                textColor: brandColor as [number, number, number],
                cellPadding: { top: 4, bottom: 2 },
              },
            },
          ],
        ];
        const outputHead = [
          [
            { content: "Ch" },
            { content: "Name" },
            { content: "Source" },
            { content: "Destination" },
            { content: "Details" },
            { content: "Notes" },
          ],
        ];
        const outputBody = (fullPatchSheet.outputs || []).map((output: OutputEntry) => [
          output.channelNumber,
          output.name || "",
          output.sourceType || "",
          `${output.destinationType || ""}\n${output.destinationGear || ""}`,
          formatOutputDetails(output),
          output.notes || "",
        ]);

        autoTable(doc, {
          head: outputTitle.concat(outputHead as TableRow[]) as TableRow[],
          body: outputBody,
          didDrawPage: (data) => {
            pageHeader();
            pageFooter(data);
          },
          margin: { top: 22, bottom: 20 },
          styles: { cellPadding: 1.5, fontSize: 7, overflow: "linebreak" },
          headStyles: {
            fillColor: brandColor as [number, number, number],
            textColor: 255,
            fontStyle: "bold",
            halign: "center",
          },
          columnStyles: { 0: { cellWidth: 8 } },
        });

        doc.save(`${fullPatchSheet.name.replace(/\s+/g, "-").toLowerCase()}-patch-sheet-print.pdf`);
      } else {
        // 'color' export
        setCurrentExportPatchSheet(fullPatchSheet);
        await new Promise((resolve) => setTimeout(resolve, 100));
        await exportAsPdf(
          patchSheetExportRef,
          fullPatchSheet.name,
          "patch-sheet",
          "#111827",
          "Inter",
        );
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

  const prepareAndExecuteStagePlotExport = async (
    stagePlotId: string,
    exportFormat: "color" | "print",
  ) => {
    setExportingItemId(stagePlotId);
    setShowStagePlotExportModal(false);
    try {
      const { data, error } = await supabase
        .from("stage_plots")
        .select("*")
        .eq("id", stagePlotId)
        .single();
      if (error || !data) throw error || new Error("Stage plot not found");

      const fullStagePlot = {
        ...data,
        stage_size: data.stage_size || "medium-wide",
        elements: data.elements || [],
      };
      setCurrentExportStagePlot(fullStagePlot);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const targetRef = exportFormat === "color" ? stagePlotExportRef : printStagePlotExportRef;
      const backgroundColor = exportFormat === "color" ? "#111827" : "#ffffff";
      const fileNameSuffix = exportFormat === "color" ? "stage-plot" : "stage-plot-print";
      const font = exportFormat === "color" ? "Inter" : "Arial";

      await exportAsPdf(targetRef, fullStagePlot.name, fileNameSuffix, backgroundColor, font);
    } catch (err) {
      console.error("Error preparing stage plot export:", err);
      setSupabaseError("Failed to prepare stage plot for export.");
    } finally {
      setCurrentExportStagePlot(null);
      setExportingItemId(null);
      setExportStagePlotId(null);
    }
  };

  const prepareAndExecuteMicPlotExport = async (
    micPlotId: string,
    actualPlotType: "corporate" | "theater",
    exportFormat: "image" | "print",
  ) => {
    setExportingMicPlotItemId(micPlotId);
    setShowMicPlotExportModal(false);

    try {
      if (actualPlotType === "corporate") {
        const { data: fullMicPlot, error } = await supabase
          .from("corporate_mic_plots")
          .select("*")
          .eq("id", micPlotId)
          .single();
        if (error || !fullMicPlot) throw error || new Error("Corporate mic plot not found");

        if (exportFormat === "image") {
          setCurrentExportingMicPlotData(fullMicPlot as CorporateMicPlotFullData);
          await new Promise((resolve) => setTimeout(resolve, 150));
          await exportAsPdf(
            corporateMicPlotExportRef,
            fullMicPlot.name,
            "corporate-mic-plot",
            "#111827",
            "Inter",
          );
        } else {
          // print
          const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
          const brandColor = [45, 55, 72];
          const formatTime = (timeString?: string) => {
            if (!timeString) return "-";
            if (/^\d{2}:\d{2}$/.test(timeString)) return timeString;
            try {
              const date = new Date(timeString);
              if (isNaN(date.getTime())) return timeString;
              return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              });
            } catch {
              return timeString;
            }
          };
          const pageHeader = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
            doc.text("SoundDocs", 14, 15);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.text(fullMicPlot.name, doc.internal.pageSize.getWidth() - 14, 15, {
              align: "right",
            });
            doc.setDrawColor(200);
            doc.line(14, 20, doc.internal.pageSize.getWidth() - 14, 20);
          };
          const pageFooter = (data: { pageNumber: number }) => {
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
              doc.text(
                `Page ${data.pageNumber} of ${pageCount - 1}`,
                pageWidth / 2,
                pageHeight - 9,
                { align: "center" },
              );
            }
            const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
            doc.text(dateStr, pageWidth - 14, pageHeight - 9, { align: "right" });
          };
          const head = [
            [
              { content: "Photo" },
              { content: "Presenter" },
              { content: "Session" },
              { content: "Mic Type" },
              { content: "Channel" },
              { content: "TX Pack Loc." },
              { content: "Backup" },
              { content: "Sound Check" },
              { content: "Pres. Type" },
              { content: "Remote" },
              { content: "Notes" },
            ],
          ];
          const body = (fullMicPlot.presenters || []).map((p: PresenterEntry) => [
            "",
            p.presenter_name || "-",
            p.session_segment || "-",
            p.mic_type || "-",
            p.element_channel_number || "-",
            p.tx_pack_location || "-",
            p.backup_element || "-",
            formatTime(p.sound_check_time),
            p.presentation_type || "-",
            p.remote_participation ? "Yes" : "No",
            p.notes || "-",
          ]);
          const presenterTitle = [
            [
              {
                content: "Presenters",
                colSpan: 11,
                styles: {
                  halign: "left",
                  fontStyle: "bold",
                  fontSize: 12,
                  fillColor: [255, 255, 255],
                  textColor: brandColor as [number, number, number],
                  cellPadding: { top: 4, bottom: 2 },
                },
              },
            ],
          ];
          autoTable(doc, {
            head: presenterTitle.concat(head as TableRow[]) as TableRow[],
            body: body,
            startY: 25,
            didDrawPage: (data) => {
              pageHeader();
              pageFooter(data);
            },
            margin: { top: 22, bottom: 20 },
            styles: {
              cellPadding: 1.5,
              fontSize: 7,
              overflow: "linebreak",
              valign: "middle",
              minCellHeight: 18,
            },
            headStyles: {
              fillColor: brandColor as [number, number, number],
              textColor: 255,
              fontStyle: "bold",
              halign: "center",
              valign: "middle",
            },
            columnStyles: {
              0: { cellWidth: 18, halign: "center" },
              1: { cellWidth: 30 },
              2: { cellWidth: 30 },
              3: { cellWidth: 20 },
              4: { cellWidth: 15 },
              5: { cellWidth: 25 },
              6: { cellWidth: 25 },
              7: { cellWidth: 20, halign: "center" },
              8: { cellWidth: 25 },
              9: { cellWidth: 15, halign: "center" },
            },
            didDrawCell: (data) => {
              if (data.section === "body" && data.column.index === 0) {
                const presenter = (fullMicPlot.presenters || [])[data.row.index];
                if (
                  presenter &&
                  presenter.photo_url &&
                  presenter.photo_url.startsWith("data:image/")
                ) {
                  const imgData = presenter.photo_url;
                  const formatMatch = imgData.match(/data:image\/(.*?);/);
                  const format = formatMatch ? formatMatch[1].toUpperCase() : "PNG";
                  doc.setFillColor(255, 255, 255);
                  doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, "F");
                  const imgDim = 16;
                  const x = data.cell.x + (data.cell.width - imgDim) / 2;
                  const y = data.cell.y + (data.cell.height - imgDim) / 2;
                  try {
                    doc.addImage(imgData, format, x, y, imgDim, imgDim);
                  } catch {
                    console.error(`Failed to add image to PDF cell. Format: ${format}`);
                  }
                }
              }
            },
          });
          doc.save(
            `${fullMicPlot.name.replace(/\s+/g, "-").toLowerCase()}-corporate-mic-plot-print.pdf`,
          );
        }
      } else if (actualPlotType === "theater") {
        const { data: fullMicPlot, error } = await supabase
          .from("theater_mic_plots")
          .select("*")
          .eq("id", micPlotId)
          .single();
        if (error || !fullMicPlot) throw error || new Error("Theater mic plot not found");

        if (exportFormat === "image") {
          setCurrentExportingMicPlotData(fullMicPlot as TheaterMicPlotFullData);
          await new Promise((resolve) => setTimeout(resolve, 150));
          await exportAsPdf(
            theaterMicPlotExportRef,
            fullMicPlot.name,
            "theater-mic-plot",
            "#111827",
            "Inter",
          );
        } else {
          // print
          const doc = new jsPDF({ orientation: "landscape", unit: "mm" });
          const brandColor = [45, 55, 72];
          const pageHeader = () => {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(16);
            doc.setTextColor(brandColor[0], brandColor[1], brandColor[2]);
            doc.text("SoundDocs", 14, 15);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(12);
            doc.text(fullMicPlot.name, doc.internal.pageSize.getWidth() - 14, 15, {
              align: "right",
            });
            doc.setDrawColor(200);
            doc.line(14, 20, doc.internal.pageSize.getWidth() - 14, 20);
          };
          const pageFooter = (data: { pageNumber: number }) => {
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
              doc.text(
                `Page ${data.pageNumber} of ${pageCount - 1}`,
                pageWidth / 2,
                pageHeight - 9,
                { align: "center" },
              );
            }
            const dateStr = `Generated on: ${new Date().toLocaleDateString()}`;
            doc.text(dateStr, pageWidth - 14, pageHeight - 9, { align: "right" });
          };
          const head = [
            [
              { content: "Photo" },
              { content: "Actor" },
              { content: "Character(s)" },
              { content: "Channel" },
              { content: "Mic Location" },
              { content: "TX Location" },
              { content: "Backup Mic" },
              { content: "Scenes" },
              { content: "Notes" },
            ],
          ];
          const body = (fullMicPlot.actors || []).map((actor: ActorEntry) => {
            const notes = [actor.costume_notes, actor.wig_hair_notes].filter(Boolean).join(" | ");
            return [
              "",
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
                  textColor: brandColor as [number, number, number],
                  cellPadding: { top: 4, bottom: 2 },
                },
              },
            ],
          ];
          autoTable(doc, {
            head: actorsTitle.concat(head as TableRow[]) as TableRow[],
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
              fillColor: brandColor as [number, number, number],
              textColor: 255,
              fontStyle: "bold",
              halign: "center",
              valign: "middle",
            },
            columnStyles: {
              0: { cellWidth: 18, halign: "center" },
              1: { cellWidth: 35 },
              2: { cellWidth: 35 },
              3: { cellWidth: 15, halign: "center" },
              4: { cellWidth: 30 },
              5: { cellWidth: 30 },
              6: { cellWidth: 30 },
              7: { cellWidth: 20 },
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
                  } catch {
                    console.error(`Failed to add image to PDF cell. Format: ${format}`);
                  }
                }
              }
            },
          });
          doc.save(
            `${fullMicPlot.name.replace(/\s+/g, "-").toLowerCase()}-theater-mic-plot-print.pdf`,
          );
        }
      }
    } catch (err) {
      console.error(`Error preparing ${actualPlotType} mic plot export:`, err);
      setSupabaseError(`Failed to prepare ${actualPlotType} mic plot for export.`);
    } finally {
      setCurrentExportingMicPlotData(null);
      setExportingMicPlotItemId(null);
      setExportMicPlotId(null);
      setExportMicPlotActualType(null);
    }
  };

  const prepareAndExecuteCommsPlanExport = async (
    commsPlanId: string,
    exportFormat: "color" | "print",
  ) => {
    setExportingItemId(commsPlanId);
    setShowCommsPlanExportModal(false);

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
        transceivers: (data.transceivers || []).map((tx: TransceiverData) => ({
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
        beltpacks: (data.beltpacks || []).map((bp: BeltpackData) => ({
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
        await exportAsPdf(
          commsPlanExportRef,
          commsPlanData.name,
          "comms-plan-color",
          "#111827",
          "Inter",
        );
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

          (doc as jsPDFWithAutoTable).autoTable({
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
          lastY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 15;
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
          const transceiversBody = commsPlanData.transceivers.map((tx: TransceiverEntry) => {
            const connectedBeltpacks = commsPlanData.beltpacks.filter(
              (bp: BeltpackEntry) => bp.transceiverRef === tx.id,
            );
            return [
              tx.label,
              tx.model,
              tx.band,
              `${tx.coverageRadius}' radius`,
              `${connectedBeltpacks.length} / ${tx.maxBeltpacks}`,
            ];
          });

          (doc as jsPDFWithAutoTable).autoTable({
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
          lastY = (doc as jsPDFWithAutoTable).lastAutoTable.finalY + 30;
        }

        if (commsPlanData.beltpacks && commsPlanData.beltpacks.length > 0) {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Beltpacks", 40, lastY);
          lastY += 20;

          const beltpacksHead = [["Label", "Connected To", "Channel Assignments"]];
          const beltpacksBody = commsPlanData.beltpacks.map((bp: BeltpackEntry) => {
            const transceiver = commsPlanData.transceivers.find(
              (tx: TransceiverEntry) => tx.id === bp.transceiverRef,
            );
            const assignments =
              bp.channelAssignments && bp.channelAssignments.length > 0
                ? bp.channelAssignments
                    .map((ca: ChannelAssignment) => `${ca.channel}:${ca.assignment}`)
                    .join(", ")
                : "No assignments";

            return [bp.label, transceiver ? transceiver.label : "Not Connected", assignments];
          });

          (doc as jsPDFWithAutoTable).autoTable({
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
      setSupabaseError("Failed to prepare comms plan for export. Please try again.");
    } finally {
      setCurrentExportCommsPlan(null);
      setExportingItemId(null);
      setExportCommsPlanId(null);
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
    <>
      <Helmet>
        <title>Audio Documentation Tools | Patch Sheets & Mic Plots | SoundDocs</title>
        <meta
          name="description"
          content="Professional audio documentation tools for live events. Create patch sheets, mic plots, input lists, and stage plots. Free forever for audio engineers and FOH technicians."
        />
        <meta
          name="keywords"
          content="audio documentation, patch sheet, mic plot, input list, stage plot, audio engineer tools, FOH, monitor engineer, wireless mic management"
        />

        {/* Canonical URL */}
        <link rel="canonical" href={getCanonicalUrl()} />

        {/* Open Graph - Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sounddocs.org/audio" />
        <meta property="og:title" content="Audio Documentation Tools | SoundDocs" />
        <meta
          property="og:description"
          content="Professional audio documentation tools for live events. Create patch sheets, mic plots, and input lists. Free forever."
        />
        <meta property="og:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Audio Documentation Tools | SoundDocs" />
        <meta
          name="twitter:description"
          content="Professional audio documentation tools for live events. Create patch sheets, mic plots, and input lists. Free forever."
        />
        <meta name="twitter:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />
      </Helmet>

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
            <p className="text-lg text-gray-300">
              Manage your patch lists, stage plots, and mic plots.
            </p>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportClick(patchList.id, "patch");
                            }}
                            disabled={exportingItemId === patchList.id}
                          >
                            {exportingItemId === patchList.id ? (
                              <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRequest(patchList.id, "patch", patchList.name);
                            }}
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportClick(stagePlot.id, "stage");
                            }}
                            disabled={exportingItemId === stagePlot.id}
                          >
                            {exportingItemId === stagePlot.id ? (
                              <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
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
                            onClick={() =>
                              handleDeleteRequest(stagePlot.id, "stage", stagePlot.name)
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

          {/* Cards Section - Mic Plots and Comms Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* My Mic Plots Card */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">My Mic Plots</h2>
                  <p className="text-gray-400">Visualize and manage microphone placements</p>
                </div>
                <Mic className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="space-y-4">
                {micPlots.length > 0 ? (
                  <div className="space-y-3">
                    {micPlots.slice(0, 3).map((micPlot) => (
                      <div
                        key={micPlot.id}
                        className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <h3 className="text-white font-medium">{micPlot.name}</h3>
                          <p className="text-gray-400 text-sm">
                            Type: <span className="capitalize">{micPlot.plot_type}</span> |
                            {micPlot.last_edited
                              ? ` Edited ${new Date(micPlot.last_edited).toLocaleDateString()}`
                              : ` Created ${new Date(micPlot.created_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400"
                            title="Download Mic Plot"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportClick(micPlot.id, "mic", micPlot.plot_type);
                            }}
                            disabled={exportingMicPlotItemId === micPlot.id}
                          >
                            {exportingMicPlotItemId === micPlot.id ? (
                              <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400"
                            title="Edit"
                            onClick={() => handleEditMicPlot(micPlot.id, micPlot.plot_type)}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-400"
                            title="Delete"
                            onClick={() =>
                              handleDeleteRequest(
                                micPlot.id,
                                "mic",
                                micPlot.name,
                                micPlot.plot_type,
                              )
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
                    <p className="text-gray-300 mb-4">You haven't created any mic plots yet</p>
                  </div>
                )}
                <div className="pt-3 text-center">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-center">
                    <button
                      className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                      onClick={handleCreateMicPlot}
                    >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      New Mic Plot
                    </button>
                    {micPlots.length > 0 && (
                      <button
                        className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                        onClick={() => navigate("/all-mic-plots")}
                      >
                        <List className="h-5 w-5 mr-2" />
                        View All {micPlots.length > 0 && `(${micPlots.length})`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* My Comms Plans Card */}
            <div className="bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">My Comms Plans</h2>
                  <p className="text-gray-400">Design and manage your RF comms systems</p>
                </div>
                <Radio className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="space-y-4">
                {commsPlans.length > 0 ? (
                  <div className="space-y-3">
                    {commsPlans.slice(0, 3).map((plan) => (
                      <div
                        key={plan.id}
                        className="bg-gray-700 p-4 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <h3 className="text-white font-medium">{plan.name}</h3>
                          <p className="text-gray-400 text-sm">
                            {plan.last_edited
                              ? `Edited ${new Date(plan.last_edited).toLocaleDateString()}`
                              : `Created ${new Date(plan.created_at).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400"
                            title="Download"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExportCommsPlanId(plan.id);
                              setShowCommsPlanExportModal(true);
                            }}
                            disabled={exportingItemId === plan.id}
                          >
                            {exportingItemId === plan.id ? (
                              <Loader className="h-5 w-5 animate-spin" />
                            ) : (
                              <Download className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400"
                            title="Edit"
                            onClick={() =>
                              navigate(`/comms-planner/${plan.id}`, { state: { from: "/audio" } })
                            }
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-400"
                            title="Delete"
                            onClick={() => handleDeleteRequest(plan.id, "comms", plan.name)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-700 rounded-lg text-center">
                    <p className="text-gray-300 mb-4">You haven't created any comms plans yet</p>
                  </div>
                )}
                <div className="pt-3 text-center">
                  <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-center">
                    <button
                      className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                      onClick={() => navigate("/comms-planner/new", { state: { from: "/audio" } })}
                    >
                      <PlusCircle className="h-5 w-5 mr-2" />
                      New Comms Plan
                    </button>
                    {commsPlans.length > 0 && (
                      <button
                        className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                        onClick={() => navigate("/all-comms-plans")}
                      >
                        <List className="h-5 w-5 mr-2" />
                        View All {commsPlans.length > 0 && `(${commsPlans.length})`}
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
          onClose={() => {
            if (!(exportingItemId && exportPatchSheetId)) setShowPatchSheetExportModal(false);
          }}
          onExportColor={() =>
            exportPatchSheetId && prepareAndExecutePatchSheetExport(exportPatchSheetId, "color")
          }
          onExportPrintFriendly={() =>
            exportPatchSheetId && prepareAndExecutePatchSheetExport(exportPatchSheetId, "print")
          }
          title="Patch Sheet"
          isExporting={!!(exportingItemId && exportPatchSheetId)}
        />

        <ExportModal
          isOpen={showStagePlotExportModal}
          onClose={() => {
            if (!exportingItemId) setShowStagePlotExportModal(false);
          }}
          onExportColor={() =>
            exportStagePlotId && prepareAndExecuteStagePlotExport(exportStagePlotId, "color")
          }
          onExportPrintFriendly={() =>
            exportStagePlotId && prepareAndExecuteStagePlotExport(exportStagePlotId, "print")
          }
          title="Stage Plot"
          isExporting={!!(exportingItemId && exportStagePlotId)}
        />

        <ExportModal
          isOpen={showMicPlotExportModal}
          onClose={() => {
            if (!exportingMicPlotItemId) {
              setShowMicPlotExportModal(false);
              setExportMicPlotId(null);
              setExportMicPlotActualType(null);
            }
          }}
          onExportColor={() =>
            exportMicPlotId &&
            exportMicPlotActualType &&
            prepareAndExecuteMicPlotExport(exportMicPlotId, exportMicPlotActualType, "image")
          }
          onExportPrintFriendly={() =>
            exportMicPlotId &&
            exportMicPlotActualType &&
            prepareAndExecuteMicPlotExport(exportMicPlotId, exportMicPlotActualType, "print")
          }
          title="Mic Plot"
          isExporting={!!exportingMicPlotItemId}
        />

        <ExportModal
          isOpen={showCommsPlanExportModal}
          onClose={() => {
            if (!exportingItemId) {
              setShowCommsPlanExportModal(false);
              setExportCommsPlanId(null);
            }
          }}
          onExportColor={() =>
            exportCommsPlanId && prepareAndExecuteCommsPlanExport(exportCommsPlanId, "color")
          }
          onExportPrintFriendly={() =>
            exportCommsPlanId && prepareAndExecuteCommsPlanExport(exportCommsPlanId, "print")
          }
          title="Comms Plan"
          isExporting={!!(exportingItemId && exportCommsPlanId)}
        />

        {currentExportPatchSheet && (
          <>
            <PatchSheetExport ref={patchSheetExportRef} patchSheet={currentExportPatchSheet} />
            <PrintPatchSheetExport
              ref={printPatchSheetExportRef}
              patchSheet={currentExportPatchSheet}
            />
          </>
        )}

        {currentExportStagePlot && (
          <>
            <StagePlotExport ref={stagePlotExportRef} stagePlot={currentExportStagePlot} />
            <PrintStagePlotExport
              ref={printStagePlotExportRef}
              stagePlot={currentExportStagePlot}
            />
          </>
        )}

        {currentExportingMicPlotData && exportMicPlotActualType === "corporate" && (
          <>
            <CorporateMicPlotExport
              ref={corporateMicPlotExportRef}
              micPlot={currentExportingMicPlotData as CorporateMicPlotFullData}
            />
            <PrintCorporateMicPlotExport
              ref={printCorporateMicPlotExportRef}
              micPlot={currentExportingMicPlotData as CorporateMicPlotFullData}
            />
          </>
        )}

        {currentExportingMicPlotData && exportMicPlotActualType === "theater" && (
          <>
            <TheaterMicPlotExport
              ref={theaterMicPlotExportRef}
              micPlot={currentExportingMicPlotData as TheaterMicPlotFullData}
            />
            <PrintTheaterMicPlotExport
              ref={printTheaterMicPlotExportRef}
              micPlot={currentExportingMicPlotData as TheaterMicPlotFullData}
            />
          </>
        )}

        {currentExportCommsPlan && (
          <>
            <CommsPlanExport ref={commsPlanExportRef} commsPlan={currentExportCommsPlan} />
            <PrintCommsPlanExport
              ref={printCommsPlanExportRef}
              commsPlan={currentExportCommsPlan}
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
                    {documentToDelete.type === "patch"
                      ? "Patch List"
                      : documentToDelete.type === "stage"
                        ? "Stage Plot"
                        : "Mic Plot"}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-300">
                      Are you sure you want to delete "{documentToDelete.name}"? This action cannot
                      be undone.
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

        {showMicPlotTypeModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl text-white">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Select Mic Plot Type</h3>
                <button
                  onClick={() => setShowMicPlotTypeModal(false)}
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                  aria-label="Close modal"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-300 mb-6">
                Choose the type of mic plot you want to create. This will determine the initial
                template and available tools.
              </p>
              <div className="space-y-4">
                <button
                  onClick={() => handleSelectMicPlotType("corporate")}
                  className="w-full flex items-center justify-center text-left p-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all duration-200 group"
                >
                  <Briefcase
                    size={28}
                    className="mr-4 text-indigo-300 group-hover:text-white transition-colors"
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Corporate</h4>
                    <p className="text-sm text-indigo-200 group-hover:text-indigo-100 transition-colors">
                      For conferences, presentations, and panel discussions.
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => handleSelectMicPlotType("theater")}
                  className="w-full flex items-center justify-center text-left p-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all duration-200 group"
                >
                  <Drama
                    size={28}
                    className="mr-4 text-purple-300 group-hover:text-white transition-colors"
                  />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Theater</h4>
                    <p className="text-sm text-purple-200 group-hover:text-purple-100 transition-colors">
                      For stage plays, musicals, and live performances.
                    </p>
                  </div>
                </button>
              </div>
              <div className="mt-8 text-right">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md font-medium transition-colors text-sm"
                  onClick={() => setShowMicPlotTypeModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </>
  );
};

export default AudioPage;

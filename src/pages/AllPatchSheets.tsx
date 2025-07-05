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
  FileText,
  Trash2,
  Edit,
  Download,
  Search,
  SortAsc,
  SortDesc,
  Copy,
  LayoutTemplate,
  Share2,
  AlertTriangle,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import PatchSheetExport from "../components/PatchSheetExport";
import PrintPatchSheetExport from "../components/PrintPatchSheetExport";
import ShareModal from "../components/ShareModal";
import ExportModal from "../components/ExportModal";

// Define type for our patch sheets
interface PatchSheet {
  id: string;
  name: string;
  created_at: string;
  last_edited?: string;
  inputs?: any[];
  outputs?: any[];
  info?: Record<string, any>;
  [key: string]: any; // Allow any additional properties
}

const AllPatchSheets = () => {
  const navigate = useNavigate();
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [patchSheets, setPatchSheets] = useState<PatchSheet[]>([]);
  const [filteredPatchSheets, setFilteredPatchSheets] = useState<PatchSheet[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"name" | "created_at" | "last_edited">("last_edited");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentExportPatchSheet, setCurrentExportPatchSheet] = useState<PatchSheet | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedPatchSheet, setSelectedPatchSheet] = useState<PatchSheet | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedSharePatchSheet, setSelectedSharePatchSheet] = useState<PatchSheet | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPatchSheetId, setExportPatchSheetId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<{ id: string; name: string } | null>(
    null,
  );

  // Refs for the exportable components
  const exportRef = useRef<HTMLDivElement>(null);
  const printExportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPatchSheets = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (!userData.user) {
          navigate("/login");
          return;
        }

        const { data, error } = await supabase
          .from("patch_sheets")
          .select("*")
          .eq("user_id", userData.user.id)
          .order(sortField, { ascending: sortDirection === "asc" });

        if (error) throw error;

        if (data) {
          setPatchSheets(data);
          setFilteredPatchSheets(data);
        }
      } catch (error) {
        console.error("Error fetching patch sheets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatchSheets();
  }, [navigate, sortField, sortDirection]);

  // Filter patch sheets when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredPatchSheets(patchSheets);
    } else {
      const lowercaseSearch = searchTerm.toLowerCase();
      const filtered = patchSheets.filter((sheet) =>
        sheet.name.toLowerCase().includes(lowercaseSearch),
      );
      setFilteredPatchSheets(filtered);
    }
  }, [searchTerm, patchSheets]);

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

  const handleDeleteRequest = (id: string, name: string) => {
    setDocumentToDelete({ id, name });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!documentToDelete) return;

    try {
      const { error } = await supabase.from("patch_sheets").delete().eq("id", documentToDelete.id);

      if (error) throw error;

      // Update the local state
      setPatchSheets(patchSheets.filter((item) => item.id !== documentToDelete.id));
      setFilteredPatchSheets(filteredPatchSheets.filter((item) => item.id !== documentToDelete.id));
    } catch (error) {
      console.error("Error deleting patch sheet:", error);
      alert("Failed to delete patch sheet. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setDocumentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setDocumentToDelete(null);
  };

  const handleEditPatchSheet = (id: string) => {
    navigate(`/patch-sheet/${id}`, { state: { from: "/all-patch-sheets" } });
  };

  const handleSharePatchSheet = (patchSheet: PatchSheet) => {
    setSelectedSharePatchSheet(patchSheet);
    setShowShareModal(true);
  };

  const handleDuplicatePatchSheet = async (patchSheet: PatchSheet) => {
    try {
      setDuplicatingId(patchSheet.id);

      // Fetch complete patch sheet data if needed
      let fullPatchSheet = patchSheet;
      if (!patchSheet.inputs || !patchSheet.outputs || !patchSheet.info) {
        const { data, error } = await supabase
          .from("patch_sheets")
          .select("*")
          .eq("id", patchSheet.id)
          .single();

        if (error) throw error;
        fullPatchSheet = data;
      }

      // Create new patch sheet with the same data
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      // Create a duplicate patch sheet with "Copy of" prefix
      const { data: newPatchSheet, error: insertError } = await supabase
        .from("patch_sheets")
        .insert([
          {
            name: `Copy of ${fullPatchSheet.name}`,
            user_id: userData.user.id,
            info: fullPatchSheet.info,
            inputs: fullPatchSheet.inputs,
            outputs: fullPatchSheet.outputs,
            created_at: new Date().toISOString(),
            last_edited: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) throw insertError;

      if (newPatchSheet && newPatchSheet[0]) {
        // Add the new patch sheet to the local state
        setPatchSheets([newPatchSheet[0], ...patchSheets]);
        setFilteredPatchSheets([newPatchSheet[0], ...filteredPatchSheets]);

        // Navigate to the editor for the new patch sheet
        navigate(`/patch-sheet/${newPatchSheet[0].id}`, { state: { from: "/all-patch-sheets" } });
      }
    } catch (error) {
      console.error("Error duplicating patch sheet:", error);
      alert("Failed to duplicate patch sheet. Please try again.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleCreateTemplateClick = (patchSheet: PatchSheet) => {
    setSelectedPatchSheet(patchSheet);
    setTemplateId(patchSheet.id);
    setTemplateName(`Template - ${patchSheet.name}`);
    setShowTemplateModal(true);
  };

  const handleCreateTemplate = async () => {
    if (!selectedPatchSheet || !templateName) return;

    try {
      setTemplateId(selectedPatchSheet.id);

      // Fetch complete patch sheet data if needed
      let fullPatchSheet = selectedPatchSheet;
      if (!selectedPatchSheet.inputs || !selectedPatchSheet.outputs) {
        const { data, error } = await supabase
          .from("patch_sheets")
          .select("*")
          .eq("id", selectedPatchSheet.id)
          .single();

        if (error) throw error;
        fullPatchSheet = data;
      }

      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error("User not authenticated");
      }

      // Create template versions of the inputs and outputs
      // For inputs, keep only connection type and related fields
      const templateInputs = (fullPatchSheet.inputs || []).map((input: any, index: number) => {
        return {
          id: `input-template-${index}`,
          channelNumber: `${index + 1}`,
          name: "", // Empty name
          type: "", // Empty type
          device: "", // Empty device
          phantom: input.phantom || false,
          connection: input.connection || "",
          connectionDetails: input.connectionDetails || {},
          notes: "", // Empty notes
          // Preserve stereo linking if present
          isStereo: input.isStereo || false,
          stereoChannelNumber: input.stereoChannelNumber || "",
        };
      });

      // For outputs, keep only source type and related fields
      const templateOutputs = (fullPatchSheet.outputs || []).map((output: any, index: number) => {
        return {
          id: `output-template-${index}`,
          channelNumber: `${index + 1}`,
          name: "", // Empty name
          sourceType: output.sourceType || "",
          sourceDetails: output.sourceDetails || {},
          destinationType: "", // Empty destination type
          destinationGear: "", // Empty destination gear
          notes: "", // Empty notes
          // Preserve stereo linking if present
          isStereo: output.isStereo || false,
          stereoChannelNumber: output.stereoChannelNumber || "",
        };
      });

      // Create a template patch sheet
      const { data: newTemplate, error: insertError } = await supabase
        .from("patch_sheets")
        .insert([
          {
            name: templateName,
            user_id: userData.user.id,
            info: {}, // Empty info
            inputs: templateInputs,
            outputs: templateOutputs,
            created_at: new Date().toISOString(),
            last_edited: new Date().toISOString(),
          },
        ])
        .select();

      if (insertError) throw insertError;

      if (newTemplate && newTemplate[0]) {
        // Add the new template to the local state
        setPatchSheets([newTemplate[0], ...patchSheets]);
        setFilteredPatchSheets([newTemplate[0], ...filteredPatchSheets]);

        // Close modal and reset state
        setShowTemplateModal(false);
        setSelectedPatchSheet(null);
        setTemplateName("");

        // Navigate to edit the new template
        navigate(`/patch-sheet/${newTemplate[0].id}`, { state: { from: "/all-patch-sheets" } });
      }
    } catch (error) {
      console.error("Error creating template:", error);
      alert("Failed to create template. Please try again.");
    } finally {
      setTemplateId(null);
    }
  };

  const handleExportPatchSheetClick = (patchSheet: PatchSheet) => {
    setExportPatchSheetId(patchSheet.id);
    setShowExportModal(true);
  };

  const handlePdfExport = async (patchSheetId: string, exportFormat: 'color' | 'print') => {
    try {
      setDownloadingId(patchSheetId);
      setShowExportModal(false);

      // Fetch complete patch sheet data if needed
      let fullPatchSheet = patchSheets.find((p) => p.id === patchSheetId);
      if (
        !fullPatchSheet ||
        !fullPatchSheet.inputs ||
        !fullPatchSheet.outputs ||
        !fullPatchSheet.info
      ) {
        const { data, error } = await supabase
          .from("patch_sheets")
          .select("*")
          .eq("id", patchSheetId)
          .single();

        if (error) throw error;
        fullPatchSheet = data;
      }

      if (!fullPatchSheet) {
        throw new Error("Patch sheet not found");
      }

      // Set the current patch sheet to be exported
      setCurrentExportPatchSheet(fullPatchSheet);

      // Wait for the component to render
      await new Promise(resolve => setTimeout(resolve, 100));

      const targetRef = exportFormat === 'color' ? exportRef : printExportRef;
      const backgroundColor = exportFormat === 'color' ? '#111827' : '#ffffff';
      const fileNameSuffix = exportFormat === 'color' ? 'patch-sheet' : 'patch-sheet-print';

      if (targetRef.current) {
        const canvas = await html2canvas(targetRef.current, {
          scale: 2,
          backgroundColor,
          logging: false,
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
        pdf.save(`${fullPatchSheet.name.replace(/\s+/g, "-").toLowerCase()}-${fileNameSuffix}.pdf`);

      } else {
        throw new Error("Export component is not ready.");
      }
    } catch (error) {
      console.error(`Error exporting ${exportFormat} PDF:`, error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      // Clean up
      setCurrentExportPatchSheet(null);
      setDownloadingId(null);
      setExportPatchSheetId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Show warning on mobile screens
  if (screenSize === "mobile" || screenSize === "tablet") {
    return (
      <MobileScreenWarning
        title="Screen Size Too Small"
        description="The Patch Sheet management requires a larger screen to provide the best experience. Please use a desktop or laptop computer."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header dashboard={true} />

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
            onClick={() => navigate("/patch-sheet/new", { state: { from: "/all-patch-sheets" } })}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md font-medium transition-all duration-200"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            New Patch Sheet
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-white">All Patch Sheets</h1>
            <p className="text-gray-400">Manage all your patch sheets in one place</p>
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
                {filteredPatchSheets.length > 0 ? (
                  filteredPatchSheets.map((sheet) => (
                    <tr key={sheet.id} className="hover:bg-gray-750 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                          <span className="text-white font-medium">{sheet.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {new Date(sheet.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-gray-300">
                        {sheet.last_edited
                          ? new Date(sheet.last_edited).toLocaleDateString()
                          : new Date(sheet.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Share"
                            onClick={() => handleSharePatchSheet(sheet)}
                          >
                            <Share2 className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Create Template"
                            onClick={() => handleCreateTemplateClick(sheet)}
                            disabled={templateId === sheet.id}
                          >
                            <LayoutTemplate
                              className={`h-5 w-5 ${templateId === sheet.id ? "animate-pulse" : ""}`}
                            />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Duplicate"
                            onClick={() => handleDuplicatePatchSheet(sheet)}
                            disabled={duplicatingId === sheet.id}
                          >
                            <Copy
                              className={`h-5 w-5 ${duplicatingId === sheet.id ? "animate-pulse" : ""}`}
                            />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Download"
                            onClick={() => handleExportPatchSheetClick(sheet)}
                            disabled={downloadingId === sheet.id}
                          >
                            <Download
                              className={`h-5 w-5 ${downloadingId === sheet.id ? "animate-pulse" : ""}`}
                            />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-indigo-400 transition-colors"
                            title="Edit"
                            onClick={() => handleEditPatchSheet(sheet.id)}
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                            onClick={() => handleDeleteRequest(sheet.id, sheet.name)}
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
                        ? "No patch sheets match your search criteria"
                        : "You haven't created any patch sheets yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredPatchSheets.length > 0 && (
            <div className="p-4 border-t border-gray-700 text-gray-400 text-sm">
              Showing {filteredPatchSheets.length} of {patchSheets.length} patch sheets
            </div>
          )}
        </div>
      </main>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-white mb-4">Create Template</h3>
            <p className="text-gray-300 mb-4">
              This will create a template that preserves only connection details for inputs and
              source details for outputs. All other fields will be blank for customization.
            </p>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2" htmlFor="templateName">
                Template Name
              </label>
              <input
                id="templateName"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full bg-gray-700 text-white border border-gray-600 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter template name"
              />
            </div>
            <div className="flex space-x-3 justify-end">
              <button
                className="px-4 py-2 text-gray-300 hover:text-white"
                onClick={() => {
                  setShowTemplateModal(false);
                  setSelectedPatchSheet(null);
                  setTemplateName("");
                }}
              >
                Cancel
              </button>
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200"
                onClick={handleCreateTemplate}
                disabled={!templateName.trim() || !selectedPatchSheet}
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedSharePatchSheet && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedSharePatchSheet(null);
          }}
          resourceId={selectedSharePatchSheet.id}
          resourceType="patch_sheet"
          resourceName={selectedSharePatchSheet.name}
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportColor={() => exportPatchSheetId && handlePdfExport(exportPatchSheetId, 'color')}
        onExportPrintFriendly={() => exportPatchSheetId && handlePdfExport(exportPatchSheetId, 'print')}
        title="Patch Sheet"
        isExporting={!!downloadingId}
      />

      {/* Hidden Export Components */}
      {currentExportPatchSheet && (
        <>
          <PatchSheetExport ref={exportRef} patchSheet={currentExportPatchSheet} />
          <PrintPatchSheetExport ref={printExportRef} patchSheet={currentExportPatchSheet} />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && documentToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-500/20 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
              </div>
              <div className="ml-4 text-left">
                <h3 className="text-lg font-medium text-white" id="modal-title">
                  Delete Patch Sheet
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

export default AllPatchSheets;

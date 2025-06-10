import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
import PatchSheetInputs from "../components/patch-sheet/PatchSheetInputs";
import PatchSheetOutputs from "../components/patch-sheet/PatchSheetOutputs";
import MobileScreenWarning from "../components/MobileScreenWarning";
import { useScreenSize } from "../hooks/useScreenSize";
import { Loader, ArrowLeft, Save, AlertCircle } from "lucide-react";
import { getSharedResource, updateSharedResource, getShareUrl } from "../lib/shareUtils"; // Added getShareUrl

interface InputChannel {
  id: string;
  channelNumber: string;
  name: string;
  type: string;
  device: string;
  phantom: boolean;
  connection: string;
  connectionDetails?: {
    snakeType?: string;
    inputNumber?: string;
    networkType?: string;
    networkPatch?: string;
    consoleType?: string;
    consoleInputNumber?: string;
  };
  notes: string;
  isStereo?: boolean;
  stereoChannelNumber?: string;
}

interface OutputChannel {
  id: string;
  channelNumber: string;
  name: string;
  sourceType: string;
  sourceDetails?: {
    outputNumber?: string;
    snakeType?: string;
    networkType?: string;
    networkPatch?: string;
    consoleType?: string;
    consoleOutputNumber?: string;
  };
  destinationType: string;
  destinationGear: string;
  notes: string;
}

const PatchSheetEditor = () => {
  const { id, shareCode } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const screenSize = useScreenSize();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patchSheet, setPatchSheet] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("inputs");
  const [user, setUser] = useState<any>(null);
  const [inputs, setInputs] = useState<InputChannel[]>([]);
  const [outputs, setOutputs] = useState<OutputChannel[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [isSharedEdit, setIsSharedEdit] = useState(false); // State for UI elements like Header
  const [shareLink, setShareLink] = useState<any>(null); // Added state for shareLink

  useEffect(() => {
    if (screenSize === "mobile" || screenSize === "tablet") {
      setShowMobileWarning(true);
    }
    // This effect sets the isSharedEdit state, which can be used by UI elements
    // that react to this state change (e.g., Header, save button logic if needed).
    // The main data fetching logic will calculate this directly to avoid race conditions.
    setIsSharedEdit(location.pathname.includes("/shared/edit/"));
  }, [screenSize, location.pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    };

    const fetchPatchSheetData = async () => {
      setLoading(true);
      // Determine if it's a shared edit directly from the path for this fetch operation
      const currentPathIsSharedEdit = location.pathname.includes("/shared/edit/");
      
      console.log(`[PatchSheetEditor] Fetching. Path: ${location.pathname}, ID: ${id}, ShareCode: ${shareCode}, CalculatedIsShared: ${currentPathIsSharedEdit}`);

      if (currentPathIsSharedEdit && shareCode) {
        console.log("[PatchSheetEditor] Attempting to fetch SHARED resource with shareCode:", shareCode);
        try {
          const { resource, shareLink: fetchedShareLink } = await getSharedResource(shareCode);
          console.log("[PatchSheetEditor] Fetched SHARED resource:", resource, "Link:", fetchedShareLink);

          if (fetchedShareLink.link_type !== "edit") {
            console.log("[PatchSheetEditor] Link type is not 'edit', redirecting to view.");
            // Ensure getShareUrl is imported and provides the correct view URL
            window.location.href = getShareUrl(shareCode, fetchedShareLink.resource_type, 'view');
            // setLoading(false); // Not strictly needed before redirect
            return; // Exit after redirect
          }

          setPatchSheet(resource);
          setShareLink(fetchedShareLink); // Set the fetched share link state
          setInputs(resource.inputs && Array.isArray(resource.inputs) ? resource.inputs : []);
          const updatedOutputs = (resource.outputs && Array.isArray(resource.outputs) ? resource.outputs : []).map((output: any) => ({
            ...output,
            destinationGear: output.destinationGear || "",
          }));
          setOutputs(updatedOutputs);
          setLoading(false);
          console.log("[PatchSheetEditor] SHARED resource loaded successfully.");
          return; // CRITICAL: Exit after successful shared load
        } catch (error: any) {
          console.error("[PatchSheetEditor] Error fetching SHARED patch sheet:", error.message);
          navigate("/"); // Navigate to home or an error page on shared fetch failure
          setLoading(false);
          return; // CRITICAL: Exit after error in shared load
        }
      } else {
        // Proceed with OWNED document logic
        console.log(`[PatchSheetEditor] Proceeding with OWNED document logic. ID: ${id}, User:`, user);
        if (id === "new") {
          setPatchSheet({
            name: "Untitled Patch Sheet",
            created_at: new Date().toISOString(),
            info: { /* ... default info object ... */ },
            inputs: [], outputs: [],
          });
          setInputs([]);
          setOutputs([]);
          setLoading(false);
          console.log("[PatchSheetEditor] New OWNED document initialized.");
          return; // CRITICAL: Exit after new owned init
        }

        if (!id) {
          console.error("[PatchSheetEditor] OWNED logic: No ID, and not 'new'. Invalid state.");
          navigate("/dashboard"); 
          setLoading(false);
          return; // CRITICAL: Exit if no ID for owned doc
        }

        try {
          console.log("[PatchSheetEditor] Fetching OWNED patch sheet with id:", id);
          const { data, error } = await supabase.from("patch_sheets").select("*").eq("id", id).single();
          
          if (error) {
            console.error("[PatchSheetEditor] Error fetching OWNED patch sheet from Supabase:", error);
            throw error; // Let the catch block handle it
          }
          if (!data) {
            console.error("[PatchSheetEditor] OWNED patch sheet not found or access denied for id:", id);
            navigate("/dashboard"); // Or a "not found" page
            setLoading(false);
            return; // CRITICAL: Exit if no data
          }
          setPatchSheet(data);
          setInputs(data.inputs && Array.isArray(data.inputs) ? data.inputs : []);
          const updatedOutputs = (data.outputs && Array.isArray(data.outputs) ? data.outputs : []).map((output: any) => ({
            ...output,
            destinationGear: output.destinationGear || "",
          }));
          setOutputs(updatedOutputs);
          setLoading(false);
          console.log("[PatchSheetEditor] OWNED patch sheet loaded successfully.");
          // No return here, normal flow to end of function
        } catch (error) {
          console.error("[PatchSheetEditor] Catch block for OWNED patch sheet fetch error:", error);
          navigate("/dashboard"); // This is the redirect the user was seeing
          setLoading(false);
          // No return here, normal flow to end of function
        }
      }
    };

    fetchUser();
    fetchPatchSheetData();
  }, [id, shareCode, location.pathname, navigate]); // Removed isSharedEdit (state) from dependencies

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const updatedInputs = inputs.map((input) => ({
      ...input,
      connectionDetails: input.connection ? input.connectionDetails || {} : undefined,
    }));

    const updatedOutputs = outputs.map((output) => ({
      ...output,
      sourceDetails: output.sourceType ? output.sourceDetails || {} : undefined,
    }));

    try {
      const patchSheetData = {
        ...patchSheet,
        inputs: updatedInputs,
        outputs: updatedOutputs,
        last_edited: new Date().toISOString(),
      };
      
      // Use the isSharedEdit state here, as it's for a user action, not initial load
      if (isSharedEdit && shareCode) {
        const result = await updateSharedResource(shareCode, "patch_sheet", patchSheetData);
        if (result) {
          setPatchSheet(patchSheetData);
          setInputs(updatedInputs);
          setOutputs(updatedOutputs);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } else if (user) {
        if (id === "new") {
          const { data, error } = await supabase
            .from("patch_sheets")
            .insert([{ ...patchSheetData, user_id: user.id }])
            .select();
          if (error) throw error;
          if (data && data[0]) navigate(`/patch-sheet/${data[0].id}`);
        } else {
          const { error } = await supabase.from("patch_sheets").update(patchSheetData).eq("id", id);
          if (error) throw error;
          setPatchSheet(patchSheetData);
          setInputs(updatedInputs);
          setOutputs(updatedOutputs);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } else {
        // Not a shared edit, and no user logged in.
        console.warn("[PatchSheetEditor] Save attempt failed: Not a shared edit and user is not logged in.");
        setSaveError("You must be logged in to save changes to your own documents, or this shared link may not support editing.");
      }
    } catch (error) {
      console.error("Error saving patch sheet:", error);
      setSaveError("Error saving patch sheet. Please try again.");
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  const updateInputs = (newInputs: InputChannel[]) => {
    setInputs(newInputs);
  };

  const updateOutputs = (newOutputs: OutputChannel[]) => {
    setOutputs(newOutputs);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="h-12 w-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {showMobileWarning && (
        <MobileScreenWarning
          title="Optimized for Larger Screens"
          description="This editor works best on larger screens. You can continue, but some features may be harder to use on mobile."
          continueAnyway={true}
          editorType="patch"
        />
      )}

      {/* Header uses isSharedEdit state, which is fine as it re-renders when state changes */}
      <Header dashboard={!isSharedEdit} />

      <main className="flex-grow container mx-auto px-4 py-6 md:py-12 mt-16 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
          <div className="flex items-center">
            <button
              onClick={() =>
                isSharedEdit && shareCode // Use state here, reliable after initial load
                  ? (window.location.href = getShareUrl(shareCode, patchSheet?.resource_type || 'patch_sheet' , 'view')) // Fallback to patch_sheet if type unknown
                  : navigate("/audio")
              }
              className="mr-2 md:mr-4 flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <input
                type="text"
                value={patchSheet?.name || "Untitled Patch Sheet"}
                onChange={(e) => setPatchSheet({ ...patchSheet, name: e.target.value })}
                className="text-xl md:text-2xl font-bold text-white bg-transparent border-none focus:outline-none focus:ring-0 w-full max-w-[220px] sm:max-w-none"
                placeholder="Enter patch sheet name"
              />
              <p className="text-xs sm:text-sm text-gray-400">
                Last edited:{" "}
                {new Date(patchSheet?.last_edited || patchSheet?.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="fixed bottom-4 right-4 z-10 md:static md:z-auto sm:ml-auto">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg md:shadow-none"
            >
              {saving ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {saveError && (
          <div className="bg-red-400/10 border border-red-400 rounded-lg p-4 mb-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-red-400 text-sm">{saveError}</p>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-400/10 border border-green-400 rounded-lg p-4 mb-4 flex items-start">
            <Save className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-green-400 text-sm">Patch sheet saved successfully!</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-4 md:p-6 border-b border-gray-700">
            <h2 className="text-xl font-medium text-white">Patch Sheet Editor</h2>
            <p className="text-gray-400 text-sm">
              Manage your input and output lists
            </p>
          </div>

          <div className="border-b border-gray-700">
            <nav className="flex overflow-x-auto">
              <button
                className={`px-3 md:px-6 py-3 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === "inputs"
                    ? "text-white border-b-2 border-indigo-500"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("inputs")}
              >
                Inputs
              </button>
              <button
                className={`px-3 md:px-6 py-3 text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                  activeTab === "outputs"
                    ? "text-white border-b-2 border-indigo-500"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("outputs")}
              >
                Outputs
              </button>
            </nav>
          </div>

          <div className="p-4 md:p-6 overflow-x-auto">
            <div className="min-w-[800px] md:min-w-0">
              {activeTab === "inputs" && (
                <PatchSheetInputs inputs={inputs} updateInputs={updateInputs} />
              )}
              {activeTab === "outputs" && (
                <PatchSheetOutputs outputs={outputs} updateOutputs={updateOutputs} />
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center py-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md font-medium transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg text-base"
          >
            {saving ? (
              <>
                <Loader className="h-5 w-5 mr-2 animate-spin" />
                Saving Patch Sheet...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Patch Sheet
              </>
            )}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PatchSheetEditor;

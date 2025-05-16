import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";
import Footer from "../components/Footer";
// PatchSheetInfo component is no longer used directly here
import PatchSheetInputs from "../components/patch-sheet/PatchSheetInputs";
import PatchSheetOutputs from "../components/patch-sheet/PatchSheetOutputs";
import MobileScreenWarning from "../components/MobileScreenWarning";
import { useScreenSize } from "../hooks/useScreenSize";
import { Loader, ArrowLeft, Save, AlertCircle } from "lucide-react";
import { getSharedResource, updateSharedResource } from "../lib/shareUtils";

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
  const [activeTab, setActiveTab] = useState("inputs"); // Default to "inputs"
  const [user, setUser] = useState<any>(null);
  const [inputs, setInputs] = useState<InputChannel[]>([]);
  const [outputs, setOutputs] = useState<OutputChannel[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  const [isSharedEdit, setIsSharedEdit] = useState(false);
  const [shareLink, setShareLink] = useState<any>(null);

  useEffect(() => {
    if (screenSize === "mobile" || screenSize === "tablet") {
      setShowMobileWarning(true);
    }
    const isSharedEditRoute = location.pathname.includes("/shared/edit/");
    setIsSharedEdit(isSharedEditRoute);
  }, [screenSize, location.pathname]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUser(data.user);
      }
    };

    const fetchPatchSheet = async () => {
      if (isSharedEdit && shareCode) {
        try {
          const { resource, shareLink } = await getSharedResource(shareCode);
          if (shareLink.link_type !== "edit") {
            window.location.href = `https://sounddocs.org/shared/${shareCode}`;
            return;
          }
          setPatchSheet(resource);
          setShareLink(shareLink);
          setInputs(resource.inputs && Array.isArray(resource.inputs) ? resource.inputs : []);
          const updatedOutputs = (resource.outputs && Array.isArray(resource.outputs) ? resource.outputs : []).map((output: any) => ({
            ...output,
            destinationGear: output.destinationGear || "",
          }));
          setOutputs(updatedOutputs);
          setLoading(false);
          return;
        } catch (error) {
          console.error("Error fetching shared patch sheet:", error);
          window.location.href = "https://sounddocs.org/";
          return;
        }
      }

      if (id === "new") {
        setPatchSheet({
          name: "Untitled Patch Sheet",
          created_at: new Date().toISOString(),
          // Info object is still created for data consistency, even if not editable in UI
          info: {
            event_name: "", venue: "", room: "", address: "", date: "", time: "",
            load_in: "", sound_check: "", doors_open: "", event_start: "", event_end: "",
            client: "", artist: "", genre: "", contact_name: "", contact_email: "", contact_phone: "",
            foh_engineer: "", monitor_engineer: "", production_manager: "", av_company: "",
            pa_system: "", console_foh: "", console_monitors: "", monitor_type: "",
            event_type: "", estimated_attendance: "", hospitality_notes: "", notes: "",
          },
          inputs: [],
          outputs: [],
        });
        setInputs([]);
        setOutputs([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.from("patch_sheets").select("*").eq("id", id).single();
        if (error) throw error;
        setPatchSheet(data);
        setInputs(data.inputs && Array.isArray(data.inputs) ? data.inputs : []);
        const updatedOutputs = (data.outputs && Array.isArray(data.outputs) ? data.outputs : []).map((output: any) => ({
          ...output,
          destinationGear: output.destinationGear || "",
        }));
        setOutputs(updatedOutputs);
      } catch (error) {
        console.error("Error fetching patch sheet:", error);
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
    fetchPatchSheet();
  }, [id, navigate, isSharedEdit, shareCode, location.pathname]);

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
        ...patchSheet, // This includes the existing patchSheet.info
        inputs: updatedInputs,
        outputs: updatedOutputs,
        last_edited: new Date().toISOString(),
      };

      if (isSharedEdit && shareCode) {
        const result = await updateSharedResource(shareCode, "patch_sheet", patchSheetData);
        if (result) {
          setPatchSheet(patchSheetData); // Update local state
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
          setPatchSheet(patchSheetData); // Update local state
          setInputs(updatedInputs);
          setOutputs(updatedOutputs);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      }
    } catch (error) {
      console.error("Error saving patch sheet:", error);
      setSaveError("Error saving patch sheet. Please try again.");
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // updatePatchSheetInfo is no longer needed as PatchSheetInfo component is removed
  // const updatePatchSheetInfo = (info: any) => {
  //   setPatchSheet({
  //     ...patchSheet,
  //     info,
  //   });
  // };

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

      <Header dashboard={!isSharedEdit} />

      <main className="flex-grow container mx-auto px-4 py-6 md:py-12 mt-16 md:mt-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-8 gap-4">
          <div className="flex items-center">
            <button
              onClick={() =>
                isSharedEdit
                  ? (window.location.href = `https://sounddocs.org/shared/${shareCode}`)
                  : navigate("/dashboard")
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
              {/* "Info" tab button removed */}
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
              {/* Rendering of PatchSheetInfo removed */}
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

import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftCircle, Server, Save, FolderOpen } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AgentConnectionManager from "../components/analyzer/AgentConnectionManager";
import AgentDownload from "../components/analyzer/AgentDownload";
import ProSettings from "../components/analyzer/ProSettings";
import SavedMeasurementsModal from "../components/analyzer/SavedMeasurementsModal";
import ChartDetailModal from "../components/analyzer/ChartDetailModal";
import { TransferFunctionVisualizer } from "@sounddocs/analyzer-lite";
import { useCaptureAgent } from "../stores/agentStore";
import { supabase } from "../lib/supabase";
import { Device, TFData } from "@sounddocs/analyzer-protocol";
import { useState, useEffect, useMemo } from "react";
import { TRACE_COLORS } from "../lib/constants";
import { EqSetting } from "../lib/dsp";

interface Measurement {
  id: string;
  name: string;
  created_at: string;
  tf_data: TFData;
  color?: string;
  sample_rate: number;
  eq_settings?: EqSetting[];
}

const AnalyzerProPage: React.FC = () => {
  const navigate = useNavigate();
  const { status, lastMessage, sendMessage } = useCaptureAgent();
  const [devices, setDevices] = useState<Device[]>([]);
  const [tfData, setTfData] = useState<TFData | null>(null);
  const [delayMs, setDelayMs] = useState<number>(0);
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [delayMode, setDelayMode] = useState<string>("auto");
  const [appliedDelayMs, setAppliedDelayMs] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<
    "magnitude" | "phase" | "impulse" | "coherence"
  >("magnitude");
  const [savedMeasurements, setSavedMeasurements] = useState<Measurement[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [eqMeasurementId, setEqMeasurementId] = useState<string | null>(null);
  const [measurementAdjustments, setMeasurementAdjustments] = useState<{
    [id: string]: { gain: number; delay: number };
  }>({});

  const handleEqChange = async (id: string, eq_settings: EqSetting[]) => {
    // Update local state immediately for responsiveness
    const updatedMeasurements = savedMeasurements.map((m) =>
      m.id === id ? { ...m, eq_settings } : m,
    );
    setSavedMeasurements(updatedMeasurements);

    // Persist to database
    try {
      const { error } = await supabase
        .from("tf_measurements")
        .update({ eq_settings })
        .match({ id });
      if (error) throw error;
    } catch (error) {
      console.error("Error updating EQ settings:", error);
      // Optionally revert local state change on error
    }
  };

  const handleAddMeasurements = async (measurements: Omit<Measurement, "id" | "created_at">[]) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const newMeasurements = measurements.map((m) => {
        const { color, ...rest } = m;
        return {
          ...rest,
          color_preference: color,
          user_id: user.id,
          nfft: m.tf_data.freqs.length * 2 - 2,
          agent_version: "capture-agent-py/0.1.0",
          dsp_version: "tf/0.1.0",
          window: "hann",
          ref_chan: 1,
          meas_chan: 2,
        };
      });

      const { error } = await supabase.from("tf_measurements").insert(newMeasurements);
      if (error) throw error;

      fetchMeasurements();
    } catch (error) {
      console.error("Error importing measurements:", error);
      alert(
        `Error importing measurements: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const handleMeasurementAdjustmentChange = (
    id: string,
    newValues: { gain?: number; delay?: number },
  ) => {
    setMeasurementAdjustments((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { gain: 0, delay: 0 }),
        ...newValues,
      },
    }));
  };

  useEffect(() => {
    fetchMeasurements();
  }, []);

  useEffect(() => {
    if (status === "connected") {
      sendMessage({ type: "list_devices" });
    }
  }, [status, sendMessage]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === "devices") {
        setDevices(lastMessage.items);
      } else if (lastMessage.type === "frame") {
        setIsCapturing(true);
        setTfData(lastMessage.tf);
        setDelayMs(lastMessage.delay_ms);
        setSampleRate(lastMessage.sampleRate);
        setDelayMode(lastMessage.delay_mode);
        setAppliedDelayMs(lastMessage.applied_delay_ms);
      } else if (lastMessage.type === "stopped") {
        setIsCapturing(false);
      } else if (lastMessage.type === "delay_status") {
        // immediate UI feedback when you click the button
        if (typeof lastMessage.applied_ms === "number") {
          setAppliedDelayMs(lastMessage.applied_ms);
        }
        if (typeof lastMessage.mode === "string") {
          setDelayMode(lastMessage.mode);
        }
      }
    }
  }, [lastMessage]);

  const fetchMeasurements = async () => {
    try {
      const { data, error } = await supabase
        .from("tf_measurements")
        .select("id, name, created_at, tf_data, sample_rate, eq_settings, capture_delay_ms")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedMeasurements(
        (data || []).map((m, i) => ({
          ...m,
          color: TRACE_COLORS[i % TRACE_COLORS.length],
        })),
      );
    } catch (error) {
      console.error("Error fetching measurements:", error);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    try {
      const { error } = await supabase.from("tf_measurements").delete().match({ id });
      if (error) throw error;
      setSavedMeasurements(savedMeasurements.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting measurement:", error);
    }
  };

  const toggleMeasurementVisibility = (id: string) => {
    setVisibleIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSaveMeasurement = async () => {
    if (!tfData) {
      alert("No measurement data to save.");
      return;
    }

    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not logged in.");
      }

      const name = prompt(
        "Enter a name for the measurement:",
        `Measurement - ${new Date().toLocaleString()}`,
      );
      if (!name) {
        setIsSaving(false);
        return;
      }

      const payload = {
        user_id: user.id,
        name,
        tf_data: tfData,
        sample_rate: sampleRate,
        capture_delay_ms: appliedDelayMs,
        nfft: tfData.freqs.length * 2 - 2, // This is an approximation
        // Hardcoded for now, will be dynamic later
        agent_version: "capture-agent-py/0.1.0",
        dsp_version: "tf/0.1.0",
        window: "hann",
        ref_chan: 1,
        meas_chan: 2,
      };

      const { error } = await supabase.from("tf_measurements").insert(payload);

      if (error) {
        throw error;
      }

      alert("Measurement saved successfully!");
      fetchMeasurements(); // Refresh the list after saving
    } catch (error) {
      console.error("Error saving measurement:", error);
      alert(`Error saving measurement: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <Header onSignOut={handleSignOut} />

      <main className="flex-grow container mx-auto px-4 py-12 mt-12">
        <div className="mb-8">
          <button
            onClick={() => navigate("/analyzer")}
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4 group"
          >
            <ArrowLeftCircle className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Analyzer Hub
          </button>
          <div className="flex items-center mb-4">
            <Server className="h-8 w-8 text-indigo-400 mr-3" />
            <h1 className="text-4xl font-bold text-white">AcoustIQ Pro</h1>
          </div>
          <p className="text-lg text-gray-300">
            Connect to the local capture agent for multi-channel analysis, transfer functions, and
            more.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          <AgentConnectionManager />

          {status !== "connected" && <AgentDownload />}
          {status === "connected" && (
            <ProSettings
              devices={devices}
              onStartCapture={(config) => {
                sendMessage({ type: "start", ...config });
                setIsCapturing(true);
              }}
              onStopCapture={() => {
                sendMessage({ type: "stop" });
                setIsCapturing(false);
              }}
              onFreezeDelay={(enable) =>
                sendMessage({ type: "delay_freeze", enable, applied_ms: appliedDelayMs })
              }
              delayMode={delayMode}
              appliedDelayMs={appliedDelayMs}
              isCapturing={isCapturing}
            />
          )}
          <div className="bg-gray-800 p-4 rounded-lg shadow-inner">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-white">Measurements</h3>
              <div className="flex items-center space-x-2">
                {status === "connected" && (
                  <button
                    className="bg-indigo-500 text-white hover:bg-indigo-600 font-semibold py-2 px-4 rounded-md inline-flex items-center transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-px"
                    onClick={handleSaveMeasurement}
                    disabled={isSaving}
                  >
                    <Save className="h-5 w-5 mr-2" />
                    {isSaving ? "Saving..." : "Save Measurement"}
                  </button>
                )}
                <button
                  className="bg-transparent text-indigo-400 hover:text-white hover:bg-indigo-500 border border-indigo-400 font-semibold py-2 px-4 rounded-md inline-flex items-center transition-all duration-300 ease-in-out"
                  onClick={() => setIsModalOpen(true)}
                >
                  <FolderOpen className="h-5 w-5 mr-2" />
                  View Saved
                </button>
              </div>
            </div>
            {status === "connected" && (
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-3xl font-mono text-green-400">
                    {appliedDelayMs.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-400">Applied Delay (ms)</div>
                </div>
              </div>
            )}
          </div>
          <TransferFunctionVisualizer
            tfData={tfData}
            sampleRate={sampleRate}
            saved={savedMeasurements
              .filter((m) => visibleIds.has(m.id))
              .map((m) => ({
                id: m.id,
                tf: m.tf_data,
                label: m.name,
                color: m.color,
                sample_rate: m.sample_rate,
              }))}
            onChartClick={(chartName) => {
              setSelectedChart(chartName);
              setIsDetailModalOpen(true);
            }}
          />
        </div>
      </main>

      <Footer />
      <SavedMeasurementsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        measurements={savedMeasurements}
        visibleIds={visibleIds}
        onToggleVisibility={toggleMeasurementVisibility}
        onDelete={handleDeleteMeasurement}
        onRefresh={fetchMeasurements}
      />

      <ChartDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setEqMeasurementId(null);
        }}
        initialChart={selectedChart}
        liveData={tfData}
        savedMeasurements={savedMeasurements}
        visibleIds={visibleIds}
        onToggleVisibility={toggleMeasurementVisibility}
        onDelete={handleDeleteMeasurement}
        onAddMeasurements={handleAddMeasurements}
        sampleRate={sampleRate}
        measurementAdjustments={measurementAdjustments}
        onMeasurementAdjustmentChange={handleMeasurementAdjustmentChange}
        eqMeasurementId={eqMeasurementId}
        onEqMeasurementIdChange={setEqMeasurementId}
        onEqChange={handleEqChange}
      />
    </div>
  );
};

export default AnalyzerProPage;

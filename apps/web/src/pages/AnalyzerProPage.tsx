import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { ArrowLeftCircle, Server, Save, FolderOpen } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { getCanonicalUrl } from "../utils/canonical-url";
import { generateBreadcrumbSchema, createBreadcrumbs } from "../utils/breadcrumb-schema";
import { acoustiqProSchema } from "../schemas/software-schemas";
import AgentConnectionManager from "../components/analyzer/AgentConnectionManager";
import AgentDownload from "../components/analyzer/AgentDownload";
import AgentUpdateNotification from "../components/analyzer/AgentUpdateNotification";
import ProSettings from "../components/analyzer/ProSettings";
import SignalGeneratorSettings, {
  SignalGeneratorConfig,
} from "../components/analyzer/SignalGeneratorSettings";
import SavedMeasurementsModal from "../components/analyzer/SavedMeasurementsModal";
import ChartDetailModal from "../components/analyzer/ChartDetailModal";
import MathTraceModal from "../components/analyzer/MathTraceModal";
import { TransferFunctionVisualizer } from "@sounddocs/analyzer-lite";
import { useCaptureAgent } from "../stores/agentStore";
import { supabase } from "../lib/supabase";
import { Device, TFData } from "@sounddocs/analyzer-protocol";
import { useState, useEffect, useMemo } from "react";
import { TRACE_COLORS } from "../lib/constants";
import { EqSetting, calculateMathTrace } from "../lib/dsp";
import { Measurement } from "../lib/types";

interface MathTrace {
  id: string;
  name: string;
  operation: "average" | "sum" | "subtract";
  source_measurement_ids: string[];
}

const AnalyzerProPage: React.FC = () => {
  const navigate = useNavigate();
  const { status, lastMessage, sendMessage } = useCaptureAgent();
  const [devices, setDevices] = useState<Device[]>([]);
  const [tfData, setTfData] = useState<TFData | null>(null);
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [delayMode, setDelayMode] = useState<string>("auto");
  const [appliedDelayMs, setAppliedDelayMs] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedChart, setSelectedChart] = useState<
    "magnitude" | "phase" | "impulse" | "coherence"
  >("magnitude");
  const [savedMeasurements, setSavedMeasurements] = useState<Measurement[]>([]);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const [eqMeasurementId, setEqMeasurementId] = useState<string | null>(null);
  const [measurementAdjustments, setMeasurementAdjustments] = useState<{
    [id: string]: { gain: number; delay: number; phaseFlipped: boolean };
  }>({});
  const [agentVersion, setAgentVersion] = useState<string | undefined>();
  const [mathTraces, setMathTraces] = useState<MathTrace[]>([]);
  const [signalGeneratorConfig, setSignalGeneratorConfig] = useState<SignalGeneratorConfig>({
    enabled: false,
    signalType: "sine",
    outputChannels: null,
    frequency: 1000,
    startFreq: 20,
    endFreq: 20000,
    sweepDuration: 1,
    amplitude: 0.5,
  });
  const [computedMathTraces, setComputedMathTraces] = useState<Measurement[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");

  const handleGeneratorConfigChange = (config: SignalGeneratorConfig) => {
    setSignalGeneratorConfig(config);
    if (status === "connected") {
      sendMessage({
        type: "update_generator",
        config,
      });
    }
  };

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

  const handleMeasurementAdjustmentChange = async (
    id: string,
    newValues: { gain?: number; delay?: number; phaseFlipped?: boolean },
  ) => {
    setMeasurementAdjustments((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { gain: 0, delay: 0, phaseFlipped: false }),
        ...newValues,
      },
    }));

    if (typeof newValues.phaseFlipped === "boolean") {
      try {
        const { error } = await supabase
          .from("tf_measurements")
          .update({ phase_flipped: newValues.phaseFlipped })
          .match({ id });
        if (error) throw error;
      } catch (error) {
        console.error("Error updating phase flip:", error);
        // Revert on error
        setMeasurementAdjustments((prev) => ({
          ...prev,
          [id]: {
            ...prev[id],
            phaseFlipped: !newValues.phaseFlipped,
          },
        }));
      }
    }
  };

  useEffect(() => {
    fetchMeasurements();
  }, []);

  useEffect(() => {
    const measurementsById = new Map(savedMeasurements.map((m) => [m.id, m]));
    const computed = mathTraces.map((trace): Measurement | null => {
      const sourceMeasurements = trace.source_measurement_ids
        .map((id) => measurementsById.get(id))
        .filter((m): m is Measurement => !!m);

      if (sourceMeasurements.length !== trace.source_measurement_ids.length) {
        console.warn(`Could not find all source measurements for math trace ${trace.name}`);
        return null;
      }

      const tf_data = calculateMathTrace(
        sourceMeasurements.map((m) => m.tf_data),
        trace.operation,
      );

      return {
        id: trace.id,
        name: trace.name,
        created_at: new Date().toISOString(), // This is transient, so timestamp is for rendering key
        tf_data,
        sample_rate: sourceMeasurements[0]?.sample_rate || 48000, // Assume same sample rate
        color:
          TRACE_COLORS[
            (savedMeasurements.length + mathTraces.indexOf(trace)) % TRACE_COLORS.length
          ],
        isMathTrace: true,
      };
    });
    setComputedMathTraces(computed.filter((t): t is Measurement => t !== null));
  }, [mathTraces, savedMeasurements]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  useEffect(() => {
    if (status === "connected") {
      sendMessage({ type: "list_devices" });
    }
  }, [status, sendMessage]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === "hello_ack") {
        setAgentVersion(lastMessage.version);
      } else if (lastMessage.type === "devices") {
        setDevices(lastMessage.items);
        // Set default selected device if none selected
        if (!selectedDeviceId && lastMessage.items.length > 0) {
          setSelectedDeviceId(lastMessage.items[0].id);
        }
      } else if (lastMessage.type === "frame") {
        setIsCapturing(true);
        setTfData(lastMessage.tf);
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
  }, [lastMessage, selectedDeviceId]);

  const fetchMeasurements = async () => {
    try {
      const { data, error } = await supabase
        .from("tf_measurements")
        .select(
          "id, name, created_at, tf_data, sample_rate, eq_settings, capture_delay_ms, phase_flipped",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      const measurements = (data || []).map((m, i) => ({
        ...m,
        color: TRACE_COLORS[i % TRACE_COLORS.length],
      }));
      setSavedMeasurements(measurements);

      // Initialize adjustments based on fetched data
      const initialAdjustments: {
        [id: string]: { gain: number; delay: number; phaseFlipped: boolean };
      } = {};
      measurements.forEach((m) => {
        initialAdjustments[m.id] = {
          gain: measurementAdjustments[m.id]?.gain || 0,
          delay: measurementAdjustments[m.id]?.delay || 0,
          phaseFlipped: m.phase_flipped || false,
        };
      });
      setMeasurementAdjustments(initialAdjustments);

      // Fetch math traces
      const { data: mathData, error: mathError } = await supabase
        .from("math_measurements")
        .select("*")
        .order("created_at", { ascending: false });

      if (mathError) throw mathError;
      setMathTraces(mathData || []);
    } catch (error) {
      console.error("Error fetching measurements:", error);
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    try {
      const isMath = mathTraces.some((t) => t.id === id);
      if (isMath) {
        const { error } = await supabase.from("math_measurements").delete().match({ id });
        if (error) throw error;
        setMathTraces((prev) => prev.filter((t) => t.id !== id));
      } else {
        // Determine dependent traces before any deletion
        const dependentTraces = mathTraces.filter((t) => t.source_measurement_ids.includes(id));
        if (dependentTraces.length > 0) {
          const shouldDelete = window.confirm(
            `This measurement is referenced by ${dependentTraces.length} math trace(s). ` +
              `Deleting it will also remove these math traces. Continue?`,
          );
          if (!shouldDelete) return;
        }

        // Proceed with deletion(s)
        const { error } = await supabase.from("tf_measurements").delete().match({ id });
        if (error) throw error;
        setSavedMeasurements((prev) => prev.filter((m) => m.id !== id));

        if (dependentTraces.length > 0) {
          const dependentIds = dependentTraces.map((t) => t.id);
          const { error: deleteError } = await supabase
            .from("math_measurements")
            .delete()
            .in("id", dependentIds);
          if (deleteError) console.error("Error deleting dependent math traces:", deleteError);
          setMathTraces((prev) => prev.filter((t) => !dependentIds.includes(t.id)));
        }
      }
      await fetchMeasurements();
    } catch (error) {
      console.error("Error deleting measurement:", error);
      alert(
        `Error deleting measurement: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  const handleSaveMathTrace = async (trace: Omit<MathTrace, "id"> & { id?: string }) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not logged in");

      const payload = {
        ...trace,
        user_id: user.id,
      };

      if (trace.id) {
        // Update
        const { error } = await supabase
          .from("math_measurements")
          .update(payload)
          .match({ id: trace.id });
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from("math_measurements").insert(payload);
        if (error) throw error;
      }
      fetchMeasurements();
    } catch (error) {
      console.error("Error saving math trace:", error);
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

  const breadcrumbs = createBreadcrumbs.analyzer("pro");

  return (
    <>
      <Helmet>
        <title>
          AcoustIQ Pro - Professional Dual-Channel Audio Analyzer | Transfer Function | SoundDocs
        </title>
        <meta
          name="description"
          content="Professional dual-channel audio analyzer with transfer function analysis, coherence measurement, phase analysis, and advanced acoustics tools. Free download for macOS and Windows."
        />
        <meta
          name="keywords"
          content="transfer function analyzer, dual channel analyzer, coherence measurement, phase analyzer, professional audio analyzer, acoustic measurement software, system tuning software"
        />

        {/* Canonical URL */}
        <link rel="canonical" href={getCanonicalUrl()} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sounddocs.org/analyzer/pro" />
        <meta property="og:title" content="AcoustIQ Pro - Professional Audio Analyzer" />
        <meta
          property="og:description"
          content="Professional dual-channel audio analyzer with transfer function, coherence, and phase analysis. Free download for macOS and Windows."
        />
        <meta property="og:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AcoustIQ Pro - Professional Audio Analyzer" />
        <meta
          name="twitter:description"
          content="Professional dual-channel audio analyzer with transfer function, coherence, and phase analysis."
        />
        <meta name="twitter:image" content="https://i.postimg.cc/c448TSnj/New-Project-3.png" />

        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(generateBreadcrumbSchema(breadcrumbs))}
        </script>
        <script type="application/ld+json">{JSON.stringify(acoustiqProSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-gray-900 flex flex-col">
        <Header onSignOut={handleSignOut} />

        <main className="flex-grow container mx-auto px-4 py-12 mt-12">
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors duration-200 mb-4 group"
            >
              <ArrowLeftCircle className="h-5 w-5 mr-2 transform group-hover:-translate-x-1 transition-transform duration-200" />
              Back to AcoustIQ Hub
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

            {status === "connected" && agentVersion && agentVersion !== "0.1.8" && (
              <AgentUpdateNotification connectedVersion={agentVersion} latestVersion="0.1.8" />
            )}

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
                signalGeneratorConfig={signalGeneratorConfig}
                selectedDeviceId={selectedDeviceId}
                onDeviceSelect={setSelectedDeviceId}
              />
            )}
            {status === "connected" && selectedDevice && selectedDevice.outputs > 0 && (
              <SignalGeneratorSettings
                deviceChannels={selectedDevice.outputs}
                onConfigChange={handleGeneratorConfigChange}
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
              saved={[...savedMeasurements, ...computedMathTraces]
                .filter((m) => visibleIds.has(m.id))
                .map((m) => {
                  const adjustments = measurementAdjustments[m.id] || {
                    gain: 0,
                    delay: 0,
                    phaseFlipped: false,
                  };
                  return {
                    id: m.id,
                    tf: m.tf_data,
                    label: m.name,
                    color: m.color,
                    sample_rate: m.sample_rate,
                    phaseFlipped: adjustments.phaseFlipped,
                  };
                })}
              onChartClick={(chartName) => {
                setSelectedChart(chartName);
                setIsDetailModalOpen(true);
              }}
            />
          </div>
        </main>

        <Footer />
      </div>

      <SavedMeasurementsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        measurements={[...savedMeasurements, ...computedMathTraces]}
        visibleIds={visibleIds}
        onToggleVisibility={toggleMeasurementVisibility}
        onDelete={handleDeleteMeasurement}
        onRefresh={fetchMeasurements}
        onManageMath={() => setIsMathModalOpen(true)}
      />

      <MathTraceModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        allMeasurements={savedMeasurements}
        mathTraces={mathTraces}
        onSave={handleSaveMathTrace}
        onDelete={handleDeleteMeasurement}
      />

      <ChartDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setEqMeasurementId(null);
        }}
        initialChart={selectedChart}
        liveData={tfData}
        savedMeasurements={[...savedMeasurements, ...computedMathTraces]}
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
    </>
  );
};

export default AnalyzerProPage;

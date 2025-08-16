import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftCircle, Server } from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AgentConnectionManager from "../components/analyzer/AgentConnectionManager";
import AgentDownload from "../components/analyzer/AgentDownload";
import ProSettings from "../components/analyzer/ProSettings";
import { TransferFunctionVisualizer } from "@sounddocs/analyzer-lite";
import { useCaptureAgent } from "../stores/agentStore";
import { supabase } from "../lib/supabase";
import { Device, TFData } from "@sounddocs/analyzer-protocol";
import { useState, useEffect } from "react";

const AnalyzerProPage: React.FC = () => {
  const navigate = useNavigate();
  const { status, lastMessage, sendMessage } = useCaptureAgent();
  const [devices, setDevices] = useState<Device[]>([]);
  const [tfData, setTfData] = useState<TFData | null>(null);
  const [delayMs, setDelayMs] = useState<number>(0);
  const [sampleRate, setSampleRate] = useState<number>(48000);
  const [delayMode, setDelayMode] = useState<string>("auto");
  const [appliedDelayMs, setAppliedDelayMs] = useState<number>(0);

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
        setTfData(lastMessage.tf);
        setDelayMs(lastMessage.delay_ms);
        setSampleRate(lastMessage.sampleRate);
        setDelayMode(lastMessage.delay_mode);
        setAppliedDelayMs(lastMessage.applied_delay_ms);
      }
    }
  }, [lastMessage]);

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

          {status === "connected" ? (
            <>
              <ProSettings
                devices={devices}
                onStartCapture={(config) => sendMessage({ type: "start", ...config })}
                onStopCapture={() => sendMessage({ type: "stop" })}
                onFreezeDelay={(enable) =>
                  sendMessage({ type: "delay_freeze", enable, applied_ms: delayMs })
                }
                delayMode={delayMode}
                appliedDelayMs={appliedDelayMs}
              />
              <div className="bg-gray-800 p-4 rounded-lg shadow-inner">
                <h3 className="text-lg font-semibold text-white mb-2">Live Measurements</h3>
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-3xl font-mono text-green-400">{delayMs.toFixed(2)}</div>
                    <div className="text-sm text-gray-400">Delay (ms)</div>
                  </div>
                </div>
              </div>
              <TransferFunctionVisualizer tfData={tfData} sampleRate={sampleRate} />
            </>
          ) : (
            <AgentDownload />
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AnalyzerProPage;

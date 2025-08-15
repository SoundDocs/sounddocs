import { create } from "zustand";
import type { AudioDevice } from "@sounddocs/analyzer-lite";

interface AnalyzerState {
  // Device management
  selectedDevice: AudioDevice | null;
  audioStream: MediaStream | null;
  isConnected: boolean;

  // Analysis state
  isAnalyzing: boolean;
  analyzerType: "lite" | "pro"; // lite = browser only, pro = with capture agent

  // Error handling
  error: string | null;

  // Actions
  setSelectedDevice: (device: AudioDevice | null) => void;
  setAudioStream: (stream: MediaStream | null) => void;
  setConnected: (connected: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalyzerType: (type: "lite" | "pro") => void;
  setError: (error: string | null) => void;
  disconnect: () => void;
  reset: () => void;
}

export const useAnalyzerStore = create<AnalyzerState>((set, get) => ({
  // Initial state
  selectedDevice: null,
  audioStream: null,
  isConnected: false,
  isAnalyzing: false,
  analyzerType: "lite",
  error: null,

  // Actions
  setSelectedDevice: (device) => set({ selectedDevice: device }),

  setAudioStream: (stream) => set({ audioStream: stream }),

  setConnected: (connected) => set({ isConnected: connected }),

  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  setAnalyzerType: (type) => set({ analyzerType: type }),

  setError: (error) => set({ error }),

  disconnect: () => {
    const { audioStream } = get();

    // Stop any active audio stream
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }

    set({
      selectedDevice: null,
      audioStream: null,
      isConnected: false,
      isAnalyzing: false,
      error: null,
    });
  },

  reset: () => {
    const { audioStream } = get();

    // Stop any active audio stream
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop());
    }

    set({
      selectedDevice: null,
      audioStream: null,
      isConnected: false,
      isAnalyzing: false,
      analyzerType: "lite",
      error: null,
    });
  },
}));

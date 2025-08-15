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

  // FFT settings
  averageType: "off" | "lpf" | "fifo";
  lpfFrequency: number;
  averageCount: number;
  transformMode: "fast" | "log";
  windowFunction: "hann" | "kaiser" | "blackman";

  // Error handling
  error: string | null;

  // Actions
  setSelectedDevice: (device: AudioDevice | null) => void;
  setAudioStream: (stream: MediaStream | null) => void;
  setConnected: (connected: boolean) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalyzerType: (type: "lite" | "pro") => void;
  setAverageType: (type: "off" | "lpf" | "fifo") => void;
  setLpfFrequency: (frequency: number) => void;
  setAverageCount: (count: number) => void;
  setTransformMode: (mode: "fast" | "log") => void;
  setWindowFunction: (window: "hann" | "kaiser" | "blackman") => void;
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
  averageType: "off",
  lpfFrequency: 1,
  averageCount: 1,
  transformMode: "fast",
  windowFunction: "hann",
  error: null,

  // Actions
  setSelectedDevice: (device) => set({ selectedDevice: device }),

  setAudioStream: (stream) => set({ audioStream: stream }),

  setConnected: (connected) => set({ isConnected: connected }),

  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  setAnalyzerType: (type) => set({ analyzerType: type }),

  setAverageType: (type) => set({ averageType: type }),

  setLpfFrequency: (frequency) => set({ lpfFrequency: frequency }),

  setAverageCount: (count) => set({ averageCount: count }),

  setTransformMode: (mode) => set({ transformMode: mode }),

  setWindowFunction: (window) => set({ windowFunction: window }),

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

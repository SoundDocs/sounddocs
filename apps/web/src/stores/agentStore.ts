import { useEffect } from "react";
import { create } from "zustand";
import { AgentMessage, ClientMessage } from "@sounddocs/analyzer-protocol";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";
const AGENT_URL = "wss://127.0.0.1:9469";

interface AgentState {
  status: ConnectionStatus;
  lastMessage: AgentMessage | null;
  worker: Worker | null;
  actions: {
    connect: () => void;
    disconnect: () => void;
    sendMessage: (message: ClientMessage) => void;
    initialize: () => void;
    cleanup: () => void;
  };
}

const useAgentStore = create<AgentState>((set, get) => ({
  status: "disconnected",
  lastMessage: null,
  worker: null,
  actions: {
    initialize: () => {
      if (get().worker) return; // Already initialized

      const worker = new Worker(new URL("../workers/capture.worker.ts", import.meta.url), {
        type: "module",
      });

      worker.onmessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === "status") {
          set({ status: payload });
        } else if (type === "agentMessage") {
          set({ lastMessage: payload });
        }
      };

      set({ worker });
    },
    connect: () => {
      get().worker?.postMessage({ type: "connect", payload: { url: AGENT_URL } });
    },
    disconnect: () => {
      get().worker?.postMessage({ type: "disconnect" });
    },
    sendMessage: (message: ClientMessage) => {
      get().worker?.postMessage({ type: "sendMessage", payload: message });
    },
    cleanup: () => {
      get().worker?.postMessage({ type: "disconnect" });
      get().worker?.terminate();
      set({ worker: null, status: "disconnected" });
    },
  },
}));

export const useAgentActions = () => useAgentStore((state) => state.actions);
export const useAgentStatus = () => useAgentStore((state) => state.status);
export const useLastAgentMessage = () => useAgentStore((state) => state.lastMessage);

// Custom hook to initialize the store and provide a stable API
export const useCaptureAgent = () => {
  const actions = useAgentActions();
  const status = useAgentStatus();
  const lastMessage = useLastAgentMessage();

  useEffect(() => {
    actions.initialize();
    return () => {
      actions.cleanup();
    };
  }, [actions]);

  return {
    status,
    lastMessage,
    connect: actions.connect,
    disconnect: actions.disconnect,
    sendMessage: actions.sendMessage,
  };
};

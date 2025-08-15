import { useState, useEffect, useRef, useCallback } from "react";
import { AgentMessage } from "@sounddocs/analyzer-protocol";

type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

const AGENT_URL = "ws://127.0.0.1:9469";

export function useCaptureAgent() {
  const [status, setStatus] = useState<ConnectionStatus>("disconnected");
  const [lastMessage, setLastMessage] = useState<AgentMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Don't connect automatically, wait for a manual call
    return () => {
      ws.current?.close();
    };
  }, []);

  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      console.log("WebSocket is already connected.");
      return;
    }

    setStatus("connecting");
    ws.current = new WebSocket(AGENT_URL);

    ws.current.onopen = () => {
      console.log("Capture agent connected.");
      setStatus("connected");
      // Send a hello message
      ws.current?.send(
        JSON.stringify({ type: "hello", client: "sounddocs-web", nonce: crypto.randomUUID() }),
      );
    };

    ws.current.onmessage = (event) => {
      try {
        const message: AgentMessage = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error("Failed to parse message from agent:", error);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("error");
    };

    ws.current.onclose = () => {
      console.log("Capture agent disconnected.");
      setStatus("disconnected");
    };
  }, []);

  const disconnect = useCallback(() => {
    ws.current?.close();
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.error("Cannot send message, WebSocket is not open.");
    }
  }, []);

  return { status, lastMessage, connect, disconnect, sendMessage };
}

/// <reference lib="webworker" />

import { AgentMessage, ClientMessage } from "@sounddocs/analyzer-protocol";

let ws: WebSocket | null = null;

self.onmessage = (event: MessageEvent) => {
  const { type, payload } = event.data;

  switch (type) {
    case "connect":
      connect(payload.url);
      break;
    case "disconnect":
      ws?.close();
      break;
    case "sendMessage":
      sendMessage(payload);
      break;
  }
};

function connect(url: string) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return;
  }

  ws = new WebSocket(url);

  ws.onopen = () => {
    self.postMessage({ type: "status", payload: "connected" });
    // Send a hello message automatically on connect
    sendMessage({ type: "hello", client: "sounddocs-web", nonce: crypto.randomUUID() });
  };

  ws.onmessage = (event) => {
    try {
      const message: AgentMessage = JSON.parse(event.data);
      // For now, we'll just forward the JSON message.
      // In the next step, this will be replaced with SharedArrayBuffer.
      self.postMessage({ type: "agentMessage", payload: message });
    } catch (error) {
      console.error("Worker: Failed to parse message from agent:", error);
    }
  };

  ws.onerror = (error) => {
    console.error("Worker: WebSocket error:", error);
    self.postMessage({ type: "status", payload: "error" });
  };

  ws.onclose = () => {
    self.postMessage({ type: "status", payload: "disconnected" });
    ws = null;
  };
}

function sendMessage(message: ClientMessage) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

export {};

// WebSocket Protocol for SoundDocs Analyzer
// Defines messages between browser (web app) and capture agent

export interface Device {
  id: string;
  name: string;
  inputs: number;
  outputs: number;
}

export interface TFData {
  freqs: number[];
  mag_db: number[];
  phase_deg: number[];
  coh: number[];
}

export interface SPLData {
  Leq: number;
  LZ: number;
}

export interface CaptureConfig {
  deviceId: string;
  sampleRate: number;
  blockSize: number;
  nfft: number;
  refChan: number;
  measChan: number;
  window: "hann" | "kaiser" | "blackman";
  avg: "exp" | "linear";
  smoothing: "none" | "1/3" | "1/6" | "1/12";
}

// Message types from client to agent
export interface HelloMessage {
  type: "hello";
  client: string;
  nonce: string;
}

export interface ListDevicesMessage {
  type: "list_devices";
}

export interface StartCaptureMessage {
  type: "start";
  deviceId: string;
  sampleRate: number;
  blockSize: number;
  nfft: number;
  refChan: number;
  measChan: number;
  window: "hann" | "kaiser" | "blackman";
  avg: "exp" | "linear";
  smoothing: "none" | "1/3" | "1/6" | "1/12";
}

export interface StopCaptureMessage {
  type: "stop";
}

export interface CalibrateMessage {
  type: "calibrate";
  spl_ref_db: number;
  rms_dbfs: number;
}

export interface GetVersionMessage {
  type: "get_version";
}

export type ClientMessage =
  | HelloMessage
  | ListDevicesMessage
  | StartCaptureMessage
  | StopCaptureMessage
  | CalibrateMessage
  | GetVersionMessage;

// Message types from agent to client
export interface HelloAckMessage {
  type: "hello_ack";
  agent: string;
  originAllowed: boolean;
}

export interface DevicesMessage {
  type: "devices";
  items: Device[];
}

export interface FrameMessage {
  type: "frame";
  tf: TFData;
  spl: SPLData;
  latency_ms: number;
  ts: number;
}

export interface StoppedMessage {
  type: "stopped";
}

export interface ErrorMessage {
  type: "error";
  message: string;
  code?: string;
}

export interface VersionMessage {
  type: "version";
  version: string;
  build?: string;
}

export interface CalibrationDoneMessage {
  type: "calibration_done";
  slope: number;
  offset: number;
}

export type AgentMessage =
  | HelloAckMessage
  | DevicesMessage
  | FrameMessage
  | StoppedMessage
  | ErrorMessage
  | VersionMessage
  | CalibrationDoneMessage;

// Union type for all messages
export type ProtocolMessage = ClientMessage | AgentMessage;

// Utility type guards
export function isClientMessage(msg: ProtocolMessage): msg is ClientMessage {
  return ["hello", "list_devices", "start", "stop", "calibrate", "get_version"].includes(msg.type);
}

export function isAgentMessage(msg: ProtocolMessage): msg is AgentMessage {
  return [
    "hello_ack",
    "devices",
    "frame",
    "stopped",
    "error",
    "version",
    "calibration_done",
  ].includes(msg.type);
}

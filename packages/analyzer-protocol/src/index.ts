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
  ir: number[];
}

export interface SPLData {
  Leq: number;
  LZ: number;
}

export type WindowType = "hann" | "kaiser" | "blackman";
export type AvgType = "power" | "linear" | "exp";
export type LpfMode = "lpf" | "none";

export interface CaptureConfig {
  deviceId: string;
  sampleRate: number;
  blockSize: number;
  refChan: number;
  measChan: number;

  // FFT & Averaging
  nfft: number;
  avg: AvgType;
  avgCount: number;
  window: WindowType;

  // Smoothing
  lpfMode: LpfMode;
  lpfFreq: number;
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

export interface StartCaptureMessage extends CaptureConfig {
  type: "start";
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

export interface DelayFreezeMessage {
  type: "delay_freeze";
  enable: boolean;
  applied_ms?: number;
}

export type ClientMessage =
  | HelloMessage
  | ListDevicesMessage
  | StartCaptureMessage
  | StopCaptureMessage
  | CalibrateMessage
  | GetVersionMessage
  | DelayFreezeMessage;

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
  delay_ms: number;
  latency_ms: number;
  ts: number;
  sampleRate: number;
  delay_mode: string;
  applied_delay_ms: number;
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

export interface DelayStatusMessage {
  type: "delay_status";
  mode: string;
  applied_ms: number;
  raw_ms?: number;
}

export type AgentMessage =
  | HelloAckMessage
  | DevicesMessage
  | FrameMessage
  | StoppedMessage
  | ErrorMessage
  | VersionMessage
  | CalibrationDoneMessage
  | DelayStatusMessage;

// Union type for all messages
export type ProtocolMessage = ClientMessage | AgentMessage;

// Utility type guards
export function isClientMessage(msg: ProtocolMessage): msg is ClientMessage {
  return [
    "hello",
    "list_devices",
    "start",
    "stop",
    "calibrate",
    "get_version",
    "delay_freeze",
  ].includes(msg.type);
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
    "delay_status",
  ].includes(msg.type);
}

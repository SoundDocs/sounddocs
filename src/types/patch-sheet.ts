/**
 * TypeScript type definitions for the patch sheet system
 * 
 * This file contains all type definitions used throughout the application
 * for managing audio patch sheets, including input channels, routing,
 * and event information.
 * 
 * Core Types:
 * - InputChannel: Represents a single audio input with routing and configuration
 * - ConnectionType: Available connection routing options
 * - InputType: Available input types (Mic, DI, Wireless)
 * - PatchSheet: Complete patch sheet document structure
 * - PatchSheetInfo: Event and technical information
 * 
 * Features:
 * - Type-safe input channel configuration
 * - Comprehensive event information structure
 * - Connection routing type safety
 * - Device categorization by input type
 * - Support for stereo channel linking
 * - Optional connection details based on routing type
 * 
 * Usage:
 * ```tsx
 * import { InputChannel, PatchSheet, ConnectionType } from './types/patch-sheet';
 * 
 * const input: InputChannel = {
 *   id: '1',
 *   channelNumber: '1',
 *   type: 'Microphone',
 *   // ... other properties
 * };
 * ```
 */

export interface InputChannel {
    id: string;
    channelNumber: string;
    name: string;
    type: string;
    device: string;
    phantom: boolean;
    connection: ConnectionType;
    connectionDetails?: {
      snakeType?: string;
      inputNumber?: string;
      networkType?: string;
      networkPatch?: string;
      consoleType?: string;
      consoleInputNumber?: string;
    };
    notes: string;
    isStereo?: boolean;
    stereoChannelNumber?: string;
  }

export  interface OutputChannel {
  id: string;
  channelNumber: string;
  name: string;
  sourceType: string;
  sourceDetails?: {
    outputNumber?: string;
    snakeType?: string;
    networkType?: string;
    networkPatch?: string;
    consoleType?: string;
    consoleOutputNumber?: string;
  };
  destinationType: string;
  destinationGear: string;
  notes: string;
  isStereo?: boolean;
  stereoChannelNumber?: string;
}
  
  
  export type ConnectionType = 'Console Direct' | 'Analog Snake' | 'Digital Snake' | 'Digital Network';
  
  export type InputType = 'Microphone' | 'DI' | 'Wireless';

  export type InputTypeValues = 'Microphone' | 'DI' | 'Wireless';

  export interface DeviceOptionsByType {
    "Microphone": string[];
    "DI": string[];
    "Wireless": string[];
  }
  
  export interface PatchSheet {
    id: string;
    name: string;
    created_at: string;
    last_edited?: string;
    inputs: InputChannel[];
    outputs: OutputChannel[];
    info: PatchSheetInfo;
  }
  
  export interface PatchSheetInfo {
    event_name: string;
    venue: string;
    room: string;
    address: string;
    date: string;
    time: string;
    load_in: string;
    sound_check: string;
    doors_open: string;
    event_start: string;
    event_end: string;
    client: string;
    artist: string;
    genre: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string;
    foh_engineer: string;
    monitor_engineer: string;
    production_manager: string;
    av_company: string;
    pa_system: string;
    console_foh: string;
    console_monitors: string;
    monitor_type: string;
    event_type: string;
    estimated_attendance: string;
    hospitality_notes: string;
    notes: string;
  }
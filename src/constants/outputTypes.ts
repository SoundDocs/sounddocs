  /**
 * Constants for audio output types and related configurations
 * 
 * This file contains all the constant values used throughout the application
 * for managing audio output channels, connections, and device configurations.
 * 
 * Includes:
 * - Output Types (Microphone, DI, Wireless)
 * - Destination Types
 * 
 * Of note, some types may be shared with inputs.
 * 
 * Usage:
 * ```tsx
 * import { 
 *   INPUT_TYPES, 
 *   
**/
  
  export const OUTPUT_TYPES = [
    "Console Output",
    "Analog Snake",
    "Digital Snake",
    "Digital Network"
  ] as const;

  export const DESTINATION_TYPES = [
    "Main Speakers",
    "Monitors",
    "IEM System",
    "Recording Device",
    "Broadcast Feed",
    "Stage Fill",
    "Delay Speakers",
    "Effects Processor"
  ] as const;
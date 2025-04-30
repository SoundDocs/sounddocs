/**
 * Constants for audio input types and related configurations
 * 
 * This file contains all the constant values used throughout the application
 * for managing audio input channels, connections, and device configurations.
 * 
 * Includes:
 * - Input types (Microphone, DI, Wireless)
 * - Connection routing options
 * - Device models by input type
 * - Snake types (analog and digital)
 * - Network protocols
 * - Console models
 * 
 * Usage:
 * ```tsx
 * import { 
 *   INPUT_TYPES, 
 *   
**/

import { DeviceOptionsByType, InputTypeValues } from '../types/patch-sheet';

export const INPUT_TYPES: InputTypeValues[] = [
  'Microphone',
  'DI',
  'Wireless'
] as const;

export const CONNECTION_TYPES = [
  'Console Direct',
  'Analog Snake',
  'Digital Snake',
  'Digital Network'
] as const;

export const DEVICE_OPTIONS_BY_TYPE: DeviceOptionsByType = {
  'Microphone': [
    'SM58',
    'SM57',
    'Beta 58A',
    'Beta 57A',
    'Beta 52A',
    'KSM137',
    'C414',
    'MD421',
    'e835',
    'e945',
    'AT4050',
    'Neumann KMS105'
  ],
  'DI': [
    'Active DI',
    'Passive DI',
    'Radial J48',
    'BSS AR133',
    'Radial ProDI',
    'Countryman Type 85',
    'Radial ProD2',
    'Avalon U5'
  ],
  'Wireless': [
    'Shure ULXD',
    'Shure QLXD',
    'Shure SLX',
    'Sennheiser EW500',
    'Sennheiser G4',
    'Shure Axient Digital',
    'Sennheiser Digital 6000',
    'Line 6 XD-V'
  ]
};

export const ANALOG_SNAKE_TYPES = [
  'Multicore',
  'XLR Harness',
  'Sub Snake'
] as const;

export const DIGITAL_SNAKE_TYPES = [
  'Yamaha Rio',
  'Allen & Heath DX168',
  'Behringer S16',
  'Midas DL16',
  'PreSonus NSB'
] as const;

export const NETWORK_TYPES = [
  'Dante',
  'AVB',
  'MADI',
  'AES50',
  'Ravenna',
  'AES67'
] as const;

export const CONSOLE_TYPES = [
  'Avid S6L',
  'Avid Profile',
  'Avid SC48',
  'DiGiCo SD12',
  'DiGiCo SD10',
  'DiGiCo SD5',
  'Yamaha CL5',
  'Yamaha QL5',
  'Allen & Heath dLive',
  'Allen & Heath SQ7',
  'Midas PRO X',
  'Midas M32',
  'Behringer X32'
] as const;
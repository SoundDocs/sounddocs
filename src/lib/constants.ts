import { Resolution } from './types';

export const FIELD_TYPES = {
  // Input Fields
  INPUT_DEVICE: 'input_device',
  INPUT_CONN_ANALOG_SNAKE_TYPE: 'input_connection_analog_snake_type',
  INPUT_CONN_DIGITAL_SNAKE_TYPE: 'input_connection_digital_snake_type',
  INPUT_CONN_NETWORK_TYPE: 'input_connection_network_type',
  INPUT_CONN_CONSOLE_TYPE: 'input_connection_console_type',

  // Output Fields
  OUTPUT_SRC_CONSOLE_TYPE: 'output_source_console_type',
  OUTPUT_SRC_ANALOG_SNAKE_TYPE: 'output_source_analog_snake_type',
  OUTPUT_SRC_DIGITAL_SNAKE_TYPE: 'output_source_digital_snake_type',
  OUTPUT_SRC_NETWORK_TYPE: 'output_source_network_type',
  OUTPUT_DESTINATION_TYPE: 'output_destination_type',
  OUTPUT_DESTINATION_GEAR: 'output_destination_gear',
};
export const ASPECT_RATIOS = [
  { value: '16:9', label: '16:9' },
  { value: '16:10', label: '16:10' },
  { value: '4:3', label: '4:3' },
  { value: '3:2', label: '3:2' },
  { value: '3:1', label: '3:1' },
  { value: '1:1', label: '1:1' },
];

export const RESOLUTIONS: Resolution[] = [
  // 16:9
  { value: '1280x720', label: '1280 x 720 (HD)', width: 1280, height: 720, aspectRatio: '16:9' },
  { value: '1920x1080', label: '1920 x 1080 (FHD)', width: 1920, height: 1080, aspectRatio: '16:9' },
  { value: '2560x1440', label: '2560 x 1440 (QHD)', width: 2560, height: 1440, aspectRatio: '16:9' },
  { value: '3840x2160', label: '3840 x 2160 (4K UHD)', width: 3840, height: 2160, aspectRatio: '16:9' },
  // 16:10
  { value: '1280x800', label: '1280 x 800', width: 1280, height: 800, aspectRatio: '16:10' },
  { value: '1920x1200', label: '1920 x 1200', width: 1920, height: 1200, aspectRatio: '16:10' },
  { value: '2560x1600', label: '2560 x 1600', width: 2560, height: 1600, aspectRatio: '16:10' },
  // 4:3
  { value: '1024x768', label: '1024 x 768', width: 1024, height: 768, aspectRatio: '4:3' },
  { value: '1600x1200', label: '1600 x 1200', width: 1600, height: 1200, aspectRatio: '4:3' },
  { value: '2048x1536', label: '2048 x 1536', width: 2048, height: 1536, aspectRatio: '4:3' },
  // 3:2
  { value: '1440x960', label: '1440 x 960', width: 1440, height: 960, aspectRatio: '3:2' },
  { value: '2160x1440', label: '2160 x 1440', width: 2160, height: 1440, aspectRatio: '3:2' },
  // 3:1
  { value: '2880x960', label: '2880 x 960', width: 2880, height: 960, aspectRatio: '3:1' },
  { value: '3840x1280', label: '3840 x 1280', width: 3840, height: 1280, aspectRatio: '3:1' },
  // 1:1
  { value: '1080x1080', label: '1080 x 1080', width: 1080, height: 1080, aspectRatio: '1:1' },
  { value: '2048x2048', label: '2048 x 2048', width: 2048, height: 2048, aspectRatio: '1:1' },
  // 9:16
  { value: '720x1280', label: '720 x 1280', width: 720, height: 1280, aspectRatio: '9:16' },
  { value: '1080x1920', label: '1080 x 1920', width: 1080, height: 1920, aspectRatio: '9:16' },
];

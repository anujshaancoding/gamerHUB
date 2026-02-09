// Accessibility Feature Types

export interface AccessibilitySettings {
  id: string;
  user_id: string;

  // Visual
  high_contrast_mode: boolean;
  color_blind_mode: ColorBlindMode | null;
  reduce_motion: boolean;
  large_text: boolean;
  text_scale: number; // 1.0 - 2.0
  custom_font: CustomFont | null;
  dyslexia_font: boolean;

  // Audio
  sound_effects_volume: number; // 0-100
  voice_chat_volume: number; // 0-100
  notification_sounds: boolean;
  screen_reader_optimized: boolean;
  audio_descriptions: boolean;

  // Input
  keyboard_only_mode: boolean;
  custom_keybinds: Record<string, string>;
  input_delay_ms: number;
  double_click_speed: number;

  // Communication
  auto_captions: boolean;
  caption_size: CaptionSize;
  caption_style: CaptionStyle;
  tts_enabled: boolean;
  tts_rate: number; // 0.5 - 2.0
  tts_voice: string | null;

  // Cognitive
  simplified_ui: boolean;
  focus_indicators: boolean;
  reading_guide: boolean;
  content_warnings_enabled: boolean;
  flashing_content_warning: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export type ColorBlindMode =
  | 'protanopia' // Red-blind
  | 'deuteranopia' // Green-blind
  | 'tritanopia' // Blue-blind
  | 'achromatopsia' // Total color blindness
  | 'protanomaly' // Red-weak
  | 'deuteranomaly' // Green-weak
  | 'tritanomaly'; // Blue-weak

export type CustomFont =
  | 'opendyslexic'
  | 'lexie_readable'
  | 'comic_sans'
  | 'arial'
  | 'verdana';

export type CaptionSize = 'small' | 'medium' | 'large' | 'extra_large';
export type CaptionStyle = 'default' | 'outline' | 'shadow' | 'box';

export interface VoiceTranscription {
  id: string;
  user_id: string;
  session_id: string;
  channel_type: 'voice_chat' | 'game' | 'stream';
  channel_id: string;
  speaker_id: string | null;
  speaker_name: string | null;
  transcript_text: string;
  confidence: number;
  language: string;
  created_at: string;
}

// API Types
export interface UpdateAccessibilitySettingsRequest {
  high_contrast_mode?: boolean;
  color_blind_mode?: ColorBlindMode | null;
  reduce_motion?: boolean;
  large_text?: boolean;
  text_scale?: number;
  custom_font?: CustomFont | null;
  dyslexia_font?: boolean;
  sound_effects_volume?: number;
  voice_chat_volume?: number;
  notification_sounds?: boolean;
  screen_reader_optimized?: boolean;
  audio_descriptions?: boolean;
  keyboard_only_mode?: boolean;
  custom_keybinds?: Record<string, string>;
  input_delay_ms?: number;
  double_click_speed?: number;
  auto_captions?: boolean;
  caption_size?: CaptionSize;
  caption_style?: CaptionStyle;
  tts_enabled?: boolean;
  tts_rate?: number;
  tts_voice?: string;
  simplified_ui?: boolean;
  focus_indicators?: boolean;
  reading_guide?: boolean;
  content_warnings_enabled?: boolean;
  flashing_content_warning?: boolean;
}

// Color blind filter configurations
export const COLOR_BLIND_FILTERS: Record<ColorBlindMode, {
  name: string;
  description: string;
  filter: string;
}> = {
  protanopia: {
    name: 'Protanopia',
    description: 'Red-blind (no red cones)',
    filter: 'url(#protanopia)',
  },
  deuteranopia: {
    name: 'Deuteranopia',
    description: 'Green-blind (no green cones)',
    filter: 'url(#deuteranopia)',
  },
  tritanopia: {
    name: 'Tritanopia',
    description: 'Blue-blind (no blue cones)',
    filter: 'url(#tritanopia)',
  },
  achromatopsia: {
    name: 'Achromatopsia',
    description: 'Total color blindness',
    filter: 'grayscale(100%)',
  },
  protanomaly: {
    name: 'Protanomaly',
    description: 'Red-weak (reduced red sensitivity)',
    filter: 'url(#protanomaly)',
  },
  deuteranomaly: {
    name: 'Deuteranomaly',
    description: 'Green-weak (reduced green sensitivity)',
    filter: 'url(#deuteranomaly)',
  },
  tritanomaly: {
    name: 'Tritanomaly',
    description: 'Blue-weak (reduced blue sensitivity)',
    filter: 'url(#tritanomaly)',
  },
};

// Font configurations
export const CUSTOM_FONTS: Record<CustomFont, {
  name: string;
  description: string;
  fontFamily: string;
}> = {
  opendyslexic: {
    name: 'OpenDyslexic',
    description: 'Designed to help with dyslexia',
    fontFamily: '"OpenDyslexic", sans-serif',
  },
  lexie_readable: {
    name: 'Lexie Readable',
    description: 'Easy to read font',
    fontFamily: '"Lexie Readable", sans-serif',
  },
  comic_sans: {
    name: 'Comic Sans',
    description: 'Informal, easy to read',
    fontFamily: '"Comic Sans MS", cursive, sans-serif',
  },
  arial: {
    name: 'Arial',
    description: 'Clean sans-serif',
    fontFamily: 'Arial, sans-serif',
  },
  verdana: {
    name: 'Verdana',
    description: 'Wide, easy to read',
    fontFamily: 'Verdana, sans-serif',
  },
};

// Default settings
export const DEFAULT_ACCESSIBILITY_SETTINGS: Partial<AccessibilitySettings> = {
  high_contrast_mode: false,
  color_blind_mode: null,
  reduce_motion: false,
  large_text: false,
  text_scale: 1.0,
  custom_font: null,
  dyslexia_font: false,
  sound_effects_volume: 100,
  voice_chat_volume: 100,
  notification_sounds: true,
  screen_reader_optimized: false,
  audio_descriptions: false,
  keyboard_only_mode: false,
  custom_keybinds: {},
  input_delay_ms: 0,
  double_click_speed: 500,
  auto_captions: false,
  caption_size: 'medium',
  caption_style: 'default',
  tts_enabled: false,
  tts_rate: 1.0,
  tts_voice: null,
  simplified_ui: false,
  focus_indicators: true,
  reading_guide: false,
  content_warnings_enabled: true,
  flashing_content_warning: true,
};

import {
  DEFAULT_REQUIREMENTS_SYSTEM_PROMPT,
  DEFAULT_SEQUENCE_SYSTEM_PROMPT,
  DEFAULT_USECASE_SYSTEM_PROMPT,
} from './default-system-prompts';

const STORAGE_KEY = 'usecase-builder-settings';

export interface Settings {
  openaiApiKey: string;
  model: string;
  useCaseSystemPrompt: string;
  sequenceSystemPrompt: string;
  requirementsSystemPrompt: string;
}

const defaultSettings: Settings = {
  openaiApiKey: '',
  model: 'gpt-5.2',
  useCaseSystemPrompt: DEFAULT_USECASE_SYSTEM_PROMPT,
  sequenceSystemPrompt: DEFAULT_SEQUENCE_SYSTEM_PROMPT,
  requirementsSystemPrompt: DEFAULT_REQUIREMENTS_SYSTEM_PROMPT,
};

export function getDefaultSettings(): Settings {
  return { ...defaultSettings };
}

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return getDefaultSettings();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return getDefaultSettings();
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function restoreDefaultSettings(): Settings {
  const defaults = getDefaultSettings();
  saveSettings(defaults);
  return defaults;
}

export function clearSettings(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear settings:', e);
  }
}

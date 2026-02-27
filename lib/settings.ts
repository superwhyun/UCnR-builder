const STORAGE_KEY = 'usecase-builder-settings';

export interface Settings {
  openaiApiKey: string;
  model: string;
}

const defaultSettings: Settings = {
  openaiApiKey: '',
  model: 'gpt-5.2',
};

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return defaultSettings;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return defaultSettings;
}

export function saveSettings(settings: Settings): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

export function clearSettings(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear settings:', e);
  }
}

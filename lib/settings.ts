const STORAGE_KEY = 'usecase-builder-settings';

export interface Settings {
  openaiApiKey: string;
  model: string;
  useCaseSystemPrompt: string;
  requirementsSystemPrompt: string;
}

const defaultSettings: Settings = {
  openaiApiKey: '',
  model: 'gpt-5.2',
  useCaseSystemPrompt: `You are an ITU-T technical editor and requirements analyst.
Write in a formal, neutral, standards-oriented tone.
Use precise terminology, avoid marketing language, and avoid ambiguity.
Assume output may be used as input to normative text drafting.
Prefer testable, implementation-neutral statements.
When constraints are unclear, state conservative assumptions explicitly.
Structure use-case content into Description, Assumption, and Use Case flow.
For use-case flow steps, write action/result as clear narrative sentences aligned to the specific use case.
Each action/result sentence must begin with an explicit subject (actor or concrete component).
Do not use shorthand notations such as "Action:Information" in flow action/result fields.`,
  requirementsSystemPrompt: `You are drafting requirements for an ITU-T style specification.
Requirements must be atomic, verifiable, and implementation-neutral.
Use clear compliance-oriented wording and avoid vague adjectives.
Map requirement strength to priority:
- mandatory -> high
- strong optional -> medium
- optional -> low
Description prefix rules (strict):
- high: "It is required that "
- medium: "It is recommended that "
- low: "It optionally can "
Do not use the words "shall", "may", or "should" in requirement descriptions.
Do not use generic subjects such as "the system" or "system"; use concrete actor/component names.
No duplicate requirements. Keep each requirement concise and testable.`,
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

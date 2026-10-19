import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { CourseId, isCourseId, UI_LANGUAGES, UiLanguage } from './languages';
import { loadValue, saveValue } from './storage';

// The user's choices, saved on the phone: languages, speech speed, microphone exercises.

export const SETTINGS_KEY = 'settings';

export type SpeechRate = 'normal' | 'slow';

export type Settings = {
  nativeLanguage: UiLanguage | null; // null until chosen on the welcome screen
  courseId: CourseId | null; // the course being learned now
  onboarded: boolean;
  speechRate: SpeechRate;
  micEnabled: boolean | null; // null = not decided yet: on if the phone supports it
  installHintSeen: boolean;
  lastBackup: string | null; // day key of the last backup
};

const DEFAULTS: Settings = {
  nativeLanguage: null,
  courseId: null,
  onboarded: false,
  speechRate: 'normal',
  micEnabled: null,
  installHintSeen: false,
  lastBackup: null,
};

// Keep only valid values (the stored data may come from an older version or a backup).
function clean(saved: Partial<Settings>): Settings {
  const merged = { ...DEFAULTS, ...saved };
  if (merged.nativeLanguage && !UI_LANGUAGES.includes(merged.nativeLanguage)) merged.nativeLanguage = null;
  if (merged.courseId && !isCourseId(merged.courseId)) merged.courseId = null;
  if (!merged.nativeLanguage || !merged.courseId) merged.onboarded = false;
  return merged;
}

type SettingsState = {
  loaded: boolean;
  settings: Settings;
  update: (change: Partial<Settings>) => void;
  reload: () => Promise<void>;
};

const SettingsContext = createContext<SettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  const reload = useCallback(async () => {
    const saved = await loadValue<Partial<Settings>>(SETTINGS_KEY, {});
    setSettings(clean(saved));
    setLoaded(true);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Change some settings and save them to the phone straight away.
  const update = useCallback((change: Partial<Settings>) => {
    setSettings((old) => {
      const next = { ...old, ...change };
      saveValue(SETTINGS_KEY, next);
      return next;
    });
  }, []);

  return <SettingsContext.Provider value={{ loaded, settings, update, reload }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsState {
  const state = useContext(SettingsContext);
  if (!state) throw new Error('useSettings must be used inside SettingsProvider');
  return state;
}

/**
 * Global app settings — language, theme, payday default, plus stubs for
 * notifications / FaceID to be wired in later phases.
 *
 * Persisted via AsyncStorage. Components subscribe with the standard
 * Zustand hook pattern; ThemeProvider and the i18n bridge re-render the
 * tree whenever `theme` or `language` change.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { FreelanceMunicipality, Prefecture } from '@/types/tax';

export type LanguageSetting = 'vi' | 'ja' | 'system';
export type ThemeSetting = 'light' | 'dark' | 'system';

export interface AppSettings {
  language: LanguageSetting;
  theme: ThemeSetting;
  /** Day of the month the user expects to be paid (1-31). Used by Dashboard countdown. */
  payday: number;
  defaultPrefecture: Prefecture | null;
  defaultMunicipality: FreelanceMunicipality | null;
  notificationsEnabled: boolean;
  faceIdEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'system',
  theme: 'system',
  payday: 25,
  defaultPrefecture: null,
  defaultMunicipality: null,
  notificationsEnabled: false,
  faceIdEnabled: false,
};

interface SettingsStore {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      updateSetting: (key, value) => {
        set({ settings: { ...get().settings, [key]: value } });
      },
      resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'money-dashboard-jp-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

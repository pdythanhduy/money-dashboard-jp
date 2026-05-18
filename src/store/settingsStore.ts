/**
 * App-wide user settings — persisted via AsyncStorage.
 *
 * Wraps a single `AppSettings` object and exposes `updateSetting<K>(key, val)`
 * for type-safe single-key updates. Subscribers (theme, i18n) react via
 * `useSettingsStore.subscribe` in App.tsx.
 *
 * Persisted key: `kakei-settings-v1`. Bump the suffix if the shape breaks.
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
  /** 1-31. Days beyond month length are clamped at runtime by date-helpers. */
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

function clampPayday(n: number): number {
  if (!Number.isFinite(n)) return DEFAULT_SETTINGS.payday;
  const int = Math.floor(n);
  if (int < 1) return 1;
  if (int > 31) return 31;
  return int;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,

      updateSetting: (key, value) => {
        const next = { ...get().settings, [key]: value } as AppSettings;
        if (key === 'payday') next.payday = clampPayday(value as number);
        set({ settings: next });
      },

      resetToDefaults: () => set({ settings: DEFAULT_SETTINGS }),
    }),
    {
      name: 'kakei-settings-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ settings: state.settings }),
    },
  ),
);

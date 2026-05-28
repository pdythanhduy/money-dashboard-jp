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
  /**
   * The APP_BUILD value the user has already acknowledged the "What's
   * new" card for. Empty string = never seen. When `APP_BUILD` !==
   * this value, Dashboard shows the release-notes card; tapping
   * dismiss writes the current APP_BUILD here.
   */
  lastSeenReleaseNotesBuild: string;
  /**
   * IDs of dashboard sections the user has collapsed. Persisted so the
   * fold state survives navigation + cold-start. New collapsible sections
   * default to expanded — i.e. omission from this array means "open".
   */
  collapsedDashboardSections: string[];
}

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'system',
  theme: 'system',
  payday: 25,
  defaultPrefecture: null,
  defaultMunicipality: null,
  notificationsEnabled: false,
  faceIdEnabled: false,
  lastSeenReleaseNotesBuild: '',
  collapsedDashboardSections: [],
};

interface SettingsStore {
  settings: AppSettings;
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  /** Merge multiple keys in a single store write — fewer renders for callers
   *  like OnboardingNavigator that commit 3+ fields at once. */
  updateSettings: (partial: Partial<AppSettings>) => void;
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

      updateSettings: (partial) => {
        const next = { ...get().settings, ...partial } as AppSettings;
        if ('payday' in partial && partial.payday !== undefined) {
          next.payday = clampPayday(partial.payday);
        }
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

/**
 * `true` once the persisted settings have been rehydrated from AsyncStorage.
 * App.tsx gates the navigation tree on this so the user doesn't briefly see
 * default settings (light theme / system language) flicker into their saved
 * preferences. Returns `true` in environments where the persist middleware
 * doesn't expose `hasHydrated` (e.g. unmocked test paths).
 */
export function useSettingsHydrated(): boolean {
  const persistApi = (useSettingsStore as unknown as {
    persist?: { hasHydrated: () => boolean };
  }).persist;
  return persistApi ? persistApi.hasHydrated() : true;
}

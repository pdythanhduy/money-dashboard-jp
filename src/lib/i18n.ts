/**
 * i18next setup + reactive bridge to settingsStore.
 *
 * Init is wrapped in try/catch so a failure in `expo-localization` cannot
 * black-hole the entire app — we degrade to the fallback language instead.
 *
 * `useReactiveI18n()` is called from App.tsx. It subscribes to
 * `settingsStore.settings.language` and re-routes i18next when the user
 * picks vi/ja/system from Settings.
 */

import { useEffect } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ja from '@/locales/ja.json';
import vi from '@/locales/vi.json';
import { useSettingsStore, type LanguageSetting } from '@/store/settingsStore';

const SUPPORTED = ['vi', 'ja'] as const;
type Supported = (typeof SUPPORTED)[number];
const FALLBACK: Supported = 'vi';

function getDeviceLocale(): Supported {
  try {
    const { getLocales } = require('expo-localization') as typeof import('expo-localization');
    const code = getLocales()[0]?.languageCode;
    if (code && (SUPPORTED as readonly string[]).includes(code)) {
      return code as Supported;
    }
  } catch (err) {
    console.warn('[i18n] expo-localization unavailable, falling back to', FALLBACK, err);
  }
  return FALLBACK;
}

export function resolveLanguage(pref: LanguageSetting): Supported {
  if (pref === 'system') return getDeviceLocale();
  return pref;
}

try {
  void i18n.use(initReactI18next).init({
    resources: {
      vi: { translation: vi },
      ja: { translation: ja },
    },
    lng: resolveLanguage('system'),
    fallbackLng: FALLBACK,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
} catch (err) {
  console.error('[i18n] init failed', err);
}

/**
 * Hook for App.tsx — keeps i18next's active language in sync with the
 * persisted user setting. Re-runs every time settings.language changes
 * (and once on mount to apply the persisted value after rehydrate).
 */
export function useReactiveI18n(): void {
  const pref = useSettingsStore((s) => s.settings.language);
  useEffect(() => {
    const target = resolveLanguage(pref);
    if (i18n.language !== target) {
      void i18n.changeLanguage(target);
    }
  }, [pref]);
}

export default i18n;

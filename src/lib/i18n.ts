/**
 * i18next setup. Detects device language via `expo-localization`. Falls
 * back to Vietnamese (primary target audience).
 *
 * Translation files live in `src/locales/`. Add a new language by importing
 * its JSON and adding it to `resources` + `SUPPORTED`.
 *
 * `resolveLanguage(setting)` maps the user's stored preference (`vi` / `ja`
 * / `system`) to a concrete i18n language code. Call it whenever the
 * settingsStore changes and pass the result to `i18n.changeLanguage`.
 *
 * Init is wrapped in try/catch so a failure in `expo-localization` cannot
 * black-hole the entire app — we degrade to the fallback language instead.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ja from '@/locales/ja.json';
import vi from '@/locales/vi.json';

export const SUPPORTED = ['vi', 'ja'] as const;
export type SupportedLanguage = (typeof SUPPORTED)[number];
export const FALLBACK_LANGUAGE: SupportedLanguage = 'vi';

export function detectDeviceLanguage(): SupportedLanguage {
  try {
    // Imported lazily so a native-module load failure can't break this module.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const { getLocales } = require('expo-localization') as typeof import('expo-localization');
    const code = getLocales()[0]?.languageCode;
    if (code && (SUPPORTED as readonly string[]).includes(code)) {
      return code as SupportedLanguage;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[i18n] expo-localization unavailable, falling back to', FALLBACK_LANGUAGE, err);
  }
  return FALLBACK_LANGUAGE;
}

export function resolveLanguage(setting: 'vi' | 'ja' | 'system'): SupportedLanguage {
  if (setting === 'system') return detectDeviceLanguage();
  return setting;
}

try {
  void i18n.use(initReactI18next).init({
    resources: {
      vi: { translation: vi },
      ja: { translation: ja },
    },
    lng: detectDeviceLanguage(),
    fallbackLng: FALLBACK_LANGUAGE,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[i18n] init failed', err);
}

export default i18n;

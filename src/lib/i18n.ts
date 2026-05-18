/**
 * i18next setup. Detects device language via `expo-localization`. Falls
 * back to Vietnamese (primary target audience).
 *
 * Translation files live in `src/locales/`. Add a new language by importing
 * its JSON and adding it to `resources` + `SUPPORTED`.
 *
 * Init is wrapped in try/catch so a failure in `expo-localization` cannot
 * black-hole the entire app — we degrade to the fallback language instead.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ja from '@/locales/ja.json';
import vi from '@/locales/vi.json';

const SUPPORTED = ['vi', 'ja'] as const;
type Supported = (typeof SUPPORTED)[number];
const FALLBACK: Supported = 'vi';

function pickInitialLanguage(): Supported {
  try {
    // Imported lazily so a native-module load failure can't break this module.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const { getLocales } = require('expo-localization') as typeof import('expo-localization');
    const code = getLocales()[0]?.languageCode;
    if (code && (SUPPORTED as readonly string[]).includes(code)) {
      return code as Supported;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[i18n] expo-localization unavailable, falling back to', FALLBACK, err);
  }
  return FALLBACK;
}

try {
  void i18n.use(initReactI18next).init({
    resources: {
      vi: { translation: vi },
      ja: { translation: ja },
    },
    lng: pickInitialLanguage(),
    fallbackLng: FALLBACK,
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  // eslint-disable-next-line no-console
  console.log('[i18n] init dispatched, initial lng:', i18n.language);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error('[i18n] init failed', err);
}

export default i18n;

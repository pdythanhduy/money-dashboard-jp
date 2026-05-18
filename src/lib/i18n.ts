/**
 * i18next setup. Detects device language via `expo-localization`. Falls
 * back to Vietnamese (primary target audience).
 *
 * Translation files live in `src/locales/`. Add a new language by importing
 * its JSON and adding it to `resources` + `SUPPORTED`.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import ja from '@/locales/ja.json';
import vi from '@/locales/vi.json';

const SUPPORTED = ['vi', 'ja'] as const;
type Supported = (typeof SUPPORTED)[number];
const FALLBACK: Supported = 'vi';

function pickInitialLanguage(): Supported {
  const deviceLocale = getLocales()[0]?.languageCode;
  if (deviceLocale && (SUPPORTED as readonly string[]).includes(deviceLocale)) {
    return deviceLocale as Supported;
  }
  return FALLBACK;
}

void i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    ja: { translation: ja },
  },
  lng: pickInitialLanguage(),
  fallbackLng: FALLBACK,
  interpolation: { escapeValue: false },
  returnNull: false,
  compatibilityJSON: 'v4',
});

export default i18n;

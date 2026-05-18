import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import vi from './vi.json';
import ja from './ja.json';

const deviceLocale = getLocales()[0]?.languageCode ?? 'vi';
const fallback = 'vi';
const supported = ['vi', 'ja'] as const;
type Supported = (typeof supported)[number];
const initialLanguage: Supported = (supported as readonly string[]).includes(deviceLocale)
  ? (deviceLocale as Supported)
  : fallback;

void i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    ja: { translation: ja },
  },
  lng: initialLanguage,
  fallbackLng: fallback,
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;

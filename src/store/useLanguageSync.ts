/**
 * Bridges `useSettingsStore.settings.language` into i18next.
 *
 * Mounted once at the root. On mount we sync the resolved language with
 * `i18n.language`; on each settings change we re-resolve and call
 * `changeLanguage` only if it differs (avoids redundant re-renders).
 */

import { useEffect } from 'react';

import i18n, { resolveLanguage } from '@/lib/i18n';
import { useSettingsStore } from '@/store/settingsStore';

export function useLanguageSync() {
  const language = useSettingsStore((s) => s.settings.language);

  useEffect(() => {
    const target = resolveLanguage(language);
    if (i18n.language !== target) {
      void i18n.changeLanguage(target);
    }
  }, [language]);
}

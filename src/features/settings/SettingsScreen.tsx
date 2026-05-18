import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export function SettingsScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('screens.settings.title')}
      subtitle={t('screens.settings.placeholder')}
      icon="settings-outline"
    />
  );
}

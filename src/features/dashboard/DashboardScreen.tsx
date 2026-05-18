import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export function DashboardScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('screens.dashboard.title')}
      subtitle={t('screens.dashboard.placeholder')}
      icon="home-outline"
    />
  );
}

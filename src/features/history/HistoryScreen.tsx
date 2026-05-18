import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export function HistoryScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('screens.history.title')}
      subtitle={t('screens.history.placeholder')}
      icon="stats-chart-outline"
    />
  );
}

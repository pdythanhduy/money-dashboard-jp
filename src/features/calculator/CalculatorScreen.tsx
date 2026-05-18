import { useTranslation } from 'react-i18next';

import { PlaceholderScreen } from '@/components/PlaceholderScreen';

export function CalculatorScreen() {
  const { t } = useTranslation();
  return (
    <PlaceholderScreen
      title={t('screens.calculator.title')}
      subtitle={t('screens.calculator.placeholder')}
      icon="calculator-outline"
    />
  );
}

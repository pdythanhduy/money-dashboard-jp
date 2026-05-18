import { useTranslation } from 'react-i18next';

import { OptionPickerModal } from '@/features/settings/components/OptionPickerModal';
import type { ThemeSetting } from '@/store/settingsStore';

interface ThemePickerProps {
  visible: boolean;
  value: ThemeSetting;
  onChange: (value: ThemeSetting) => void;
  onClose: () => void;
}

export function ThemePicker({ visible, value, onChange, onClose }: ThemePickerProps) {
  const { t } = useTranslation();

  const options = [
    { value: 'system' as const, label: t('settings.values.themeSystem') },
    { value: 'light' as const, label: t('settings.values.themeLight') },
    { value: 'dark' as const, label: t('settings.values.themeDark') },
  ];

  return (
    <OptionPickerModal
      visible={visible}
      title={t('settings.theme.title')}
      subtitle={t('settings.theme.subtitle')}
      closeLabel={t('common.close')}
      value={value}
      options={options}
      onChange={onChange}
      onClose={onClose}
    />
  );
}

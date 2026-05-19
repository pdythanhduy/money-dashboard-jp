import { useTranslation } from 'react-i18next';

import { OptionPickerModal } from '@/features/settings/components/OptionPickerModal';
import type { LanguageSetting } from '@/store/settingsStore';

interface LanguagePickerProps {
  visible: boolean;
  value: LanguageSetting;
  onChange: (value: LanguageSetting) => void;
  onClose: () => void;
}

export function LanguagePicker({ visible, value, onChange, onClose }: LanguagePickerProps) {
  const { t } = useTranslation();

  const options = [
    { value: 'system' as const, label: t('settings.values.languageSystem') },
    { value: 'vi' as const, label: t('settings.values.languageVi') },
    { value: 'ja' as const, label: t('settings.values.languageJa') },
  ];

  return (
    <OptionPickerModal
      visible={visible}
      title={t('settings.language.title')}
      subtitle={t('settings.language.subtitle')}
      closeLabel={t('common.close')}
      value={value}
      options={options}
      onChange={onChange}
      onClose={onClose}
    />
  );
}

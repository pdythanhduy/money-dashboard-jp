/**
 * Thin wrapper around the generic OptionPickerModal that knows the
 * Phase-1 prefecture list. Re-used in Settings and the onboarding's
 * InitialSetupScreen.
 *
 * Keeps the option labels translated from `calculator.prefectures.*` so
 * we don't duplicate the prefecture copy in the settings namespace.
 */

import { useTranslation } from 'react-i18next';

import { OptionPickerModal, type PickerOption } from '@/features/settings/components/OptionPickerModal';
import type { Prefecture } from '@/types/tax';

const PREFECTURES: readonly Prefecture[] = [
  'tokyo',
  'osaka',
  'aichi',
  'kanagawa',
  'saitama',
  'chiba',
  'hyogo',
  'fukuoka',
];

interface PrefecturePickerProps {
  visible: boolean;
  value: Prefecture | null;
  onChange: (value: Prefecture) => void;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function PrefecturePicker({
  visible,
  value,
  onChange,
  onClose,
  title,
  subtitle,
}: PrefecturePickerProps) {
  const { t } = useTranslation();

  const options: Array<PickerOption<Prefecture>> = PREFECTURES.map((p) => ({
    value: p,
    label: t(`calculator.prefectures.${p}.label`),
    description: t(`calculator.prefectures.${p}.description`),
  }));

  return (
    <OptionPickerModal
      visible={visible}
      title={title ?? t('calculator.fields.prefecture.label')}
      subtitle={subtitle ?? t('calculator.fields.prefecture.jp')}
      closeLabel={t('common.close')}
      value={value ?? undefined}
      options={options}
      onChange={(v) => onChange(v as Prefecture)}
      onClose={onClose}
    />
  );
}

import { useTranslation } from 'react-i18next';

import {
  OptionPickerModal,
  type PickerOption,
} from '@/features/settings/components/OptionPickerModal';
import type { FreelanceMunicipality } from '@/types/tax';

const MUNICIPALITIES: readonly FreelanceMunicipality[] = ['osaka-shi', 'tokyo-23ku'];

interface MunicipalityPickerProps {
  visible: boolean;
  value: FreelanceMunicipality | null;
  onChange: (value: FreelanceMunicipality) => void;
  onClose: () => void;
}

export function MunicipalityPicker({
  visible,
  value,
  onChange,
  onClose,
}: MunicipalityPickerProps) {
  const { t } = useTranslation();

  const options: Array<PickerOption<FreelanceMunicipality>> = MUNICIPALITIES.map((m) => ({
    value: m,
    label: t(`calculator.municipalities.${m}.label`),
    description: t(`calculator.municipalities.${m}.description`),
  }));

  return (
    <OptionPickerModal
      visible={visible}
      title={t('calculator.fields.municipality.label')}
      subtitle={t('calculator.fields.municipality.jp')}
      closeLabel={t('common.close')}
      value={value ?? undefined}
      options={options}
      onChange={(v) => onChange(v as FreelanceMunicipality)}
      onClose={onClose}
    />
  );
}

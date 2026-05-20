import { useTranslation } from 'react-i18next';
import { Text, TextInput, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import {
  computeEarthquakeInsuranceDeduction,
  computeLifeInsuranceDeduction,
} from '@/lib/kakutei-shinkoku';
import { useKakuteiStore, type KakuteiDraftField } from '@/store/kakuteiStore';
import { useTheme } from '@/theme';

function parseYen(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function ManualDeductionsStep() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const draft = useKakuteiStore((s) => s.draft);
  const updateField = useKakuteiStore((s) => s.updateDraftField);

  const lifeDeduction = computeLifeInsuranceDeduction(draft.lifeInsurancePremium);
  const earthquakeDeduction = computeEarthquakeInsuranceDeduction(draft.earthquakeInsurancePremium);

  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <Text style={[typography.title3, { color: colors.text, fontWeight: '700' }]}>
        {t('kakutei.steps.4.title')}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary }]}>{t('kakutei.steps.4.body')}</Text>

      <Field
        label={t('kakutei.fields.lifeInsurance')}
        hint={t('kakutei.fields.lifeInsuranceHint')}
        value={draft.lifeInsurancePremium}
        onChange={(v) => updateField('lifeInsurancePremium', v)}
        preview={lifeDeduction > 0 ? t('kakutei.steps.4.livePreview', { amount: formatCurrency(lifeDeduction) }) : undefined}
        fieldKey="lifeInsurancePremium"
      />

      <Field
        label={t('kakutei.fields.earthquakeInsurance')}
        hint={t('kakutei.fields.earthquakeInsuranceHint')}
        value={draft.earthquakeInsurancePremium}
        onChange={(v) => updateField('earthquakeInsurancePremium', v)}
        preview={
          earthquakeDeduction > 0
            ? t('kakutei.steps.4.livePreview', { amount: formatCurrency(earthquakeDeduction) })
            : undefined
        }
        fieldKey="earthquakeInsurancePremium"
      />

      <Field
        label={t('kakutei.fields.publicPension')}
        hint={t('kakutei.fields.publicPensionHint')}
        value={draft.publicPensionContribution}
        onChange={(v) => updateField('publicPensionContribution', v)}
        fieldKey="publicPensionContribution"
      />
    </View>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  preview,
  fieldKey,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  preview?: string;
  fieldKey: KakuteiDraftField;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.headline, { color: colors.text }]}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={[typography.title3, { color: colors.textSecondary }]}>¥</Text>
        <TextInput
          accessibilityLabel={fieldKey}
          value={value > 0 ? String(value) : ''}
          onChangeText={(v) => onChange(parseYen(v))}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          inputMode="numeric"
          style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
        />
      </View>
      {hint ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
      {preview ? (
        <Text style={[typography.caption, { color: colors.brand, fontWeight: '600' }]}>{preview}</Text>
      ) : null}
    </View>
  );
}

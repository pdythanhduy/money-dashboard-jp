import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { DeductionRow } from '@/features/kakutei/components/DeductionRow';
import { useKakuteiData } from '@/features/kakutei/hooks/useKakuteiData';
import { useTheme } from '@/theme';

/** Map deduction keys to a source-of-truth label so user knows where to edit. */
const SOURCE_LABEL: Record<string, string> = {
  basic: 'kakutei.steps.3.fromCalculator',
  social_insurance: 'kakutei.steps.3.fromCalculator',
  spouse: 'kakutei.steps.3.fromCalculator',
  dependent: 'kakutei.steps.3.fromCalculator',
  working_student: 'kakutei.steps.3.fromCalculator',
  medical: 'kakutei.steps.3.fromMedical',
  furusato: 'kakutei.steps.3.fromFurusato',
};

const AUTO_KEYS = new Set([
  'basic',
  'social_insurance',
  'spouse',
  'dependent',
  'working_student',
  'medical',
  'furusato',
]);

export function AutoDeductionsStep() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const data = useKakuteiData();

  const autoLines = data.summary.deductions.filter((d) => AUTO_KEYS.has(d.key));

  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <Text style={[typography.title3, { color: colors.text, fontWeight: '700' }]}>
        {t('kakutei.steps.3.title')}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary }]}>{t('kakutei.steps.3.body')}</Text>

      <View
        style={{
          padding: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceElevated,
        }}
      >
        {autoLines.length === 0 ? (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>—</Text>
        ) : (
          autoLines.map((line) => {
            const sourceKey = SOURCE_LABEL[line.key];
            return (
              <DeductionRow
                key={line.key}
                line={line}
                noteOverride={sourceKey ? t(sourceKey) : undefined}
              />
            );
          })
        )}
      </View>
    </View>
  );
}

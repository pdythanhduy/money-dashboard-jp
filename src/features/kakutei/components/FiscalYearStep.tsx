import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useKakuteiStore } from '@/store/kakuteiStore';
import { useTheme } from '@/theme';

export function FiscalYearStep() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const fiscalYear = useKakuteiStore((s) => s.draft.fiscalYear);
  const updateField = useKakuteiStore((s) => s.updateDraftField);

  const currentYear = new Date().getFullYear();
  // Allow filing for current-year minus 1 and minus 2 (back-claim window).
  const options = [currentYear - 1, currentYear - 2];

  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <Text style={[typography.title3, { color: colors.text, fontWeight: '700' }]}>
        {t('kakutei.steps.1.title')}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary }]}>
        {t('kakutei.steps.1.body', { currentYear: currentYear - 1, nextYear: currentYear })}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {options.map((y) => {
          const selected = fiscalYear === y;
          return (
            <Pressable
              key={y}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={String(y)}
              onPress={() => updateField('fiscalYear', y)}
              style={({ pressed }) => ({
                flex: 1,
                paddingVertical: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: selected ? colors.brand : colors.border,
                backgroundColor: selected ? colors.brandSubtle : colors.surface,
                alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={[
                  typography.title3,
                  { color: selected ? colors.brand : colors.text, fontWeight: '700' },
                ]}
              >
                {y}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

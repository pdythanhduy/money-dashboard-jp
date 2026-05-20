import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface Props {
  /** 1-indexed. */
  current: number;
  total: number;
}

export function StepIndicator({ current, total }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.sm, gap: spacing.xs }}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('kakutei.steps.indicator', { current, total })}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {Array.from({ length: total }, (_, i) => {
          const done = i + 1 <= current;
          return (
            <View
              key={i}
              style={{
                flex: 1,
                height: 4,
                borderRadius: radius.pill,
                backgroundColor: done ? colors.brand : colors.border,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { computeDailySpending } from '@/lib/daily-spending';
import { formatCurrency } from '@/lib/format';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useTheme } from '@/theme';

interface Props {
  /** Called when user taps the card — typically navigates to Kakeibo. */
  onPress: () => void;
}

export function DailySpendingCard({ onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const entries = useKakeiboStore((s) => s.entries);
  const budgets = useKakeiboStore((s) => s.budgets);

  const result = useMemo(() => computeDailySpending(entries, budgets, new Date()), [entries, budgets]);

  const heroColor =
    result.todayVsAvg === 'over'
      ? colors.danger
      : result.todayVsAvg === 'under'
        ? colors.success
        : colors.brand;

  const subline = (() => {
    if (result.todayVsAvg === 'no_budget') return t('dashboard.dailySpending.noBudget');
    return t('dashboard.dailySpending.dailyRemaining', {
      amount: formatCurrency(Math.max(0, result.dailyRemainingAvg)),
    });
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('dashboard.dailySpending.title')}
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        opacity: pressed ? 0.85 : 1,
        ...(isDark
          ? {
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }
          : {}),
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="wallet-outline" size={18} color={colors.brand} />
        <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
          {t('dashboard.dailySpending.title')}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
      <Text style={[typography.largeTitle, { color: heroColor, fontWeight: '800', marginTop: spacing.xs }]}>
        {formatCurrency(result.todaySpent)}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
        {subline}
      </Text>
      {result.todayVsAvg !== 'no_budget' ? (
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: spacing.xs,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radius.pill,
            backgroundColor: result.todayVsAvg === 'over' ? colors.danger : colors.success,
          }}
        >
          <Text style={[typography.caption, { color: colors.textInverse, fontWeight: '700' }]}>
            {result.todayVsAvg === 'over'
              ? t('dashboard.dailySpending.overBudget')
              : t('dashboard.dailySpending.underBudget')}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

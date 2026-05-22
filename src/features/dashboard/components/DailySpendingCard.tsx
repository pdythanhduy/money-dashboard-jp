import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { MiniSevenDaySpendingChart } from '@/features/kakeibo/components/charts/MiniSevenDaySpendingChart';
import { computeDailySpending } from '@/lib/daily-spending';
import { formatCurrency } from '@/lib/format';
import { buildLastNDaysSpendingSeries } from '@/lib/kakeibo-charts';
import { computeLivingCost, type LivingCostStatus } from '@/lib/living-cost-math';
import { useCalculatorStore } from '@/store/calculatorStore';
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
  const recurrings = useKakeiboStore((s) => s.recurrings);
  const takeHomeMonthly = useCalculatorStore((s) => s.lastResult?.takeHomeMonthly ?? 0);

  // Prefer salary-based math when we have take-home from Calculator.
  // Fall back to budget-sum math when only budgets are configured.
  const mode: 'salary' | 'budget' = takeHomeMonthly > 0 ? 'salary' : 'budget';

  const salary = useMemo(
    () =>
      mode === 'salary'
        ? computeLivingCost({
            takeHomeMonthly,
            entries,
            recurrings,
            now: new Date(),
          })
        : null,
    [mode, takeHomeMonthly, entries, recurrings],
  );
  const budget = useMemo(
    () => (mode === 'budget' ? computeDailySpending(entries, budgets, new Date()) : null),
    [mode, entries, budgets],
  );

  const todaySpent = salary?.todaySpent ?? budget?.todaySpent ?? 0;

  const status: LivingCostStatus | 'no_budget' = salary
    ? salary.status
    : budget?.todayVsAvg === 'no_budget'
      ? 'no_budget'
      : budget?.todayVsAvg === 'over'
        ? 'danger'
        : 'safe';

  const heroColor =
    status === 'danger'
      ? colors.danger
      : status === 'warning'
        ? colors.warning
        : status === 'safe'
          ? colors.success
          : colors.brand;

  const statusLabel =
    status === 'danger'
      ? t('dashboard.dailySpending.statusDanger')
      : status === 'warning'
        ? t('dashboard.dailySpending.statusWarning')
        : status === 'safe'
          ? t('dashboard.dailySpending.statusSafe')
          : null;

  const dailyLine = salary
    ? t('dashboard.dailySpending.dailyRemaining', {
        amount: formatCurrency(Math.max(0, salary.dailyAllowance)),
      })
    : budget && budget.todayVsAvg !== 'no_budget'
      ? t('dashboard.dailySpending.dailyRemaining', {
          amount: formatCurrency(Math.max(0, budget.dailyRemainingAvg)),
        })
      : t('dashboard.dailySpending.noBudget');

  // 7-day mini chart only when there's at least one entry to plot.
  const miniSeries = useMemo(
    () => (entries.length > 0 ? buildLastNDaysSpendingSeries(entries, 7, new Date()) : []),
    [entries],
  );
  const showMini = miniSeries.some((p) => p.amount > 0);

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
        {formatCurrency(todaySpent)}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
        {dailyLine}
      </Text>
      {salary && salary.totalFixedCost > 0 ? (
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {t('dashboard.dailySpending.fixedCostTotal', {
            amount: formatCurrency(salary.totalFixedCost),
          })}
          {' · '}
          {t('dashboard.dailySpending.remainingMonth', {
            amount: formatCurrency(Math.max(0, salary.remainingThisMonth)),
          })}
        </Text>
      ) : null}
      {showMini ? (
        <View style={{ marginTop: spacing.sm, alignItems: 'flex-end' }}>
          <MiniSevenDaySpendingChart series={miniSeries} />
        </View>
      ) : null}
      {statusLabel ? (
        <View
          style={{
            alignSelf: 'flex-start',
            marginTop: spacing.xs,
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radius.pill,
            backgroundColor: heroColor,
          }}
        >
          <Text style={[typography.caption, { color: colors.textInverse, fontWeight: '700' }]}>
            {statusLabel}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

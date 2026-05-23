import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { MiniSevenDaySpendingChart } from '@/features/kakeibo/components/charts/MiniSevenDaySpendingChart';
import { computeDailySpending } from '@/lib/daily-spending';
import { computeFinancialHealth } from '@/lib/financial-health';
import { formatCurrency } from '@/lib/format';
import { buildLastNDaysSpendingSeries } from '@/lib/kakeibo-charts';
import { computeLivingCost, type LivingCostStatus } from '@/lib/living-cost-math';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useTheme } from '@/theme';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function currentYearMonth(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

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

  const health = useMemo(() => {
    const now = new Date();
    return computeFinancialHealth({
      takeHomeMonthly,
      entries,
      recurrings,
      budgets,
      yearMonth: currentYearMonth(now),
      now,
    });
  }, [takeHomeMonthly, entries, recurrings, budgets]);

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
      <FinancialHealthChipRow
        budgetSummary={health.budgetSummary}
        topCategory={health.topCategory}
        fixedCostBurdenPercent={health.fixedCostBurdenPercent}
      />
    </Pressable>
  );
}

interface ChipRowProps {
  budgetSummary?: { total: number; safe: number; warning: number; over: number };
  topCategory?: { category: string; amount: number; percent: number };
  fixedCostBurdenPercent?: number;
}

function FinancialHealthChipRow({ budgetSummary, topCategory, fixedCostBurdenPercent }: ChipRowProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const chips: { key: string; label: string }[] = [];
  if (budgetSummary && budgetSummary.total > 0) {
    chips.push({
      key: 'budget',
      label: t('dashboard.financialHealth.budgetChip', {
        safe: budgetSummary.safe,
        total: budgetSummary.total,
      }),
    });
  }
  if (topCategory) {
    chips.push({
      key: 'top',
      label: t('dashboard.financialHealth.topCategoryChip', {
        category: t(`kakeibo.categories.${topCategory.category}`),
      }),
    });
  }
  if (fixedCostBurdenPercent !== undefined) {
    chips.push({
      key: 'fixed',
      label: t('dashboard.financialHealth.fixedCostChip', {
        percent: Math.round(fixedCostBurdenPercent * 100),
      }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <View
      style={{
        marginTop: spacing.sm,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
      }}
    >
      {chips.map((c) => (
        <View
          key={c.key}
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radius.pill,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
            {c.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import { formatCurrency } from '@/lib/format';
import {
  computeAllBudgetStatuses,
  type BudgetTarget,
  type KakeiboEntry,
} from '@/lib/kakeibo-math';
import { useTheme } from '@/theme';

interface Props {
  entries: readonly KakeiboEntry[];
  budgets: readonly BudgetTarget[];
  yearMonth: string;
}

/**
 * Renders every saved budget for the selected month with spent / limit /
 * remaining + a progress bar. Visible whether the budget is safe, warning,
 * or over — fixes the discoverability bug where users couldn't see their
 * saved budgets unless something was already failing.
 *
 * Returns null when the user has no budgets at all, so the Overview tab
 * stays clean for first-time users.
 */
export function BudgetComparisonSection({ entries, budgets, yearMonth }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const statuses = useMemo(
    () => computeAllBudgetStatuses(entries as KakeiboEntry[], yearMonth, budgets as BudgetTarget[]),
    [entries, yearMonth, budgets],
  );

  if (statuses.length === 0) return null;

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        gap: spacing.sm,
      }}
    >
      <Text style={[typography.headline, { color: colors.text }]}>
        {t('kakeibo.budgetComparison.title')}
      </Text>
      {statuses.map((s) => {
        const barColor =
          s.severity === 'over'
            ? colors.danger
            : s.severity === 'warning'
              ? colors.warning
              : colors.brand;
        const barWidth = Math.max(2, Math.min(100, Math.round(s.percentUsed * 100)));
        const remainingLabel =
          s.severity === 'over'
            ? t('kakeibo.budgetComparison.over', { amount: formatCurrency(Math.abs(s.remaining)) })
            : t('kakeibo.budgetComparison.remaining', { amount: formatCurrency(s.remaining) });
        return (
          <View key={s.category} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name={CATEGORY_ICONS[s.category]} size={16} color={colors.brand} />
              <Text style={[typography.callout, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {t(`kakeibo.categories.${s.category}`)}
              </Text>
              <Text style={[typography.callout, { color: colors.text, fontWeight: '700' }]}>
                {formatCurrency(s.spent)} / {formatCurrency(s.limit)}
              </Text>
            </View>
            <View
              style={{
                height: 6,
                borderRadius: 3,
                backgroundColor: colors.border,
                overflow: 'hidden',
              }}
            >
              <View style={{ width: `${barWidth}%`, height: '100%', backgroundColor: barColor }} />
            </View>
            <Text
              style={[
                typography.caption,
                {
                  color:
                    s.severity === 'over'
                      ? colors.danger
                      : s.severity === 'warning'
                        ? colors.warning
                        : colors.textSecondary,
                  fontWeight: '600',
                },
              ]}
            >
              {remainingLabel}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

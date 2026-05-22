import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import { formatCurrency } from '@/lib/format';
import type { CategorySpendingPoint } from '@/lib/kakeibo-charts';
import type { ExpenseCategory } from '@/lib/kakeibo-math';
import { useTheme } from '@/theme';

interface Props {
  series: readonly CategorySpendingPoint[];
  topN?: number;
}

const DEFAULT_TOP_N = 5;

export function CategorySpendingChart({ series, topN = DEFAULT_TOP_N }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const rows = useMemo(() => {
    if (series.length <= topN) return series.slice();
    const top = series.slice(0, topN - 1);
    const rest = series.slice(topN - 1);
    const restTotal = rest.reduce((s, r) => s + r.amount, 0);
    const restPercent = rest.reduce((s, r) => s + r.percent, 0);
    return [
      ...top,
      {
        category: 'other' as ExpenseCategory,
        amount: restTotal,
        percent: Math.round(restPercent * 10) / 10,
      },
    ];
  }, [series, topN]);

  if (rows.length === 0) {
    return (
      <View
        style={{
          padding: spacing.md,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          alignItems: 'center',
        }}
      >
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('kakeibo.charts.empty')}
        </Text>
      </View>
    );
  }

  const max = rows[0]?.amount ?? 1;

  return (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        gap: spacing.sm,
      }}
    >
      {rows.map((r) => {
        const widthPct = Math.max(2, Math.min(100, (r.amount / max) * 100));
        return (
          <View key={r.category} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name={CATEGORY_ICONS[r.category]} size={16} color={colors.brand} />
              <Text style={[typography.callout, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {t(`kakeibo.categories.${r.category}`)}
              </Text>
              <Text style={[typography.callout, { color: colors.text, fontWeight: '600' }]}>
                {formatCurrency(r.amount)}
              </Text>
              <Text
                style={[typography.caption, { color: colors.textSecondary, width: 48, textAlign: 'right' }]}
              >
                {r.percent.toFixed(0)}%
              </Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
              <View style={{ width: `${widthPct}%`, height: '100%', backgroundColor: colors.brand }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

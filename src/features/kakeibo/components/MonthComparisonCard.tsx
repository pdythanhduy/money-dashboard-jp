import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { compareMonths, type MonthlyReport } from '@/lib/kakeibo-math';
import { useTheme } from '@/theme';

interface Props {
  prev: MonthlyReport;
  current: MonthlyReport;
}

function formatPercent(p: number): string {
  if (!Number.isFinite(p)) return '∞';
  return `${Math.round(p * 100)}`;
}

export function MonthComparisonCard({ prev, current }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const cmp = compareMonths(prev, current);

  // Top 3 by |delta|.
  const movers = [...cmp.byCategoryDelta]
    .filter((d) => d.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  const headerColor =
    cmp.totalDelta > 0 ? colors.danger : cmp.totalDelta < 0 ? colors.success : colors.textSecondary;

  let headerText: string;
  if (cmp.totalDelta === 0) {
    headerText = t('kakeibo.comparison.unchanged');
  } else if (cmp.totalDelta > 0) {
    headerText = t('kakeibo.comparison.increase', {
      amount: formatCurrency(Math.abs(cmp.totalDelta)),
      percent: formatPercent(cmp.totalDeltaPercent),
    });
  } else {
    headerText = t('kakeibo.comparison.decrease', {
      amount: formatCurrency(Math.abs(cmp.totalDelta)),
      percent: formatPercent(Math.abs(cmp.totalDeltaPercent)),
    });
  }

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        gap: spacing.xs,
      }}
    >
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('kakeibo.comparison.title')}
      </Text>
      <Text style={[typography.headline, { color: headerColor, fontWeight: '700' }]}>{headerText}</Text>
      {movers.length > 0 ? (
        <View style={{ marginTop: spacing.xs, gap: 2 }}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {t('kakeibo.comparison.topCategories')}
          </Text>
          {movers.map((m) => (
            <View key={m.category} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Ionicons
                name={m.delta > 0 ? 'arrow-up' : 'arrow-down'}
                size={14}
                color={m.delta > 0 ? colors.danger : colors.success}
              />
              <Text style={[typography.caption, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {t(`kakeibo.categories.${m.category}`)}
              </Text>
              <Text
                style={[typography.caption, { color: m.delta > 0 ? colors.danger : colors.success, fontWeight: '600' }]}
              >
                {m.delta > 0 ? '+' : '−'}{formatCurrency(Math.abs(m.delta))}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

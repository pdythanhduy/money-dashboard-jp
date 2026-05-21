import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme';

interface Props {
  totalSpent: number;
  entryCount: number;
  totalIncome?: number;
  surplus?: number;
}

export function SummaryCard({ totalSpent, entryCount, totalIncome, surplus }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const hasIncome = totalIncome !== undefined && totalIncome > 0 && surplus !== undefined;
  const surplusColor = hasIncome
    ? (surplus as number) >= 0
      ? colors.success
      : colors.danger
    : colors.textSecondary;
  // Floor the percent so we never round a small overspend to a friendly 99%.
  const percentOfIncome = hasIncome
    ? Math.min(999, Math.floor((totalSpent / (totalIncome as number)) * 100))
    : 0;

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        gap: spacing.xs,
      }}
    >
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('kakeibo.summary.totalSpent')}
      </Text>
      <Text style={[typography.largeTitle, { color: colors.text, fontWeight: '800' }]}>
        {formatCurrency(totalSpent)}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('kakeibo.summary.entriesCount', { count: entryCount })}
      </Text>
      {hasIncome ? (
        <View style={{ marginTop: spacing.sm, gap: 2 }}>
          <Row
            label={t('kakeibo.summary.income')}
            value={formatCurrency(totalIncome as number)}
            color={colors.textSecondary}
          />
          <Row
            label={
              (surplus as number) >= 0
                ? t('kakeibo.summary.surplusLabel')
                : t('kakeibo.summary.deficitLabel')
            }
            value={formatCurrency(Math.abs(surplus as number))}
            color={surplusColor}
            valueWeight="700"
          />
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {t('kakeibo.summary.percentOfIncome', { percent: percentOfIncome })}
          </Text>
        </View>
      ) : (
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {t('kakeibo.summary.noIncomeContext')}
        </Text>
      )}
    </View>
  );
}

function Row({
  label,
  value,
  color,
  valueWeight,
}: {
  label: string;
  value: string;
  color: string;
  valueWeight?: '400' | '600' | '700';
}) {
  const { typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[typography.callout, { color }]}>{label}</Text>
      <Text style={[typography.callout, { color, fontWeight: valueWeight ?? '600' }]}>{value}</Text>
    </View>
  );
}

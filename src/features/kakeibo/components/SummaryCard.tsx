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
  const surplusColor =
    surplus !== undefined ? (surplus >= 0 ? colors.success : colors.danger) : colors.textSecondary;

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
      {totalIncome !== undefined && surplus !== undefined ? (
        <Text style={[typography.callout, { color: surplusColor, fontWeight: '600', marginTop: spacing.xs }]}>
          {surplus >= 0
            ? t('kakeibo.summary.surplus', { amount: formatCurrency(surplus) })
            : t('kakeibo.summary.deficit', { amount: formatCurrency(Math.abs(surplus)) })}
        </Text>
      ) : (
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {t('kakeibo.summary.noIncomeContext')}
        </Text>
      )}
    </View>
  );
}

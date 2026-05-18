import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme';

interface Props {
  totalCount: number;
  highestTakeHome: number;
  averageTakeHome: number;
  totalTaxEstimated: number;
}

export function StatsCard({ totalCount, highestTakeHome, averageTakeHome, totalTaxEstimated }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, radius, isDark } = useTheme();

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        ...(isDark
          ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
          : {}),
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Cell
          icon="calendar-number-outline"
          label={t('history.stats.totalCount')}
          value={String(totalCount)}
          tint={colors.brand}
        />
        <Cell
          icon="trending-up-outline"
          label={t('history.stats.highest')}
          value={formatCurrency(highestTakeHome)}
          tint={colors.success}
        />
        <Cell
          icon="analytics-outline"
          label={t('history.stats.average')}
          value={formatCurrency(averageTakeHome)}
          tint={colors.accent}
        />
        <Cell
          icon="receipt-outline"
          label={t('history.stats.tax')}
          value={formatCurrency(totalTaxEstimated)}
          tint={colors.warning}
        />
      </View>
    </View>
  );
}

interface CellProps {
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  label: string;
  value: string;
  tint: string;
}

function Cell({ icon, label, value, tint }: CellProps) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ width: '50%', padding: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: 2 }}>
        <Ionicons name={icon} size={14} color={tint} />
        <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text
        style={[typography.headline, { color: colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

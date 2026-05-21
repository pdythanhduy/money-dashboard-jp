import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, useWindowDimensions, View } from 'react-native';

import { useHistoryStats } from '@/features/history/hooks/useHistoryStats';
import { TrendChart } from '@/features/history/components/TrendChart';
import { useTheme } from '@/theme';

/**
 * Dashboard widget that reuses History's `TrendChart` SVG once the user
 * has ≥ 2 entries. Below that we just nudge them with a one-liner — the
 * full History tab handles its own empty state.
 */
export function MonthlyTrendChart() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const stats = useHistoryStats('all');

  const cardPadding = spacing.lg;
  const screenMargin = spacing.lg;
  // SVG width = window − card horizontal margins − card internal padding both sides.
  const chartWidth = Math.max(200, windowWidth - screenMargin * 2 - cardPadding * 2);
  const chartHeight = 140;

  return (
    <View
      style={{
        marginHorizontal: screenMargin,
        marginTop: spacing.lg,
        padding: cardPadding,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        ...(isDark
          ? {
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }
          : {}),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="trending-up-outline" size={18} color={colors.brand} />
        <Text style={[typography.headline, { color: colors.text }]}>
          {t('dashboard.trend.title')}
        </Text>
      </View>
      <View style={{ marginTop: spacing.sm }}>
        {stats.trendData.length < 2 ? (
          <View style={{ height: 80, alignItems: 'center', justifyContent: 'center' }}>
            <Text
              style={[
                typography.footnote,
                { color: colors.textSecondary, textAlign: 'center', opacity: 0.85 },
              ]}
            >
              {t('dashboard.trend.needsTwoPoints')}
            </Text>
          </View>
        ) : (
          <TrendChart data={stats.trendData} width={chartWidth} height={chartHeight} />
        )}
      </View>
    </View>
  );
}

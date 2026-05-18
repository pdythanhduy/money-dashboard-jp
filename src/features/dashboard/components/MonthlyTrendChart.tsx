import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';

/**
 * Phase 5C: stub card. Real chart in a later phase once we wire the
 * history SQLite table.
 */
export function MonthlyTrendChart() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.lg,
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
      <View
        style={{
          height: 80,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: spacing.sm,
        }}
      >
        <Text
          style={[
            typography.footnote,
            { color: colors.textSecondary, textAlign: 'center', opacity: 0.7 },
          ]}
        >
          {t('dashboard.trend.placeholder')}
        </Text>
      </View>
    </View>
  );
}

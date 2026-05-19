import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { formatCurrency, formatPercent } from '@/lib/format';
import { useTheme } from '@/theme';

interface QuickStatsRowProps {
  proportionalTax: number;
  proportionalInsurance: number;
  retentionRate: number;
  onPressTax?: () => void;
}

export function QuickStatsRow({
  proportionalTax,
  proportionalInsurance,
  retentionRate,
  onPressTax,
}: QuickStatsRowProps) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const keptOutOf100 = Math.round(retentionRate * 100);

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: spacing.sm,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
      }}
    >
      <StatCard
        icon="receipt-outline"
        tint={colors.warning}
        label={t('dashboard.quickStats.tax')}
        value={formatCurrency(proportionalTax)}
        onPress={onPressTax}
      />
      <StatCard
        icon="shield-outline"
        tint={colors.brand}
        label={t('dashboard.quickStats.insurance')}
        value={formatCurrency(proportionalInsurance)}
      />
      <StatCard
        icon="pie-chart-outline"
        tint={colors.success}
        label={t('dashboard.quickStats.retention')}
        value={formatPercent(retentionRate)}
        sub={t('dashboard.quickStats.retentionSub', { kept: keptOutOf100 })}
      />
    </View>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
}

function StatCard({ icon, tint, label, value, sub, onPress }: StatCardProps) {
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const inner = (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
        padding: spacing.md,
        minHeight: 100,
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
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: tint + '22',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.xs,
        }}
      >
        <Ionicons name={icon} size={16} color={tint} />
      </View>
      <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[typography.headline, { color: colors.text, marginTop: 2 }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
      {sub ? (
        <Text
          style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}
          numberOfLines={2}
        >
          {sub}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        onPress={onPress}
        style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}
      >
        {inner}
      </Pressable>
    );
  }
  return inner;
}

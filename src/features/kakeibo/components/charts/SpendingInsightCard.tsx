import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import type { SpendingInsight } from '@/lib/kakeibo-charts';
import { useTheme } from '@/theme';

interface Props {
  insights: readonly SpendingInsight[];
}

function severityIcon(s: SpendingInsight['severity']): keyof typeof import('@expo/vector-icons').Ionicons.glyphMap {
  switch (s) {
    case 'success':
      return 'checkmark-circle-outline';
    case 'warning':
      return 'warning-outline';
    case 'danger':
      return 'alert-circle-outline';
    default:
      return 'information-circle-outline';
  }
}

export function SpendingInsightCard({ insights }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  if (insights.length === 0) return null;

  return (
    <View
      style={{
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        gap: spacing.sm,
      }}
    >
      <Text style={[typography.headline, { color: colors.text }]}>
        {t('kakeibo.insights.title')}
      </Text>
      {insights.map((ins, idx) => {
        const color =
          ins.severity === 'danger'
            ? colors.danger
            : ins.severity === 'warning'
              ? colors.warning
              : ins.severity === 'success'
                ? colors.success
                : colors.brand;
        // Interpolate `category` value through i18n if the rule passed a key,
        // and format monetary fields via `formatCurrency`.
        const interpolatedValues: Record<string, string | number> = {};
        for (const [k, v] of Object.entries(ins.values)) {
          if (k === 'category' && typeof v === 'string') {
            interpolatedValues[k] = t(v);
          } else if (typeof v === 'number' && k !== 'percent') {
            interpolatedValues[k] = formatCurrency(v);
          } else {
            interpolatedValues[k] = v;
          }
        }
        return (
          <View key={`${ins.type}-${idx}`} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <Ionicons name={severityIcon(ins.severity)} size={20} color={color} />
            <View style={{ flex: 1 }}>
              <Text style={[typography.callout, { color: colors.text, fontWeight: '700' }]}>
                {t(ins.titleKey)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {t(ins.bodyKey, interpolatedValues)}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

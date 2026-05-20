import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import { formatCurrency } from '@/lib/format';
import type { CategoryTotals } from '@/lib/kakeibo-math';
import { useTheme } from '@/theme';

interface Props {
  byCategory: CategoryTotals[];
  /** Cap the visible rows; remainder is grouped under "other-rest". */
  topN?: number;
}

export function CategoryBreakdownBar({ byCategory, topN = 5 }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  if (byCategory.length === 0) return null;

  const top = byCategory.slice(0, topN);
  const rest = byCategory.slice(topN);
  const restTotal = rest.reduce((sum, c) => sum + c.total, 0);
  const restPercent = rest.reduce((sum, c) => sum + c.percentOfMonth, 0);

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
      {top.map((c) => (
        <View key={c.category} style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name={CATEGORY_ICONS[c.category]} size={16} color={colors.brand} />
            <Text style={[typography.callout, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {t(`kakeibo.categories.${c.category}`)}
            </Text>
            <Text style={[typography.callout, { color: colors.text, fontWeight: '600' }]}>
              {formatCurrency(c.total)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, width: 44, textAlign: 'right' }]}>
              {Math.round(c.percentOfMonth * 100)}%
            </Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
            <View
              style={{
                width: `${Math.max(0, Math.min(1, c.percentOfMonth)) * 100}%`,
                height: '100%',
                backgroundColor: colors.brand,
              }}
            />
          </View>
        </View>
      ))}
      {rest.length > 0 ? (
        <View style={{ gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
            <Text style={[typography.callout, { color: colors.textSecondary, flex: 1 }]}>
              +{rest.length}
            </Text>
            <Text style={[typography.callout, { color: colors.textSecondary, fontWeight: '600' }]}>
              {formatCurrency(restTotal)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, width: 44, textAlign: 'right' }]}>
              {Math.round(restPercent * 100)}%
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import type { ProviderComparison } from '@/lib/remittance-math';
import { useTheme } from '@/theme';

interface Props {
  comparisons: ProviderComparison[];
}

function formatRate(r: number): string {
  return Number.isFinite(r) && r > 0 ? r.toFixed(2) : '—';
}

export function ProviderComparisonCard({ comparisons }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  if (comparisons.length === 0) return null;

  // Normalize bar widths to the top provider's effective rate.
  const max = comparisons[0]?.effectiveRate ?? 0;

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
      <Text style={[typography.headline, { color: colors.text }]}>
        {t('remittance.providersCompare.title')}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('remittance.providersCompare.sortedNote')}
      </Text>
      {comparisons.map((c, idx) => {
        const widthPct = max > 0 ? (c.effectiveRate / max) * 100 : 0;
        const isTop = idx === 0;
        return (
          <View key={c.provider} style={{ gap: 4, marginTop: spacing.xs }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text
                style={[
                  typography.callout,
                  { color: isTop ? colors.brand : colors.text, fontWeight: isTop ? '700' : '600', flex: 1 },
                ]}
                numberOfLines={1}
              >
                {isTop ? '★ ' : ''}
                {t(`remittance.providers.${c.provider}`)}
              </Text>
              <Text style={[typography.caption, { color: isTop ? colors.brand : colors.textSecondary, fontWeight: '700' }]}>
                {formatRate(c.effectiveRate)}
              </Text>
            </View>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden' }}>
              <View style={{ width: `${Math.max(5, Math.min(100, widthPct))}%`, height: '100%', backgroundColor: isTop ? colors.brand : colors.borderStrong }} />
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t('remittance.providersCompare.avgRateLabel')} {formatRate(c.avgRate)} ·{' '}
              {t('remittance.providersCompare.avgFeeLabel')} {formatCurrency(Math.round(c.avgFee))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

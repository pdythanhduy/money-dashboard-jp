import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme';

interface Props {
  total: number;
  threshold: number;
  deductible: number;
  refund: number;
}

export function SummaryCard({ total, threshold, deductible, refund }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const progress = threshold > 0 ? Math.min(1, total / threshold) : 0;
  const aboveThreshold = total >= threshold;

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.lg,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        gap: spacing.sm,
        ...(isDark
          ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
          : {}),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Text style={[typography.headline, { color: colors.text }]}>
          {t('medical.summary.total')}
        </Text>
        <Text style={[typography.title2, { color: colors.brand, fontWeight: '800' }]}>
          {formatCurrency(total)}
        </Text>
      </View>

      <View
        style={{
          height: 8,
          borderRadius: 4,
          backgroundColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            backgroundColor: aboveThreshold ? colors.success : colors.accent,
          }}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons
          name={aboveThreshold ? 'checkmark-circle' : 'flag-outline'}
          size={14}
          color={aboveThreshold ? colors.success : colors.textSecondary}
        />
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('medical.summary.progressLabel', {
            current: formatCurrency(total),
            threshold: formatCurrency(threshold),
          })}
        </Text>
      </View>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.xs }} />

      <Row label={t('medical.summary.threshold')} value={formatCurrency(threshold)} />
      <Row label={t('medical.summary.deductible')} value={formatCurrency(deductible)} accent />
      <Row label={t('medical.summary.taxRefund')} value={formatCurrency(refund)} accent />
    </View>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[typography.footnote, { color: colors.textSecondary }]}>{label}</Text>
      <Text
        style={[
          typography.footnote,
          { color: accent ? colors.brand : colors.text, fontWeight: '600' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

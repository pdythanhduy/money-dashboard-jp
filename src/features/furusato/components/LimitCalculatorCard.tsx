import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatCurrency, formatPercent } from '@/lib/format';
import type { FurusatoLimitResult } from '@/lib/furusato-calculator';
import { useTheme } from '@/theme';

interface Props {
  limit: FurusatoLimitResult;
  residentTaxableIncome: number;
  incomeTaxMarginalRate: number;
  totalDonated: number;
  remainingCapacity: number;
  fromCalculator: boolean;
}

export function LimitCalculatorCard({
  limit,
  residentTaxableIncome,
  incomeTaxMarginalRate,
  totalDonated,
  remainingCapacity,
  fromCalculator,
}: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const progress = limit.maxDonation > 0 ? Math.min(1, totalDonated / limit.maxDonation) : 0;

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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons
          name={fromCalculator ? 'flash' : 'create-outline'}
          size={14}
          color={colors.textSecondary}
        />
        <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
          {fromCalculator
            ? t('furusato.calculator.useCalculatorResult')
            : t('furusato.calculator.manualInput')}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Text style={[typography.headline, { color: colors.text }]}>
          {t('furusato.calculator.maxDonationLabel')}
        </Text>
        <Text style={[typography.title1, { color: colors.brand, fontWeight: '800' }]}>
          {formatCurrency(limit.maxDonation)}
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
            backgroundColor: progress >= 1 ? colors.danger : colors.accent,
          }}
        />
      </View>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('furusato.history.sumLabel', { total: formatCurrency(totalDonated) })} ·{' '}
        {t('furusato.history.remainingLabel', { remaining: formatCurrency(remainingCapacity) })}
      </Text>

      <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.xs }} />

      <Row label={t('furusato.calculator.taxableIncome')} value={formatCurrency(residentTaxableIncome)} />
      <Row label={t('furusato.calculator.marginalRate')} value={formatPercent(incomeTaxMarginalRate)} />
      <Row label={t('furusato.calculator.breakdown.incomeTax')} value={formatCurrency(limit.incomeTaxReduction)} />
      <Row label={t('furusato.calculator.breakdown.residentBasic')} value={formatCurrency(limit.residentTaxBasicReduction)} />
      <Row label={t('furusato.calculator.breakdown.residentSpecial')} value={formatCurrency(limit.residentTaxSpecialReduction)} />
      <Row label={t('furusato.calculator.breakdown.selfBurden')} value={formatCurrency(limit.selfBurden)} accent />

      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.sm, opacity: 0.8 }]}>
        {t('furusato.calculator.disclaimer')}
      </Text>
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
          { color: accent ? colors.warning : colors.text, fontWeight: '600' },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

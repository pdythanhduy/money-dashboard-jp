import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Share, Text, View } from 'react-native';

import { DeductionRow } from '@/features/kakutei/components/DeductionRow';
import { useKakuteiData } from '@/features/kakutei/hooks/useKakuteiData';
import { formatCurrency } from '@/lib/format';
import type { KakuteiSummary } from '@/lib/kakutei-shinkoku';
import { useKakuteiStore } from '@/store/kakuteiStore';
import { useTheme } from '@/theme';

function summaryToJson(s: KakuteiSummary): string {
  return JSON.stringify(s, null, 2);
}

function summaryToCsv(s: KakuteiSummary, deductionLabel: (key: string) => string): string {
  const lines: string[] = [];
  lines.push('section,key,amount_jpy');
  lines.push(`income,gross,${s.grossIncome}`);
  lines.push(`income,employment,${s.employmentIncomeAmount}`);
  for (const d of s.deductions) {
    lines.push(`deduction,${d.key},${d.amount}`);
  }
  lines.push(`totals,total_deductions,${s.totalDeductions}`);
  lines.push(`totals,taxable_income,${s.taxableIncome}`);
  lines.push(`totals,estimated_income_tax,${s.estimatedIncomeTax}`);
  lines.push(`totals,withheld_tax,${s.withheldTax}`);
  lines.push(`totals,refund_or_due,${s.refundOrDue}`);
  lines.push(`totals,resident_tax_next_year,${s.residentTaxImpact}`);
  // Labels for human readers in the trailing block.
  lines.push('label,key,label');
  for (const d of s.deductions) {
    lines.push(`label,${d.key},"${deductionLabel(d.key).replace(/"/g, '""')}"`);
  }
  return lines.join('\n');
}

export function SummaryStep() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const data = useKakuteiData();
  const saveSummary = useKakuteiStore((s) => s.saveSummary);

  const s = data.summary;
  const refundAmt = Math.abs(s.refundOrDue);

  const handleExportJson = useCallback(async () => {
    try {
      await Share.share({
        title: t('kakutei.export.jsonTitle', { year: s.fiscalYear }),
        message: summaryToJson(s),
      });
    } catch {
      Alert.alert(t('kakutei.export.error'));
    }
  }, [s, t]);

  const handleExportCsv = useCallback(async () => {
    try {
      await Share.share({
        title: t('kakutei.export.csvTitle', { year: s.fiscalYear }),
        message: summaryToCsv(s, (key) => t(`kakutei.deductions.${key}`)),
      });
    } catch {
      Alert.alert(t('kakutei.export.error'));
    }
  }, [s, t]);

  const handleSave = useCallback(() => {
    saveSummary(s);
    Alert.alert(t('kakutei.save.success'));
  }, [s, t, saveSummary]);

  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <Text style={[typography.title3, { color: colors.text, fontWeight: '700' }]}>
        {t('kakutei.steps.5.title')}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary }]}>{t('kakutei.steps.5.body')}</Text>

      <View
        style={{
          padding: spacing.lg,
          borderRadius: radius.md,
          backgroundColor: s.isRefund ? colors.brandSubtle : colors.surfaceElevated,
          borderWidth: s.isRefund ? 1 : 0,
          borderColor: colors.success,
          alignItems: 'center',
          gap: spacing.xs,
        }}
      >
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {s.isRefund ? t('kakutei.summary.refund') : t('kakutei.summary.due')}
        </Text>
        <Text
          style={[
            typography.largeTitle,
            { color: s.isRefund ? colors.success : colors.danger, fontWeight: '800' },
          ]}
        >
          {s.isRefund ? `+${formatCurrency(refundAmt)}` : formatCurrency(refundAmt)}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('kakutei.summary.year', { year: s.fiscalYear })}
        </Text>
      </View>

      <View style={{ padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceElevated, gap: 2 }}>
        <KV label={t('kakutei.summary.gross')} value={formatCurrency(s.grossIncome)} />
        <KV label={t('kakutei.summary.employmentIncome')} value={formatCurrency(s.employmentIncomeAmount)} />
        <Divider />
        <Text style={[typography.caption, { color: colors.textSecondary, marginVertical: spacing.xs }]}>
          {t('kakutei.summary.deductionsTitle')}
        </Text>
        {s.deductions.map((line) => (
          <DeductionRow key={line.key} line={line} />
        ))}
        <Divider />
        <KV label={t('kakutei.summary.totalDeductions')} value={formatCurrency(s.totalDeductions)} bold />
        <KV label={t('kakutei.summary.taxableIncome')} value={formatCurrency(s.taxableIncome)} bold />
        <KV label={t('kakutei.summary.estimatedTax')} value={formatCurrency(s.estimatedIncomeTax)} />
        <KV label={t('kakutei.summary.withheldTax')} value={formatCurrency(s.withheldTax)} />
        <Divider />
        <KV
          label={t('kakutei.summary.residentTaxNextYear')}
          value={formatCurrency(s.residentTaxImpact)}
        />
      </View>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <ExportBtn label={t('kakutei.export.json')} icon="code-slash-outline" onPress={handleExportJson} />
        <ExportBtn label={t('kakutei.export.csv')} icon="grid-outline" onPress={handleExportCsv} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('kakutei.save.button')}
        onPress={handleSave}
        style={({ pressed }) => ({
          minHeight: 50,
          borderRadius: radius.sm,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={[typography.callout, { color: colors.textInverse, fontWeight: '600' }]}>
          {t('kakutei.save.button')}
        </Text>
      </Pressable>

      <Text
        style={[
          typography.caption,
          { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
        ]}
      >
        {t('kakutei.disclaimer')}
      </Text>
    </View>
  );
}

function KV({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
      <Text style={[typography.body, { color: colors.text, fontWeight: bold ? '700' : '400' }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.text, fontWeight: bold ? '800' : '600' }]}>{value}</Text>
    </View>
  );
}

function Divider() {
  const { colors, spacing } = useTheme();
  return <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.xs }} />;
}

function ExportBtn({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  onPress: () => void;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 50,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.brand,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing.xs,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name={icon} size={16} color={colors.brand} />
      <Text style={[typography.callout, { color: colors.brand, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

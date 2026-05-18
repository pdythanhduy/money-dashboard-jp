import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { calculateHealthInsurance } from '@/lib/tax-calculator';
import { useTheme } from '@/theme';
import type { SalaryInput, TakeHomeResult } from '@/types/tax';
import { formatCurrency } from '@/features/calculator/hooks/useCalculator';

interface BreakdownListProps {
  result: TakeHomeResult;
  input: SalaryInput | null;
}

interface BreakdownItem {
  label: string;
  value: number;
  info: string;
  subItem?: boolean;
}

export function BreakdownList({ result, input }: BreakdownListProps) {
  const { t } = useTranslation();
  const { colors, spacing, radius } = useTheme();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const careInsurance = useMemo(() => calculateCareInsurance(input), [input]);
  const healthTotal =
    result.nationalHealthInsurance > 0 ? result.nationalHealthInsurance : result.healthInsurance;
  const healthBase = Math.max(0, healthTotal - careInsurance);
  const pensionTotal = result.nationalPension > 0 ? result.nationalPension : result.pension;
  const usesNationalPension = result.nationalPension > 0 || input?.pensionType === 'national';

  const taxItems: BreakdownItem[] = [
    {
      label: t('calculator.breakdown.items.incomeTax'),
      value: result.incomeTax,
      info: t('calculator.breakdown.info.incomeTax'),
    },
    {
      label: t('calculator.breakdown.items.reconstructionSurtax'),
      value: result.breakdown.reconstructionSurtax,
      info: t('calculator.breakdown.info.reconstructionSurtax'),
      subItem: true,
    },
    {
      label: t('calculator.breakdown.items.residentTax'),
      value: result.residentTax,
      info: t('calculator.breakdown.info.residentTax'),
    },
  ];

  const insuranceItems: BreakdownItem[] = [
    {
      label:
        result.nationalHealthInsurance > 0
          ? t('calculator.breakdown.items.nationalHealthInsurance')
          : t('calculator.breakdown.items.healthInsurance'),
      value: healthBase,
      info: t('calculator.breakdown.info.healthInsurance'),
    },
    {
      label:
        usesNationalPension
          ? t('calculator.breakdown.items.nationalPension')
          : t('calculator.breakdown.items.pension'),
      value: pensionTotal,
      info: t('calculator.breakdown.info.pension'),
    },
  ];

  if (result.employmentInsurance > 0) {
    insuranceItems.push({
      label: t('calculator.breakdown.items.employmentInsurance'),
      value: result.employmentInsurance,
      info: t('calculator.breakdown.info.employmentInsurance'),
    });
  }

  if (careInsurance > 0) {
    insuranceItems.push({
      label: t('calculator.breakdown.items.longTermCare'),
      value: careInsurance,
      info: t('calculator.breakdown.info.longTermCare'),
    });
  }

  const detailItems: BreakdownItem[] = [
    {
      label: t('calculator.breakdown.items.employmentIncomeDeduction'),
      value: result.breakdown.employmentIncomeDeduction,
      info: t('calculator.breakdown.info.employmentIncomeDeduction'),
    },
    {
      label: t('calculator.breakdown.items.basicDeductionNational'),
      value: result.breakdown.basicDeductionNationalTax,
      info: t('calculator.breakdown.info.basicDeductionNational'),
    },
    {
      label: t('calculator.breakdown.items.basicDeductionResident'),
      value: result.breakdown.basicDeductionResidentTax,
      info: t('calculator.breakdown.info.basicDeductionResident'),
    },
    {
      label: t('calculator.breakdown.items.taxableNational'),
      value: result.breakdown.taxableIncomeForNationalTax,
      info: t('calculator.breakdown.info.taxableNational'),
    },
    {
      label: t('calculator.breakdown.items.taxableResident'),
      value: result.breakdown.taxableIncomeForResidentTax,
      info: t('calculator.breakdown.info.taxableResident'),
    },
    {
      label: t('calculator.breakdown.items.standardMonthlyRemuneration'),
      value: result.breakdown.standardMonthlyRemuneration ?? 0,
      info: t('calculator.breakdown.info.standardMonthlyRemuneration'),
    },
  ];

  return (
    <View style={{ gap: spacing.md }}>
      <BreakdownGroup title={t('calculator.breakdown.groups.tax')} items={taxItems} />
      <BreakdownGroup title={t('calculator.breakdown.groups.insurance')} items={insuranceItems} />
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => setDetailsOpen((value) => !value)}
          style={{
            minHeight: 56,
            paddingHorizontal: spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <GroupTitle title={t('calculator.breakdown.groups.details')} />
          <Ionicons
            name={detailsOpen ? 'chevron-up' : 'chevron-down'}
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
        {detailsOpen ? <BreakdownRows items={detailItems} /> : null}
      </View>
    </View>
  );
}

function BreakdownGroup({ title, items }: { title: string; items: BreakdownItem[] }) {
  const { colors, spacing, radius } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ minHeight: 52, paddingHorizontal: spacing.md, justifyContent: 'center' }}>
        <GroupTitle title={title} />
      </View>
      <BreakdownRows items={items} />
    </View>
  );
}

function GroupTitle({ title }: { title: string }) {
  const { colors, typography } = useTheme();
  return <Text style={[typography.headline, { color: colors.text }]}>{title}</Text>;
}

function BreakdownRows({ items }: { items: BreakdownItem[] }) {
  const { colors } = useTheme();
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
      {items.map((item) => (
        <BreakdownRow key={item.label} item={item} />
      ))}
    </View>
  );
}

function BreakdownRow({ item }: { item: BreakdownItem }) {
  const { colors, typography, spacing } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <View
      style={{
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        paddingLeft: item.subItem ? spacing.xl : spacing.md,
      }}
    >
      <View style={{ minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Text style={[item.subItem ? typography.footnote : typography.body, { color: colors.text, flex: 1 }]}>
            {item.label}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen((value) => !value)}
            style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
        <Text style={[item.subItem ? typography.footnote : typography.body, { color: colors.text }]}>
          {formatCurrency(item.value)}
        </Text>
      </View>
      {open ? (
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          {item.info}
        </Text>
      ) : null}
    </View>
  );
}

function calculateCareInsurance(input: SalaryInput | null): number {
  if (!input || input.age < 40 || input.age > 64) return 0;
  try {
    const withCare = calculateHealthInsurance(input);
    const withoutCare = calculateHealthInsurance({ ...input, age: 39 });
    return Math.max(0, withCare - withoutCare);
  } catch {
    return 0;
  }
}

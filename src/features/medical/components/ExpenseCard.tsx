import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { netExpense, type MedicalExpense, type MedicalCategory } from '@/lib/medical-deduction';
import { useTheme } from '@/theme';

interface Props {
  expense: MedicalExpense;
  onPress: (e: MedicalExpense) => void;
}

const ICON_BY_CATEGORY: Record<MedicalCategory, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  doctor_visit: 'medkit-outline',
  hospitalization: 'bed-outline',
  pharmacy: 'flask-outline',
  dental: 'happy-outline',
  optical: 'eye-outline',
  maternity: 'happy-outline',
  transportation: 'car-outline',
  other: 'document-outline',
};

function ExpenseCardImpl({ expense, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const icon = ICON_BY_CATEGORY[expense.category];
  const net = netExpense(expense);
  const reimbursed = (expense.reimbursedAmount ?? 0) > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatExpiry(expense.date)} · ${t(`medical.categories.${expense.category}`)} · ${formatCurrency(net)}`}
      onPress={() => onPress(expense)}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        opacity: pressed ? 0.85 : 1,
        ...(isDark
          ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
          : {}),
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: colors.brandSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
          {expense.provider?.trim() || t(`medical.categories.${expense.category}`)}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
          {formatExpiry(expense.date)} · {t(`medical.categories.${expense.category}`)}
          {reimbursed ? ` · ↩ ${formatCurrency(expense.reimbursedAmount ?? 0)}` : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[typography.body, { color: colors.brand, fontWeight: '700' }]}>
          {formatCurrency(net)}
        </Text>
        {expense.receiptImageUri ? (
          <Ionicons name="image-outline" size={14} color={colors.textSecondary} />
        ) : null}
      </View>
    </Pressable>
  );
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export const ExpenseCard = memo(ExpenseCardImpl);

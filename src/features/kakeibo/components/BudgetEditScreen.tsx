import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import {
  ALL_EXPENSE_CATEGORIES,
  suggestBudgetsFromIncome,
  type BudgetTarget,
  type ExpenseCategory,
} from '@/lib/kakeibo-math';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function parseYen(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function BudgetEditScreen({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const budgets = useKakeiboStore((s) => s.budgets);
  const setBudgets = useKakeiboStore((s) => s.setBudgets);
  const takeHomeMonthly = useCalculatorStore((s) => s.lastResult?.takeHomeMonthly);

  // Draft = string-per-category map, so empty inputs naturally map to 0.
  const [draft, setDraft] = useState<Record<ExpenseCategory, string>>(() =>
    Object.fromEntries(ALL_EXPENSE_CATEGORIES.map((c) => [c, ''])) as Record<ExpenseCategory, string>,
  );

  useEffect(() => {
    if (!visible) return;
    const next = Object.fromEntries(
      ALL_EXPENSE_CATEGORIES.map((c) => {
        const existing = budgets.find((b) => b.category === c);
        return [c, existing ? String(existing.monthlyLimit) : ''];
      }),
    ) as Record<ExpenseCategory, string>;
    setDraft(next);
  }, [visible, budgets]);

  const handleAutoSuggest = () => {
    if (!takeHomeMonthly || takeHomeMonthly <= 0) return;
    const suggested = suggestBudgetsFromIncome(takeHomeMonthly);
    const next = Object.fromEntries(
      ALL_EXPENSE_CATEGORIES.map((c) => {
        const s = suggested.find((b) => b.category === c);
        return [c, s ? String(s.monthlyLimit) : ''];
      }),
    ) as Record<ExpenseCategory, string>;
    setDraft(next);
  };

  const handleSave = () => {
    const next: BudgetTarget[] = ALL_EXPENSE_CATEGORIES.map((category) => ({
      category,
      monthlyLimit: parseYen(draft[category] ?? ''),
    }));
    setBudgets(next);
    // Lightweight confirmation: the Overview tab will surface the new
    // budgets immediately, but a toast removes the "did anything happen?"
    // moment after pressing Save.
    Alert.alert(t('kakeibo.budget.saveSuccess'));
    onClose();
  };

  const canAutoSuggest = Boolean(takeHomeMonthly && takeHomeMonthly > 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.sm,
              paddingBottom: spacing.md,
            }}
          >
            <Text style={[typography.title3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {t('kakeibo.budget.title')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t('kakeibo.budget.subtitle')}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('kakeibo.budget.autoSuggest')}
              accessibilityState={{ disabled: !canAutoSuggest }}
              disabled={!canAutoSuggest}
              onPress={handleAutoSuggest}
              style={({ pressed }) => ({
                padding: spacing.md,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: canAutoSuggest ? colors.brand : colors.border,
                backgroundColor: canAutoSuggest ? colors.brandSubtle : colors.surface,
                opacity: pressed && canAutoSuggest ? 0.85 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              })}
            >
              <Ionicons name="sparkles-outline" size={18} color={canAutoSuggest ? colors.brand : colors.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    typography.callout,
                    { color: canAutoSuggest ? colors.brand : colors.textSecondary, fontWeight: '600' },
                  ]}
                >
                  {t('kakeibo.budget.autoSuggest')}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                  {canAutoSuggest ? t('kakeibo.budget.autoSuggestHint') : t('kakeibo.budget.noIncomeYet')}
                </Text>
              </View>
            </Pressable>

            {ALL_EXPENSE_CATEGORIES.map((c) => (
              <View key={c} style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Ionicons name={CATEGORY_ICONS[c]} size={16} color={colors.brand} />
                  <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
                    {t(`kakeibo.categories.${c}`)}
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.xs,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.md,
                    backgroundColor: colors.surface,
                  }}
                >
                  <Text style={[typography.body, { color: colors.textSecondary }]}>¥</Text>
                  <TextInput
                    value={(draft[c] ?? '').replace(/[^\d]/g, '')}
                    onChangeText={(v) => setDraft((d) => ({ ...d, [c]: v.replace(/[^\d]/g, '') }))}
                    placeholder={t('kakeibo.budget.remove')}
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    inputMode="numeric"
                    style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.body }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('kakeibo.budget.save')}
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
                {t('kakeibo.budget.save')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

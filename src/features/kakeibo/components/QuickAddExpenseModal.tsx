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
import { formatCurrency } from '@/lib/format';
import { ALL_EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/kakeibo-math';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const QUICK_AMOUNTS = [500, 1_000, 3_000, 5_000, 10_000] as const;

function parseYen(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function QuickAddExpenseModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addEntry = useKakeiboStore((s) => s.addEntry);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setNote('');
    setCategory('food');
  }, [visible]);

  const amountValue = parseYen(amount);
  const canSave = amountValue > 0;

  const handleSave = () => {
    if (!canSave) return;
    const result = addEntry({
      date: todayIso(),
      amount: amountValue,
      category,
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    if (!result.added && result.reason === 'limit_reached') {
      Alert.alert(t('kakeibo.list.limitReached', { max: 5000 }));
      return;
    }
    onClose();
  };

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
            <View style={{ flex: 1 }}>
              <Text style={[typography.title3, { color: colors.text }]} numberOfLines={1}>
                {t('kakeibo.quickAdd.title')}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {t('kakeibo.quickAdd.todayDate')}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>{t('kakeibo.fields.amount')}</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  borderWidth: 1,
                  borderColor: canSave ? colors.border : colors.danger,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={[typography.title3, { color: colors.textSecondary }]}>¥</Text>
                <TextInput
                  value={amount.replace(/[^\d]/g, '')}
                  onChangeText={(v) => setAmount(v.replace(/[^\d]/g, ''))}
                  placeholder="500"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                  autoFocus
                />
              </View>
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {t('kakeibo.quickAdd.recentAmounts')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {QUICK_AMOUNTS.map((amt) => (
                  <Pressable
                    key={amt}
                    accessibilityRole="button"
                    accessibilityLabel={formatCurrency(amt)}
                    onPress={() => setAmount(String(amt))}
                    style={({ pressed }) => ({
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text style={[typography.callout, { color: colors.text }]}>
                      ¥{amt >= 1000 ? `${amt / 1000}K` : amt}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>{t('kakeibo.fields.category')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {ALL_EXPENSE_CATEGORIES.map((c) => {
                  const selected = category === c;
                  return (
                    <Pressable
                      key={c}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={t(`kakeibo.categories.${c}`)}
                      onPress={() => setCategory(c)}
                      style={({ pressed }) => ({
                        width: 72,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.md,
                        borderWidth: 1,
                        borderColor: selected ? colors.brand : colors.border,
                        backgroundColor: selected ? colors.brandSubtle : colors.surface,
                        alignItems: 'center',
                        gap: 2,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Ionicons name={CATEGORY_ICONS[c]} size={22} color={selected ? colors.brand : colors.text} />
                      <Text
                        style={[
                          typography.caption,
                          { color: selected ? colors.brand : colors.textSecondary, fontWeight: selected ? '700' : '400' },
                        ]}
                        numberOfLines={1}
                      >
                        {t(`kakeibo.categories.${c}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>{t('kakeibo.fields.note')}</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t('kakeibo.fields.notePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={{
                  minHeight: 50,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  ...typography.body,
                }}
              />
            </View>
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
              accessibilityLabel={t('kakeibo.actions.save')}
              accessibilityState={{ disabled: !canSave }}
              disabled={!canSave}
              onPress={handleSave}
              style={({ pressed }) => ({
                minHeight: 50,
                borderRadius: radius.sm,
                backgroundColor: canSave ? colors.brand : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={[
                  typography.callout,
                  { color: canSave ? colors.textInverse : colors.textSecondary, fontWeight: '600' },
                ]}
              >
                {t('kakeibo.actions.save')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

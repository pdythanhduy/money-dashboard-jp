import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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

import { isoFromYMD } from '@/features/documents/date-utils';
import { useGoalsStore } from '@/store/goalsStore';
import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  /**
   * ID-based lookup so the contribution history list re-renders after
   * each addSavings without re-mounting the modal.
   */
  goalId: string | null;
  onClose: () => void;
}

const QUICK_AMOUNTS = [1_000, 5_000, 10_000, 50_000] as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function todayDraft() {
  const now = new Date();
  return { year: String(now.getFullYear()), month: String(now.getMonth() + 1), day: String(now.getDate()) };
}

function isValidDate(year: string, month: string, day: string): boolean {
  const y = Number.parseInt(year, 10);
  const m = Number.parseInt(month, 10);
  const d = Number.parseInt(day, 10);
  if (![y, m, d].every((n) => Number.isFinite(n))) return false;
  if (y < 1900 || y > 2200 || m < 1 || m > 12) return false;
  const date = new Date(y, m - 1, d);
  return date.getDate() === d && date.getMonth() === m - 1 && date.getFullYear() === y;
}

function parseYen(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function AddSavingsModal({ visible, goalId, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addSavings = useGoalsStore((s) => s.addSavings);
  const removeSavings = useGoalsStore((s) => s.removeSavings);
  const goal = useGoalsStore((s) =>
    goalId ? s.goals.find((g) => g.id === goalId) ?? null : null,
  );

  const [amountInput, setAmountInput] = useState('');
  const [note, setNote] = useState('');
  const [{ year, month, day }, setYmd] = useState(todayDraft);

  useEffect(() => {
    if (!visible) return;
    setAmountInput('');
    setNote('');
    setYmd(todayDraft());
  }, [visible]);

  const dateValid = useMemo(() => isValidDate(year, month, day), [year, month, day]);
  const amount = parseYen(amountInput);
  const canAdd = amount > 0 && dateValid;

  const handleAdd = () => {
    if (!canAdd || !goal) return;
    const iso = isoFromYMD(Number.parseInt(year, 10), Number.parseInt(month, 10), Number.parseInt(day, 10));
    addSavings(goal.id, {
      date: iso,
      amount,
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    setAmountInput('');
    setNote('');
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
                {t('goals.addSavings.title')}
              </Text>
              {goal ? (
                <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                  {goal.title}
                </Text>
              ) : null}
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
              <Text style={[typography.headline, { color: colors.text }]}>{t('goals.addSavings.amountLabel')}</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  borderWidth: 1,
                  borderColor: amount > 0 ? colors.border : colors.danger,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={[typography.title3, { color: colors.textSecondary }]}>¥</Text>
                <TextInput
                  value={amountInput.replace(/[^\d]/g, '')}
                  onChangeText={(v) => setAmountInput(v.replace(/[^\d]/g, ''))}
                  placeholder="10000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                />
              </View>
              {amount <= 0 ? (
                <Text style={[typography.caption, { color: colors.danger }]}>{t('goals.errors.amountPositive')}</Text>
              ) : null}
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('goals.addSavings.quickChips')}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {QUICK_AMOUNTS.map((amt) => (
                  <Pressable
                    key={amt}
                    accessibilityRole="button"
                    accessibilityLabel={formatCurrency(amt)}
                    onPress={() => setAmountInput(String(amt))}
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
                      +{formatCurrency(amt)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>{t('goals.addSavings.dateLabel')}</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DateNumInput label="YYYY" value={year} onChange={(v) => setYmd((p) => ({ ...p, year: v }))} maxLength={4} flex={2} />
                <DateNumInput label="MM" value={month} onChange={(v) => setYmd((p) => ({ ...p, month: v }))} maxLength={2} flex={1} />
                <DateNumInput label="DD" value={day} onChange={(v) => setYmd((p) => ({ ...p, day: v }))} maxLength={2} flex={1} />
              </View>
              {!dateValid ? (
                <Text style={[typography.caption, { color: colors.danger }]}>{t('goals.errors.dateInvalid')}</Text>
              ) : null}
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>{t('goals.addSavings.noteLabel')}</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t('goals.fields.notePlaceholder')}
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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('goals.actions.addSavings')}
              accessibilityState={{ disabled: !canAdd }}
              disabled={!canAdd}
              onPress={handleAdd}
              style={({ pressed }) => ({
                marginTop: spacing.xs,
                minHeight: 50,
                borderRadius: radius.sm,
                backgroundColor: canAdd ? colors.brand : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: canAdd ? colors.textInverse : colors.textSecondary, fontWeight: '600' }]}>
                {t('goals.actions.addSavings')}
              </Text>
            </Pressable>

            <View style={{ marginTop: spacing.lg, gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>{t('goals.addSavings.history')}</Text>
              {goal && goal.contributions.length > 0 ? (
                goal.contributions.map((c) => (
                  <View
                    key={c.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      paddingVertical: spacing.sm,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
                        +{formatCurrency(c.amount)}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
                        {formatDate(c.date)}{c.note ? ` · ${c.note}` : ''}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('goals.actions.removeSavings')}
                      onPress={() => removeSavings(goal.id, c.id)}
                      hitSlop={8}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                ))
              ) : (
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t('goals.addSavings.historyEmpty')}
                </Text>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function DateNumInput({
  label,
  value,
  onChange,
  maxLength,
  flex,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  maxLength: number;
  flex: number;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ flex, gap: 2 }}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={(v) => onChange(v.replace(/[^\d]/g, '').slice(0, maxLength))}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={maxLength}
        style={{
          minHeight: 50,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          color: colors.text,
          backgroundColor: colors.surface,
          textAlign: 'center',
          ...typography.title3,
        }}
      />
    </View>
  );
}

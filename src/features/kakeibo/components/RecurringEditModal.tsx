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
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import { ALL_EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/kakeibo-math';
import { MAX_RECURRINGS, useKakeiboStore } from '@/store/kakeiboStore';
import { useTheme } from '@/theme';
import type { RecurringExpense } from '@/types/recurring-expense';

interface Props {
  visible: boolean;
  editing: RecurringExpense | null;
  onClose: () => void;
}

interface DraftState {
  name: string;
  amountInput: string;
  category: ExpenseCategory;
  dayOfMonth: number;
  note: string;
  active: boolean;
}

function emptyDraft(): DraftState {
  return {
    name: '',
    amountInput: '',
    category: 'rent',
    dayOfMonth: 1,
    note: '',
    active: true,
  };
}

function fromRecurring(r: RecurringExpense): DraftState {
  return {
    name: r.name,
    amountInput: String(r.amount),
    category: r.category,
    dayOfMonth: r.dayOfMonth,
    note: r.note ?? '',
    active: r.active,
  };
}

function parseYen(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function RecurringEditModal({ visible, editing, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addRecurring = useKakeiboStore((s) => s.addRecurring);
  const updateRecurring = useKakeiboStore((s) => s.updateRecurring);
  const removeRecurring = useKakeiboStore((s) => s.removeRecurring);

  const [draft, setDraft] = useState<DraftState>(() => emptyDraft());

  useEffect(() => {
    if (!visible) return;
    setDraft(editing ? fromRecurring(editing) : emptyDraft());
  }, [visible, editing]);

  const amount = parseYen(draft.amountInput);
  const nameValid = draft.name.trim().length > 0;
  const amountValid = amount > 0;
  const canSave = nameValid && amountValid;

  const handleSave = () => {
    if (!canSave) return;
    const payload = {
      name: draft.name.trim(),
      amount,
      category: draft.category,
      dayOfMonth: draft.dayOfMonth,
      active: draft.active,
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    };
    if (editing) {
      updateRecurring(editing.id, payload);
    } else {
      const r = addRecurring(payload);
      if (!r.added && r.reason === 'limit_reached') {
        Alert.alert(t('kakeibo.recurring.limitReached', { max: MAX_RECURRINGS }));
        return;
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(
      t('kakeibo.actions.deleteConfirmTitle'),
      t('kakeibo.actions.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('kakeibo.actions.deleteConfirmOk'),
          style: 'destructive',
          onPress: () => {
            removeRecurring(editing.id);
            onClose();
          },
        },
      ],
    );
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
            <Text style={[typography.title3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {editing ? t('kakeibo.recurring.editTitle') : t('kakeibo.recurring.addTitle')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <Field label={t('kakeibo.recurring.nameLabel')}>
              <TextInput
                value={draft.name}
                onChangeText={(v) => setDraft((d) => ({ ...d, name: v }))}
                placeholder={t('kakeibo.recurring.namePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={{
                  minHeight: 50,
                  borderWidth: 1,
                  borderColor: nameValid ? colors.border : colors.danger,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  ...typography.body,
                }}
              />
            </Field>

            <Field label={t('kakeibo.fields.amount')}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  borderWidth: 1,
                  borderColor: amountValid ? colors.border : colors.danger,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={[typography.title3, { color: colors.textSecondary }]}>¥</Text>
                <TextInput
                  value={draft.amountInput.replace(/[^\d]/g, '')}
                  onChangeText={(v) => setDraft((d) => ({ ...d, amountInput: v.replace(/[^\d]/g, '') }))}
                  placeholder="8000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                />
              </View>
            </Field>

            <Field label={t('kakeibo.fields.category')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {ALL_EXPENSE_CATEGORIES.map((c) => {
                  const selected = draft.category === c;
                  return (
                    <Pressable
                      key={c}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={t(`kakeibo.categories.${c}`)}
                      onPress={() => setDraft((d) => ({ ...d, category: c }))}
                      style={({ pressed }) => ({
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: selected ? colors.brand : colors.border,
                        backgroundColor: selected ? colors.brandSubtle : colors.surface,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Ionicons name={CATEGORY_ICONS[c]} size={14} color={selected ? colors.brand : colors.text} />
                      <Text
                        style={[
                          typography.caption,
                          { color: selected ? colors.brand : colors.text, fontWeight: selected ? '700' : '400' },
                        ]}
                      >
                        {t(`kakeibo.categories.${c}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field
              label={t('kakeibo.recurring.dayLabel', { day: draft.dayOfMonth })}
              hint={t('kakeibo.recurring.autoNote')}
            >
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: spacing.xs, gap: 6 }}
              >
                {DAYS.map((d) => {
                  const selected = draft.dayOfMonth === d;
                  return (
                    <Pressable
                      key={d}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={`Day ${d}`}
                      onPress={() => setDraft((prev) => ({ ...prev, dayOfMonth: d }))}
                      style={({ pressed }) => ({
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: selected ? colors.brand : colors.border,
                        backgroundColor: selected ? colors.brand : colors.surface,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text
                        style={[
                          typography.callout,
                          { color: selected ? colors.textInverse : colors.text, fontWeight: '600' },
                        ]}
                      >
                        {d}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Field>

            <Field label={t('kakeibo.fields.note')}>
              <TextInput
                value={draft.note}
                onChangeText={(v) => setDraft((d) => ({ ...d, note: v }))}
                placeholder={t('kakeibo.fields.notePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={2}
                style={{
                  minHeight: 60,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  textAlignVertical: 'top',
                  ...typography.body,
                }}
              />
            </Field>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: spacing.xs,
              }}
            >
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                {t('kakeibo.recurring.activeLabel')}
              </Text>
              <Switch
                accessibilityLabel={t('kakeibo.recurring.activeLabel')}
                value={draft.active}
                onValueChange={(v) => setDraft((d) => ({ ...d, active: v }))}
                trackColor={{ false: colors.border, true: colors.brand }}
                thumbColor={colors.textInverse}
              />
            </View>
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            {editing ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('kakeibo.actions.delete')}
                onPress={handleDelete}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 50,
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: colors.danger,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={[typography.callout, { color: colors.danger }]}>{t('kakeibo.actions.delete')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('kakeibo.actions.save')}
              accessibilityState={{ disabled: !canSave }}
              disabled={!canSave}
              onPress={handleSave}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 50,
                borderRadius: radius.sm,
                backgroundColor: canSave ? colors.brand : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: canSave ? colors.textInverse : colors.textSecondary, fontWeight: '600' }]}>
                {t('kakeibo.actions.save')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.headline, { color: colors.text }]}>{label}</Text>
      {children}
      {hint ? <Text style={[typography.caption, { color: colors.textSecondary }]}>{hint}</Text> : null}
    </View>
  );
}

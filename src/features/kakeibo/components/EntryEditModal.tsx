import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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

import { isoFromYMD, ymdFromIso } from '@/features/documents/date-utils';
import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import { ALL_EXPENSE_CATEGORIES, type ExpenseCategory, type KakeiboEntry } from '@/lib/kakeibo-math';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  editing: KakeiboEntry | null;
  /** Pre-filled category when user taps "+" on a category filter chip. */
  defaultCategory?: ExpenseCategory;
  onClose: () => void;
}

interface DraftState {
  amountInput: string;
  category: ExpenseCategory;
  year: string;
  month: string;
  day: string;
  label: string;
  note: string;
  isRecurring: boolean;
}

function emptyDraft(defaultCategory?: ExpenseCategory): DraftState {
  const now = new Date();
  return {
    amountInput: '',
    category: defaultCategory ?? 'food',
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
    day: String(now.getDate()),
    label: '',
    note: '',
    isRecurring: false,
  };
}

function draftFromEntry(e: KakeiboEntry): DraftState {
  const ymd = ymdFromIso(e.date);
  return {
    amountInput: String(e.amount),
    category: e.category,
    year: ymd ? String(ymd.year) : '',
    month: ymd ? String(ymd.month) : '',
    day: ymd ? String(ymd.day) : '',
    label: e.label ?? '',
    note: e.note ?? '',
    isRecurring: e.isRecurring ?? false,
  };
}

function isValidDate(d: DraftState): boolean {
  const y = Number.parseInt(d.year, 10);
  const m = Number.parseInt(d.month, 10);
  const day = Number.parseInt(d.day, 10);
  if (![y, m, day].every((n) => Number.isFinite(n))) return false;
  if (y < 1900 || y > 2200 || m < 1 || m > 12) return false;
  const date = new Date(y, m - 1, day);
  return date.getDate() === day && date.getMonth() === m - 1 && date.getFullYear() === y;
}

function parseYen(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function EntryEditModal({ visible, editing, defaultCategory, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addEntry = useKakeiboStore((s) => s.addEntry);
  const updateEntry = useKakeiboStore((s) => s.updateEntry);
  const removeEntry = useKakeiboStore((s) => s.removeEntry);

  const [draft, setDraft] = useState<DraftState>(() => emptyDraft(defaultCategory));

  useEffect(() => {
    if (!visible) return;
    setDraft(editing ? draftFromEntry(editing) : emptyDraft(defaultCategory));
  }, [visible, editing, defaultCategory]);

  const dateValid = useMemo(() => isValidDate(draft), [draft]);
  const amountValid = parseYen(draft.amountInput) > 0;
  const canSave = amountValid && dateValid;

  const handleSave = () => {
    if (!canSave) return;
    const iso = isoFromYMD(
      Number.parseInt(draft.year, 10),
      Number.parseInt(draft.month, 10),
      Number.parseInt(draft.day, 10),
    );
    const payload = {
      date: iso,
      amount: parseYen(draft.amountInput),
      category: draft.category,
      label: draft.label.trim() || undefined,
      note: draft.note.trim() || undefined,
      isRecurring: draft.isRecurring ? true : undefined,
    };
    if (editing) {
      updateEntry(editing.id, payload);
    } else {
      const r = addEntry(payload);
      if (!r.added && r.reason === 'limit_reached') {
        Alert.alert(t('kakeibo.list.limitReached', { max: 5000 }));
        return;
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(t('kakeibo.actions.deleteConfirmTitle'), t('kakeibo.actions.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('kakeibo.actions.deleteConfirmOk'),
        style: 'destructive',
        onPress: () => {
          removeEntry(editing.id);
          onClose();
        },
      },
    ]);
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
              {editing ? t('kakeibo.edit.title') : t('kakeibo.add.title')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <Field label={t('kakeibo.fields.amount')} error={!amountValid ? t('kakeibo.errors.amountPositive') : undefined}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  borderWidth: 1,
                  borderColor: !amountValid ? colors.danger : colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={[typography.title3, { color: colors.textSecondary }]}>¥</Text>
                <TextInput
                  value={draft.amountInput.replace(/[^\d]/g, '')}
                  onChangeText={(v) => setDraft((d) => ({ ...d, amountInput: v.replace(/[^\d]/g, '') }))}
                  placeholder="1000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                />
              </View>
            </Field>

            <Field label={t('kakeibo.fields.date')} error={!dateValid ? t('kakeibo.errors.dateRequired') : undefined}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DateNumInput label="YYYY" value={draft.year} onChange={(v) => setDraft((d) => ({ ...d, year: v }))} maxLength={4} flex={2} />
                <DateNumInput label="MM" value={draft.month} onChange={(v) => setDraft((d) => ({ ...d, month: v }))} maxLength={2} flex={1} />
                <DateNumInput label="DD" value={draft.day} onChange={(v) => setDraft((d) => ({ ...d, day: v }))} maxLength={2} flex={1} />
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

            <Field label={t('kakeibo.fields.label')}>
              <TextInput
                value={draft.label}
                onChangeText={(v) => setDraft((d) => ({ ...d, label: v }))}
                placeholder={t('kakeibo.fields.labelPlaceholder')}
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
                {t('kakeibo.fields.recurring')}
              </Text>
              <Switch
                accessibilityLabel={t('kakeibo.fields.recurring')}
                value={draft.isRecurring}
                onValueChange={(v) => setDraft((d) => ({ ...d, isRecurring: v }))}
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

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.headline, { color: colors.text }]}>{label}</Text>
      {children}
      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
    </View>
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

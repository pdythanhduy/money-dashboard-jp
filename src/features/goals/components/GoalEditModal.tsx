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
import { IconPicker } from '@/features/goals/components/IconPicker';
import {
  ALL_MONEY_GOAL_CATEGORIES,
  useGoalsStore,
  type Goal,
  type GoalIcon,
  type MoneyGoalCategory,
} from '@/store/goalsStore';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  editing: Goal | null;
  onClose: () => void;
}

interface DraftState {
  title: string;
  icon: GoalIcon;
  category: MoneyGoalCategory;
  amountInput: string;
  monthlyInput: string;
  useDeadline: boolean;
  year: string;
  month: string;
  day: string;
  note: string;
}

function emptyDraft(): DraftState {
  const inThreeMonths = new Date();
  inThreeMonths.setMonth(inThreeMonths.getMonth() + 3);
  return {
    title: '',
    icon: 'piggy',
    category: 'other',
    amountInput: '',
    monthlyInput: '',
    useDeadline: false,
    year: String(inThreeMonths.getFullYear()),
    month: String(inThreeMonths.getMonth() + 1),
    day: String(inThreeMonths.getDate()),
    note: '',
  };
}

function draftFromGoal(g: Goal): DraftState {
  const ymd = g.deadline ? ymdFromIso(g.deadline) : null;
  const fallback = emptyDraft();
  return {
    title: g.title,
    icon: g.icon,
    category: g.category ?? 'other',
    amountInput: String(g.targetAmount),
    monthlyInput: g.monthlyContribution !== undefined ? String(g.monthlyContribution) : '',
    useDeadline: Boolean(g.deadline),
    year: ymd ? String(ymd.year) : fallback.year,
    month: ymd ? String(ymd.month) : fallback.month,
    day: ymd ? String(ymd.day) : fallback.day,
    note: g.note ?? '',
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

export function GoalEditModal({ visible, editing, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addGoal = useGoalsStore((s) => s.addGoal);
  const updateGoal = useGoalsStore((s) => s.updateGoal);
  const removeGoal = useGoalsStore((s) => s.removeGoal);

  const [draft, setDraft] = useState<DraftState>(() => emptyDraft());

  useEffect(() => {
    if (!visible) return;
    setDraft(editing ? draftFromGoal(editing) : emptyDraft());
  }, [visible, editing]);

  const titleValid = draft.title.trim().length > 0;
  const amountValid = parseYen(draft.amountInput) > 0;
  const dateValid = !draft.useDeadline || isValidDate(draft);
  const canSave = titleValid && amountValid && dateValid;

  const handleSave = () => {
    if (!canSave) return;
    const deadline = draft.useDeadline
      ? isoFromYMD(
          Number.parseInt(draft.year, 10),
          Number.parseInt(draft.month, 10),
          Number.parseInt(draft.day, 10),
        )
      : undefined;
    const monthly = parseYen(draft.monthlyInput);
    const payload = {
      title: draft.title.trim(),
      icon: draft.icon,
      category: draft.category,
      targetAmount: parseYen(draft.amountInput),
      ...(deadline ? { deadline } : {}),
      ...(monthly > 0 ? { monthlyContribution: monthly } : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    };
    if (editing) {
      updateGoal(editing.id, payload);
    } else {
      const r = addGoal(payload);
      if (!r.added && r.reason === 'limit_reached') {
        Alert.alert(t('goals.list.limitReached', { max: 20 }));
        return;
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(t('goals.actions.deleteConfirmTitle'), t('goals.actions.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('goals.actions.delete'),
        style: 'destructive',
        onPress: () => {
          removeGoal(editing.id);
          onClose();
        },
      },
    ]);
  };

  const headerTitle = editing ? t('goals.actions.edit') : t('goals.actions.addGoal');

  const deadlinePreview = useMemo(() => {
    if (!draft.useDeadline) return t('goals.fields.deadlineHint');
    if (!dateValid) return t('goals.errors.dateInvalid');
    return undefined;
  }, [draft.useDeadline, dateValid, t]);

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
              {headerTitle}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <Field label={t('goals.fields.title')} error={!titleValid ? t('goals.errors.titleRequired') : undefined}>
              <TextInput
                value={draft.title}
                onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))}
                placeholder={t('goals.fields.titlePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={{
                  minHeight: 50,
                  borderWidth: 1,
                  borderColor: !titleValid ? colors.danger : colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  ...typography.body,
                }}
              />
            </Field>

            <Field label={t('goals.fields.targetAmount')} error={!amountValid ? t('goals.errors.targetPositive') : undefined}>
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
                  placeholder="150000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                />
              </View>
            </Field>

            <Field label={t('goals.fields.icon')}>
              <IconPicker value={draft.icon} onChange={(icon) => setDraft((d) => ({ ...d, icon }))} />
            </Field>

            <Field label={t('goals.fields.category')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {ALL_MONEY_GOAL_CATEGORIES.map((cat) => {
                  const selected = draft.category === cat;
                  return (
                    <Pressable
                      key={cat}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={t(`goals.categories.${cat}`)}
                      onPress={() => setDraft((d) => ({ ...d, category: cat }))}
                      style={({ pressed }) => ({
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 6,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: selected ? colors.brand : colors.border,
                        backgroundColor: selected ? colors.brand : colors.surface,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text
                        style={[
                          typography.caption,
                          {
                            color: selected ? colors.textInverse : colors.text,
                            fontWeight: '600',
                          },
                        ]}
                      >
                        {t(`goals.categories.${cat}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label={t('goals.fields.monthlyContribution')}>
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
                  value={draft.monthlyInput.replace(/[^\d]/g, '')}
                  onChangeText={(v) => setDraft((d) => ({ ...d, monthlyInput: v.replace(/[^\d]/g, '') }))}
                  placeholder="20000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.body }}
                />
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {t('goals.fields.monthlyContributionHint')}
              </Text>
            </Field>

            <View style={{ gap: spacing.xs }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[typography.headline, { color: colors.text }]}>{t('goals.fields.deadline')}</Text>
                <Switch
                  accessibilityLabel={t('goals.fields.deadline')}
                  value={draft.useDeadline}
                  onValueChange={(v) => setDraft((d) => ({ ...d, useDeadline: v }))}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.textInverse}
                />
              </View>
              {draft.useDeadline ? (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <DateNumInput label="YYYY" value={draft.year} onChange={(v) => setDraft((d) => ({ ...d, year: v }))} maxLength={4} flex={2} />
                  <DateNumInput label="MM" value={draft.month} onChange={(v) => setDraft((d) => ({ ...d, month: v }))} maxLength={2} flex={1} />
                  <DateNumInput label="DD" value={draft.day} onChange={(v) => setDraft((d) => ({ ...d, day: v }))} maxLength={2} flex={1} />
                </View>
              ) : null}
              {deadlinePreview ? (
                <Text style={[typography.caption, { color: dateValid ? colors.textSecondary : colors.danger }]}>
                  {deadlinePreview}
                </Text>
              ) : null}
            </View>

            <Field label={t('goals.fields.note')}>
              <TextInput
                value={draft.note}
                onChangeText={(v) => setDraft((d) => ({ ...d, note: v }))}
                placeholder={t('goals.fields.notePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                style={{
                  minHeight: 80,
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
                accessibilityLabel={t('goals.actions.delete')}
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
                <Text style={[typography.callout, { color: colors.danger }]}>{t('goals.actions.delete')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('goals.actions.save')}
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
                {t('goals.actions.save')}
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

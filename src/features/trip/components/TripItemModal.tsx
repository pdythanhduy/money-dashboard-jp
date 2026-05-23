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
import { TRIP_CATEGORY_ICONS } from '@/features/trip/category-icons';
import { useTripBudgetStore } from '@/store/tripBudgetStore';
import { useTheme } from '@/theme';
import {
  ALL_TRIP_EXPENSE_CATEGORIES,
  type TripActualExpense,
  type TripBudget,
  type TripExpenseCategory,
  type TripPlanItem,
} from '@/types/trip-budget';

/**
 * Shared modal for adding/editing a single line item on a trip.
 *
 *   mode = 'plan'   → TripPlanItem (category + plannedAmount + label/note)
 *   mode = 'actual' → TripActualExpense (date + category + amount + label/note + reimbursable for business trips)
 */
interface Props {
  visible: boolean;
  mode: 'plan' | 'actual';
  trip: TripBudget | null;
  editingPlan?: TripPlanItem | null;
  editingActual?: TripActualExpense | null;
  onClose: () => void;
}

interface DraftState {
  category: TripExpenseCategory;
  amountInput: string;
  label: string;
  note: string;
  year: string;
  month: string;
  day: string;
  reimbursable: boolean;
}

function emptyDraft(trip: TripBudget | null): DraftState {
  // Default actual date to today (or trip start if today is outside the trip).
  const now = new Date();
  return {
    category: 'food',
    amountInput: '',
    label: '',
    note: '',
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
    day: String(now.getDate()),
    reimbursable: trip?.type === 'business',
  };
}

function fromPlan(p: TripPlanItem, trip: TripBudget | null): DraftState {
  return { ...emptyDraft(trip), category: p.category, amountInput: String(p.plannedAmount), label: p.label ?? '', note: p.note ?? '' };
}

function fromActual(a: TripActualExpense, trip: TripBudget | null): DraftState {
  const ymd = ymdFromIso(a.date);
  const fallback = emptyDraft(trip);
  return {
    category: a.category,
    amountInput: String(a.amount),
    label: a.label ?? '',
    note: a.note ?? '',
    year: ymd ? String(ymd.year) : fallback.year,
    month: ymd ? String(ymd.month) : fallback.month,
    day: ymd ? String(ymd.day) : fallback.day,
    reimbursable: a.reimbursable ?? false,
  };
}

function isValidDate(y: string, m: string, d: string): boolean {
  const yi = Number.parseInt(y, 10);
  const mi = Number.parseInt(m, 10);
  const di = Number.parseInt(d, 10);
  if (![yi, mi, di].every((n) => Number.isFinite(n))) return false;
  if (yi < 1900 || yi > 2200 || mi < 1 || mi > 12) return false;
  const date = new Date(yi, mi - 1, di);
  return date.getDate() === di && date.getMonth() === mi - 1 && date.getFullYear() === yi;
}

function parseYen(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function TripItemModal({
  visible,
  mode,
  trip,
  editingPlan = null,
  editingActual = null,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addPlanItem = useTripBudgetStore((s) => s.addPlanItem);
  const updatePlanItem = useTripBudgetStore((s) => s.updatePlanItem);
  const deletePlanItem = useTripBudgetStore((s) => s.deletePlanItem);
  const addActualExpense = useTripBudgetStore((s) => s.addActualExpense);
  const updateActualExpense = useTripBudgetStore((s) => s.updateActualExpense);
  const deleteActualExpense = useTripBudgetStore((s) => s.deleteActualExpense);

  const [draft, setDraft] = useState<DraftState>(() => emptyDraft(trip));

  useEffect(() => {
    if (!visible) return;
    if (mode === 'plan' && editingPlan) setDraft(fromPlan(editingPlan, trip));
    else if (mode === 'actual' && editingActual) setDraft(fromActual(editingActual, trip));
    else setDraft(emptyDraft(trip));
  }, [visible, mode, editingPlan, editingActual, trip]);

  const amount = parseYen(draft.amountInput);
  const amountValid = amount > 0;
  const dateValid = useMemo(
    () => mode === 'plan' || isValidDate(draft.year, draft.month, draft.day),
    [mode, draft.year, draft.month, draft.day],
  );
  const canSave = amountValid && dateValid && trip !== null;

  const editing = mode === 'plan' ? editingPlan : editingActual;
  const showReimbursable = mode === 'actual' && trip?.type === 'business';

  const handleSave = () => {
    if (!canSave || !trip) return;
    if (mode === 'plan') {
      const payload = {
        category: draft.category,
        plannedAmount: amount,
        ...(draft.label.trim() ? { label: draft.label.trim() } : {}),
        ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
      };
      if (editingPlan) updatePlanItem(trip.id, editingPlan.id, payload);
      else {
        const r = addPlanItem(trip.id, payload);
        if (!r.ok && r.reason === 'limit_reached') {
          Alert.alert(t('trip.validation.limitReached'));
          return;
        }
      }
    } else {
      const iso = isoFromYMD(Number(draft.year), Number(draft.month), Number(draft.day));
      const payload = {
        date: iso,
        category: draft.category,
        amount,
        ...(draft.label.trim() ? { label: draft.label.trim() } : {}),
        ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
        ...(showReimbursable && draft.reimbursable ? { reimbursable: true } : {}),
      };
      if (editingActual) updateActualExpense(trip.id, editingActual.id, payload);
      else {
        const r = addActualExpense(trip.id, payload);
        if (!r.ok && r.reason === 'limit_reached') {
          Alert.alert(t('trip.validation.limitReached'));
          return;
        }
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (!trip || !editing) return;
    Alert.alert(t('trip.action.delete'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('trip.action.delete'),
        style: 'destructive',
        onPress: () => {
          if (mode === 'plan' && editingPlan) deletePlanItem(trip.id, editingPlan.id);
          else if (mode === 'actual' && editingActual) deleteActualExpense(trip.id, editingActual.id);
          onClose();
        },
      },
    ]);
  };

  const headerTitle = mode === 'plan' ? t('trip.action.addPlan') : t('trip.action.addActual');

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
            <Field label={t('trip.actualField.category')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {ALL_TRIP_EXPENSE_CATEGORIES.map((c) => {
                  const selected = draft.category === c;
                  return (
                    <Pressable
                      key={c}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={t(`trip.category.${c}`)}
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
                      <Ionicons name={TRIP_CATEGORY_ICONS[c]} size={14} color={selected ? colors.brand : colors.text} />
                      <Text
                        style={[
                          typography.caption,
                          { color: selected ? colors.brand : colors.text, fontWeight: selected ? '700' : '400' },
                        ]}
                      >
                        {t(`trip.category.${c}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field
              label={t('trip.actualField.amount')}
              error={!amountValid ? t('trip.validation.amountPositive') : undefined}
            >
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
                  placeholder="5000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                />
              </View>
            </Field>

            {mode === 'actual' ? (
              <Field label={t('trip.actualField.date')} error={!dateValid ? t('trip.validation.datesInvalid') : undefined}>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <DateNumInput label="YYYY" value={draft.year} onChange={(v) => setDraft((d) => ({ ...d, year: v }))} maxLength={4} flex={2} />
                  <DateNumInput label="MM" value={draft.month} onChange={(v) => setDraft((d) => ({ ...d, month: v }))} maxLength={2} flex={1} />
                  <DateNumInput label="DD" value={draft.day} onChange={(v) => setDraft((d) => ({ ...d, day: v }))} maxLength={2} flex={1} />
                </View>
              </Field>
            ) : null}

            <Field label={t('trip.field.title')}>
              <TextInput
                value={draft.label}
                onChangeText={(v) => setDraft((d) => ({ ...d, label: v }))}
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

            <Field label={t('trip.field.note')}>
              <TextInput
                value={draft.note}
                onChangeText={(v) => setDraft((d) => ({ ...d, note: v }))}
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

            {showReimbursable ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: spacing.xs,
                }}
              >
                <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                  {t('trip.actualField.reimbursable')}
                </Text>
                <Switch
                  accessibilityLabel={t('trip.actualField.reimbursable')}
                  value={draft.reimbursable}
                  onValueChange={(v) => setDraft((d) => ({ ...d, reimbursable: v }))}
                  trackColor={{ false: colors.border, true: colors.brand }}
                  thumbColor={colors.textInverse}
                />
              </View>
            ) : null}
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
                accessibilityLabel={t('trip.action.delete')}
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
                <Text style={[typography.callout, { color: colors.danger }]}>{t('trip.action.delete')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.save')}
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
                {t('common.save')}
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

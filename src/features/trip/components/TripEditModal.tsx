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
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isoFromYMD, ymdFromIso } from '@/features/documents/date-utils';
import { useTripBudgetStore } from '@/store/tripBudgetStore';
import { useTheme } from '@/theme';
import { ALL_TRIP_TYPES, type TripBudget, type TripType } from '@/types/trip-budget';

interface Props {
  visible: boolean;
  editing: TripBudget | null;
  onClose: () => void;
}

interface DraftState {
  title: string;
  type: TripType;
  destination: string;
  startY: string;
  startM: string;
  startD: string;
  endY: string;
  endM: string;
  endD: string;
  companyAdvance: string;
  note: string;
}

function todayDraft(): DraftState {
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + 2);
  return {
    title: '',
    type: 'travel',
    destination: '',
    startY: String(now.getFullYear()),
    startM: String(now.getMonth() + 1),
    startD: String(now.getDate()),
    endY: String(future.getFullYear()),
    endM: String(future.getMonth() + 1),
    endD: String(future.getDate()),
    companyAdvance: '',
    note: '',
  };
}

function fromTrip(t: TripBudget): DraftState {
  const s = ymdFromIso(t.startDate);
  const e = ymdFromIso(t.endDate);
  const fallback = todayDraft();
  return {
    title: t.title,
    type: t.type,
    destination: t.destination ?? '',
    startY: s ? String(s.year) : fallback.startY,
    startM: s ? String(s.month) : fallback.startM,
    startD: s ? String(s.day) : fallback.startD,
    endY: e ? String(e.year) : fallback.endY,
    endM: e ? String(e.month) : fallback.endM,
    endD: e ? String(e.day) : fallback.endD,
    companyAdvance: t.companyAdvanceAmount ? String(t.companyAdvanceAmount) : '',
    note: t.note ?? '',
  };
}

function parseYen(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

function isValidYMD(y: string, m: string, d: string): boolean {
  const yi = Number.parseInt(y, 10);
  const mi = Number.parseInt(m, 10);
  const di = Number.parseInt(d, 10);
  if (![yi, mi, di].every((n) => Number.isFinite(n))) return false;
  if (yi < 1900 || yi > 2200 || mi < 1 || mi > 12) return false;
  const date = new Date(yi, mi - 1, di);
  return date.getDate() === di && date.getMonth() === mi - 1 && date.getFullYear() === yi;
}

export function TripEditModal({ visible, editing, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addTrip = useTripBudgetStore((s) => s.addTrip);
  const updateTrip = useTripBudgetStore((s) => s.updateTrip);
  const deleteTrip = useTripBudgetStore((s) => s.deleteTrip);

  const [draft, setDraft] = useState<DraftState>(() => todayDraft());

  useEffect(() => {
    if (!visible) return;
    setDraft(editing ? fromTrip(editing) : todayDraft());
  }, [visible, editing]);

  const startValid = useMemo(
    () => isValidYMD(draft.startY, draft.startM, draft.startD),
    [draft.startY, draft.startM, draft.startD],
  );
  const endValid = useMemo(
    () => isValidYMD(draft.endY, draft.endM, draft.endD),
    [draft.endY, draft.endM, draft.endD],
  );
  const titleValid = draft.title.trim().length > 0;

  const startDate = startValid
    ? isoFromYMD(Number(draft.startY), Number(draft.startM), Number(draft.startD))
    : '';
  const endDate = endValid
    ? isoFromYMD(Number(draft.endY), Number(draft.endM), Number(draft.endD))
    : '';
  const dateOrderValid = startValid && endValid && endDate >= startDate;

  const canSave = titleValid && startValid && endValid && dateOrderValid;
  const showCompanyAdvance = draft.type === 'business';

  const handleSave = () => {
    if (!canSave) return;
    const payload = {
      title: draft.title.trim(),
      type: draft.type,
      startDate,
      endDate,
      ...(draft.destination.trim() ? { destination: draft.destination.trim() } : {}),
      ...(showCompanyAdvance && parseYen(draft.companyAdvance) > 0
        ? { companyAdvanceAmount: parseYen(draft.companyAdvance) }
        : {}),
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    };
    if (editing) {
      updateTrip(editing.id, payload);
    } else {
      const r = addTrip(payload);
      if (!r.ok && r.reason === 'limit_reached') {
        Alert.alert(t('trip.validation.limitReached'));
        return;
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(t('trip.delete'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('trip.delete'),
        style: 'destructive',
        onPress: () => {
          deleteTrip(editing.id);
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
              {editing ? t('trip.edit') : t('trip.add')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <Field label={t('trip.field.title')} error={!titleValid ? t('trip.validation.titleRequired') : undefined}>
              <TextInput
                value={draft.title}
                onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))}
                placeholder={t('trip.field.titlePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={{
                  minHeight: 50,
                  borderWidth: 1,
                  borderColor: titleValid ? colors.border : colors.danger,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  ...typography.body,
                }}
              />
            </Field>

            <Field label={t('trip.type.label')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {ALL_TRIP_TYPES.map((tp) => {
                  const selected = draft.type === tp;
                  return (
                    <Pressable
                      key={tp}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={t(`trip.type.${tp}`)}
                      onPress={() => setDraft((d) => ({ ...d, type: tp }))}
                      style={({ pressed }) => ({
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: selected ? colors.brand : colors.border,
                        backgroundColor: selected ? colors.brandSubtle : colors.surface,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text
                        style={[
                          typography.callout,
                          { color: selected ? colors.brand : colors.text, fontWeight: selected ? '700' : '400' },
                        ]}
                      >
                        {t(`trip.type.${tp}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label={t('trip.field.destination')}>
              <TextInput
                value={draft.destination}
                onChangeText={(v) => setDraft((d) => ({ ...d, destination: v }))}
                placeholder={t('trip.field.destinationPlaceholder')}
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

            <Field
              label={t('trip.field.startDate')}
              error={!startValid ? t('trip.validation.datesInvalid') : undefined}
            >
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DateNumInput label="YYYY" value={draft.startY} onChange={(v) => setDraft((d) => ({ ...d, startY: v }))} maxLength={4} flex={2} />
                <DateNumInput label="MM" value={draft.startM} onChange={(v) => setDraft((d) => ({ ...d, startM: v }))} maxLength={2} flex={1} />
                <DateNumInput label="DD" value={draft.startD} onChange={(v) => setDraft((d) => ({ ...d, startD: v }))} maxLength={2} flex={1} />
              </View>
            </Field>

            <Field
              label={t('trip.field.endDate')}
              error={!endValid || !dateOrderValid ? t('trip.validation.datesInvalid') : undefined}
            >
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DateNumInput label="YYYY" value={draft.endY} onChange={(v) => setDraft((d) => ({ ...d, endY: v }))} maxLength={4} flex={2} />
                <DateNumInput label="MM" value={draft.endM} onChange={(v) => setDraft((d) => ({ ...d, endM: v }))} maxLength={2} flex={1} />
                <DateNumInput label="DD" value={draft.endD} onChange={(v) => setDraft((d) => ({ ...d, endD: v }))} maxLength={2} flex={1} />
              </View>
            </Field>

            {showCompanyAdvance ? (
              <Field label={t('trip.field.companyAdvance')}>
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
                  <Text style={[typography.title3, { color: colors.textSecondary }]}>¥</Text>
                  <TextInput
                    value={draft.companyAdvance.replace(/[^\d]/g, '')}
                    onChangeText={(v) => setDraft((d) => ({ ...d, companyAdvance: v.replace(/[^\d]/g, '') }))}
                    placeholder="50000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    inputMode="numeric"
                    style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                  />
                </View>
              </Field>
            ) : null}

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
                accessibilityLabel={t('trip.delete')}
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
                <Text style={[typography.callout, { color: colors.danger }]}>{t('trip.delete')}</Text>
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

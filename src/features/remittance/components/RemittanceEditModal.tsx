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
import { formatVND } from '@/features/remittance/format-vnd';
import { formatCurrency } from '@/lib/format';
import {
  ALL_REMITTANCE_PROVIDERS,
  computeAmountVND,
  type RemittanceEntry,
  type RemittanceProvider,
} from '@/lib/remittance-math';
import { useRemittanceStore } from '@/store/remittanceStore';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  editing: RemittanceEntry | null;
  onClose: () => void;
}

interface DraftState {
  year: string;
  month: string;
  day: string;
  amountInput: string;
  feeInput: string;
  rateInput: string;
  provider: RemittanceProvider;
  recipient: string;
  note: string;
}

function emptyDraft(): DraftState {
  const now = new Date();
  return {
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
    day: String(now.getDate()),
    amountInput: '',
    feeInput: '',
    rateInput: '',
    provider: 'wise',
    recipient: '',
    note: '',
  };
}

function draftFromEntry(e: RemittanceEntry): DraftState {
  const ymd = ymdFromIso(e.date);
  return {
    year: ymd ? String(ymd.year) : '',
    month: ymd ? String(ymd.month) : '',
    day: ymd ? String(ymd.day) : '',
    amountInput: String(e.amountJPY),
    feeInput: String(e.feeJPY),
    rateInput: String(e.exchangeRate),
    provider: e.provider,
    recipient: e.recipient ?? '',
    note: e.note ?? '',
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

function parseRate(input: string): number {
  // Allow "169.5" or "169,5" — strip everything except digits + first separator.
  const cleaned = input.replace(/,/g, '.').replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

export function RemittanceEditModal({ visible, editing, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addEntry = useRemittanceStore((s) => s.addEntry);
  const updateEntry = useRemittanceStore((s) => s.updateEntry);
  const removeEntry = useRemittanceStore((s) => s.removeEntry);

  const [draft, setDraft] = useState<DraftState>(() => emptyDraft());

  useEffect(() => {
    if (!visible) return;
    setDraft(editing ? draftFromEntry(editing) : emptyDraft());
  }, [visible, editing]);

  const dateValid = useMemo(() => isValidDate(draft), [draft]);
  const amount = parseYen(draft.amountInput);
  const fee = parseYen(draft.feeInput);
  const rate = parseRate(draft.rateInput);
  const amountValid = amount > 0;
  const rateValid = rate > 0;
  const canSave = dateValid && amountValid && rateValid;

  const livePreviewVND = computeAmountVND(amount, rate);

  const handleSave = () => {
    if (!canSave) return;
    const iso = isoFromYMD(
      Number.parseInt(draft.year, 10),
      Number.parseInt(draft.month, 10),
      Number.parseInt(draft.day, 10),
    );
    const payload = {
      date: iso,
      amountJPY: amount,
      feeJPY: fee,
      exchangeRate: rate,
      provider: draft.provider,
      recipient: draft.recipient.trim() || undefined,
      note: draft.note.trim() || undefined,
    };
    if (editing) {
      updateEntry(editing.id, payload);
    } else {
      const r = addEntry(payload);
      if (!r.added && r.reason === 'limit_reached') {
        Alert.alert(t('remittance.list.limitReached', { max: 500 }));
        return;
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(
      t('remittance.actions.deleteConfirmTitle'),
      t('remittance.actions.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('remittance.actions.delete'),
          style: 'destructive',
          onPress: () => {
            removeEntry(editing.id);
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
              {editing ? t('remittance.edit.title') : t('remittance.add.title')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <Field label={t('remittance.fields.date')} error={!dateValid ? t('remittance.errors.dateRequired') : undefined}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DateNumInput label="YYYY" value={draft.year} onChange={(v) => setDraft((d) => ({ ...d, year: v }))} maxLength={4} flex={2} />
                <DateNumInput label="MM" value={draft.month} onChange={(v) => setDraft((d) => ({ ...d, month: v }))} maxLength={2} flex={1} />
                <DateNumInput label="DD" value={draft.day} onChange={(v) => setDraft((d) => ({ ...d, day: v }))} maxLength={2} flex={1} />
              </View>
            </Field>

            <Field label={t('remittance.fields.amountJPY')} error={!amountValid ? t('remittance.errors.amountPositive') : undefined}>
              <YenInput
                value={draft.amountInput}
                onChange={(v) => setDraft((d) => ({ ...d, amountInput: v }))}
                placeholder="50000"
                error={!amountValid}
              />
            </Field>

            <Field label={t('remittance.fields.feeJPY')}>
              <YenInput
                value={draft.feeInput}
                onChange={(v) => setDraft((d) => ({ ...d, feeInput: v }))}
                placeholder="500"
              />
            </Field>

            <Field
              label={t('remittance.fields.exchangeRate')}
              hint={t('remittance.fields.exchangeRateHelper')}
              error={!rateValid ? t('remittance.errors.ratePositive') : undefined}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: !rateValid ? colors.danger : colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  backgroundColor: colors.surface,
                }}
              >
                <TextInput
                  value={draft.rateInput}
                  onChangeText={(v) =>
                    setDraft((d) => ({ ...d, rateInput: v.replace(/,/g, '.').replace(/[^\d.]/g, '').slice(0, 10) }))
                  }
                  placeholder="169.5"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="decimal-pad"
                  inputMode="decimal"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                />
                <Text style={[typography.caption, { color: colors.textSecondary }]}>₫/¥</Text>
              </View>
            </Field>

            {amount > 0 && rate > 0 ? (
              <View
                style={{
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.brandSubtle,
                  gap: 2,
                }}
              >
                <Text style={[typography.caption, { color: colors.brand, fontWeight: '600' }]}>
                  {t('remittance.fields.livePreviewLabel')}
                </Text>
                <Text style={[typography.title3, { color: colors.danger, fontWeight: '800' }]}>
                  {formatVND(livePreviewVND)}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {formatCurrency(amount)} × {rate.toFixed(2)} ₫/¥
                </Text>
              </View>
            ) : null}

            <Field label={t('remittance.fields.provider')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {ALL_REMITTANCE_PROVIDERS.map((p) => {
                  const selected = draft.provider === p;
                  return (
                    <Pressable
                      key={p}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={t(`remittance.providers.${p}`)}
                      onPress={() => setDraft((d) => ({ ...d, provider: p }))}
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
                        {t(`remittance.providers.${p}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label={t('remittance.fields.recipient')}>
              <TextInput
                value={draft.recipient}
                onChangeText={(v) => setDraft((d) => ({ ...d, recipient: v }))}
                placeholder={t('remittance.fields.recipientPlaceholder')}
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

            <Field label={t('remittance.fields.note')}>
              <TextInput
                value={draft.note}
                onChangeText={(v) => setDraft((d) => ({ ...d, note: v }))}
                placeholder={t('remittance.fields.notePlaceholder')}
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
                accessibilityLabel={t('remittance.actions.delete')}
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
                <Text style={[typography.callout, { color: colors.danger }]}>{t('remittance.actions.delete')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('remittance.actions.save')}
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
                {t('remittance.actions.save')}
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
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.headline, { color: colors.text }]}>{label}</Text>
      {children}
      {hint && !error ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{hint}</Text>
      ) : null}
      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}
    </View>
  );
}

function YenInput({
  value,
  onChange,
  placeholder,
  error,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  error?: boolean;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: error ? colors.danger : colors.border,
        borderRadius: radius.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surface,
      }}
    >
      <Text style={[typography.title3, { color: colors.textSecondary }]}>¥</Text>
      <TextInput
        value={value.replace(/[^\d]/g, '')}
        onChangeText={(v) => onChange(v.replace(/[^\d]/g, ''))}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        inputMode="numeric"
        style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
      />
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

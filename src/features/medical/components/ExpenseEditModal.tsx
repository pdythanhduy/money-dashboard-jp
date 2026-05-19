/**
 * Add / edit a single medical expense. Image picker uses expo-image-picker
 * camera + library options; the chosen URI is copied into local document
 * storage via receipt-storage before persisting to the store.
 */

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Image,
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
import { ALL_MEDICAL_CATEGORIES, type MedicalCategory, type MedicalExpense } from '@/lib/medical-deduction';
import { deleteReceiptImage, saveReceiptImage } from '@/lib/receipt-storage';
import { useMedicalExpensesStore } from '@/store/medicalExpensesStore';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  editing: MedicalExpense | null;
  onClose: () => void;
}

interface DraftState {
  amountInput: string;
  reimbursedInput: string;
  category: MedicalCategory;
  year: string;
  month: string;
  day: string;
  provider: string;
  note: string;
  receiptImageUri: string | null;
}

function emptyDraft(): DraftState {
  const now = new Date();
  return {
    amountInput: '',
    reimbursedInput: '',
    category: 'doctor_visit',
    year: String(now.getFullYear()),
    month: String(now.getMonth() + 1),
    day: String(now.getDate()),
    provider: '',
    note: '',
    receiptImageUri: null,
  };
}

function draftFromExpense(e: MedicalExpense): DraftState {
  const ymd = ymdFromIso(e.date);
  return {
    amountInput: String(e.amount),
    reimbursedInput: e.reimbursedAmount ? String(e.reimbursedAmount) : '',
    category: e.category,
    year: ymd ? String(ymd.year) : '',
    month: ymd ? String(ymd.month) : '',
    day: ymd ? String(ymd.day) : '',
    provider: e.provider ?? '',
    note: e.note ?? '',
    receiptImageUri: e.receiptImageUri ?? null,
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

export function ExpenseEditModal({ visible, editing, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addExpense = useMedicalExpensesStore((s) => s.addExpense);
  const updateExpense = useMedicalExpensesStore((s) => s.updateExpense);
  const removeExpense = useMedicalExpensesStore((s) => s.removeExpense);

  const [draft, setDraft] = useState<DraftState>(() => emptyDraft());
  const [categoryOpen, setCategoryOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraft(editing ? draftFromExpense(editing) : emptyDraft());
    setCategoryOpen(false);
  }, [visible, editing]);

  const dateValid = useMemo(() => isValidDate(draft), [draft]);
  const amountValid = parseYen(draft.amountInput) > 0;
  const canSave = dateValid && amountValid;

  const pickFromLibrary = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsEditing: false,
      });
      if (res.canceled) return;
      const sourceUri = res.assets[0]?.uri;
      if (!sourceUri) return;
      const saved = await saveReceiptImage(sourceUri);
      if (saved) setDraft((d) => ({ ...d, receiptImageUri: saved }));
    } catch {
      Alert.alert(t('medical.errors.imagePicker'));
    }
  };

  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
      if (res.canceled) return;
      const sourceUri = res.assets[0]?.uri;
      if (!sourceUri) return;
      const saved = await saveReceiptImage(sourceUri);
      if (saved) setDraft((d) => ({ ...d, receiptImageUri: saved }));
    } catch {
      Alert.alert(t('medical.errors.imagePicker'));
    }
  };

  const removeReceiptImage = () => {
    const uri = draft.receiptImageUri;
    setDraft((d) => ({ ...d, receiptImageUri: null }));
    if (uri) void deleteReceiptImage(uri);
  };

  const handleSave = () => {
    if (!canSave) return;
    const iso = isoFromYMD(
      Number.parseInt(draft.year, 10),
      Number.parseInt(draft.month, 10),
      Number.parseInt(draft.day, 10),
    );
    const amount = parseYen(draft.amountInput);
    const reimbursed = parseYen(draft.reimbursedInput);
    const payload = {
      date: iso,
      amount,
      category: draft.category,
      provider: draft.provider.trim() || undefined,
      note: draft.note.trim() || undefined,
      receiptImageUri: draft.receiptImageUri ?? undefined,
      reimbursedAmount: reimbursed > 0 ? reimbursed : undefined,
    };
    if (editing) {
      updateExpense(editing.id, payload);
    } else {
      addExpense(payload);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(
      t('medical.actions.deleteConfirmTitle'),
      t('medical.actions.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('medical.actions.deleteConfirmOk'),
          style: 'destructive',
          onPress: () => {
            if (editing.receiptImageUri) void deleteReceiptImage(editing.receiptImageUri);
            removeExpense(editing.id);
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
              {editing ? t('medical.edit.title') : t('medical.add.title')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Amount */}
            <Field label={t('medical.fields.amount')} error={!amountValid ? t('medical.errors.amountPositive') : undefined}>
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
                  placeholder="5000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                />
              </View>
            </Field>

            {/* Date */}
            <Field label={t('medical.fields.date')} error={!dateValid ? t('medical.errors.dateRequired') : undefined}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DateNumInput label="YYYY" value={draft.year} onChange={(v) => setDraft((d) => ({ ...d, year: v }))} maxLength={4} flex={2} />
                <DateNumInput label="MM" value={draft.month} onChange={(v) => setDraft((d) => ({ ...d, month: v }))} maxLength={2} flex={1} />
                <DateNumInput label="DD" value={draft.day} onChange={(v) => setDraft((d) => ({ ...d, day: v }))} maxLength={2} flex={1} />
              </View>
            </Field>

            {/* Category */}
            <Field label={t('medical.fields.category')}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('medical.fields.category')}
                onPress={() => setCategoryOpen((v) => !v)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: 50,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  backgroundColor: colors.surface,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={[typography.body, { color: colors.text }]}>
                  {t(`medical.categories.${draft.category}`)}
                </Text>
                <Ionicons name={categoryOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </Pressable>
              {categoryOpen ? (
                <View
                  style={{
                    marginTop: spacing.xs,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                    backgroundColor: colors.surfaceElevated,
                    overflow: 'hidden',
                  }}
                >
                  {ALL_MEDICAL_CATEGORIES.map((c) => (
                    <Pressable
                      key={c}
                      accessibilityRole="button"
                      accessibilityState={{ selected: draft.category === c }}
                      accessibilityLabel={t(`medical.categories.${c}`)}
                      onPress={() => {
                        setDraft((d) => ({ ...d, category: c }));
                        setCategoryOpen(false);
                      }}
                      style={({ pressed }) => ({
                        padding: spacing.md,
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                        backgroundColor: pressed ? colors.brandSubtle : 'transparent',
                      })}
                    >
                      <Text
                        style={[
                          typography.body,
                          { color: draft.category === c ? colors.brand : colors.text, fontWeight: draft.category === c ? '700' : '400' },
                        ]}
                      >
                        {t(`medical.categories.${c}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </Field>

            {/* Provider */}
            <Field label={t('medical.fields.provider')}>
              <TextInput
                value={draft.provider}
                onChangeText={(v) => setDraft((d) => ({ ...d, provider: v }))}
                placeholder={t('medical.fields.providerPlaceholder')}
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

            {/* Reimbursed */}
            <Field label={t('medical.fields.reimbursed')} helper={t('medical.fields.reimbursedHelper')}>
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
                  value={draft.reimbursedInput.replace(/[^\d]/g, '')}
                  onChangeText={(v) => setDraft((d) => ({ ...d, reimbursedInput: v.replace(/[^\d]/g, '') }))}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                />
              </View>
            </Field>

            {/* Receipt */}
            <Field label={t('medical.fields.receipt')}>
              {draft.receiptImageUri ? (
                <View style={{ gap: spacing.xs }}>
                  <Image
                    source={{ uri: draft.receiptImageUri }}
                    style={{ width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.surface }}
                    resizeMode="cover"
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('medical.fields.receiptRemove')}
                    onPress={removeReceiptImage}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.xs,
                      alignSelf: 'flex-start',
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.xs,
                      borderRadius: radius.pill,
                      borderWidth: 1,
                      borderColor: colors.danger,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Ionicons name="trash-outline" size={14} color={colors.danger} />
                    <Text style={[typography.caption, { color: colors.danger }]}>
                      {t('medical.fields.receiptRemove')}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <ReceiptButton icon="camera-outline" label={t('medical.fields.receiptCamera')} onPress={pickFromCamera} />
                  <ReceiptButton icon="images-outline" label={t('medical.fields.receiptGallery')} onPress={pickFromLibrary} />
                </View>
              )}
            </Field>

            {/* Note */}
            <Field label={t('medical.fields.note')}>
              <TextInput
                value={draft.note}
                onChangeText={(v) => setDraft((d) => ({ ...d, note: v }))}
                placeholder={t('medical.fields.notePlaceholder')}
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
                accessibilityLabel={t('medical.actions.delete')}
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
                <Text style={[typography.callout, { color: colors.danger }]}>{t('medical.actions.delete')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('medical.actions.save')}
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
                {t('medical.actions.save')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, helper, error, children }: { label: string; helper?: string; error?: string; children: React.ReactNode }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.headline, { color: colors.text }]}>{label}</Text>
      {children}
      {helper ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{helper}</Text>
      ) : null}
      {error ? (
        <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
      ) : null}
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

function ReceiptButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: 80,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.brand,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Ionicons name={icon} size={24} color={colors.brand} />
      <Text style={[typography.caption, { color: colors.brand, fontWeight: '600' }]}>{label}</Text>
    </Pressable>
  );
}

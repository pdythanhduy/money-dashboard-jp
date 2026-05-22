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
import {
  MAX_DOCUMENT_DEADLINES,
  useDocumentDeadlineStore,
} from '@/store/documentDeadlineStore';
import { useTheme } from '@/theme';
import {
  ALL_DOCUMENT_TYPES,
  REMIND_BEFORE_OPTIONS,
  type DocumentDeadline,
  type DocumentType,
} from '@/types/document-deadline';

interface Props {
  visible: boolean;
  editing: DocumentDeadline | null;
  onClose: () => void;
}

interface DraftState {
  type: DocumentType;
  title: string;
  year: string;
  month: string;
  day: string;
  remindBeforeDays: number;
  note: string;
}

function emptyDraft(): DraftState {
  const inOneMonth = new Date();
  inOneMonth.setMonth(inOneMonth.getMonth() + 1);
  return {
    type: 'residence_card',
    title: '',
    year: String(inOneMonth.getFullYear()),
    month: String(inOneMonth.getMonth() + 1),
    day: String(inOneMonth.getDate()),
    remindBeforeDays: 30,
    note: '',
  };
}

function fromDoc(d: DocumentDeadline): DraftState {
  const ymd = ymdFromIso(d.expiryDate);
  const fallback = emptyDraft();
  return {
    type: d.type,
    title: d.title,
    year: ymd ? String(ymd.year) : fallback.year,
    month: ymd ? String(ymd.month) : fallback.month,
    day: ymd ? String(ymd.day) : fallback.day,
    remindBeforeDays: d.remindBeforeDays,
    note: d.note ?? '',
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

export function DocumentDeadlineEditModal({ visible, editing, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addDoc = useDocumentDeadlineStore((s) => s.addDocumentDeadline);
  const updateDoc = useDocumentDeadlineStore((s) => s.updateDocumentDeadline);
  const removeDoc = useDocumentDeadlineStore((s) => s.removeDocumentDeadline);

  const [draft, setDraft] = useState<DraftState>(() => emptyDraft());

  useEffect(() => {
    if (!visible) return;
    setDraft(editing ? fromDoc(editing) : emptyDraft());
  }, [visible, editing]);

  const dateValid = useMemo(() => isValidDate(draft), [draft]);
  const titleValid = draft.title.trim().length > 0;
  const canSave = dateValid && titleValid;

  const handleSave = () => {
    if (!canSave) return;
    const expiryDate = isoFromYMD(
      Number.parseInt(draft.year, 10),
      Number.parseInt(draft.month, 10),
      Number.parseInt(draft.day, 10),
    );
    const payload = {
      type: draft.type,
      title: draft.title.trim(),
      expiryDate,
      remindBeforeDays: draft.remindBeforeDays,
      ...(draft.note.trim() ? { note: draft.note.trim() } : {}),
    };
    if (editing) {
      updateDoc(editing.id, payload);
    } else {
      const r = addDoc(payload);
      if (!r.added && r.reason === 'limit_reached') {
        Alert.alert(t('documents.list.limitReached', { max: MAX_DOCUMENT_DEADLINES }));
        return;
      }
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    Alert.alert(t('documents.delete'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('documents.delete'),
        style: 'destructive',
        onPress: () => {
          removeDoc(editing.id);
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
              {editing ? t('documents.edit.title') : t('documents.add.title')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <Field label={t('documents.type')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {ALL_DOCUMENT_TYPES.map((tp) => {
                  const selected = draft.type === tp;
                  return (
                    <Pressable
                      key={tp}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={t(`documents.types.${tp}`)}
                      onPress={() => setDraft((d) => ({ ...d, type: tp }))}
                      style={({ pressed }) => ({
                        paddingHorizontal: spacing.sm,
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
                          typography.caption,
                          { color: selected ? colors.brand : colors.text, fontWeight: selected ? '700' : '400' },
                        ]}
                      >
                        {t(`documents.types.${tp}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label={t('documents.titleField')}>
              <TextInput
                value={draft.title}
                onChangeText={(v) => setDraft((d) => ({ ...d, title: v }))}
                placeholder={t('documents.titlePlaceholder')}
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

            <Field label={t('documents.expiryDate')} error={!dateValid ? t('documents.invalidDate') : undefined}>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DateNumInput label="YYYY" value={draft.year} onChange={(v) => setDraft((d) => ({ ...d, year: v }))} maxLength={4} flex={2} />
                <DateNumInput label="MM" value={draft.month} onChange={(v) => setDraft((d) => ({ ...d, month: v }))} maxLength={2} flex={1} />
                <DateNumInput label="DD" value={draft.day} onChange={(v) => setDraft((d) => ({ ...d, day: v }))} maxLength={2} flex={1} />
              </View>
            </Field>

            <Field label={t('documents.remindBefore')}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                {REMIND_BEFORE_OPTIONS.map((opt) => {
                  const selected = draft.remindBeforeDays === opt;
                  return (
                    <Pressable
                      key={opt}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={t('documents.daysLeft', { days: opt })}
                      onPress={() => setDraft((d) => ({ ...d, remindBeforeDays: opt }))}
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
                        {opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Field>

            <Field label={t('documents.note')}>
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
                accessibilityLabel={t('documents.delete')}
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
                <Text style={[typography.callout, { color: colors.danger }]}>{t('documents.delete')}</Text>
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('documents.save')}
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
                {t('documents.save')}
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

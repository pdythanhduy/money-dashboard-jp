/**
 * Add / edit a single DocumentReminder. Date picker is intentionally
 * 3 plain number inputs (year / month / day) so we don't have to install
 * `@react-native-community/datetimepicker` — CLAUDE.md no-new-deps rule.
 */

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

import { isoFromYMD, ymdFromIso } from '@/features/documents/date-utils';
import { DEFAULT_NOTIFY_DAYS, useDocumentsStore } from '@/store/documentsStore';
import { useTheme } from '@/theme';
import { ALL_DOCUMENT_KINDS, type DocumentKind, type DocumentReminder } from '@/types/document';

interface Props {
  visible: boolean;
  editing: DocumentReminder | null;
  onClose: () => void;
}

const NOTIFY_OPTIONS = [30, 7, 1] as const;

interface DraftState {
  kind: DocumentKind;
  customName: string;
  year: string;
  month: string;
  day: string;
  notifyDaysBefore: number[];
  notes: string;
}

function emptyDraft(): DraftState {
  const now = new Date();
  return {
    kind: 'zairyu_card',
    customName: '',
    year: String(now.getFullYear() + 1),
    month: String(now.getMonth() + 1),
    day: String(now.getDate()),
    notifyDaysBefore: [...DEFAULT_NOTIFY_DAYS],
    notes: '',
  };
}

function draftFromDoc(doc: DocumentReminder): DraftState {
  const ymd = ymdFromIso(doc.expiryDate);
  return {
    kind: doc.kind,
    customName: doc.customName ?? '',
    year: ymd ? String(ymd.year) : '',
    month: ymd ? String(ymd.month) : '',
    day: ymd ? String(ymd.day) : '',
    notifyDaysBefore: doc.notifyDaysBefore.length > 0 ? [...doc.notifyDaysBefore] : [...DEFAULT_NOTIFY_DAYS],
    notes: doc.notes ?? '',
  };
}

function isValidDate(d: DraftState): boolean {
  const y = Number.parseInt(d.year, 10);
  const m = Number.parseInt(d.month, 10);
  const day = Number.parseInt(d.day, 10);
  if (![y, m, day].every((n) => Number.isFinite(n))) return false;
  if (y < 1900 || y > 2200) return false;
  if (m < 1 || m > 12) return false;
  const date = new Date(y, m - 1, day);
  return date.getDate() === day && date.getMonth() === m - 1 && date.getFullYear() === y;
}

export function DocumentEditModal({ visible, editing, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const addDocument = useDocumentsStore((s) => s.addDocument);
  const updateDocument = useDocumentsStore((s) => s.updateDocument);
  const removeDocument = useDocumentsStore((s) => s.removeDocument);

  const [draft, setDraft] = useState<DraftState>(() => emptyDraft());
  const [kindPickerOpen, setKindPickerOpen] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraft(editing ? draftFromDoc(editing) : emptyDraft());
    setKindPickerOpen(false);
  }, [visible, editing]);

  const dateValid = useMemo(() => isValidDate(draft), [draft]);
  const canSave = dateValid;

  const toggleNotify = (n: number) => {
    setDraft((d) => {
      const next = d.notifyDaysBefore.includes(n)
        ? d.notifyDaysBefore.filter((x) => x !== n)
        : [...d.notifyDaysBefore, n].sort((a, b) => b - a);
      return { ...d, notifyDaysBefore: next };
    });
  };

  const handleSave = () => {
    if (!canSave) return;
    const iso = isoFromYMD(
      Number.parseInt(draft.year, 10),
      Number.parseInt(draft.month, 10),
      Number.parseInt(draft.day, 10),
    );
    if (editing) {
      updateDocument(editing.id, {
        kind: draft.kind,
        customName: draft.customName.trim() || undefined,
        expiryDate: iso,
        notifyDaysBefore: draft.notifyDaysBefore.length > 0 ? draft.notifyDaysBefore : [...DEFAULT_NOTIFY_DAYS],
        notes: draft.notes.trim() || undefined,
      });
    } else {
      addDocument({
        kind: draft.kind,
        expiryDate: iso,
        customName: draft.customName.trim() || undefined,
        notifyDaysBefore: draft.notifyDaysBefore,
        notes: draft.notes.trim() || undefined,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!editing) return;
    removeDocument(editing.id);
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
            <Text style={[typography.title3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {editing ? t('documents.edit.title') : t('documents.add.title')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Kind picker */}
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {t('documents.kindLabel')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('documents.kindLabel')}
                onPress={() => setKindPickerOpen((v) => !v)}
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
                  {t(`documents.kinds.${draft.kind}`)}
                </Text>
                <Ionicons name={kindPickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
              </Pressable>
              {kindPickerOpen ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
                    backgroundColor: colors.surfaceElevated,
                    overflow: 'hidden',
                  }}
                >
                  {ALL_DOCUMENT_KINDS.map((k) => (
                    <Pressable
                      key={k}
                      accessibilityRole="button"
                      accessibilityState={{ selected: draft.kind === k }}
                      accessibilityLabel={t(`documents.kinds.${k}`)}
                      onPress={() => {
                        setDraft((d) => ({ ...d, kind: k }));
                        setKindPickerOpen(false);
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
                          { color: draft.kind === k ? colors.brand : colors.text, fontWeight: draft.kind === k ? '700' : '400' },
                        ]}
                      >
                        {t(`documents.kinds.${k}`)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>

            {/* Custom name */}
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {t('documents.nameLabel')}
              </Text>
              <TextInput
                value={draft.customName}
                onChangeText={(v) => setDraft((d) => ({ ...d, customName: v }))}
                placeholder={t(`documents.kinds.${draft.kind}`)}
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

            {/* Expiry date — 3 number inputs */}
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {t('documents.expiryLabel')}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <DateNumInput
                  label="YYYY"
                  value={draft.year}
                  onChange={(v) => setDraft((d) => ({ ...d, year: v }))}
                  maxLength={4}
                  flex={2}
                />
                <DateNumInput
                  label="MM"
                  value={draft.month}
                  onChange={(v) => setDraft((d) => ({ ...d, month: v }))}
                  maxLength={2}
                  flex={1}
                />
                <DateNumInput
                  label="DD"
                  value={draft.day}
                  onChange={(v) => setDraft((d) => ({ ...d, day: v }))}
                  maxLength={2}
                  flex={1}
                />
              </View>
              {!dateValid ? (
                <Text style={[typography.caption, { color: colors.danger }]}>
                  {t('documents.invalidDate')}
                </Text>
              ) : null}
            </View>

            {/* Notify toggles */}
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {t('documents.notifyLabel')}
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {NOTIFY_OPTIONS.map((n) => {
                  const selected = draft.notifyDaysBefore.includes(n);
                  return (
                    <Pressable
                      key={n}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={t(`documents.notifyOptions.${n}`)}
                      onPress={() => toggleNotify(n)}
                      style={({ pressed }) => ({
                        flex: 1,
                        minHeight: 44,
                        borderRadius: radius.pill,
                        borderWidth: 1,
                        borderColor: selected ? colors.brand : colors.border,
                        backgroundColor: selected ? colors.brandSubtle : colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text
                        style={[
                          typography.callout,
                          { color: selected ? colors.brand : colors.text, fontWeight: selected ? '700' : '400' },
                        ]}
                      >
                        {t(`documents.notifyOptions.${n}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Notes */}
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {t('documents.notesLabel')}
              </Text>
              <TextInput
                value={draft.notes}
                onChangeText={(v) => setDraft((d) => ({ ...d, notes: v }))}
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

/**
 * Two-step modal: paste backup JSON → preview summary → destructive
 * confirm → restore.
 *
 * Design notes:
 *   - No file picker. We avoid adding expo-document-picker — pasting the
 *     JSON keeps the offline-first promise intact and matches the
 *     bug-report copy-helper pattern.
 *   - Step 2 is informational only (counts per store + meta from payload).
 *     The confirm button is intentionally red and has a final tap-to-arm
 *     gesture so the user can't restore a stale backup by mistake.
 *   - The modal owns the parse/preview state; the parent only learns
 *     "restore done" via `onRestored` and shows a toast.
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  parseBackupJSON,
  restoreBackup,
  summarizeBackup,
  type BackupPayload,
  type BackupSummary,
} from '@/lib/backup';
import { useTheme } from '@/theme';

interface BackupImportModalProps {
  visible: boolean;
  onClose: () => void;
  onRestored: () => void;
}

type Step = 'paste' | 'preview' | 'restoring';
type ParseError = 'invalid-json' | 'invalid-shape' | 'incompatible-version';

export function BackupImportModal({ visible, onClose, onRestored }: BackupImportModalProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const [text, setText] = useState('');
  const [step, setStep] = useState<Step>('paste');
  const [payload, setPayload] = useState<BackupPayload | null>(null);
  const [summary, setSummary] = useState<BackupSummary | null>(null);
  const [error, setError] = useState<ParseError | null>(null);

  const handleClose = useCallback(() => {
    setText('');
    setStep('paste');
    setPayload(null);
    setSummary(null);
    setError(null);
    onClose();
  }, [onClose]);

  const handlePreview = useCallback(() => {
    const result = parseBackupJSON(text.trim());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPayload(result.payload);
    setSummary(summarizeBackup(result.payload));
    setError(null);
    setStep('preview');
  }, [text]);

  const handleConfirm = useCallback(async () => {
    if (!payload) return;
    setStep('restoring');
    try {
      await restoreBackup(payload);
      onRestored();
      handleClose();
    } catch {
      setStep('preview');
      setError('invalid-shape');
    }
  }, [payload, onRestored, handleClose]);

  const errorMsg = error ? t(`settings.backup.errors.${camelize(error)}`) : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(15,20,25,0.52)',
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View
            style={{
              margin: spacing.lg,
              padding: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              maxHeight: '90%',
              flex: 1,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.md,
              }}
            >
              <Text style={[typography.title3, { color: colors.text }]}>
                {t('settings.backup.import.title')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={handleClose}
                hitSlop={12}
              >
                <Text style={[typography.body, { color: colors.brand }]}>{t('common.close')}</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
              {step === 'paste' ? (
                <PasteStep
                  text={text}
                  onChangeText={setText}
                  errorMsg={errorMsg}
                  onPreview={handlePreview}
                />
              ) : null}

              {step === 'preview' && summary ? (
                <PreviewStep summary={summary} onConfirm={handleConfirm} errorMsg={errorMsg} />
              ) : null}

              {step === 'restoring' ? (
                <Text
                  style={[
                    typography.body,
                    { color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
                  ]}
                >
                  {t('settings.backup.import.restoring')}
                </Text>
              ) : null}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function PasteStep({
  text,
  onChangeText,
  errorMsg,
  onPreview,
}: {
  text: string;
  onChangeText: (v: string) => void;
  errorMsg: string | null;
  onPreview: () => void;
}) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const disabled = text.trim().length === 0;
  return (
    <View style={{ gap: spacing.md }}>
      <Text style={[typography.body, { color: colors.textSecondary }]}>
        {t('settings.backup.import.description')}
      </Text>
      <TextInput
        value={text}
        onChangeText={onChangeText}
        multiline
        numberOfLines={8}
        placeholder={t('settings.backup.import.placeholder')}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={t('settings.backup.import.textareaA11y')}
        style={{
          minHeight: 180,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.sm,
          padding: spacing.md,
          color: colors.text,
          textAlignVertical: 'top',
          fontSize: 14,
        }}
      />
      {errorMsg ? (
        <Text style={[typography.caption, { color: colors.danger }]}>{errorMsg}</Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        onPress={onPreview}
        disabled={disabled}
        style={({ pressed }) => ({
          backgroundColor: disabled ? colors.border : pressed ? colors.brandStrong : colors.brand,
          paddingVertical: spacing.md,
          borderRadius: radius.sm,
          alignItems: 'center',
        })}
      >
        <Text style={[typography.body, { color: colors.textInverse, fontWeight: '600' }]}>
          {t('settings.backup.import.previewCta')}
        </Text>
      </Pressable>
    </View>
  );
}

function PreviewStep({
  summary,
  onConfirm,
  errorMsg,
}: {
  summary: BackupSummary;
  onConfirm: () => void;
  errorMsg: string | null;
}) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const [armed, setArmed] = useState(false);

  return (
    <View style={{ gap: spacing.md }}>
      <View
        style={{
          backgroundColor: colors.background,
          borderRadius: radius.sm,
          padding: spacing.md,
          gap: spacing.xs,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <MetaRow label={t('settings.backup.import.meta.exportedAt')} value={formatDate(summary.exportedAt)} />
        <MetaRow
          label={t('settings.backup.import.meta.appVersion')}
          value={`${summary.appVersion} (${summary.appBuild})`}
        />
        <MetaRow
          label={t('settings.backup.import.meta.schemaVersion')}
          value={String(summary.schemaVersion)}
        />
      </View>

      <Text
        style={[
          typography.footnote,
          { color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
        ]}
      >
        {t('settings.backup.import.contents')}
      </Text>

      <View
        style={{
          backgroundColor: colors.background,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        {summary.rows.map((row, idx) => (
          <View
            key={row.label}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: spacing.md,
              borderTopWidth: idx === 0 ? 0 : 1,
              borderTopColor: colors.border,
              opacity: row.present ? 1 : 0.5,
            }}
          >
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
              {t(`settings.backup.stores.${row.label}`)}
            </Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              {!row.present
                ? t('settings.backup.import.notPresent')
                : row.count !== null
                  ? t('settings.backup.import.itemCount', { count: row.count })
                  : t('settings.backup.import.willOverwrite')}
            </Text>
          </View>
        ))}
      </View>

      <Text style={[typography.caption, { color: colors.danger }]}>
        {t('settings.backup.import.warning')}
      </Text>

      {errorMsg ? (
        <Text style={[typography.caption, { color: colors.danger }]}>{errorMsg}</Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => (armed ? void onConfirm() : setArmed(true))}
        style={({ pressed }) => ({
          backgroundColor: armed ? (pressed ? colors.danger : colors.danger) : colors.surface,
          borderWidth: 1,
          borderColor: colors.danger,
          paddingVertical: spacing.md,
          borderRadius: radius.sm,
          alignItems: 'center',
          opacity: armed && pressed ? 0.85 : 1,
        })}
      >
        <Text
          style={[
            typography.body,
            { color: armed ? colors.textInverse : colors.danger, fontWeight: '600' },
          ]}
        >
          {armed ? t('settings.backup.import.confirmFinal') : t('settings.backup.import.confirmArm')}
        </Text>
      </Pressable>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs / 2 }}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typography.caption, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function camelize(kebab: string): string {
  return kebab.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

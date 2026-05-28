import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_BUILD, APP_VERSION } from '@/lib/app-info';
import { useTheme } from '@/theme';

interface BugReportModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Pure-local bug report helper. Renders a pre-filled diagnostic text
 * block (app version + build + platform + locale + timestamp) inside a
 * read-only multiline TextInput so the user can long-press → Select
 * All → Copy via the system menu. We deliberately do NOT pull in a
 * clipboard module — `@react-native-clipboard/clipboard` would be a
 * new native dep, and React Native's built-in Clipboard was removed in
 * 0.74+. The text-modal fallback is universal + zero-dep.
 *
 * No network. The user is responsible for pasting into email / Github /
 * wherever they're reporting.
 */
export function BugReportModal({ visible, onClose }: BugReportModalProps) {
  const { t, i18n } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();

  // Re-build the diagnostic text every time the modal opens — captures
  // the current timestamp + active locale, which are the most useful
  // values to a maintainer triaging an incoming report.
  const diagnosticText = useMemo(() => {
    if (!visible) return '';
    return buildDiagnosticText(i18n.language);
  }, [visible, i18n.language]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
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
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: spacing.sm,
                gap: spacing.sm,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[typography.title3, { color: colors.text }]}>
                  {t('settings.bugReport.title')}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginTop: spacing.xs },
                  ]}
                >
                  {t('settings.bugReport.description')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={onClose}
                hitSlop={12}
                style={{
                  width: 32,
                  height: 32,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: spacing.sm }}
              showsVerticalScrollIndicator={false}
            >
              <Text
                style={[
                  typography.footnote,
                  {
                    color: colors.textSecondary,
                    marginBottom: spacing.xs,
                  },
                ]}
              >
                {t('settings.bugReport.copyHint')}
              </Text>
              <TextInput
                value={diagnosticText}
                multiline
                editable={false}
                selectTextOnFocus
                showSoftInputOnFocus={false}
                accessibilityLabel={t('settings.bugReport.textareaA11y')}
                style={{
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  padding: spacing.md,
                  backgroundColor: colors.background,
                  color: colors.text,
                  ...typography.footnote,
                  fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
                  minHeight: 240,
                  textAlignVertical: 'top',
                }}
              />
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/**
 * Pure: builds the diagnostic block. Exported for direct unit testing
 * so we don't depend on TextRenderer to verify the contents.
 */
export function buildDiagnosticText(locale: string, now: Date = new Date()): string {
  return [
    '=== Money Dashboard JP — Bug Report ===',
    `App version: ${APP_VERSION} (${APP_BUILD})`,
    `Platform: ${Platform.OS}${Platform.Version ? ` ${Platform.Version}` : ''}`,
    `Locale: ${locale}`,
    `Timestamp: ${now.toISOString()}`,
    '',
    '— Describe the issue here —',
    '',
    '',
    '— Steps to reproduce —',
    '1.',
    '2.',
    '3.',
    '',
    '— Expected behavior —',
    '',
    '',
    '— Actual behavior —',
    '',
  ].join('\n');
}

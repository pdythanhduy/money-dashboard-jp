import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type Step = 'warn' | 'confirm';

interface ClearDataConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const BULLET_KEYS = ['history', 'settings', 'calculator', 'onboarding'] as const;

export function ClearDataConfirmModal({
  visible,
  onClose,
  onConfirm,
}: ClearDataConfirmModalProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();

  const [step, setStep] = useState<Step>('warn');
  const [text, setText] = useState('');

  // Reset state every time the modal opens.
  useEffect(() => {
    if (visible) {
      setStep('warn');
      setText('');
    }
  }, [visible]);

  const expected = t('settings.clear.confirmWord');
  const canDelete = text.trim() === expected;

  const handleClose = () => {
    setStep('warn');
    setText('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(15,20,25,0.52)',
            justifyContent: 'center',
          }}
        >
          <SafeAreaView edges={['top', 'bottom']}>
            <View
              style={{
                margin: spacing.lg,
                padding: spacing.lg,
                borderRadius: radius.lg,
                backgroundColor: colors.surface,
                gap: spacing.md,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, paddingRight: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
                  <Ionicons name="warning" size={24} color={colors.danger} />
                  <Text style={[typography.title3, { color: colors.text, flex: 1 }]}>
                    {step === 'warn'
                      ? t('settings.clear.title')
                      : t('settings.clear.confirmTitle')}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                  onPress={handleClose}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: radius.pill,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.background,
                  }}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </Pressable>
              </View>

              {step === 'warn' ? (
                <>
                  <Text style={[typography.body, { color: colors.text }]}>
                    {t('settings.clear.warning')}
                  </Text>
                  <View style={{ gap: spacing.xs, paddingLeft: spacing.sm }}>
                    {BULLET_KEYS.map((k) => (
                      <View key={k} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
                        <Text style={[typography.body, { color: colors.danger }]}>•</Text>
                        <Text style={[typography.body, { color: colors.text, flex: 1 }]}>
                          {t(`settings.clear.items.${k}`)}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                    <ActionButton
                      label={t('common.cancel')}
                      onPress={handleClose}
                      variant="ghost"
                    />
                    <ActionButton
                      label={t('settings.clear.continueLabel')}
                      onPress={() => setStep('confirm')}
                      variant="danger"
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={[typography.callout, { color: colors.textSecondary }]}>
                    {t('settings.clear.confirmHint')}
                  </Text>
                  <TextInput
                    accessibilityLabel="clear-data-confirm-input"
                    value={text}
                    onChangeText={setText}
                    placeholder={t('settings.clear.confirmPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    style={{
                      minHeight: 50,
                      borderWidth: 1.5,
                      borderColor: canDelete ? colors.danger : colors.border,
                      borderRadius: radius.md,
                      paddingHorizontal: spacing.md,
                      color: colors.text,
                      ...typography.body,
                    }}
                  />

                  <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                    <ActionButton
                      label={t('common.cancel')}
                      onPress={handleClose}
                      variant="ghost"
                    />
                    <ActionButton
                      label={t('settings.clear.deleteButton')}
                      onPress={onConfirm}
                      variant="danger"
                      disabled={!canDelete}
                    />
                  </View>
                </>
              )}
            </View>
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ActionButton({
  label,
  onPress,
  variant,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  variant: 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  const isDanger = variant === 'danger';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 48,
        borderRadius: radius.md,
        backgroundColor: isDanger ? colors.danger : 'transparent',
        borderWidth: isDanger ? 0 : 1,
        borderColor: colors.border,
        opacity: disabled ? 0.4 : 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.md,
      }}
    >
      <Text
        style={[
          typography.callout,
          { color: isDanger ? '#fff' : colors.text, fontWeight: '600' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

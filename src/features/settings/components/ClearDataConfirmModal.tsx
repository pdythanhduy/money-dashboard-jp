/**
 * Two-stage data-wipe modal. Stage 1 explains what is about to disappear;
 * stage 2 requires the user to type the literal word "XÓA" (or "削除" if
 * Japanese is active) before the destructive button enables.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClearDataConfirmModal({ visible, onClose, onConfirm }: Props) {
  const { t, i18n } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const [stage, setStage] = useState<1 | 2>(1);
  const [typed, setTyped] = useState('');

  const requiredWord = i18n.language === 'ja' ? '削除' : 'XÓA';
  const canConfirm = typed.trim().toUpperCase() === requiredWord.toUpperCase();

  useEffect(() => {
    if (visible) {
      setStage(1);
      setTyped('');
    }
  }, [visible]);

  const items = [
    t('settings.clearData.items.history'),
    t('settings.clearData.items.lastCalculation'),
    t('settings.clearData.items.settings'),
    t('settings.clearData.items.onboarding'),
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
          <Text style={[typography.title2, { color: colors.danger, marginBottom: spacing.sm }]}>
            {t('settings.clearData.title')}
          </Text>
          <Text style={[typography.body, { color: colors.text, marginBottom: spacing.md }]}>
            {t(`settings.clearData.stage${stage}Body`)}
          </Text>

          {stage === 1 ? (
            <View
              style={{
                backgroundColor: colors.surfaceElevated,
                borderRadius: radius.md,
                padding: spacing.md,
                gap: spacing.xs,
                marginBottom: spacing.lg,
              }}
            >
              {items.map((item) => (
                <Text key={item} style={[typography.body, { color: colors.text }]}>
                  · {item}
                </Text>
              ))}
            </View>
          ) : (
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={[typography.footnote, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
                {t('settings.clearData.typePrompt', { word: requiredWord })}
              </Text>
              <TextInput
                value={typed}
                onChangeText={setTyped}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder={requiredWord}
                placeholderTextColor={colors.textSecondary}
                style={{
                  borderWidth: 1,
                  borderColor: canConfirm ? colors.danger : colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  color: colors.text,
                  fontSize: typography.body.fontSize,
                  backgroundColor: colors.surface,
                }}
              />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 50,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: colors.text }]}>{t('common.cancel')}</Text>
            </Pressable>
            {stage === 1 ? (
              <Pressable
                onPress={() => setStage(2)}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 50,
                  borderRadius: radius.sm,
                  backgroundColor: colors.warning,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={[typography.callout, { color: '#fff', fontWeight: '600' }]}>
                  {t('settings.clearData.continue')}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={canConfirm ? onConfirm : undefined}
                disabled={!canConfirm}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: 50,
                  borderRadius: radius.sm,
                  backgroundColor: canConfirm ? colors.danger : colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={[typography.callout, { color: '#fff', fontWeight: '700' }]}>
                  {t('settings.clearData.confirmFinal')}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
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

import { formatCurrency } from '@/lib/format';
import { useRemittanceStore } from '@/store/remittanceStore';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const SUGGESTIONS = [
  { key: '500k' as const, value: 500_000 },
  { key: '1m' as const, value: 1_000_000 },
  { key: '2m' as const, value: 2_000_000 },
];

function parseYen(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

export function AnnualGoalModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const annualGoalJPY = useRemittanceStore((s) => s.annualGoalJPY);
  const setAnnualGoal = useRemittanceStore((s) => s.setAnnualGoal);

  const [input, setInput] = useState(() => (annualGoalJPY > 0 ? String(annualGoalJPY) : ''));

  useEffect(() => {
    if (!visible) return;
    setInput(annualGoalJPY > 0 ? String(annualGoalJPY) : '');
  }, [visible, annualGoalJPY]);

  const value = parseYen(input);

  const handleSave = () => {
    setAnnualGoal(value);
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
              {t('remittance.goal.set')}
            </Text>
            <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>{t('remittance.goal.target')}</Text>
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
                  value={input.replace(/[^\d]/g, '')}
                  onChangeText={(v) => setInput(v.replace(/[^\d]/g, ''))}
                  placeholder="1000000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
                />
              </View>
              {value > 0 ? (
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  = {formatCurrency(value)}
                </Text>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {SUGGESTIONS.map((s) => (
                <Pressable
                  key={s.key}
                  accessibilityRole="button"
                  accessibilityLabel={t(`remittance.goal.suggestion.${s.key}`)}
                  onPress={() => setInput(String(s.value))}
                  style={({ pressed }) => ({
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: input === String(s.value) ? colors.brand : colors.border,
                    backgroundColor: input === String(s.value) ? colors.brandSubtle : colors.surface,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={[typography.callout, { color: input === String(s.value) ? colors.brand : colors.text }]}>
                    {t(`remittance.goal.suggestion.${s.key}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('remittance.actions.save')}
              onPress={handleSave}
              style={({ pressed }) => ({
                minHeight: 50,
                borderRadius: radius.sm,
                backgroundColor: colors.brand,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: colors.textInverse, fontWeight: '600' }]}>
                {t('remittance.actions.save')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

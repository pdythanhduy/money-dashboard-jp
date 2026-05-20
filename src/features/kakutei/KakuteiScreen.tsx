import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AutoDeductionsStep } from '@/features/kakutei/components/AutoDeductionsStep';
import { FiscalYearStep } from '@/features/kakutei/components/FiscalYearStep';
import { IncomeStep } from '@/features/kakutei/components/IncomeStep';
import { ManualDeductionsStep } from '@/features/kakutei/components/ManualDeductionsStep';
import { StepIndicator } from '@/features/kakutei/components/StepIndicator';
import { SummaryStep } from '@/features/kakutei/components/SummaryStep';
import { useTheme } from '@/theme';

const TOTAL_STEPS = 5;

export function KakuteiScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const [step, setStep] = useState(1);

  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const goBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xs,
          gap: spacing.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[typography.largeTitle, { color: colors.text }]}>{t('kakutei.title')}</Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>{t('kakutei.subtitle')}</Text>
        </View>
      </View>

      <StepIndicator current={step} total={TOTAL_STEPS} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingVertical: spacing.md, paddingBottom: spacing.xxl }}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 ? <FiscalYearStep /> : null}
          {step === 2 ? <IncomeStep /> : null}
          {step === 3 ? <AutoDeductionsStep /> : null}
          {step === 4 ? <ManualDeductionsStep /> : null}
          {step === 5 ? <SummaryStep /> : null}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('kakutei.steps.back')}
            accessibilityState={{ disabled: step === 1 }}
            disabled={step === 1}
            onPress={goBack}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 50,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: step === 1 ? 0.4 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={[typography.callout, { color: colors.text, fontWeight: '600' }]}>
              {t('kakutei.steps.back')}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('kakutei.steps.next')}
            accessibilityState={{ disabled: step === TOTAL_STEPS }}
            disabled={step === TOTAL_STEPS}
            onPress={goNext}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 50,
              borderRadius: radius.sm,
              backgroundColor: step === TOTAL_STEPS ? colors.border : colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={[
                typography.callout,
                { color: step === TOTAL_STEPS ? colors.textSecondary : colors.textInverse, fontWeight: '600' },
              ]}
            >
              {t('kakutei.steps.next')}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

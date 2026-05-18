import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { BreakdownList } from '@/features/calculator/components/BreakdownList';
import { ResultCard } from '@/features/calculator/components/ResultCard';
import { SalaryForm } from '@/features/calculator/components/SalaryForm';
import { useCalculator } from '@/features/calculator/hooks/useCalculator';
import { useTheme } from '@/theme';

export function CalculatorScreen() {
  const calculator = useCalculator();
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  if (calculator.mode === 'input' || !calculator.result) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <Text style={[typography.largeTitle, { color: colors.text }]}>
              {t('screens.calculator.title')}
            </Text>
          </View>
          <SalaryForm calculator={calculator} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.xl,
            gap: spacing.lg,
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={calculator.editInput}
            style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, alignSelf: 'flex-start' }}
          >
            <Ionicons name="chevron-back" size={22} color={colors.brand} />
            <Text style={[typography.body, { color: colors.brand }]}>
              {t('calculator.actions.editInput')}
            </Text>
          </Pressable>

          <ResultCard result={calculator.result} />
          <BreakdownList result={calculator.result} input={calculator.submittedInput} />

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => console.log('[Calculator] save history stub')}
              style={{
                flex: 1,
                minHeight: 50,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: spacing.sm,
              }}
            >
              <Text style={[typography.callout, { color: colors.text, textAlign: 'center' }]}>
                {t('calculator.actions.saveHistory')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={calculator.editInput}
              style={{
                flex: 1,
                minHeight: 50,
                borderRadius: radius.sm,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: spacing.sm,
              }}
            >
              <Text style={[typography.callout, { color: colors.textInverse, textAlign: 'center' }]}>
                {t('calculator.actions.recalculate')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

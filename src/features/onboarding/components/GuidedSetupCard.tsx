/**
 * "What to do first" hub for brand-new users — shows once after the
 * welcome onboarding finishes, on the Dashboard. Each row navigates the
 * user to the relevant feature and marks itself complete when the
 * parent confirms (via `markStepComplete`). All-complete OR the close
 * button dismisses it permanently.
 *
 * Hidden when:
 *   - welcome onboarding not done (parent guards on `hasCompletedOnboarding`)
 *   - user has already dismissed (`hasSeenGuidedSetup === true`)
 *   - all 5 steps complete (auto-finishes itself, set on render)
 *
 * Settings exposes "Hiện lại hướng dẫn ban đầu" → `resetGuidedSetup()`
 * to bring this card back.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { GUIDED_SETUP_STEPS, useOnboardingStore, type GuidedSetupStep } from '@/store/onboardingStore';
import { useTheme } from '@/theme';

export interface GuidedSetupHandlers {
  /** CTA: "Tính lương" — navigate to Calculator. */
  onSalary: () => void;
  /** CTA: "Thêm chi phí" — navigate to Kakeibo (recurring section). */
  onFixedCosts: () => void;
  /** CTA: "Đặt budget" — navigate to Kakeibo (budget editor). */
  onBudget: () => void;
  /** CTA: "Thêm giấy tờ" — navigate to Documents. */
  onDocuments: () => void;
  /** CTA: "Bắt đầu" — navigate to Kakeibo for daily entry. */
  onDailyTracking: () => void;
}

const STEP_ICONS: Record<GuidedSetupStep, keyof typeof Ionicons.glyphMap> = {
  salary: 'calculator-outline',
  fixedCosts: 'repeat-outline',
  budget: 'wallet-outline',
  documents: 'document-text-outline',
  dailyTracking: 'add-circle-outline',
};

export function GuidedSetupCard(handlers: GuidedSetupHandlers) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const hasSeenGuidedSetup = useOnboardingStore((s) => s.hasSeenGuidedSetup);
  const completedSteps = useOnboardingStore((s) => s.completedSteps);
  const markStepComplete = useOnboardingStore((s) => s.markStepComplete);
  const skipGuidedSetup = useOnboardingStore((s) => s.skipGuidedSetup);
  const completeGuidedSetup = useOnboardingStore((s) => s.completeGuidedSetup);

  const doneCount = completedSteps.length;
  const total = GUIDED_SETUP_STEPS.length;
  const allDone = doneCount >= total;

  // When the user marks the last step, auto-dismiss on the next render
  // pass so the card animates out and never re-appears.
  useEffect(() => {
    if (allDone && !hasSeenGuidedSetup) completeGuidedSetup();
  }, [allDone, hasSeenGuidedSetup, completeGuidedSetup]);

  if (!hasCompletedOnboarding || hasSeenGuidedSetup) return null;

  const stepHandler: Record<GuidedSetupStep, () => void> = {
    salary: handlers.onSalary,
    fixedCosts: handlers.onFixedCosts,
    budget: handlers.onBudget,
    documents: handlers.onDocuments,
    dailyTracking: handlers.onDailyTracking,
  };

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
      }}
      accessibilityLabel={t('onboarding.guidedSetup.title')}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.headline, { color: colors.text }]}>
            {t('onboarding.guidedSetup.title')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {t('onboarding.guidedSetup.subtitle')} ·{' '}
            {t('onboarding.guidedSetup.stepCountDone', { done: doneCount, total })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('onboarding.guidedSetup.dismiss')}
          onPress={skipGuidedSetup}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1, padding: 4 })}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {GUIDED_SETUP_STEPS.map((step, i) => {
        const done = completedSteps.includes(step);
        return (
          <View
            key={step}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              paddingTop: spacing.xs,
              opacity: done ? 0.5 : 1,
            }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: done ? colors.success : colors.brandSubtle,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {done ? (
                <Ionicons name="checkmark" size={16} color={colors.textInverse} />
              ) : (
                <Text style={[typography.caption, { color: colors.brand, fontWeight: '700' }]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.callout, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
                {t(`onboarding.guidedSetup.steps.${step}.title`)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={2}>
                {t(`onboarding.guidedSetup.steps.${step}.body`)}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(`onboarding.guidedSetup.steps.${step}.cta`)}
              onPress={() => {
                markStepComplete(step);
                stepHandler[step]();
              }}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
                borderRadius: radius.pill,
                borderWidth: 1,
                borderColor: colors.brand,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name={STEP_ICONS[step]} size={14} color={colors.brand} />
                <Text style={[typography.caption, { color: colors.brand, fontWeight: '600' }]}>
                  {t(`onboarding.guidedSetup.steps.${step}.cta`)}
                </Text>
              </View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

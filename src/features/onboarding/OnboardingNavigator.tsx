/**
 * 4-slide onboarding flow rendered as a single screen — we control which
 * slide shows from `useOnboardingStore.currentSlide` rather than mounting
 * a real stack navigator. That's simpler than configuring 4 routes and
 * keeps the "skip" / "finish" paths trivial.
 *
 * Pending picks from slide 4 are kept in local state and only committed
 * to `settingsStore` on Finish. Skip writes spec defaults: Tokyo / 25 /
 * system language.
 */

import { useState } from 'react';

import { FeatureShowcaseScreen } from '@/features/onboarding/screens/FeatureShowcaseScreen';
import { InitialSetupScreen } from '@/features/onboarding/screens/InitialSetupScreen';
import { WelcomeScreen } from '@/features/onboarding/screens/WelcomeScreen';
import {
  ONBOARDING_SLIDE_COUNT,
  useOnboardingStore,
} from '@/store/onboardingStore';
import {
  DEFAULT_SETTINGS,
  useSettingsStore,
  type LanguageSetting,
} from '@/store/settingsStore';
import type { Prefecture } from '@/types/tax';

export function OnboardingNavigator() {
  const currentSlide = useOnboardingStore((s) => s.currentSlide);
  const setSlide = useOnboardingStore((s) => s.setSlide);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const [pendingPrefecture, setPendingPrefecture] = useState<Prefecture | null>(
    settings.defaultPrefecture,
  );
  const [pendingPayday, setPendingPayday] = useState<number>(settings.payday);
  const [pendingLanguage, setPendingLanguage] = useState<LanguageSetting>(settings.language);

  const next = () => setSlide(Math.min(currentSlide + 1, ONBOARDING_SLIDE_COUNT - 1));
  const back = () => setSlide(Math.max(currentSlide - 1, 0));
  const jumpToSlide = (i: number) => setSlide(i);

  const applyDefaultsAndComplete = () => {
    // Used by the Skip button on slides 1–3.
    updateSetting('defaultPrefecture', 'tokyo');
    updateSetting('payday', DEFAULT_SETTINGS.payday);
    updateSetting('language', DEFAULT_SETTINGS.language);
    completeOnboarding();
  };

  const finishWithPending = () => {
    updateSetting('defaultPrefecture', pendingPrefecture ?? 'tokyo');
    updateSetting('payday', pendingPayday);
    updateSetting('language', pendingLanguage);
    completeOnboarding();
  };

  if (currentSlide === 0) {
    return (
      <WelcomeScreen onNext={next} onSkip={applyDefaultsAndComplete} onJumpToSlide={jumpToSlide} />
    );
  }
  if (currentSlide === 1 || currentSlide === 2) {
    return (
      <FeatureShowcaseScreen
        slideIndex={currentSlide}
        onNext={next}
        onBack={back}
        onSkip={applyDefaultsAndComplete}
        onJumpToSlide={jumpToSlide}
      />
    );
  }
  return (
    <InitialSetupScreen
      prefecture={pendingPrefecture}
      payday={pendingPayday}
      language={pendingLanguage}
      onChangePrefecture={setPendingPrefecture}
      onChangePayday={setPendingPayday}
      onChangeLanguage={setPendingLanguage}
      onBack={back}
      onSkip={applyDefaultsAndComplete}
      onJumpToSlide={jumpToSlide}
      onFinish={finishWithPending}
    />
  );
}

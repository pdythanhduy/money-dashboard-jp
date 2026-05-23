/**
 * Onboarding completion flag + slide pointer.
 *
 * `hasCompletedOnboarding` gates RootNavigator: false → OnboardingNavigator,
 * true → MainTabs. Persisted so the welcome flow only ever runs once per
 * install.
 *
 * `currentSlide` is just UI scratch state for the swipe-able welcome
 * onboarding — it persists too so a partial flow can resume on re-open
 * before completion.
 *
 * `hasSeenGuidedSetup` + `completedSteps` drive the Dashboard's
 * `GuidedSetupCard`, which shows a 5-step "what to do first" hub for
 * brand-new users *after* the welcome flow finishes. Persisted so the
 * card never re-appears once the user dismisses it. Settings exposes a
 * "Show onboarding again" entry that flips the flag back to false via
 * `resetGuidedSetup()`.
 *
 * `reset()` is dev-only escape hatch surfaced in Settings → Dữ liệu when
 * `__DEV__`. Wipes welcome flag + slide + guided-setup state.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingStore {
  hasCompletedOnboarding: boolean;
  currentSlide: number;
  /** True once the user has interacted with the GuidedSetupCard (skip or finish). */
  hasSeenGuidedSetup: boolean;
  /** Slugs of the guided-setup steps the user has marked done. */
  completedSteps: string[];

  completeOnboarding: () => void;
  setSlide: (n: number) => void;

  /** Mark one of the GuidedSetupCard steps as done. Idempotent. */
  markStepComplete: (step: string) => void;
  /** User dismissed the GuidedSetupCard without finishing — never show again. */
  skipGuidedSetup: () => void;
  /** User finished all steps OR pressed "Đã hiểu" — never show again. */
  completeGuidedSetup: () => void;
  /** Settings → "Show onboarding again" — re-surface the card. */
  resetGuidedSetup: () => void;

  /** Dev-only full reset including welcome flow. */
  reset: () => void;
}

export const ONBOARDING_SLIDE_COUNT = 4;

export const GUIDED_SETUP_STEPS = [
  'salary',
  'fixedCosts',
  'budget',
  'documents',
  'dailyTracking',
] as const;
export type GuidedSetupStep = (typeof GUIDED_SETUP_STEPS)[number];

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set, get) => ({
      hasCompletedOnboarding: false,
      currentSlide: 0,
      hasSeenGuidedSetup: false,
      completedSteps: [],

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      setSlide: (n) => {
        const clamped = Math.max(0, Math.min(ONBOARDING_SLIDE_COUNT - 1, Math.floor(n)));
        set({ currentSlide: clamped });
      },

      markStepComplete: (step) => {
        const current = get().completedSteps;
        if (current.includes(step)) return;
        set({ completedSteps: [...current, step] });
      },

      skipGuidedSetup: () => set({ hasSeenGuidedSetup: true }),
      completeGuidedSetup: () => set({ hasSeenGuidedSetup: true }),

      resetGuidedSetup: () => set({ hasSeenGuidedSetup: false, completedSteps: [] }),

      reset: () =>
        set({
          hasCompletedOnboarding: false,
          currentSlide: 0,
          hasSeenGuidedSetup: false,
          completedSteps: [],
        }),
    }),
    {
      name: 'kakei-onboarding-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        currentSlide: state.currentSlide,
        hasSeenGuidedSetup: state.hasSeenGuidedSetup,
        completedSteps: state.completedSteps,
      }),
    },
  ),
);

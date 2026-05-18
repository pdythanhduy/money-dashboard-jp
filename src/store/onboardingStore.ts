/**
 * Onboarding completion flag + slide pointer.
 *
 * `hasCompletedOnboarding` gates RootNavigator: false → OnboardingNavigator,
 * true → MainTabs. Persisted so the flow only ever runs once per install.
 *
 * `currentSlide` is just UI scratch state for the swipe-able onboarding —
 * it persists too so a partial flow can resume on re-open before completion.
 *
 * `reset()` is dev-only escape hatch surfaced in Settings → Dữ liệu when
 * `__DEV__`. Wipes both flag + slide.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface OnboardingStore {
  hasCompletedOnboarding: boolean;
  currentSlide: number;
  completeOnboarding: () => void;
  setSlide: (n: number) => void;
  reset: () => void;
}

export const ONBOARDING_SLIDE_COUNT = 4;

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      currentSlide: 0,

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      setSlide: (n) => {
        const clamped = Math.max(0, Math.min(ONBOARDING_SLIDE_COUNT - 1, Math.floor(n)));
        set({ currentSlide: clamped });
      },

      reset: () => set({ hasCompletedOnboarding: false, currentSlide: 0 }),
    }),
    {
      name: 'kakei-onboarding-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        currentSlide: state.currentSlide,
      }),
    },
  ),
);

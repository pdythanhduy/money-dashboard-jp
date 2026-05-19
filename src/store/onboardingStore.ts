/**
 * Onboarding state. `hasCompletedOnboarding` controls the root navigator
 * branch — false routes to OnboardingNavigator, true routes to MainTabs.
 *
 * `currentSlide` is persisted so a user who background-quits halfway
 * through resumes where they left off.
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

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      currentSlide: 0,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setSlide: (n) => set({ currentSlide: n }),
      reset: () => set({ hasCompletedOnboarding: false, currentSlide: 0 }),
    }),
    {
      name: 'money-dashboard-jp-onboarding-v1',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

jest.mock('@react-native-async-storage/async-storage', () => {
  let storage: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((k: string) => Promise.resolve(storage[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        storage[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete storage[k];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storage = {};
        return Promise.resolve();
      }),
    },
  };
});

import { useOnboardingStore } from '@/store/onboardingStore';

beforeEach(() => {
  useOnboardingStore.setState({ hasCompletedOnboarding: false, currentSlide: 0 });
});

describe('onboardingStore', () => {
  it('starts not completed at slide 0', () => {
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(false);
    expect(useOnboardingStore.getState().currentSlide).toBe(0);
  });
  it('completeOnboarding flips the flag', () => {
    useOnboardingStore.getState().completeOnboarding();
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(true);
  });
  it('setSlide updates the current slide', () => {
    useOnboardingStore.getState().setSlide(2);
    expect(useOnboardingStore.getState().currentSlide).toBe(2);
  });
  it('reset wipes both flags', () => {
    useOnboardingStore.getState().completeOnboarding();
    useOnboardingStore.getState().setSlide(3);
    useOnboardingStore.getState().reset();
    const s = useOnboardingStore.getState();
    expect(s.hasCompletedOnboarding).toBe(false);
    expect(s.currentSlide).toBe(0);
  });
});

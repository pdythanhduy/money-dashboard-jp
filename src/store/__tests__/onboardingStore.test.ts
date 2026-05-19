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

import { ONBOARDING_SLIDE_COUNT, useOnboardingStore } from '@/store/onboardingStore';

beforeEach(() => {
  useOnboardingStore.setState({ hasCompletedOnboarding: false, currentSlide: 0 });
});

describe('onboardingStore.defaults', () => {
  it('starts with completion=false and slide=0', () => {
    const s = useOnboardingStore.getState();
    expect(s.hasCompletedOnboarding).toBe(false);
    expect(s.currentSlide).toBe(0);
  });

  it('exposes the slide count constant', () => {
    expect(ONBOARDING_SLIDE_COUNT).toBe(4);
  });
});

describe('onboardingStore.completeOnboarding', () => {
  it('flips completion to true', () => {
    useOnboardingStore.getState().completeOnboarding();
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(true);
  });

  it('does not change current slide', () => {
    useOnboardingStore.setState({ currentSlide: 2 });
    useOnboardingStore.getState().completeOnboarding();
    expect(useOnboardingStore.getState().currentSlide).toBe(2);
  });
});

describe('onboardingStore.setSlide', () => {
  it('clamps below 0 to 0', () => {
    useOnboardingStore.getState().setSlide(-3);
    expect(useOnboardingStore.getState().currentSlide).toBe(0);
  });

  it('clamps above max to max', () => {
    useOnboardingStore.getState().setSlide(99);
    expect(useOnboardingStore.getState().currentSlide).toBe(ONBOARDING_SLIDE_COUNT - 1);
  });

  it('accepts in-range integers', () => {
    useOnboardingStore.getState().setSlide(2);
    expect(useOnboardingStore.getState().currentSlide).toBe(2);
  });

  it('floors fractional input', () => {
    useOnboardingStore.getState().setSlide(1.9);
    expect(useOnboardingStore.getState().currentSlide).toBe(1);
  });
});

describe('onboardingStore.reset', () => {
  it('wipes completion + slide back to defaults', () => {
    useOnboardingStore.setState({ hasCompletedOnboarding: true, currentSlide: 3 });
    useOnboardingStore.getState().reset();
    const s = useOnboardingStore.getState();
    expect(s.hasCompletedOnboarding).toBe(false);
    expect(s.currentSlide).toBe(0);
  });
});

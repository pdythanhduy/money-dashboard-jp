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
  useOnboardingStore.setState({
    hasCompletedOnboarding: false,
    currentSlide: 0,
    hasSeenGuidedSetup: false,
    completedSteps: [],
  });
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

  it('also clears guided-setup state', () => {
    useOnboardingStore.setState({
      hasSeenGuidedSetup: true,
      completedSteps: ['salary', 'budget'],
    });
    useOnboardingStore.getState().reset();
    const s = useOnboardingStore.getState();
    expect(s.hasSeenGuidedSetup).toBe(false);
    expect(s.completedSteps).toEqual([]);
  });
});

describe('onboardingStore.markStepComplete', () => {
  it('appends the step on first call', () => {
    useOnboardingStore.getState().markStepComplete('salary');
    expect(useOnboardingStore.getState().completedSteps).toEqual(['salary']);
  });

  it('is idempotent — second call with the same step is a no-op', () => {
    useOnboardingStore.getState().markStepComplete('salary');
    useOnboardingStore.getState().markStepComplete('salary');
    expect(useOnboardingStore.getState().completedSteps).toEqual(['salary']);
  });

  it('keeps step order across distinct calls', () => {
    useOnboardingStore.getState().markStepComplete('salary');
    useOnboardingStore.getState().markStepComplete('budget');
    useOnboardingStore.getState().markStepComplete('documents');
    expect(useOnboardingStore.getState().completedSteps).toEqual(['salary', 'budget', 'documents']);
  });
});

describe('onboardingStore.skipGuidedSetup / completeGuidedSetup', () => {
  it('skipGuidedSetup flips hasSeenGuidedSetup to true', () => {
    useOnboardingStore.getState().skipGuidedSetup();
    expect(useOnboardingStore.getState().hasSeenGuidedSetup).toBe(true);
  });

  it('completeGuidedSetup also flips hasSeenGuidedSetup to true', () => {
    useOnboardingStore.getState().completeGuidedSetup();
    expect(useOnboardingStore.getState().hasSeenGuidedSetup).toBe(true);
  });

  it('skipGuidedSetup does not clear completedSteps progress', () => {
    useOnboardingStore.getState().markStepComplete('salary');
    useOnboardingStore.getState().skipGuidedSetup();
    expect(useOnboardingStore.getState().completedSteps).toEqual(['salary']);
  });
});

describe('onboardingStore.resetGuidedSetup', () => {
  it('clears both hasSeenGuidedSetup and completedSteps so the card shows again', () => {
    useOnboardingStore.setState({
      hasSeenGuidedSetup: true,
      completedSteps: ['salary', 'budget'],
    });
    useOnboardingStore.getState().resetGuidedSetup();
    const s = useOnboardingStore.getState();
    expect(s.hasSeenGuidedSetup).toBe(false);
    expect(s.completedSteps).toEqual([]);
  });

  it('does NOT reset the welcome onboarding flag', () => {
    useOnboardingStore.setState({ hasCompletedOnboarding: true, hasSeenGuidedSetup: true });
    useOnboardingStore.getState().resetGuidedSetup();
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(true);
  });
});

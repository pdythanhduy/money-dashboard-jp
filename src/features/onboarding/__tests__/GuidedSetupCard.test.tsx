import React from 'react';

import '@/lib/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react') as typeof React;
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, `icon:${name}`),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void | Promise<void>) => void;
  create: (el: React.ReactElement) => {
    unmount: () => void;
    toJSON: () => unknown;
    root: { findAll: (predicate: (n: { props: Record<string, unknown> }) => boolean) => Array<{ props: { onPress?: () => void } }> };
  };
};

import {
  GuidedSetupCard,
  type GuidedSetupHandlers,
} from '@/features/onboarding/components/GuidedSetupCard';
import { useOnboardingStore } from '@/store/onboardingStore';
import { ThemeProvider } from '@/theme';

function handlers(): GuidedSetupHandlers {
  return {
    onSalary: jest.fn(),
    onFixedCosts: jest.fn(),
    onBudget: jest.fn(),
    onDocuments: jest.fn(),
    onDailyTracking: jest.fn(),
  };
}

function renderTree(el: React.ReactElement) {
  let r!: ReturnType<typeof TestRenderer.create>;
  TestRenderer.act(() => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r;
}

function snap(r: ReturnType<typeof TestRenderer.create>): string {
  return JSON.stringify(r.toJSON());
}

function findPressableByLabel(
  r: ReturnType<typeof TestRenderer.create>,
  label: string,
): { props: { onPress?: () => void } } {
  const matches = r.root.findAll(
    (n) => n.props.accessibilityLabel === label && typeof n.props.onPress === 'function',
  );
  if (matches.length === 0) throw new Error(`No Pressable with label "${label}"`);
  return matches[0]!;
}

beforeEach(() => {
  useOnboardingStore.setState({
    hasCompletedOnboarding: false,
    hasSeenGuidedSetup: false,
    completedSteps: [],
    currentSlide: 0,
  });
});

describe('GuidedSetupCard', () => {
  it('does NOT render before welcome onboarding is complete', () => {
    const h = handlers();
    const r = renderTree(<GuidedSetupCard {...h} />);
    expect(r.toJSON()).toBeNull();
    TestRenderer.act(() => r.unmount());
  });

  it('does NOT render after the user has already dismissed it', () => {
    useOnboardingStore.setState({ hasCompletedOnboarding: true, hasSeenGuidedSetup: true });
    const h = handlers();
    const r = renderTree(<GuidedSetupCard {...h} />);
    expect(r.toJSON()).toBeNull();
    TestRenderer.act(() => r.unmount());
  });

  it('renders all 5 steps and a step counter when welcome is done + not yet seen', () => {
    useOnboardingStore.setState({ hasCompletedOnboarding: true, hasSeenGuidedSetup: false });
    const h = handlers();
    const r = renderTree(<GuidedSetupCard {...h} />);
    const tree = snap(r);
    expect(tree).toContain('Bắt đầu cùng Kakei');
    expect(tree).toContain('0/5 đã xong');
    expect(tree).toContain('Tính lương');
    expect(tree).toContain('Thêm chi phí');
    expect(tree).toContain('Đặt budget');
    expect(tree).toContain('Thêm giấy tờ');
    expect(tree).toContain('Bắt đầu');
    TestRenderer.act(() => r.unmount());
  });

  it('tapping a CTA marks the step complete and fires the handler', () => {
    useOnboardingStore.setState({ hasCompletedOnboarding: true, hasSeenGuidedSetup: false });
    const h = handlers();
    const r = renderTree(<GuidedSetupCard {...h} />);
    const salaryBtn = findPressableByLabel(r, 'Tính lương');
    TestRenderer.act(() => {
      salaryBtn.props.onPress?.();
    });
    expect(h.onSalary).toHaveBeenCalledTimes(1);
    expect(useOnboardingStore.getState().completedSteps).toEqual(['salary']);
    TestRenderer.act(() => r.unmount());
  });

  it('Đóng (dismiss) flips hasSeenGuidedSetup and hides the card', () => {
    useOnboardingStore.setState({ hasCompletedOnboarding: true, hasSeenGuidedSetup: false });
    const h = handlers();
    const r = renderTree(<GuidedSetupCard {...h} />);
    const close = findPressableByLabel(r, 'Đóng');
    TestRenderer.act(() => {
      close.props.onPress?.();
    });
    expect(useOnboardingStore.getState().hasSeenGuidedSetup).toBe(true);
    // Re-render with the same store state — card now returns null.
    const r2 = renderTree(<GuidedSetupCard {...handlers()} />);
    expect(r2.toJSON()).toBeNull();
    TestRenderer.act(() => r2.unmount());
    TestRenderer.act(() => r.unmount());
  });

  it('auto-completes (sets hasSeenGuidedSetup=true) when all 5 steps are marked done', () => {
    useOnboardingStore.setState({
      hasCompletedOnboarding: true,
      hasSeenGuidedSetup: false,
      completedSteps: ['salary', 'fixedCosts', 'budget', 'documents', 'dailyTracking'],
    });
    const h = handlers();
    const r = renderTree(<GuidedSetupCard {...h} />);
    expect(useOnboardingStore.getState().hasSeenGuidedSetup).toBe(true);
    TestRenderer.act(() => r.unmount());
  });
});

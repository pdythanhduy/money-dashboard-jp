import React from 'react';

import '@/lib/i18n';

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

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `sub-${++n}`) };
});

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react') as typeof React;
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void | Promise<void>) => void;
  create: (el: React.ReactElement) => { unmount: () => void; toJSON: () => unknown };
};

import { AddSavingsModal } from '@/features/goals/components/AddSavingsModal';
import { GoalDetailModal } from '@/features/goals/components/GoalDetailModal';
import { useGoalsStore } from '@/store/goalsStore';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let r!: ReturnType<typeof TestRenderer.create>;
  TestRenderer.act(() => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r;
}

function snapshotText(r: ReturnType<typeof TestRenderer.create>): string {
  return JSON.stringify(r.toJSON());
}

beforeEach(() => {
  useGoalsStore.setState({ goals: [] });
});

describe('GoalDetailModal — store subscription', () => {
  it('re-renders savedAmount + progress when addSavings mutates the store', () => {
    // Seed a goal with one ¥1,000 contribution.
    const seed = useGoalsStore.getState().addGoal({
      title: 'Mua iPhone',
      icon: 'phone',
      targetAmount: 100_000,
    });
    const goalId = seed.goal!.id;
    useGoalsStore.getState().addSavings(goalId, { amount: 1_000, date: '2026-05-21' });

    const r = renderTree(
      <GoalDetailModal
        visible
        goalId={goalId}
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onAddSavings={jest.fn()}
      />,
    );
    // Before: ¥1,000 saved → 1% progress
    expect(snapshotText(r)).toContain('¥1,000');
    expect(snapshotText(r)).toContain('1%');

    // Mutate the store while the modal stays mounted.
    TestRenderer.act(() => {
      useGoalsStore.getState().addSavings(goalId, { amount: 5_000, date: '2026-05-22' });
    });

    // After: ¥6,000 saved, 6% progress, rendered without remount.
    const after = snapshotText(r);
    expect(after).toContain('¥6,000');
    expect(after).toContain('6%');
    TestRenderer.act(() => r.unmount());
  });

  it('renders an empty modal when goalId does not match any goal in the store', () => {
    const r = renderTree(
      <GoalDetailModal
        visible
        goalId="does-not-exist"
        onClose={jest.fn()}
        onEdit={jest.fn()}
        onAddSavings={jest.fn()}
      />,
    );
    const tree = snapshotText(r);
    // Title from a real goal would land here; with no match the body is blank.
    expect(tree).not.toContain('Mua iPhone');
    expect(tree).not.toContain('Thêm khoản tiết kiệm');
    TestRenderer.act(() => r.unmount());
  });
});

describe('AddSavingsModal — store subscription', () => {
  it('history list reflects fresh goal state after an in-modal addSavings', () => {
    const seed = useGoalsStore.getState().addGoal({
      title: 'Về Tết',
      icon: 'airplane',
      targetAmount: 500_000,
    });
    const goalId = seed.goal!.id;

    const r = renderTree(<AddSavingsModal visible goalId={goalId} onClose={jest.fn()} />);
    // History starts empty.
    expect(snapshotText(r)).toContain('Chưa có khoản nào');

    TestRenderer.act(() => {
      useGoalsStore.getState().addSavings(goalId, {
        amount: 20_000,
        date: '2026-05-22',
        note: 'thưởng tháng 5',
      });
    });

    const after = snapshotText(r);
    // The Text children come through as ["+", "¥20,000"] — assert each piece
    // independently rather than the joined string.
    expect(after).toContain('¥20,000');
    expect(after).toContain('thưởng tháng 5');
    // And the empty-state copy must have been replaced by the row.
    expect(after).not.toContain('Chưa có khoản nào');
    TestRenderer.act(() => r.unmount());
  });
});

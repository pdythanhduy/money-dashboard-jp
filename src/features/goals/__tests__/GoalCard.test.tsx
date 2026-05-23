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
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => { unmount: () => void; toJSON: () => unknown };
};

import { GoalCard } from '@/features/goals/components/GoalCard';
import type { Goal } from '@/store/goalsStore';
import { ThemeProvider } from '@/theme';

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

function goal(partial: Partial<Goal> = {}): Goal {
  return {
    id: partial.id ?? 'g-1',
    title: partial.title ?? 'Về Tết',
    icon: partial.icon ?? 'airplane',
    targetAmount: partial.targetAmount ?? 200_000,
    contributions: partial.contributions ?? [],
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
    ...(partial.deadline ? { deadline: partial.deadline } : {}),
    ...(partial.category ? { category: partial.category } : {}),
    ...(partial.status ? { status: partial.status } : {}),
    ...(partial.monthlyContribution !== undefined ? { monthlyContribution: partial.monthlyContribution } : {}),
    ...(partial.note ? { note: partial.note } : {}),
  };
}

describe('GoalCard — health + status badges', () => {
  it('legacy goal (no category / status) renders with default category label', () => {
    const r = renderTree(<GoalCard goal={goal()} onPress={() => undefined} />);
    const tree = snap(r);
    // category defaults to 'other' → vi label "Khác"
    expect(tree).toContain('Khác');
    // No deadline → health = no_deadline → "Chưa đặt hạn"
    expect(tree).toContain('Chưa đặt hạn');
    TestRenderer.act(() => r.unmount());
  });

  it('explicit category label renders (home_visit → "Về Việt Nam")', () => {
    const r = renderTree(
      <GoalCard goal={goal({ category: 'home_visit' })} onPress={() => undefined} />,
    );
    expect(snap(r)).toContain('Về Việt Nam');
    TestRenderer.act(() => r.unmount());
  });

  it('paused status shows the paused badge', () => {
    const r = renderTree(
      <GoalCard goal={goal({ status: 'paused' })} onPress={() => undefined} />,
    );
    expect(snap(r)).toContain('Tạm dừng');
    TestRenderer.act(() => r.unmount());
  });

  it('completed status shows the completed badge and 100% accent', () => {
    const r = renderTree(
      <GoalCard
        goal={goal({
          status: 'completed',
          contributions: [{ id: 'c', date: '2026-05-01', amount: 200_000 }],
        })}
        onPress={() => undefined}
      />,
    );
    const tree = snap(r);
    expect(tree).toContain('Đã hoàn thành');
    expect(tree).toContain('100%');
    TestRenderer.act(() => r.unmount());
  });

  it('active goal with future deadline + plannedMonthly < required shows behind + monthly target line', () => {
    // Target 100k, deadline ~5 months out, planned ¥10k → required ~¥20k → behind.
    const future = new Date();
    future.setMonth(future.getMonth() + 5);
    const iso = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`;
    const r = renderTree(
      <GoalCard
        goal={goal({
          targetAmount: 100_000,
          deadline: iso,
          monthlyContribution: 10_000,
        })}
        onPress={() => undefined}
      />,
    );
    const tree = snap(r);
    expect(tree).toContain('Đang chậm tiến độ');
    expect(tree).toContain('Cần để dành');
    TestRenderer.act(() => r.unmount());
  });
});

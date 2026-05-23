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
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => { unmount: () => void; toJSON: () => unknown };
};

import { BudgetComparisonSection } from '@/features/kakeibo/components/BudgetComparisonSection';
import type { BudgetTarget, KakeiboEntry } from '@/lib/kakeibo-math';
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

function e(id: string, date: string, amount: number, category: KakeiboEntry['category'] = 'food'): KakeiboEntry {
  return { id, date, amount, category };
}

describe('BudgetComparisonSection', () => {
  it('renders nothing when there are no budgets (no clutter on fresh install)', () => {
    const r = renderTree(
      <BudgetComparisonSection entries={[]} budgets={[]} yearMonth="2026-05" />,
    );
    expect(r.toJSON()).toBeNull();
    TestRenderer.act(() => r.unmount());
  });

  it('renders a row for a saved budget even when zero is spent (safe state visible)', () => {
    const budgets: BudgetTarget[] = [{ category: 'food', monthlyLimit: 40_000 }];
    const r = renderTree(
      <BudgetComparisonSection entries={[]} budgets={budgets} yearMonth="2026-05" />,
    );
    const tree = snap(r);
    expect(tree).toContain('Ngân sách tháng');
    // The food category label
    expect(tree).toContain('Ăn uống');
    // ¥0 / ¥40,000 — Text children render as separate JSON tokens; assert key substrings.
    expect(tree).toContain('¥0');
    expect(tree).toContain('¥40,000');
    expect(tree).toContain('Còn lại ');
    TestRenderer.act(() => r.unmount());
  });

  it('shows spent so far and remaining when partial spending exists', () => {
    const budgets: BudgetTarget[] = [{ category: 'food', monthlyLimit: 40_000 }];
    const entries = [e('a', '2026-05-10', 500, 'food')];
    const r = renderTree(
      <BudgetComparisonSection entries={entries} budgets={budgets} yearMonth="2026-05" />,
    );
    const tree = snap(r);
    expect(tree).toContain('¥500');
    expect(tree).toContain('¥39,500'); // remaining label substring
    TestRenderer.act(() => r.unmount());
  });

  it('shows over-budget state when spent > limit', () => {
    const budgets: BudgetTarget[] = [{ category: 'food', monthlyLimit: 40_000 }];
    const entries = [e('a', '2026-05-10', 42_500, 'food')];
    const r = renderTree(
      <BudgetComparisonSection entries={entries} budgets={budgets} yearMonth="2026-05" />,
    );
    const tree = snap(r);
    expect(tree).toContain('¥42,500');
    expect(tree).toContain('¥40,000');
    expect(tree).toContain('Vượt '); // over label
    expect(tree).toContain('¥2,500'); // diff
    TestRenderer.act(() => r.unmount());
  });

  it('shows warning state at 80–100% (uses warning color)', () => {
    const budgets: BudgetTarget[] = [{ category: 'food', monthlyLimit: 10_000 }];
    const entries = [e('a', '2026-05-10', 9_000, 'food')]; // 90% → warning
    const r = renderTree(
      <BudgetComparisonSection entries={entries} budgets={budgets} yearMonth="2026-05" />,
    );
    const tree = snap(r);
    // Warning color (orange) injected on bar + remaining label
    expect(tree).toContain('#dd6b20'); // theme `warning` color
    TestRenderer.act(() => r.unmount());
  });
});

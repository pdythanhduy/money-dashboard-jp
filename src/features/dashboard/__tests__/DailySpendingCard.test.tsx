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

jest.mock('expo-crypto', () => ({
  randomUUID: () => `id-${Math.random().toString(36).slice(2)}`,
}));

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => { unmount: () => void; toJSON: () => unknown };
};

import { DailySpendingCard } from '@/features/dashboard/components/DailySpendingCard';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useKakeiboStore } from '@/store/kakeiboStore';
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

function resetStores() {
  useKakeiboStore.setState({ entries: [], budgets: [], recurrings: [] });
  useCalculatorStore.setState({ lastResult: null });
}

describe('DailySpendingCard — FinancialHealth chip row', () => {
  beforeEach(() => {
    resetStores();
  });

  it('renders no chips when no budgets / no entries / no salary', () => {
    const r = renderTree(<DailySpendingCard onPress={() => undefined} />);
    const tree = snap(r);
    expect(tree).not.toContain('Budget ');
    expect(tree).not.toContain('Nhiều nhất');
    expect(tree).not.toContain('Cố định ');
    TestRenderer.act(() => r.unmount());
  });

  it('renders the budget chip when budgets exist', () => {
    useKakeiboStore.setState({
      entries: [],
      budgets: [{ category: 'food', monthlyLimit: 30_000 }],
      recurrings: [],
    });
    const r = renderTree(<DailySpendingCard onPress={() => undefined} />);
    const tree = snap(r);
    expect(tree).toContain('Budget 1/1 OK');
    TestRenderer.act(() => r.unmount());
  });

  it('renders the top-category chip when entries exist', () => {
    const today = new Date();
    const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    useKakeiboStore.setState({
      entries: [{ id: 'a', date: isoToday, amount: 1_500, category: 'food' }],
      budgets: [],
      recurrings: [],
    });
    const r = renderTree(<DailySpendingCard onPress={() => undefined} />);
    const tree = snap(r);
    // Vietnamese top category chip mentions "Nhiều nhất" and the translated category label
    expect(tree).toContain('Nhiều nhất');
    expect(tree).toContain('Ăn uống');
    TestRenderer.act(() => r.unmount());
  });

  it('renders the fixed-cost chip only when salary AND active recurrings exist', () => {
    useKakeiboStore.setState({
      entries: [],
      budgets: [],
      recurrings: [
        {
          id: 'rent',
          name: 'Rent',
          amount: 80_000,
          category: 'rent',
          dayOfMonth: 1,
          active: true,
          autoPost: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    useCalculatorStore.setState({
      lastResult: {
        takeHomeMonthly: 200_000,
      } as ReturnType<typeof useCalculatorStore.getState>['lastResult'],
    });
    const r = renderTree(<DailySpendingCard onPress={() => undefined} />);
    const tree = snap(r);
    // 80,000 / 200,000 = 40%
    expect(tree).toContain('Cố định 40%');
    TestRenderer.act(() => r.unmount());
  });

  it('omits the fixed-cost chip when there is no salary, even if recurrings exist', () => {
    useKakeiboStore.setState({
      entries: [],
      budgets: [],
      recurrings: [
        {
          id: 'rent',
          name: 'Rent',
          amount: 80_000,
          category: 'rent',
          dayOfMonth: 1,
          active: true,
          autoPost: true,
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });
    const r = renderTree(<DailySpendingCard onPress={() => undefined} />);
    const tree = snap(r);
    expect(tree).not.toContain('Cố định ');
    TestRenderer.act(() => r.unmount());
  });
});

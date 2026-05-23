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

import { WeeklyReviewCard } from '@/features/dashboard/components/WeeklyReviewCard';
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

beforeEach(() => {
  useKakeiboStore.setState({ entries: [], budgets: [], recurrings: [] });
});

describe('WeeklyReviewCard', () => {
  it('renders nothing when both this week and last week are empty', () => {
    const r = renderTree(<WeeklyReviewCard />);
    expect(r.toJSON()).toBeNull();
    TestRenderer.act(() => r.unmount());
  });

  it('renders the card when at least one entry exists in either week', () => {
    // Seed an entry for today (so this week has data regardless of when tests run).
    const today = new Date();
    const isoToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    useKakeiboStore.setState({
      entries: [{ id: 'a', date: isoToday, amount: 1_500, category: 'food' }],
      budgets: [],
      recurrings: [],
    });
    const r = renderTree(<WeeklyReviewCard />);
    const tree = snap(r);
    expect(tree).toContain('Tuần này');
    expect(tree).toContain('¥1,500');
    TestRenderer.act(() => r.unmount());
  });
});

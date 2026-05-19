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

import { WallWarningBanner } from '@/features/calculator/components/WallWarningBanner';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let r!: ReturnType<typeof TestRenderer.create>;
  TestRenderer.act(() => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r;
}

describe('WallWarningBanner', () => {
  it('renders nothing when income is far below any wall', () => {
    const r = renderTree(<WallWarningBanner annualIncome={500_000} />);
    expect(r.toJSON()).toBeNull();
    TestRenderer.act(() => r.unmount());
  });

  it('shows approaching copy when within 10% below a wall', () => {
    // ¥1,020,000 → 103万 warning (within 10%), 106万 warning
    const r = renderTree(<WallWarningBanner annualIncome={1_020_000} />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Còn cách ngưỡng');
    expect(tree).toContain('103万円の壁');
    expect(tree).toContain('106万円の壁');
    TestRenderer.act(() => r.unmount());
  });

  it('shows crossed copy when income is past a wall', () => {
    // ¥1,310,000 → 130 crossed
    const r = renderTree(<WallWarningBanner annualIncome={1_310_000} />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Đã vượt ngưỡng');
    expect(tree).toContain('130万円の壁');
  });

  it('crossed walls list grows with income (¥2.1M crosses all six)', () => {
    const r = renderTree(<WallWarningBanner annualIncome={2_100_000} />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('103万円の壁');
    expect(tree).toContain('106万円の壁');
    expect(tree).toContain('130万円の壁');
    expect(tree).toContain('150万円の壁');
    expect(tree).toContain('160万円の壁');
    expect(tree).toContain('201万円の壁');
    TestRenderer.act(() => r.unmount());
  });
});

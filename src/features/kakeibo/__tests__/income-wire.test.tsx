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

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => { unmount: () => void; toJSON: () => unknown };
};

import { SummaryCard } from '@/features/kakeibo/components/SummaryCard';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let r!: ReturnType<typeof TestRenderer.create>;
  TestRenderer.act(() => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r;
}

function snapshot(r: ReturnType<typeof TestRenderer.create>): string {
  return JSON.stringify(r.toJSON());
}

describe('SummaryCard — Calculator income wired through', () => {
  it('renders income, surplus, and percent-spent rows when totalIncome > totalSpent', () => {
    const r = renderTree(
      <SummaryCard totalSpent={80_000} entryCount={4} totalIncome={200_000} surplus={120_000} />,
    );
    const tree = snapshot(r);
    // Income context row
    expect(tree).toContain('Thu nhập tháng');
    expect(tree).toContain('¥200,000');
    // Surplus row (positive)
    expect(tree).toContain('Còn dư');
    expect(tree).toContain('¥120,000');
    // % income spent
    expect(tree).toContain('Đã tiêu 40% thu nhập');
    // noIncomeContext fallback should NOT be rendered
    expect(tree).not.toContain('Tính lương trước');
    TestRenderer.act(() => r.unmount());
  });

  it('renders deficit label when totalSpent > totalIncome', () => {
    const r = renderTree(
      <SummaryCard totalSpent={130_000} entryCount={6} totalIncome={100_000} surplus={-30_000} />,
    );
    const tree = snapshot(r);
    // Deficit row (negative)
    expect(tree).toContain('Vượt chi');
    expect(tree).toContain('¥30,000');
    // Surplus label must NOT show in deficit case
    expect(tree).not.toContain('"children":["Còn dư"]');
    TestRenderer.act(() => r.unmount());
  });

  it('falls back to noIncomeContext copy when totalIncome is undefined', () => {
    const r = renderTree(<SummaryCard totalSpent={50_000} entryCount={3} />);
    const tree = snapshot(r);
    expect(tree).toContain('Tính lương trước');
    expect(tree).not.toContain('Thu nhập tháng');
    expect(tree).not.toContain('Đã tiêu');
    TestRenderer.act(() => r.unmount());
  });
});

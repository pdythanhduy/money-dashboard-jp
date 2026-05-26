/**
 * Regression for "Rendered fewer hooks than expected" thrown when a
 * TrendChart instance with `data.length < 2` later receives ≥ 2 points
 * (e.g. user calculates salary the first time on a history-empty
 * screen). The original code early-returned BEFORE useMemo, so React
 * saw a different hook count between the two paths.
 */

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

// react-native-svg renders as host components via react-test-renderer;
// stub them so the test tree is inspectable without a native bridge.
jest.mock('react-native-svg', () => {
  const ReactMock = require('react') as typeof React;
  const Stub = (name: string) =>
    function Stub(props: { children?: React.ReactNode }) {
      return ReactMock.createElement(name, props as Record<string, unknown>, props.children);
    };
  return {
    __esModule: true,
    default: Stub('Svg'),
    Svg: Stub('Svg'),
    Circle: Stub('Circle'),
    Line: Stub('Line'),
    Path: Stub('Path'),
    Text: Stub('SvgText'),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => {
    unmount: () => void;
    toJSON: () => unknown;
    update: (el: React.ReactElement) => void;
  };
};

import { TrendChart } from '@/features/history/components/TrendChart';
import type { MonthlyTrendPoint } from '@/features/history/history-stats';
import { ThemeProvider } from '@/theme';

/**
 * Build a MonthlyTrendPoint from a tiny shorthand. `slot` is the slot
 * index that maps to a fake year-month; we use 2026-01..2026-06 for
 * compatibility with the 6-month window the chart expects.
 */
function point(slot: number, takeHome: number, gross: number): MonthlyTrendPoint {
  const month = slot;
  return {
    yearMonth: `2026-${String(month).padStart(2, '0')}`,
    year: 2026,
    month,
    takeHome,
    gross,
  };
}

describe('TrendChart — hooks-order regression', () => {
  it('does not throw when data transitions from 0 → 2 points on the same instance', () => {
    // The exact prop-transition that triggered the production crash:
    // History opens with no entries → user runs Calculator → history
    // populates → TrendChart re-renders with data.length=2 on the same
    // component instance.
    let r!: ReturnType<typeof TestRenderer.create>;
    TestRenderer.act(() => {
      r = TestRenderer.create(
        <ThemeProvider>
          <TrendChart data={[]} width={300} height={200} />
        </ThemeProvider>,
      );
    });
    expect(() => {
      TestRenderer.act(() => {
        r.update(
          <ThemeProvider>
            <TrendChart
              data={[point(1, 100_000, 200_000), point(2, 105_000, 210_000)]}
              width={300}
              height={200}
            />
          </ThemeProvider>,
        );
      });
    }).not.toThrow();
    TestRenderer.act(() => r.unmount());
  });

  it('does not throw on the reverse transition (2 → 0 points)', () => {
    let r!: ReturnType<typeof TestRenderer.create>;
    TestRenderer.act(() => {
      r = TestRenderer.create(
        <ThemeProvider>
          <TrendChart
            data={[point(1, 100_000, 200_000), point(2, 105_000, 210_000)]}
            width={300}
            height={200}
          />
        </ThemeProvider>,
      );
    });
    expect(() => {
      TestRenderer.act(() => {
        r.update(
          <ThemeProvider>
            <TrendChart data={[]} width={300} height={200} />
          </ThemeProvider>,
        );
      });
    }).not.toThrow();
    TestRenderer.act(() => r.unmount());
  });

  it('renders the "needs two points" message when data is empty', () => {
    let r!: ReturnType<typeof TestRenderer.create>;
    TestRenderer.act(() => {
      r = TestRenderer.create(
        <ThemeProvider>
          <TrendChart data={[]} width={300} height={200} />
        </ThemeProvider>,
      );
    });
    expect(JSON.stringify(r.toJSON())).toContain(
      'Cần ít nhất 1 lần tính để xem biểu đồ 6 tháng',
    );
    TestRenderer.act(() => r.unmount());
  });
});

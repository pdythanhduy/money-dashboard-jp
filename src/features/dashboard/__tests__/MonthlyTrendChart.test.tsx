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

// react-native-svg components — simple stubs so we can detect renders.
jest.mock('react-native-svg', () => {
  const ReactMock = require('react') as typeof React;
  const { View, Text } = require('react-native') as typeof import('react-native');
  const Stub = (tag: string) => (props: { children?: React.ReactNode }) =>
    ReactMock.createElement(View, { testID: `svg-${tag}` }, props.children);
  return {
    __esModule: true,
    default: Stub('root'),
    Svg: Stub('root'),
    Circle: Stub('circle'),
    Line: Stub('line'),
    Path: Stub('path'),
    Text: ({ children }: { children?: React.ReactNode }) =>
      ReactMock.createElement(Text, null, children),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => { unmount: () => void; toJSON: () => unknown };
};

import { MonthlyTrendChart } from '@/features/dashboard/components/MonthlyTrendChart';
import { useHistoryStore } from '@/store/historyStore';
import { ThemeProvider } from '@/theme';
import type { HistoryEntry } from '@/types/history';
import type { SalaryInput, TakeHomeResult } from '@/types/tax';

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

const fakeInput: SalaryInput = {
  annualIncome: 3_600_000,
  age: 24,
  category: 'salary',
  prefecture: 'tokyo',
};

const fakeResult: TakeHomeResult = {
  grossAnnual: 3_600_000,
  incomeTax: 68_100,
  residentTax: 153_500,
  healthInsurance: 177_300,
  pension: 329_400,
  employmentInsurance: 18_000,
  nationalHealthInsurance: 0,
  nationalPension: 0,
  totalDeductions: 746_300,
  takeHomeAnnual: 2_853_700,
  takeHomeMonthly: 237_808,
  breakdown: {
    employmentIncomeDeduction: 1_160_000,
    employmentIncome: 2_440_000,
    totalIncome: 2_440_000,
    basicDeductionNationalTax: 580_000,
    basicDeductionResidentTax: 430_000,
    socialInsuranceDeduction: 524_700,
    spouseDeduction: 0,
    dependentDeduction: 0,
    workingStudentDeduction: 0,
    idecoDeduction: 0,
    lifeInsuranceDeductionNational: 0,
    lifeInsuranceDeductionResident: 0,
    taxableIncomeForNationalTax: 1_335_000,
    taxableIncomeForResidentTax: 1_485_000,
    baseIncomeTax: 66_750,
    reconstructionSurtax: 1_401,
    residentTaxIncomeBased: 148_500,
    residentTaxPerCapita: 5_000,
    standardMonthlyRemuneration: 300_000,
  },
};

function entry(id: string, timestamp: number): HistoryEntry {
  return { id, timestamp, input: fakeInput, result: fakeResult };
}

beforeEach(() => {
  useHistoryStore.setState({ entries: [], migratedFromLatest: false });
});

describe('MonthlyTrendChart on Dashboard', () => {
  it('renders the empty-state copy when history is fully empty', () => {
    // 0.3.0+: the chart renders with just 1 entry (one anchor point + average
    // reference line), so the empty-state only triggers at truly-zero history.
    useHistoryStore.setState({ entries: [] });
    const r = renderTree(<MonthlyTrendChart />);
    const tree = snapshot(r);
    expect(tree).toContain('Cần ít nhất 1 lần tính');
    // Old placeholder copy must be gone.
    expect(tree).not.toContain('開発中');
    expect(tree).not.toContain('đang phát triển');
    TestRenderer.act(() => r.unmount());
  });

  it('renders the real TrendChart SVG when history has ≥ 1 entry', () => {
    useHistoryStore.setState({
      entries: [
        entry('a', Date.now() - 30 * 86_400_000),
        entry('b', Date.now() - 15 * 86_400_000),
        entry('c', Date.now()),
      ],
    });
    const r = renderTree(<MonthlyTrendChart />);
    const tree = snapshot(r);
    // Title still present
    expect(tree).toContain('Xu hướng 6 tháng');
    // needsTwoPoints copy absent
    expect(tree).not.toContain('Cần ít nhất 1 lần tính');
    // Svg root rendered via our stub
    expect(tree).toContain('svg-root');
    // At least one dot (Circle) rendered per data point
    expect(tree).toContain('svg-circle');
    TestRenderer.act(() => r.unmount());
  });
});

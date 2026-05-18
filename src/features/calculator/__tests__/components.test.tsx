import React from 'react';

import '@/lib/i18n';
import { calculateTakeHome } from '@/lib/tax-calculator';
import { ThemeProvider } from '@/theme';
import type { SalaryInput } from '@/types/tax';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react') as typeof React;
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (callback: () => void) => void;
  create: (element: React.ReactElement) => { unmount: () => void };
};

import { BreakdownList } from '@/features/calculator/components/BreakdownList';
import { DependentsInput } from '@/features/calculator/components/DependentsInput';
import { IncomeTypeSelector } from '@/features/calculator/components/IncomeTypeSelector';
import { PrefecturePicker } from '@/features/calculator/components/PrefecturePicker';
import { ResultCard } from '@/features/calculator/components/ResultCard';
import { SalaryForm } from '@/features/calculator/components/SalaryForm';
import {
  DEFAULT_CALCULATOR_FORM,
  type UseCalculatorReturn,
} from '@/features/calculator/hooks/useCalculator';

function renderWithTheme(element: React.ReactElement) {
  let renderer: { unmount: () => void } | undefined;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(<ThemeProvider>{element}</ThemeProvider>);
  });
  return {
    unmount: () => {
      TestRenderer.act(() => {
        renderer?.unmount();
      });
    },
  };
}

describe('calculator component smoke tests', () => {
  const input: SalaryInput = {
    annualIncome: 3_600_000,
    age: 24,
    category: 'salary',
    prefecture: 'tokyo',
  };
  const result = calculateTakeHome(input);

  it('renders IncomeTypeSelector', () => {
    const renderer = renderWithTheme(<IncomeTypeSelector value="seishain" onChange={jest.fn()} />);
    expect(renderer).toBeDefined();
    renderer?.unmount();
  });

  it('renders PrefecturePicker', () => {
    const renderer = renderWithTheme(
      <PrefecturePicker
        label="prefecture"
        subLabel="都道府県"
        placeholder="select"
        closeLabel="close"
        value="tokyo"
        options={[{ value: 'tokyo', label: 'Tokyo', description: 'Tokyo' }]}
        onChange={jest.fn()}
      />,
    );
    expect(renderer).toBeDefined();
    renderer?.unmount();
  });

  it('renders DependentsInput', () => {
    const renderer = renderWithTheme(
      <DependentsInput
        form={DEFAULT_CALCULATOR_FORM}
        updateField={jest.fn() as unknown as UseCalculatorReturn['updateField']}
      />,
    );
    expect(renderer).toBeDefined();
    renderer?.unmount();
  });

  it('renders SalaryForm', () => {
    const calculator = {
      mode: 'input',
      form: DEFAULT_CALCULATOR_FORM,
      errors: {},
      result: null,
      submittedInput: null,
      canSubmit: false,
      updateField: jest.fn(),
      setAnnualIncomeText: jest.fn(),
      setAgeText: jest.fn(),
      submit: jest.fn(),
      editInput: jest.fn(),
      reset: jest.fn(),
    } as unknown as UseCalculatorReturn;

    const renderer = renderWithTheme(<SalaryForm calculator={calculator} />);
    expect(renderer).toBeDefined();
    renderer?.unmount();
  });

  it('renders ResultCard', () => {
    const renderer = renderWithTheme(<ResultCard result={result} />);
    expect(renderer).toBeDefined();
    renderer?.unmount();
  });

  it('renders BreakdownList', () => {
    const renderer = renderWithTheme(<BreakdownList result={result} input={input} />);
    expect(renderer).toBeDefined();
    renderer?.unmount();
  });
});

import React from 'react';

import type { Prefecture } from '@/types/tax';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

const TestRenderer = require('react-test-renderer') as {
  act: (callback: () => void) => void;
  create: (element: React.ReactElement) => { unmount: () => void };
};

import {
  DEFAULT_CALCULATOR_FORM,
  computeCalculatorResult,
  formatCurrency,
  useCalculator,
  validateCalculatorForm,
  type UseCalculatorReturn,
} from '@/features/calculator/hooks/useCalculator';
import { useCalculatorStore } from '@/store/calculatorStore';

describe('useCalculator', () => {
  beforeEach(() => {
    TestRenderer.act(() => {
      useCalculatorStore.getState().reset();
    });
  });

  it('computes a valid salary input and returns the expected result', () => {
    let hook: UseCalculatorReturn | undefined;

    function Harness() {
      hook = useCalculator();
      return null;
    }

    let renderer: { unmount: () => void } | undefined;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<Harness />);
    });

    TestRenderer.act(() => {
      hook?.updateField('jobType', 'seishain');
      hook?.setAnnualIncomeText('3600000');
      hook?.setAgeText('24');
      hook?.updateField('prefecture', 'tokyo' as Prefecture);
    });

    let submitted = false;
    TestRenderer.act(() => {
      submitted = hook?.submit() ?? false;
    });

    expect(submitted).toBe(true);
    expect(hook?.result?.takeHomeAnnual).toBe(2_853_700);
    expect(hook?.mode).toBe('result');
    TestRenderer.act(() => {
      renderer?.unmount();
    });
  });

  it('keeps invalid input in input mode and exposes field errors', () => {
    let hook: UseCalculatorReturn | undefined;

    function Harness() {
      hook = useCalculator();
      return null;
    }

    let renderer: { unmount: () => void } | undefined;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(<Harness />);
    });

    let submitted = true;
    TestRenderer.act(() => {
      submitted = hook?.submit() ?? true;
    });

    expect(submitted).toBe(false);
    expect(hook?.mode).toBe('input');
    expect(hook?.errors.annualIncomeInput).toBe('annualIncomeRequired');
    expect(hook?.errors.ageInput).toBe('ageRequired');
    TestRenderer.act(() => {
      renderer?.unmount();
    });
  });
});

describe('calculator formatting', () => {
  it('formats zero yen', () => {
    expect(formatCurrency(0)).toBe('¥0');
  });

  it('formats negative yen', () => {
    expect(formatCurrency(-1234)).toBe('-¥1,234');
  });

  it('formats large yen values', () => {
    expect(formatCurrency(1234567890)).toBe('¥1,234,567,890');
  });
});

describe('calculator validation', () => {
  it('returns missing field errors', () => {
    expect(validateCalculatorForm(DEFAULT_CALCULATOR_FORM)).toMatchObject({
      annualIncomeInput: 'annualIncomeRequired',
      ageInput: 'ageRequired',
      prefecture: 'prefectureRequired',
    });
  });

  it('returns negative income errors', () => {
    expect(
      validateCalculatorForm({
        ...DEFAULT_CALCULATOR_FORM,
        annualIncomeInput: '-100',
        ageInput: '24',
        prefecture: 'tokyo',
      }),
    ).toMatchObject({ annualIncomeInput: 'annualIncomePositive' });
  });

  it('returns age range errors', () => {
    expect(
      validateCalculatorForm({
        ...DEFAULT_CALCULATOR_FORM,
        annualIncomeInput: '3600000',
        ageInput: '101',
        prefecture: 'tokyo',
      }),
    ).toMatchObject({ ageInput: 'ageRange' });
  });

  it('accepts a valid salary form', () => {
    expect(
      validateCalculatorForm({
        ...DEFAULT_CALCULATOR_FORM,
        annualIncomeInput: '3600000',
        ageInput: '24',
        prefecture: 'tokyo',
      }),
    ).toEqual({});
  });
});

describe('computeCalculatorResult', () => {
  it('returns result for valid input', () => {
    const output = computeCalculatorResult({
      ...DEFAULT_CALCULATOR_FORM,
      annualIncomeInput: '3600000',
      ageInput: '24',
      prefecture: 'tokyo',
    });

    expect(output.errors).toEqual({});
    expect(output.input?.annualIncome).toBe(3_600_000);
    expect(output.input?.pensionType).toBe('employee');
    expect(output.result?.takeHomeAnnual).toBe(2_853_700);
  });

  it('maps seishain national pension selection into the tax input', () => {
    const output = computeCalculatorResult({
      ...DEFAULT_CALCULATOR_FORM,
      annualIncomeInput: '3600000',
      ageInput: '24',
      prefecture: 'tokyo',
      pensionType: 'kokumin',
    });

    expect(output.errors).toEqual({});
    expect(output.input?.pensionType).toBe('national');
    expect(output.result?.pension).toBe(215_040);
  });

  it('returns errors for invalid input', () => {
    const output = computeCalculatorResult(DEFAULT_CALCULATOR_FORM);

    expect(output.result).toBeNull();
    expect(output.errors.annualIncomeInput).toBe('annualIncomeRequired');
  });
});

/**
 * Tests for Calculator multi-job mode wiring — exercises buildSalaryInput +
 * computeCalculatorResult with multiJobInputs.length signaling validation
 * paths. Component-level tests live alongside.
 */

import React from 'react';

import '@/lib/i18n';

jest.mock('@react-native-async-storage/async-storage', () => {
  let storage: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((k: string) => Promise.resolve(storage[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        storage[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete storage[k];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storage = {};
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `m-${++n}`) };
});

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react') as typeof React;
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

import {
  DEFAULT_CALCULATOR_FORM,
  buildSalaryInput,
  computeCalculatorResult,
  validateCalculatorForm,
} from '@/features/calculator/hooks/useCalculator';
import type { HourlyJobInput } from '@/lib/hourly-wage-calculator';
import { useMultiJobStore } from '@/store/multiJobStore';

const validBaseForm = {
  ...DEFAULT_CALCULATOR_FORM,
  incomeMode: 'multi-job' as const,
  ageInput: '24',
  prefecture: 'tokyo' as const,
};

beforeEach(() => {
  useMultiJobStore.setState({ jobs: [] });
});

describe('multi-job mode validation', () => {
  it('errors with noJobsAdded when no jobs and incomeMode = multi-job', () => {
    const errors = validateCalculatorForm(validBaseForm, { multiJobCount: 0 });
    expect(errors.general).toBe('noJobsAdded');
  });

  it('passes validation when at least one job is registered', () => {
    const errors = validateCalculatorForm(validBaseForm, { multiJobCount: 2 });
    expect(errors.general).toBeUndefined();
    // No income field errors because hourly fields aren't checked in multi-job mode.
    expect(errors.hourlyRateInput).toBeUndefined();
    expect(errors.annualIncomeInput).toBeUndefined();
  });
});

describe('multi-job buildSalaryInput', () => {
  const combini: HourlyJobInput = { hourlyRate: 1_200, hoursPerDay: 8, daysPerWeek: 5 };
  const tutor: HourlyJobInput = { hourlyRate: 2_500, hoursPerDay: 4, daysPerWeek: 1 };

  it('aggregates two jobs into a single annualIncome on the SalaryInput', () => {
    const input = buildSalaryInput(validBaseForm, [combini, tutor]);
    // combini base 1200×8×5×52 = 2,496,000; tutor 2500×4×1×52 = 520,000
    expect(input.annualIncome).toBe(2_496_000 + 520_000);
    expect(input.category).toBe('salary');
  });

  it('produces annualIncome = 0 when no jobs provided', () => {
    const input = buildSalaryInput(validBaseForm, []);
    expect(input.annualIncome).toBe(0);
  });
});

describe('computeCalculatorResult — multi-job end-to-end', () => {
  it('returns a calculated result when jobs sum to a positive annual income', () => {
    const out = computeCalculatorResult(validBaseForm, [
      { hourlyRate: 1_200, hoursPerDay: 8, daysPerWeek: 5 },
    ]);
    expect(out.errors).toEqual({});
    expect(out.result).not.toBeNull();
    expect(out.input?.annualIncome).toBe(2_496_000);
  });

  it('surfaces noJobsAdded error when called with empty multi-job list', () => {
    const out = computeCalculatorResult(validBaseForm, []);
    expect(out.result).toBeNull();
    expect(out.errors.general).toBe('noJobsAdded');
  });

  it('multiJobInputs override drives annualIncome (annualIncomeInput is ignored in multi-job mode)', () => {
    const out = computeCalculatorResult(
      { ...validBaseForm, annualIncomeInput: '9999999' },
      [{ hourlyRate: 1_000, hoursPerDay: 8, daysPerWeek: 5 }],
    );
    // 1000 × 8 × 5 × 52 = 2,080,000 — NOT 9,999,999
    expect(out.input?.annualIncome).toBe(2_080_000);
  });
});

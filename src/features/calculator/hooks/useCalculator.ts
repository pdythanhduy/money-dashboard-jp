import { useCallback, useMemo, useState } from 'react';

import { calculateTakeHome } from '@/lib/tax-calculator';
import { useCalculatorStore } from '@/store/calculatorStore';
import type {
  FreelanceMunicipality,
  IncomeCategory,
  Prefecture,
  SalaryInput,
  TakeHomeResult,
} from '@/types/tax';

export type JobType = 'baito' | 'seishain' | 'freelance';
export type PensionType = 'kosei' | 'kokumin';
export type CalculatorMode = 'input' | 'result';
export type BlueReturnDeduction = 0 | 100_000 | 550_000 | 650_000;

export interface CalculatorFormState {
  jobType: JobType;
  annualIncomeInput: string;
  ageInput: string;
  prefecture?: Prefecture;
  pensionType: PensionType;
  municipality?: FreelanceMunicipality;
  hasDependents: boolean;
  hasSpouse: boolean;
  childrenUnder16: number;
  studentChildren16To22: number;
  elderlyDependents70Plus: number;
  blueReturnDeduction: BlueReturnDeduction;
}

export type CalculatorField =
  | 'annualIncomeInput'
  | 'ageInput'
  | 'prefecture'
  | 'municipality'
  | 'general';

export type CalculatorErrorCode =
  | 'annualIncomeRequired'
  | 'annualIncomePositive'
  | 'ageRequired'
  | 'ageRange'
  | 'prefectureRequired'
  | 'municipalityRequired'
  | 'calculationFailed';

export type ValidationErrors = Partial<Record<CalculatorField, CalculatorErrorCode>>;

export const DEFAULT_CALCULATOR_FORM: CalculatorFormState = {
  jobType: 'seishain',
  annualIncomeInput: '',
  ageInput: '',
  pensionType: 'kosei',
  hasDependents: false,
  hasSpouse: false,
  childrenUnder16: 0,
  studentChildren16To22: 0,
  elderlyDependents70Plus: 0,
  blueReturnDeduction: 0,
};

export const PREFECTURE_VALUES: readonly Prefecture[] = [
  'tokyo',
  'osaka',
  'aichi',
  'kanagawa',
  'saitama',
  'chiba',
  'hyogo',
  'fukuoka',
];

export const MUNICIPALITY_VALUES: readonly FreelanceMunicipality[] = ['osaka-shi', 'tokyo-23ku'];
export const BLUE_RETURN_DEDUCTIONS: readonly BlueReturnDeduction[] = [0, 100_000, 550_000, 650_000];

function stripToDigits(value: string): string {
  return value.replace(/[^\d]/g, '');
}

export function parseCurrencyInput(value: string): number {
  const normalized = value.trim();
  const sign = normalized.startsWith('-') ? -1 : 1;
  const digits = stripToDigits(normalized);
  if (!digits) return 0;
  return sign * Number.parseInt(digits, 10);
}

export function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  const wholeYen = Math.abs(Math.trunc(value));
  const grouped = wholeYen.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}¥${grouped}`;
}

export function formatCurrencyInput(value: string): string {
  if (!value) return '';
  return formatCurrency(parseCurrencyInput(value));
}

export function validateCalculatorForm(form: CalculatorFormState): ValidationErrors {
  const errors: ValidationErrors = {};
  const annualIncome = parseCurrencyInput(form.annualIncomeInput);
  const age = Number.parseInt(form.ageInput, 10);

  if (!form.annualIncomeInput.trim()) {
    errors.annualIncomeInput = 'annualIncomeRequired';
  } else if (!Number.isFinite(annualIncome) || annualIncome <= 0) {
    errors.annualIncomeInput = 'annualIncomePositive';
  }

  if (!form.ageInput.trim()) {
    errors.ageInput = 'ageRequired';
  } else if (!Number.isFinite(age) || age < 15 || age > 100) {
    errors.ageInput = 'ageRange';
  }

  if (!form.prefecture) {
    errors.prefecture = 'prefectureRequired';
  }

  if (form.jobType === 'freelance' && !form.municipality) {
    errors.municipality = 'municipalityRequired';
  }

  return errors;
}

function hasValidationErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

function repeatDependents(count: number, age: number, livesWithTaxpayer: boolean) {
  return Array.from({ length: Math.max(0, count) }, () => ({ age, livesWithTaxpayer }));
}

export function buildSalaryInput(form: CalculatorFormState): SalaryInput {
  const category: IncomeCategory = form.jobType === 'freelance' ? 'business' : 'salary';
  const dependents = form.hasDependents
    ? [
        ...repeatDependents(form.childrenUnder16, 10, true),
        ...repeatDependents(form.studentChildren16To22, 19, true),
        ...repeatDependents(form.elderlyDependents70Plus, 72, true),
      ]
    : [];

  const baseInput: SalaryInput = {
    annualIncome: parseCurrencyInput(form.annualIncomeInput),
    age: Number.parseInt(form.ageInput, 10),
    category,
    hasSpouse: form.hasDependents && form.hasSpouse,
    dependents,
  };

  if (baseInput.hasSpouse) {
    baseInput.spouseAge = 40;
  }

  if (category === 'salary') {
    return {
      ...baseInput,
      prefecture: form.prefecture,
      pensionType: form.pensionType === 'kokumin' ? 'national' : 'employee',
    };
  }

  return {
    ...baseInput,
    municipality: form.municipality,
    blueReturnDeduction: form.blueReturnDeduction,
  };
}

export function computeCalculatorResult(form: CalculatorFormState): {
  input: SalaryInput | null;
  result: TakeHomeResult | null;
  errors: ValidationErrors;
} {
  const errors = validateCalculatorForm(form);
  if (hasValidationErrors(errors)) {
    return { input: null, result: null, errors };
  }

  try {
    const input = buildSalaryInput(form);
    return { input, result: calculateTakeHome(input), errors: {} };
  } catch {
    return { input: null, result: null, errors: { general: 'calculationFailed' } };
  }
}

function formFromSalaryInput(input: SalaryInput | null): CalculatorFormState {
  if (!input) return DEFAULT_CALCULATOR_FORM;

  return {
    ...DEFAULT_CALCULATOR_FORM,
    jobType: input.category === 'business' ? 'freelance' : 'seishain',
    annualIncomeInput: String(input.annualIncome),
    ageInput: String(input.age),
    prefecture: input.prefecture,
    pensionType: input.pensionType === 'national' ? 'kokumin' : 'kosei',
    municipality: input.municipality,
    blueReturnDeduction: input.blueReturnDeduction ?? 0,
  };
}

export function useCalculator() {
  const lastInput = useCalculatorStore((state) => state.lastInput);
  const lastResult = useCalculatorStore((state) => state.lastResult);
  const setStoredInput = useCalculatorStore((state) => state.setInput);
  const setStoredResult = useCalculatorStore((state) => state.setResult);
  const resetStore = useCalculatorStore((state) => state.reset);

  const initialForm = useMemo(() => formFromSalaryInput(lastInput), [lastInput]);
  const [mode, setMode] = useState<CalculatorMode>('input');
  const [form, setForm] = useState<CalculatorFormState>(initialForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [result, setResult] = useState<TakeHomeResult | null>(lastResult);
  const [submittedInput, setSubmittedInput] = useState<SalaryInput | null>(lastInput);

  const currentValidation = useMemo(() => validateCalculatorForm(form), [form]);
  const canSubmit = !hasValidationErrors(currentValidation);

  const updateField = useCallback(
    <K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) => {
      setForm((current) => {
        const next = { ...current, [key]: value };
        if (key === 'jobType' && value === 'freelance') {
          next.pensionType = 'kokumin';
        }
        if (key === 'jobType' && value !== 'freelance' && next.pensionType === 'kokumin') {
          next.pensionType = 'kosei';
        }
        return next;
      });
      setErrors((current) => {
        if (!hasValidationErrors(current)) return current;
        const next = { ...current };
        if (key === 'annualIncomeInput') delete next.annualIncomeInput;
        if (key === 'ageInput') delete next.ageInput;
        if (key === 'prefecture') delete next.prefecture;
        if (key === 'municipality' || key === 'jobType') delete next.municipality;
        delete next.general;
        return next;
      });
    },
    [],
  );

  const setAnnualIncomeText = useCallback((value: string) => {
    updateField('annualIncomeInput', stripToDigits(value));
  }, [updateField]);

  const setAgeText = useCallback((value: string) => {
    updateField('ageInput', stripToDigits(value));
  }, [updateField]);

  const submit = useCallback(() => {
    const next = computeCalculatorResult(form);
    setErrors(next.errors);
    if (!next.input || !next.result) return false;

    setStoredInput(next.input);
    setStoredResult(next.result);
    setSubmittedInput(next.input);
    setResult(next.result);
    setMode('result');
    return true;
  }, [form, setStoredInput, setStoredResult]);

  const editInput = useCallback(() => {
    setMode('input');
  }, []);

  const reset = useCallback(() => {
    resetStore();
    setForm(DEFAULT_CALCULATOR_FORM);
    setErrors({});
    setResult(null);
    setSubmittedInput(null);
    setMode('input');
  }, [resetStore]);

  return {
    mode,
    form,
    errors,
    result,
    submittedInput,
    canSubmit,
    updateField,
    setAnnualIncomeText,
    setAgeText,
    submit,
    editInput,
    reset,
  };
}

export type UseCalculatorReturn = ReturnType<typeof useCalculator>;

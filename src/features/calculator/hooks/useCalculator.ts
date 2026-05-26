import { useCallback, useMemo, useState } from 'react';

import { formatCurrency as formatCurrencyShared } from '@/lib/format';
import {
  computeHourlyAnnual,
  computeMultiJobAnnual,
  type HourlyJobInput,
} from '@/lib/hourly-wage-calculator';
import { calculateTakeHome } from '@/lib/tax-calculator';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useHistoryStore } from '@/store/historyStore';
import { useMultiJobStore } from '@/store/multiJobStore';
import { useSettingsStore } from '@/store/settingsStore';
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
export type IncomeMode = 'annual' | 'hourly' | 'multi-job';
export type BlueReturnDeduction = 0 | 100_000 | 550_000 | 650_000;

export interface CalculatorFormState {
  jobType: JobType;
  /** Source the annual figure comes from: directly typed, or computed from
   *  hourly schedule. Hourly mode forces category=salary (baito flow). */
  incomeMode: IncomeMode;
  annualIncomeInput: string;
  // Hourly-mode-only fields. Ignored when incomeMode === 'annual'.
  hourlyRateInput: string;
  hoursPerDayInput: string;
  daysPerWeekInput: string;
  weeksPerYearInput: string;
  hasNightShift: boolean;
  nightHoursPerDayInput: string;
  hasOvertime: boolean;
  overtimeHoursPerDayInput: string;
  hasWeekend: boolean;
  weekendDaysPerMonthInput: string;

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

  // ---- 0.3.0 — accurate detailed inputs (all optional in calc; '' = unused) ----

  /** When true (and category='salary'), 健保/厚年 use monthlyBaseSalary +
   *  annualBonus + bonusPaymentCount with FY2026 caps. When false, falls
   *  back to legacy annualIncome/12 grade. */
  useDetailedSalary: boolean;
  /** 月給 (monthly base salary, yen). Required when useDetailedSalary. */
  monthlyBaseSalaryInput: string;
  /** 賞与年間合計 (annual total bonus, yen). 0 means no bonus. */
  annualBonusInput: string;
  /** Number of bonus payments per year. Default '2'. */
  bonusPaymentCountInput: string;

  /** iDeCo 月額 (small-business etc. mutual aid monthly contribution, yen). */
  idecoMonthlyInput: string;

  /** 生命保険料 — 新制度, 3 categories. */
  lifeInsuranceGeneralNewInput: string;
  lifeInsuranceCareMedicalNewInput: string;
  lifeInsurancePersonalPensionNewInput: string;

  /** 配偶者 年収 (spouse's gross annual salary). Only consumed when
   *  `hasSpouse` is true; determines whether 配偶者控除 or 配偶者特別控除
   *  applies. Leave empty to fall back to the legacy assumption (spouse
   *  qualifies for full 配偶者控除). */
  spouseAnnualIncomeInput: string;
}

export type CalculatorField =
  | 'annualIncomeInput'
  | 'hourlyRateInput'
  | 'hoursPerDayInput'
  | 'daysPerWeekInput'
  | 'ageInput'
  | 'prefecture'
  | 'municipality'
  | 'general';

export type CalculatorErrorCode =
  | 'annualIncomeRequired'
  | 'annualIncomePositive'
  | 'hourlyRateRequired'
  | 'hourlyRatePositive'
  | 'hoursDayRange'
  | 'daysWeekRange'
  | 'noJobsAdded'
  | 'ageRequired'
  | 'ageRange'
  | 'prefectureRequired'
  | 'municipalityRequired'
  | 'calculationFailed';

export type ValidationErrors = Partial<Record<CalculatorField, CalculatorErrorCode>>;

export const DEFAULT_CALCULATOR_FORM: CalculatorFormState = {
  jobType: 'seishain',
  incomeMode: 'annual',
  annualIncomeInput: '',
  hourlyRateInput: '',
  hoursPerDayInput: '8',
  daysPerWeekInput: '5',
  weeksPerYearInput: '52',
  hasNightShift: false,
  nightHoursPerDayInput: '0',
  hasOvertime: false,
  overtimeHoursPerDayInput: '0',
  hasWeekend: false,
  weekendDaysPerMonthInput: '0',
  ageInput: '',
  pensionType: 'kosei',
  hasDependents: false,
  hasSpouse: false,
  childrenUnder16: 0,
  studentChildren16To22: 0,
  elderlyDependents70Plus: 0,
  blueReturnDeduction: 0,
  useDetailedSalary: false,
  monthlyBaseSalaryInput: '',
  annualBonusInput: '',
  bonusPaymentCountInput: '2',
  idecoMonthlyInput: '',
  lifeInsuranceGeneralNewInput: '',
  lifeInsuranceCareMedicalNewInput: '',
  lifeInsurancePersonalPensionNewInput: '',
  spouseAnnualIncomeInput: '',
};

/**
 * All 47 prefectures (0.3+). Order: north → south by 都道府県コード — the
 * order users encounter on Japanese paper forms and dropdowns.
 */
export const PREFECTURE_VALUES: readonly Prefecture[] = [
  // Hokkaido / Tohoku
  'hokkaido',
  'aomori', 'iwate', 'miyagi', 'akita', 'yamagata', 'fukushima',
  // Kanto
  'ibaraki', 'tochigi', 'gunma', 'saitama', 'chiba', 'tokyo', 'kanagawa',
  // Chubu
  'niigata', 'toyama', 'ishikawa', 'fukui', 'yamanashi', 'nagano',
  'gifu', 'shizuoka', 'aichi', 'mie',
  // Kansai
  'shiga', 'kyoto', 'osaka', 'hyogo', 'nara', 'wakayama',
  // Chugoku
  'tottori', 'shimane', 'okayama', 'hiroshima', 'yamaguchi',
  // Shikoku
  'tokushima', 'kagawa', 'ehime', 'kochi',
  // Kyushu / Okinawa
  'fukuoka', 'saga', 'nagasaki', 'kumamoto', 'oita', 'miyazaki', 'kagoshima', 'okinawa',
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

// Re-export so existing call sites continue to work; new code should import
// directly from '@/lib/format'.
export const formatCurrency = formatCurrencyShared;

export function formatCurrencyInput(value: string): string {
  if (!value) return '';
  return formatCurrency(parseCurrencyInput(value));
}

/** Lenient decimal parse — accepts "8", "8.5", "8,5" (comma decimal). */
function parseDecimal(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return Number.NaN;
  return Number.parseFloat(normalized);
}

/**
 * Build a `HourlyJobInput` from the form's text fields, honoring the
 * per-allowance toggles (a zero stays zero unless the user opens that
 * section, so accidentally typed values don't leak into the total).
 */
function hourlyInputFromForm(form: CalculatorFormState): HourlyJobInput {
  const weeksRaw = parseDecimal(form.weeksPerYearInput);
  const weeks = Number.isFinite(weeksRaw) && weeksRaw > 0 ? weeksRaw : 52;

  const input: HourlyJobInput = {
    hourlyRate: parseCurrencyInput(form.hourlyRateInput),
    hoursPerDay: parseDecimal(form.hoursPerDayInput),
    daysPerWeek: parseDecimal(form.daysPerWeekInput),
    weeksPerYear: weeks,
  };
  if (form.hasNightShift) {
    const n = parseDecimal(form.nightHoursPerDayInput);
    if (Number.isFinite(n) && n > 0) input.nightHoursPerDay = n;
  }
  if (form.hasOvertime) {
    const o = parseDecimal(form.overtimeHoursPerDayInput);
    if (Number.isFinite(o) && o > 0) input.overtimeHoursPerDay = o;
  }
  if (form.hasWeekend) {
    const w = parseDecimal(form.weekendDaysPerMonthInput);
    if (Number.isFinite(w) && w > 0) input.weekendDaysPerMonth = w;
  }
  return input;
}

/** Public: derive the annual-yen figure from hourly fields without
 *  computing the rest of the take-home pipeline (useful for previews). */
export function computeHourlyTotalFromForm(form: CalculatorFormState): number {
  try {
    return computeHourlyAnnual(hourlyInputFromForm(form)).totalAnnual;
  } catch {
    return 0;
  }
}

export function validateCalculatorForm(
  form: CalculatorFormState,
  options: { multiJobCount?: number } = {},
): ValidationErrors {
  const errors: ValidationErrors = {};
  const age = Number.parseInt(form.ageInput, 10);

  if (form.incomeMode === 'multi-job') {
    if ((options.multiJobCount ?? 0) === 0) {
      errors.general = 'noJobsAdded';
    }
  } else if (form.incomeMode === 'hourly') {
    const rate = parseCurrencyInput(form.hourlyRateInput);
    const hours = parseDecimal(form.hoursPerDayInput);
    const days = parseDecimal(form.daysPerWeekInput);
    if (!form.hourlyRateInput.trim()) {
      errors.hourlyRateInput = 'hourlyRateRequired';
    } else if (!Number.isFinite(rate) || rate <= 0) {
      errors.hourlyRateInput = 'hourlyRatePositive';
    }
    if (!Number.isFinite(hours) || hours < 0.5 || hours > 24) {
      errors.hoursPerDayInput = 'hoursDayRange';
    }
    if (!Number.isFinite(days) || days < 1 || days > 7) {
      errors.daysPerWeekInput = 'daysWeekRange';
    }
  } else {
    const annualIncome = parseCurrencyInput(form.annualIncomeInput);
    if (!form.annualIncomeInput.trim()) {
      errors.annualIncomeInput = 'annualIncomeRequired';
    } else if (!Number.isFinite(annualIncome) || annualIncome <= 0) {
      errors.annualIncomeInput = 'annualIncomePositive';
    }
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

export function buildSalaryInput(
  form: CalculatorFormState,
  multiJobInputs: readonly HourlyJobInput[] = [],
): SalaryInput {
  const category: IncomeCategory = form.jobType === 'freelance' ? 'business' : 'salary';
  const dependents = form.hasDependents
    ? [
        ...repeatDependents(form.childrenUnder16, 10, true),
        ...repeatDependents(form.studentChildren16To22, 19, true),
        ...repeatDependents(form.elderlyDependents70Plus, 72, true),
      ]
    : [];

  // Hourly + multi-job both derive an annual figure then flow through the
  // existing salary pipeline. calculateTakeHome's public API is unchanged.
  let annualIncome: number;
  if (form.incomeMode === 'hourly') {
    annualIncome = computeHourlyTotalFromForm(form);
  } else if (form.incomeMode === 'multi-job') {
    annualIncome = (() => {
      try {
        return computeMultiJobAnnual(multiJobInputs).totalAnnual;
      } catch {
        return 0;
      }
    })();
  } else {
    annualIncome = parseCurrencyInput(form.annualIncomeInput);
  }

  // When detailed salary breakdown is active for a salary worker, derive the
  // annual total from monthly base × 12 + annualBonus to keep all three
  // numbers consistent (lib `validateInput` enforces this).
  const detailedActive =
    form.useDetailedSalary &&
    category === 'salary' &&
    form.incomeMode === 'annual' &&
    !!form.monthlyBaseSalaryInput;
  let monthlyBaseSalary: number | undefined;
  let annualBonus: number | undefined;
  let bonusPaymentCount: number | undefined;
  if (detailedActive) {
    monthlyBaseSalary = parseCurrencyInput(form.monthlyBaseSalaryInput);
    annualBonus = parseCurrencyInput(form.annualBonusInput);
    const count = Number.parseInt(form.bonusPaymentCountInput, 10);
    bonusPaymentCount = Number.isFinite(count) && count > 0 ? count : 2;
    annualIncome = monthlyBaseSalary * 12 + annualBonus;
  }

  // Optional new deductions (apply to both salary + freelance).
  const idecoMonthly = parseCurrencyInput(form.idecoMonthlyInput);
  const idecoMonthlyContribution = idecoMonthly > 0 ? idecoMonthly : undefined;
  const liGeneral = parseCurrencyInput(form.lifeInsuranceGeneralNewInput);
  const liCareMedical = parseCurrencyInput(form.lifeInsuranceCareMedicalNewInput);
  const liPersonalPension = parseCurrencyInput(form.lifeInsurancePersonalPensionNewInput);
  const lifeInsurancePremiums =
    liGeneral > 0 || liCareMedical > 0 || liPersonalPension > 0
      ? {
          ...(liGeneral > 0 ? { generalNew: liGeneral } : {}),
          ...(liCareMedical > 0 ? { careMedicalNew: liCareMedical } : {}),
          ...(liPersonalPension > 0 ? { personalPensionNew: liPersonalPension } : {}),
        }
      : undefined;
  const spouseAnnualIncomeRaw = parseCurrencyInput(form.spouseAnnualIncomeInput);
  const hasSpouse = form.hasDependents && form.hasSpouse;
  const spouseAnnualIncome =
    hasSpouse && form.spouseAnnualIncomeInput ? spouseAnnualIncomeRaw : undefined;

  const baseInput: SalaryInput = {
    annualIncome,
    age: Number.parseInt(form.ageInput, 10),
    category,
    hasSpouse,
    dependents,
    ...(monthlyBaseSalary !== undefined ? { monthlyBaseSalary } : {}),
    ...(annualBonus !== undefined ? { annualBonus } : {}),
    ...(bonusPaymentCount !== undefined ? { bonusPaymentCount } : {}),
    ...(idecoMonthlyContribution !== undefined ? { idecoMonthlyContribution } : {}),
    ...(lifeInsurancePremiums !== undefined ? { lifeInsurancePremiums } : {}),
    ...(spouseAnnualIncome !== undefined ? { spouseAnnualIncome } : {}),
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

export function computeCalculatorResult(
  form: CalculatorFormState,
  multiJobInputs: readonly HourlyJobInput[] = [],
): {
  input: SalaryInput | null;
  result: TakeHomeResult | null;
  errors: ValidationErrors;
} {
  const errors = validateCalculatorForm(form, { multiJobCount: multiJobInputs.length });
  if (hasValidationErrors(errors)) {
    return { input: null, result: null, errors };
  }

  try {
    const input = buildSalaryInput(form, multiJobInputs);
    return { input, result: calculateTakeHome(input), errors: {} };
  } catch {
    return { input: null, result: null, errors: { general: 'calculationFailed' } };
  }
}

interface FormDefaults {
  defaultPrefecture: Prefecture | null;
  defaultMunicipality: FreelanceMunicipality | null;
}

function formFromSalaryInput(
  input: SalaryInput | null,
  defaults: FormDefaults = { defaultPrefecture: null, defaultMunicipality: null },
): CalculatorFormState {
  // First-time path: prefill from user-level settings so the picker isn't
  // empty. Only applies when there's no stored calculation to restore.
  if (!input) {
    const seeded: CalculatorFormState = { ...DEFAULT_CALCULATOR_FORM };
    if (defaults.defaultPrefecture) seeded.prefecture = defaults.defaultPrefecture;
    if (defaults.defaultMunicipality) seeded.municipality = defaults.defaultMunicipality;
    return seeded;
  }

  const hasDetailed = input.monthlyBaseSalary !== undefined;
  const lifePremiums = input.lifeInsurancePremiums;
  return {
    ...DEFAULT_CALCULATOR_FORM,
    jobType: input.category === 'business' ? 'freelance' : 'seishain',
    annualIncomeInput: String(input.annualIncome),
    ageInput: String(input.age),
    prefecture: input.prefecture,
    pensionType: input.pensionType === 'national' ? 'kokumin' : 'kosei',
    municipality: input.municipality,
    blueReturnDeduction: input.blueReturnDeduction ?? 0,
    useDetailedSalary: hasDetailed,
    monthlyBaseSalaryInput: hasDetailed ? String(input.monthlyBaseSalary) : '',
    annualBonusInput: hasDetailed ? String(input.annualBonus ?? 0) : '',
    bonusPaymentCountInput: hasDetailed ? String(input.bonusPaymentCount ?? 2) : '2',
    idecoMonthlyInput: input.idecoMonthlyContribution
      ? String(input.idecoMonthlyContribution)
      : '',
    lifeInsuranceGeneralNewInput: lifePremiums?.generalNew ? String(lifePremiums.generalNew) : '',
    lifeInsuranceCareMedicalNewInput: lifePremiums?.careMedicalNew
      ? String(lifePremiums.careMedicalNew)
      : '',
    lifeInsurancePersonalPensionNewInput: lifePremiums?.personalPensionNew
      ? String(lifePremiums.personalPensionNew)
      : '',
    spouseAnnualIncomeInput: input.spouseAnnualIncome
      ? String(input.spouseAnnualIncome)
      : '',
  };
}

export const __testing = { formFromSalaryInput };

export function useCalculator() {
  const lastInput = useCalculatorStore((state) => state.lastInput);
  const lastResult = useCalculatorStore((state) => state.lastResult);
  const setStoredInput = useCalculatorStore((state) => state.setInput);
  const setStoredResult = useCalculatorStore((state) => state.setResult);
  const resetStore = useCalculatorStore((state) => state.reset);
  const addHistoryEntry = useHistoryStore((state) => state.addEntry);
  const multiJobs = useMultiJobStore((state) => state.jobs);
  const multiJobInputs = useMemo(() => multiJobs.map((j) => j.input), [multiJobs]);
  const defaultPrefecture = useSettingsStore((s) => s.settings.defaultPrefecture);
  const defaultMunicipality = useSettingsStore((s) => s.settings.defaultMunicipality);

  const initialForm = useMemo(
    () => formFromSalaryInput(lastInput, { defaultPrefecture, defaultMunicipality }),
    [lastInput, defaultPrefecture, defaultMunicipality],
  );
  const [mode, setMode] = useState<CalculatorMode>('input');
  const [form, setForm] = useState<CalculatorFormState>(initialForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [result, setResult] = useState<TakeHomeResult | null>(lastResult);
  const [submittedInput, setSubmittedInput] = useState<SalaryInput | null>(lastInput);

  const currentValidation = useMemo(
    () => validateCalculatorForm(form, { multiJobCount: multiJobInputs.length }),
    [form, multiJobInputs.length],
  );
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
    const next = computeCalculatorResult(form, multiJobInputs);
    setErrors(next.errors);
    if (!next.input || !next.result) return false;

    setStoredInput(next.input);
    setStoredResult(next.result);
    // Auto-append to history. If the store reports limit_reached the UI
    // will still show the latest result; user must clear some entries.
    addHistoryEntry(next.input, next.result);
    setSubmittedInput(next.input);
    setResult(next.result);
    setMode('result');
    return true;
  }, [form, multiJobInputs, setStoredInput, setStoredResult, addHistoryEntry]);

  const editInput = useCallback(() => {
    setMode('input');
  }, []);

  const reset = useCallback(() => {
    resetStore();
    setForm(formFromSalaryInput(null, { defaultPrefecture, defaultMunicipality }));
    setErrors({});
    setResult(null);
    setSubmittedInput(null);
    setMode('input');
  }, [resetStore, defaultPrefecture, defaultMunicipality]);

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

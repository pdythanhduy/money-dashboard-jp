/**
 * Japanese tax & social-insurance calculator for FY2026 (令和8年度).
 *
 * Public API:
 * - `calculateTakeHome(input)` — full result dispatcher (salary vs business).
 *
 * Helpers (exposed for testing and step-by-step debugging):
 * - `calculateEmploymentIncome(grossAnnual)`
 * - `calculateHealthInsurance(input)`
 * - `calculatePension(input)`
 * - `calculateEmploymentInsurance(input)`
 * - `calculateTaxableIncomeForNationalTax(input, socialInsuranceAnnual)`
 * - `calculateTaxableIncomeForResidentTax(input, socialInsuranceAnnual)`
 * - `calculateIncomeTaxFromTaxable(taxableForNationalTax)`
 * - `calculateResidentTaxFromTaxable(taxableForResidentTax, totalIncome, prefecture)`
 *
 * Rounding convention (matches NTA / 市区町村 practice):
 * - 課税所得 (taxable income): floor to ¥1,000.
 * - 所得税 final (incl. 復興税): floor to ¥100.
 * - All other amounts (社保, 住民税 components, intermediates): floor to ¥1.
 *
 * Assumptions in Phase 1:
 * - Salary workers are always enrolled in 健保 + 厚年 + 雇用保険.
 *   (Real-world: ≥¥88k/month + ≥20hr/week thresholds; not modeled.)
 * - 賞与 (bonus) handling depends on input shape:
 *   - If `monthlyBaseSalary` is set: 月給 uses 標準報酬月額 grade and bonus
 *     uses 標準賞与額 with the FY2026 caps (¥5.73M cumulative for 健保/介護,
 *     ¥1.5M per payment for 厚年). Accurate for users with bonus.
 *   - Otherwise: legacy fallback splits `annualIncome / 12` as monthly grade
 *     with no separate bonus calc. Less accurate but preserves 0.2.x behavior.
 * - Business income (`annualIncome`) is 事業所得 (already net of 経費).
 * - Single-person, single-household for 国保 (no shared 平等割 split).
 * - Spouse with `hasSpouse: true` is assumed to meet the ¥580k income cap.
 * - 配偶者特別控除, iDeCo, 生命保険料控除, 医療費控除 not modeled.
 */

import type {
  Dependent,
  FreelanceMunicipality,
  Prefecture,
  SalaryInput,
  TakeHomeBreakdown,
  TakeHomeResult,
} from '@/types/tax';

import {
  BASIC_DEDUCTION_NATIONAL_TAX,
  BASIC_DEDUCTION_RESIDENT_TAX,
} from './tax-data/basic-deduction';
import {
  KENPO_BONUS_ANNUAL_CAP,
  KOSEI_NENKIN_BONUS_PER_PAYMENT_CAP,
} from './tax-data/bonus-caps';
import { calculateEmploymentIncomeDeduction } from './tax-data/employment-income-deduction';
import { EMPLOYMENT_INSURANCE_RATE_EMPLOYEE } from './tax-data/employment-insurance';
import {
  INCOME_TAX_BRACKETS,
  RECONSTRUCTION_SURTAX_RATE,
} from './tax-data/income-tax-brackets';
import {
  CHILDCARE_SUPPORT_RATE_FY2026,
  KENPO_RATES,
  LONG_TERM_CARE_AGE_MAX,
  LONG_TERM_CARE_AGE_MIN,
} from './tax-data/kenpo-rates';
import { KOKUHO_BASIC_DEDUCTION, KOKUHO_RATES } from './tax-data/kokuho-rates';
import type { KokuhoComponentRate } from '@/types/tax';
import {
  DEPENDENT_DEDUCTION,
  DEPENDENT_DEDUCTION_RESIDENT_TAX,
  DEPENDENT_MIN_AGE,
  SPOUSE_DEDUCTION_NATIONAL_TAX,
  SPOUSE_DEDUCTION_RESIDENT_TAX,
  SPOUSE_INCOME_CEILING,
  SPOUSE_SPECIAL_DEDUCTION_NATIONAL_TAX,
  SPOUSE_SPECIAL_DEDUCTION_RESIDENT_TAX,
  SPOUSE_SPECIAL_INCOME_CEILING,
  TAXPAYER_SPOUSE_INCOME_CEILING,
  type SpouseDeductionRow,
  type SpouseSpecialDeductionRow,
  WORKING_STUDENT_DEDUCTION_NATIONAL_TAX,
  WORKING_STUDENT_DEDUCTION_RESIDENT_TAX,
  WORKING_STUDENT_INCOME_CEILING,
} from './tax-data/other-deductions';
import {
  calculateLifeInsuranceDeductionNational,
  calculateLifeInsuranceDeductionResident,
} from './life-insurance-deduction';
import {
  KOKUMIN_NENKIN_MONTHLY_FY2026,
  KOSEI_NENKIN_RATE_EMPLOYEE,
} from './tax-data/pension';
import {
  RESIDENT_TAX_INCOME_BASED_EXEMPTION_SINGLE,
  RESIDENT_TAX_PER_CAPITA_EXEMPTION_SINGLE,
  RESIDENT_TAX_RATES,
} from './tax-data/resident-tax';
import {
  getStandardRemunerationGrade,
  PENSION_MAX_STANDARD_REMUNERATION,
  STANDARD_REMUNERATION_GRADES,
} from './tax-data/standard-remuneration';
import type { BasicDeductionRow } from '@/types/tax';

// ---------------------------------------------------------------------------
// Rounding helpers
// ---------------------------------------------------------------------------

const floorToYen = (value: number): number => Math.floor(value);
const floorTo1000 = (value: number): number => Math.floor(value / 1000) * 1000;
const floorTo100 = (value: number): number => Math.floor(value / 100) * 100;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const SUPPORTED_PREFECTURES = Object.keys(KENPO_RATES) as readonly Prefecture[];
const SUPPORTED_MUNICIPALITIES = Object.keys(KOKUHO_RATES) as readonly FreelanceMunicipality[];

function validateInput(input: SalaryInput): void {
  if (!Number.isFinite(input.annualIncome) || input.annualIncome <= 0) {
    throw new Error(`annualIncome must be > 0, got ${input.annualIncome}`);
  }
  if (!Number.isFinite(input.age) || input.age < 0 || input.age > 120) {
    throw new Error(`age must be in [0, 120], got ${input.age}`);
  }
  if (input.category === 'salary') {
    if (!input.prefecture) {
      throw new Error(`category='salary' requires 'prefecture'`);
    }
    if (!SUPPORTED_PREFECTURES.includes(input.prefecture)) {
      throw new Error(
        `Prefecture '${input.prefecture}' không được hỗ trợ. Phase 1 chỉ support: ${SUPPORTED_PREFECTURES.join(', ')}`,
      );
    }
  } else if (input.category === 'business') {
    if (!input.municipality) {
      throw new Error(`category='business' requires 'municipality'`);
    }
    if (!SUPPORTED_MUNICIPALITIES.includes(input.municipality)) {
      throw new Error(
        `Municipality '${input.municipality}' không được hỗ trợ. Phase 1 chỉ support: ${SUPPORTED_MUNICIPALITIES.join(', ')}`,
      );
    }
  } else {
    throw new Error(`Unknown category: ${input.category as string}`);
  }
  if (input.hasSpouse && input.spouseAge === undefined) {
    throw new Error(`hasSpouse=true requires spouseAge`);
  }
  if (input.monthlyBaseSalary !== undefined) {
    if (!Number.isFinite(input.monthlyBaseSalary) || input.monthlyBaseSalary < 0) {
      throw new Error(`monthlyBaseSalary must be >= 0, got ${input.monthlyBaseSalary}`);
    }
    const bonus = input.annualBonus ?? 0;
    if (!Number.isFinite(bonus) || bonus < 0) {
      throw new Error(`annualBonus must be >= 0, got ${bonus}`);
    }
    const bonusCount = input.bonusPaymentCount ?? 2;
    if (bonus > 0 && (!Number.isInteger(bonusCount) || bonusCount <= 0)) {
      throw new Error(
        `bonusPaymentCount must be a positive integer when annualBonus > 0, got ${bonusCount}`,
      );
    }
    const computed = input.monthlyBaseSalary * 12 + bonus;
    if (Math.abs(computed - input.annualIncome) > 12) {
      throw new Error(
        `monthlyBaseSalary (${input.monthlyBaseSalary}) × 12 + annualBonus (${bonus}) = ${computed}, ` +
          `but annualIncome = ${input.annualIncome}. They must match within ±¥12.`,
      );
    }
  }
  if (input.idecoMonthlyContribution !== undefined) {
    if (!Number.isFinite(input.idecoMonthlyContribution) || input.idecoMonthlyContribution < 0) {
      throw new Error(
        `idecoMonthlyContribution must be >= 0, got ${input.idecoMonthlyContribution}`,
      );
    }
  }
  if (input.lifeInsurancePremiums) {
    const fields: ReadonlyArray<['generalNew' | 'careMedicalNew' | 'personalPensionNew', number | undefined]> = [
      ['generalNew', input.lifeInsurancePremiums.generalNew],
      ['careMedicalNew', input.lifeInsurancePremiums.careMedicalNew],
      ['personalPensionNew', input.lifeInsurancePremiums.personalPensionNew],
    ];
    for (const [name, val] of fields) {
      if (val !== undefined && (!Number.isFinite(val) || val < 0)) {
        throw new Error(`lifeInsurancePremiums.${name} must be >= 0, got ${val}`);
      }
    }
  }
  if (input.spouseAnnualIncome !== undefined) {
    if (!Number.isFinite(input.spouseAnnualIncome) || input.spouseAnnualIncome < 0) {
      throw new Error(`spouseAnnualIncome must be >= 0, got ${input.spouseAnnualIncome}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Deduction lookups
// ---------------------------------------------------------------------------

function lookupBasicDeduction(table: readonly BasicDeductionRow[], totalIncome: number): number {
  for (const row of table) {
    if (totalIncome <= row.totalIncomeUpperBound) return row.deduction;
  }
  return 0;
}

function lookupSpouseDeduction(
  table: readonly SpouseDeductionRow[],
  hasSpouse: boolean,
  spouseAge: number | undefined,
  taxpayerTotalIncome: number,
): number {
  if (!hasSpouse) return 0;
  const isElderly = (spouseAge ?? 0) >= 70;
  for (const row of table) {
    if (taxpayerTotalIncome <= row.taxpayerIncomeUpperBound) {
      return isElderly ? row.elderlyDeduction : row.generalDeduction;
    }
  }
  return 0;
}

function lookupSpouseSpecialDeduction(
  table: readonly SpouseSpecialDeductionRow[],
  spouseTotalIncome: number,
  taxpayerTotalIncome: number,
): number {
  if (spouseTotalIncome <= SPOUSE_INCOME_CEILING) return 0;
  if (spouseTotalIncome > SPOUSE_SPECIAL_INCOME_CEILING) return 0;
  if (taxpayerTotalIncome > TAXPAYER_SPOUSE_INCOME_CEILING) return 0;
  for (const row of table) {
    if (taxpayerTotalIncome <= row.taxpayerIncomeUpperBound) {
      for (const tier of row.tiers) {
        if (spouseTotalIncome <= tier.spouseIncomeUpperBound) {
          return tier.deduction;
        }
      }
    }
  }
  return 0;
}

/**
 * Dispatch spouse deduction: 配偶者控除 (when spouse 合計所得 ≤ ¥580k) OR
 * 配偶者特別控除 (¥580k < spouse 合計所得 ≤ ¥1.33M). Returns the applicable
 * amount; the two are mutually exclusive.
 *
 * If `spouseAnnualIncome` is undefined and `hasSpouse` is true, falls back
 * to legacy behavior (assumes spouse qualifies for full 配偶者控除).
 */
function resolveSpouseDeduction(
  input: SalaryInput,
  controlTable: readonly SpouseDeductionRow[],
  specialTable: readonly SpouseSpecialDeductionRow[],
  taxpayerTotalIncome: number,
): number {
  if (!input.hasSpouse) return 0;
  if (input.spouseAnnualIncome === undefined) {
    return lookupSpouseDeduction(controlTable, true, input.spouseAge, taxpayerTotalIncome);
  }
  const spouseEmploymentIncomeDed = calculateEmploymentIncomeDeduction(input.spouseAnnualIncome);
  const spouseTotalIncome = Math.max(0, input.spouseAnnualIncome - spouseEmploymentIncomeDed);
  if (spouseTotalIncome <= SPOUSE_INCOME_CEILING) {
    return lookupSpouseDeduction(controlTable, true, input.spouseAge, taxpayerTotalIncome);
  }
  return lookupSpouseSpecialDeduction(specialTable, spouseTotalIncome, taxpayerTotalIncome);
}

type DependentTable = typeof DEPENDENT_DEDUCTION | typeof DEPENDENT_DEDUCTION_RESIDENT_TAX;

function lookupDependentDeduction(table: DependentTable, dependents: readonly Dependent[]): number {
  let sum = 0;
  for (const d of dependents) {
    if (d.age < DEPENDENT_MIN_AGE) continue;
    if (d.age >= 70) {
      sum += d.livesWithTaxpayer ? table.elderly_70_plus_coresident : table.elderly_70_plus_apart;
    } else if (d.age >= 19 && d.age <= 22) {
      sum += table.specific_19_to_22;
    } else {
      sum += table.general;
    }
  }
  return sum;
}

function lookupWorkingStudentDeduction(
  amount: number,
  isStudent: boolean | undefined,
  totalIncome: number,
): number {
  if (!isStudent) return 0;
  if (totalIncome > WORKING_STUDENT_INCOME_CEILING) return 0;
  return amount;
}

// ---------------------------------------------------------------------------
// Income & social insurance
// ---------------------------------------------------------------------------

/**
 * 給与所得 = gross annual salary - 給与所得控除. Returns 0 if result would
 * be negative (caller's responsibility to handle business income separately).
 *
 * @see ./tax-data/employment-income-deduction.ts
 */
export function calculateEmploymentIncome(grossAnnualIncome: number): number {
  return Math.max(0, grossAnnualIncome - calculateEmploymentIncomeDeduction(grossAnnualIncome));
}

/** 事業所得 = gross - 青色申告控除. Returns 0 if negative. */
function calculateBusinessIncome(input: SalaryInput): number {
  const blueDeduction = input.blueReturnDeduction ?? 0;
  return Math.max(0, input.annualIncome - blueDeduction);
}

/** Total income (合計所得金額) — sum of all income categories. */
function calculateTotalIncome(input: SalaryInput): number {
  return input.category === 'salary'
    ? calculateEmploymentIncome(input.annualIncome)
    : calculateBusinessIncome(input);
}

/**
 * 健康保険 + 介護保険 (employee portion, annual yen) for salary, OR
 * 国民健康保険 total (annual yen) for business. Dispatches by category.
 *
 * Salary mode further dispatches on the presence of `monthlyBaseSalary`:
 * if set, monthly portion uses 標準報酬月額 grade and bonus portion uses
 * 標準賞与額 with the ¥5.73M annual cap (蓄積).
 *
 * @see ./tax-data/kenpo-rates.ts (salary)
 * @see ./tax-data/kokuho-rates.ts (business)
 */
export function calculateHealthInsurance(input: SalaryInput): number {
  validateInput(input);
  if (input.category === 'salary') {
    if (input.monthlyBaseSalary !== undefined) {
      return calculateHealthInsuranceSalaryWithBonus(
        input.monthlyBaseSalary,
        input.annualBonus ?? 0,
        input.bonusPaymentCount ?? 2,
        input.prefecture as Prefecture,
        input.age,
      );
    }
    return calculateHealthInsuranceSalary(
      input.annualIncome / 12,
      input.prefecture as Prefecture,
      input.age,
    );
  }
  return calculateNationalHealthInsurance(
    calculateBusinessIncome(input),
    input.municipality as FreelanceMunicipality,
    input.age,
  );
}

/** 標準賞与額 — round bonus payment down to nearest ¥1,000. */
function standardBonusAmount(bonusPayment: number): number {
  return Math.floor(bonusPayment / 1_000) * 1_000;
}

function calculateHealthInsuranceSalary(
  monthlyIncome: number,
  prefecture: Prefecture,
  age: number,
): number {
  const grade = getStandardRemunerationGrade(monthlyIncome);
  const rate = KENPO_RATES[prefecture];
  const eligibleCare = age >= LONG_TERM_CARE_AGE_MIN && age <= LONG_TERM_CARE_AGE_MAX;
  // 健保 + 介護 (40-64) + 子ども・子育て支援金 (FY2026, universal).
  const totalRate =
    rate.healthRate +
    (eligibleCare ? rate.longTermCareRate : 0) +
    CHILDCARE_SUPPORT_RATE_FY2026;
  const monthlyEmployee = floorToYen((grade.monthlyAmount * totalRate) / 2);
  return monthlyEmployee * 12;
}

/**
 * Monthly portion uses 標準報酬月額 grade from `monthlyBase`. Bonus portion
 * sums per-payment premiums on 標準賞与額, capped cumulatively at
 * KENPO_BONUS_ANNUAL_CAP across the fiscal year (健保 + 介護 share the cap).
 */
function calculateHealthInsuranceSalaryWithBonus(
  monthlyBase: number,
  annualBonus: number,
  bonusCount: number,
  prefecture: Prefecture,
  age: number,
): number {
  const monthlyAnnual = calculateHealthInsuranceSalary(monthlyBase, prefecture, age);
  if (annualBonus <= 0 || bonusCount <= 0) return monthlyAnnual;

  const rate = KENPO_RATES[prefecture];
  const eligibleCare = age >= LONG_TERM_CARE_AGE_MIN && age <= LONG_TERM_CARE_AGE_MAX;
  // Bonus uses same rate stack as monthly: 健保 + 介護 + 子ども・子育て.
  const totalRate =
    rate.healthRate +
    (eligibleCare ? rate.longTermCareRate : 0) +
    CHILDCARE_SUPPORT_RATE_FY2026;

  const perBonusPayment = annualBonus / bonusCount;
  let cumulativeStandardBonus = 0;
  let bonusEmployee = 0;
  for (let i = 0; i < bonusCount; i += 1) {
    const stdBonusRaw = standardBonusAmount(perBonusPayment);
    const remainingCap = Math.max(0, KENPO_BONUS_ANNUAL_CAP - cumulativeStandardBonus);
    const stdBonus = Math.min(stdBonusRaw, remainingCap);
    cumulativeStandardBonus += stdBonus;
    bonusEmployee += floorToYen((stdBonus * totalRate) / 2);
  }
  return monthlyAnnual + bonusEmployee;
}

function calculateKokuhoComponent(
  taxableIncome: number,
  rate: KokuhoComponentRate,
): number {
  let amount = floorToYen(taxableIncome * rate.incomeRate) + rate.perPersonAmount;
  if (rate.perHouseholdAmount !== null) amount += rate.perHouseholdAmount;
  return Math.min(amount, rate.annualCap);
}

function calculateNationalHealthInsurance(
  businessIncome: number,
  municipality: FreelanceMunicipality,
  age: number,
): number {
  const rates = KOKUHO_RATES[municipality];
  const taxableForKokuho = Math.max(0, businessIncome - KOKUHO_BASIC_DEDUCTION);
  const eligibleCare = age >= LONG_TERM_CARE_AGE_MIN && age <= LONG_TERM_CARE_AGE_MAX;

  let total = 0;
  total += calculateKokuhoComponent(taxableForKokuho, rates.medical);
  total += calculateKokuhoComponent(taxableForKokuho, rates.elderlySupport);
  if (eligibleCare) {
    total += calculateKokuhoComponent(taxableForKokuho, rates.longTermCare);
  }
  if (rates.childcareSupport) {
    total += calculateKokuhoComponent(taxableForKokuho, rates.childcareSupport);
  }
  return total;
}

/**
 * 厚生年金 (employee portion, annual yen) for salary, OR 国民年金 (annual)
 * for business. Dispatches by category.
 *
 * Salary mode further dispatches on `monthlyBaseSalary`: if set, monthly
 * portion uses 標準報酬月額 (cap ¥650k) and bonus portion sums premiums on
 * each 標準賞与額 capped per-payment at KOSEI_NENKIN_BONUS_PER_PAYMENT_CAP.
 */
export function calculatePension(input: SalaryInput): number {
  validateInput(input);
  if (input.category === 'salary') {
    if (input.pensionType === 'national') {
      return calculateNationalPensionAnnual();
    }
    if (input.monthlyBaseSalary !== undefined) {
      return calculatePensionSalaryWithBonus(
        input.monthlyBaseSalary,
        input.annualBonus ?? 0,
        input.bonusPaymentCount ?? 2,
      );
    }
    return calculatePensionSalary(input.annualIncome / 12);
  }
  return calculateNationalPensionAnnual();
}

function calculatePensionSalary(monthlyIncome: number): number {
  const grade = getStandardRemunerationGrade(monthlyIncome);
  const standardForPension = Math.min(grade.monthlyAmount, PENSION_MAX_STANDARD_REMUNERATION);
  const monthlyEmployee = floorToYen(standardForPension * KOSEI_NENKIN_RATE_EMPLOYEE);
  return monthlyEmployee * 12;
}

/**
 * Monthly portion uses 標準報酬月額 grade (capped at ¥650k for 厚年). Bonus
 * portion: each payment's 標準賞与額 is capped at ¥1.5M independently — no
 * cumulative cap (unlike 健保).
 */
function calculatePensionSalaryWithBonus(
  monthlyBase: number,
  annualBonus: number,
  bonusCount: number,
): number {
  const monthlyAnnual = calculatePensionSalary(monthlyBase);
  if (annualBonus <= 0 || bonusCount <= 0) return monthlyAnnual;

  const perBonusPayment = annualBonus / bonusCount;
  let bonusEmployee = 0;
  for (let i = 0; i < bonusCount; i += 1) {
    const stdBonusRaw = standardBonusAmount(perBonusPayment);
    const stdBonus = Math.min(stdBonusRaw, KOSEI_NENKIN_BONUS_PER_PAYMENT_CAP);
    bonusEmployee += floorToYen(stdBonus * KOSEI_NENKIN_RATE_EMPLOYEE);
  }
  return monthlyAnnual + bonusEmployee;
}

function calculateNationalPensionAnnual(): number {
  return KOKUMIN_NENKIN_MONTHLY_FY2026 * 12;
}

/**
 * 雇用保険 (employee portion, annual yen). 0 for business (freelancers
 * don't pay 雇用保険).
 */
export function calculateEmploymentInsurance(input: SalaryInput): number {
  validateInput(input);
  if (input.category !== 'salary') return 0;
  return floorToYen(input.annualIncome * EMPLOYMENT_INSURANCE_RATE_EMPLOYEE);
}

// ---------------------------------------------------------------------------
// Taxable income (課税所得)
// ---------------------------------------------------------------------------

/**
 * 課税所得 for 所得税. Already rounded down to ¥1,000.
 *
 * Pass `socialInsuranceAnnual = 0` to compute the "naked" deduction wall
 * (useful for testing the 160万円 / 103万円 boundaries).
 */
export function calculateTaxableIncomeForNationalTax(
  input: SalaryInput,
  socialInsuranceAnnual: number,
): number {
  const totalIncome = calculateTotalIncome(input);
  const basic = lookupBasicDeduction(BASIC_DEDUCTION_NATIONAL_TAX, totalIncome);
  const spouse = resolveSpouseDeduction(
    input,
    SPOUSE_DEDUCTION_NATIONAL_TAX,
    SPOUSE_SPECIAL_DEDUCTION_NATIONAL_TAX,
    totalIncome,
  );
  const dependent = lookupDependentDeduction(DEPENDENT_DEDUCTION, input.dependents ?? []);
  const workingStudent = lookupWorkingStudentDeduction(
    WORKING_STUDENT_DEDUCTION_NATIONAL_TAX,
    input.isWorkingStudent,
    totalIncome,
  );
  const ideco = (input.idecoMonthlyContribution ?? 0) * 12;
  const lifeInsurance = calculateLifeInsuranceDeductionNational(input.lifeInsurancePremiums);
  const taxable =
    totalIncome -
    socialInsuranceAnnual -
    basic -
    spouse -
    dependent -
    workingStudent -
    ideco -
    lifeInsurance;
  return floorTo1000(Math.max(0, taxable));
}

/** 課税所得 for 住民税. Already rounded down to ¥1,000. */
export function calculateTaxableIncomeForResidentTax(
  input: SalaryInput,
  socialInsuranceAnnual: number,
): number {
  const totalIncome = calculateTotalIncome(input);
  const basic = lookupBasicDeduction(BASIC_DEDUCTION_RESIDENT_TAX, totalIncome);
  const spouse = resolveSpouseDeduction(
    input,
    SPOUSE_DEDUCTION_RESIDENT_TAX,
    SPOUSE_SPECIAL_DEDUCTION_RESIDENT_TAX,
    totalIncome,
  );
  const dependent = lookupDependentDeduction(
    DEPENDENT_DEDUCTION_RESIDENT_TAX,
    input.dependents ?? [],
  );
  const workingStudent = lookupWorkingStudentDeduction(
    WORKING_STUDENT_DEDUCTION_RESIDENT_TAX,
    input.isWorkingStudent,
    totalIncome,
  );
  const ideco = (input.idecoMonthlyContribution ?? 0) * 12;
  const lifeInsurance = calculateLifeInsuranceDeductionResident(input.lifeInsurancePremiums);
  const taxable =
    totalIncome -
    socialInsuranceAnnual -
    basic -
    spouse -
    dependent -
    workingStudent -
    ideco -
    lifeInsurance;
  return floorTo1000(Math.max(0, taxable));
}

// ---------------------------------------------------------------------------
// Tax application
// ---------------------------------------------------------------------------

export interface IncomeTaxBreakdown {
  baseIncomeTax: number;
  reconstructionSurtax: number;
  total: number;
}

/**
 * Apply 所得税 progressive brackets + 復興特別所得税 surtax. Final amount
 * floor to ¥100 (NTA rounding).
 */
export function calculateIncomeTaxFromTaxable(taxableForNationalTax: number): IncomeTaxBreakdown {
  if (taxableForNationalTax <= 0) {
    return { baseIncomeTax: 0, reconstructionSurtax: 0, total: 0 };
  }
  let bracket = INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.length - 1]!;
  for (const b of INCOME_TAX_BRACKETS) {
    if (taxableForNationalTax >= b.lowerBound && taxableForNationalTax <= b.upperBound) {
      bracket = b;
      break;
    }
  }
  const baseIncomeTax = floorToYen(taxableForNationalTax * bracket.rate - bracket.deduction);
  const reconstructionSurtax = floorToYen(baseIncomeTax * RECONSTRUCTION_SURTAX_RATE);
  const total = floorTo100(baseIncomeTax + reconstructionSurtax);
  return { baseIncomeTax, reconstructionSurtax, total };
}

export interface ResidentTaxBreakdown {
  incomeBased: number;
  perCapita: number;
  total: number;
}

/**
 * 住民税 = 所得割 (10% of taxable) + 均等割 (flat ¥5,000). Both portions are
 * waived under the single-person exemption thresholds when 合計所得 is small.
 */
export function calculateResidentTaxFromTaxable(
  taxableForResidentTax: number,
  totalIncome: number,
  prefecture: Prefecture,
): ResidentTaxBreakdown {
  const rate = RESIDENT_TAX_RATES[prefecture];
  const incomeBasedExempt = totalIncome <= RESIDENT_TAX_INCOME_BASED_EXEMPTION_SINGLE;
  const perCapitaExempt = totalIncome <= RESIDENT_TAX_PER_CAPITA_EXEMPTION_SINGLE;
  const incomeBased = incomeBasedExempt ? 0 : floorToYen(taxableForResidentTax * rate.incomeRate);
  const perCapita = perCapitaExempt ? 0 : rate.perCapita;
  return { incomeBased, perCapita, total: incomeBased + perCapita };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

/**
 * Compute take-home from a full SalaryInput. Dispatches:
 * - `category: 'salary'` → 協会けんぽ + 厚生年金 + 雇用保険
 * - `category: 'business'` → 国民健康保険 + 国民年金
 */
export function calculateTakeHome(input: SalaryInput): TakeHomeResult {
  validateInput(input);

  const grossAnnual = input.annualIncome;
  const employmentIncomeDeduction =
    input.category === 'salary' ? calculateEmploymentIncomeDeduction(grossAnnual) : 0;
  const totalIncome = calculateTotalIncome(input);

  const healthDispatched = calculateHealthInsurance(input);
  const pensionDispatched = calculatePension(input);
  const employmentIns = calculateEmploymentInsurance(input);

  const socialInsuranceAnnual = healthDispatched + pensionDispatched + employmentIns;

  const taxableNational = calculateTaxableIncomeForNationalTax(input, socialInsuranceAnnual);
  const taxableResident = calculateTaxableIncomeForResidentTax(input, socialInsuranceAnnual);

  const incomeTaxBreakdown = calculateIncomeTaxFromTaxable(taxableNational);
  const residentPrefecture: Prefecture =
    input.category === 'salary' ? (input.prefecture as Prefecture) : 'osaka'; // freelance falls back to a representative rate (all currently identical)
  const residentTaxBreakdown = calculateResidentTaxFromTaxable(
    taxableResident,
    totalIncome,
    residentPrefecture,
  );

  // Split health/pension into salary vs business reporting fields.
  const healthSalary = input.category === 'salary' ? healthDispatched : 0;
  const pensionSalary = input.category === 'salary' ? pensionDispatched : 0;
  const healthBusiness = input.category === 'business' ? healthDispatched : 0;
  const pensionBusiness = input.category === 'business' ? pensionDispatched : 0;

  const monthlyForGrade = input.category === 'salary' ? input.annualIncome / 12 : undefined;
  const standardMonthlyRemuneration =
    monthlyForGrade !== undefined ? getStandardRemunerationGrade(monthlyForGrade).monthlyAmount : undefined;

  const idecoAnnual = (input.idecoMonthlyContribution ?? 0) * 12;
  const lifeInsuranceNational = calculateLifeInsuranceDeductionNational(input.lifeInsurancePremiums);
  const lifeInsuranceResident = calculateLifeInsuranceDeductionResident(input.lifeInsurancePremiums);

  const breakdown: TakeHomeBreakdown = {
    employmentIncomeDeduction,
    employmentIncome: input.category === 'salary' ? totalIncome : 0,
    totalIncome,
    basicDeductionNationalTax: lookupBasicDeduction(BASIC_DEDUCTION_NATIONAL_TAX, totalIncome),
    basicDeductionResidentTax: lookupBasicDeduction(BASIC_DEDUCTION_RESIDENT_TAX, totalIncome),
    socialInsuranceDeduction: socialInsuranceAnnual,
    spouseDeduction: resolveSpouseDeduction(
      input,
      SPOUSE_DEDUCTION_NATIONAL_TAX,
      SPOUSE_SPECIAL_DEDUCTION_NATIONAL_TAX,
      totalIncome,
    ),
    dependentDeduction: lookupDependentDeduction(DEPENDENT_DEDUCTION, input.dependents ?? []),
    workingStudentDeduction: lookupWorkingStudentDeduction(
      WORKING_STUDENT_DEDUCTION_NATIONAL_TAX,
      input.isWorkingStudent,
      totalIncome,
    ),
    idecoDeduction: idecoAnnual,
    lifeInsuranceDeductionNational: lifeInsuranceNational,
    lifeInsuranceDeductionResident: lifeInsuranceResident,
    taxableIncomeForNationalTax: taxableNational,
    taxableIncomeForResidentTax: taxableResident,
    baseIncomeTax: incomeTaxBreakdown.baseIncomeTax,
    reconstructionSurtax: incomeTaxBreakdown.reconstructionSurtax,
    residentTaxIncomeBased: residentTaxBreakdown.incomeBased,
    residentTaxPerCapita: residentTaxBreakdown.perCapita,
    ...(standardMonthlyRemuneration !== undefined ? { standardMonthlyRemuneration } : {}),
  };

  const totalDeductions =
    incomeTaxBreakdown.total +
    residentTaxBreakdown.total +
    healthSalary +
    pensionSalary +
    employmentIns +
    healthBusiness +
    pensionBusiness;

  if (totalDeductions < 0) {
    throw new Error(`Bug: totalDeductions is negative (${totalDeductions}). Input: ${JSON.stringify(input)}`);
  }

  const takeHomeAnnual = grossAnnual - totalDeductions;
  const takeHomeMonthly = floorToYen(takeHomeAnnual / 12);

  return {
    grossAnnual,
    incomeTax: incomeTaxBreakdown.total,
    residentTax: residentTaxBreakdown.total,
    healthInsurance: healthSalary,
    pension: pensionSalary,
    employmentInsurance: employmentIns,
    nationalHealthInsurance: healthBusiness,
    nationalPension: pensionBusiness,
    totalDeductions,
    takeHomeAnnual,
    takeHomeMonthly,
    breakdown,
  };
}

// Re-export the grade table for tests / UI debugging.
export { STANDARD_REMUNERATION_GRADES, getStandardRemunerationGrade };

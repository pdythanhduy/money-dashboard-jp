/**
 * 医療費控除 (Medical Expense Deduction) math — pure, FY-stable.
 *
 * NTA rule: deductible = max(0, totalNetExpenses - threshold), capped at
 * ¥2,000,000. Threshold = min(¥100,000, 5% × 総所得). Lower-income filers
 * therefore unlock the deduction sooner.
 *
 * Refund estimate = deductible × marginal income tax rate × 1.1
 *   (the 1.1 includes 住民税 ~10%, a reasonable approximation since the
 *   resident-tax deduction is computed on the same base).
 */

import { INCOME_TAX_BRACKETS } from '@/lib/tax-data/income-tax-brackets';

export type MedicalCategory =
  | 'doctor_visit'
  | 'hospitalization'
  | 'pharmacy'
  | 'dental'
  | 'optical'
  | 'maternity'
  | 'transportation'
  | 'other';

export const ALL_MEDICAL_CATEGORIES: readonly MedicalCategory[] = [
  'doctor_visit',
  'hospitalization',
  'pharmacy',
  'dental',
  'optical',
  'maternity',
  'transportation',
  'other',
];

export interface MedicalExpense {
  id: string;
  /** ISO date, e.g. "2026-05-19". */
  date: string;
  /** Integer yen. */
  amount: number;
  category: MedicalCategory;
  provider?: string;
  note?: string;
  /** Persisted `file://` URI of the receipt photo (managed by receipt-storage). */
  receiptImageUri?: string;
  /** Insurance / employer reimbursement to subtract from this expense. */
  reimbursedAmount?: number;
}

/** Hard NTA constants. */
export const MEDICAL_DEDUCTION_FLAT_THRESHOLD = 100_000;
export const MEDICAL_DEDUCTION_INCOME_RATIO = 0.05;
export const MEDICAL_DEDUCTION_MAX = 2_000_000;

/** Single expense after subtracting reimbursement; never negative. */
export function netExpense(e: MedicalExpense): number {
  const refund = Math.max(0, e.reimbursedAmount ?? 0);
  return Math.max(0, Math.floor(e.amount - refund));
}

export function totalNetExpenses(expenses: readonly MedicalExpense[]): number {
  return expenses.reduce((sum, e) => sum + netExpense(e), 0);
}

/**
 * The income-aware threshold a filer must cross before a single yen
 * becomes deductible. Always integer.
 */
export function effectiveThreshold(annualIncome: number): number {
  if (!Number.isFinite(annualIncome) || annualIncome <= 0) {
    return MEDICAL_DEDUCTION_FLAT_THRESHOLD;
  }
  const ratioCap = Math.floor(annualIncome * MEDICAL_DEDUCTION_INCOME_RATIO);
  return Math.min(MEDICAL_DEDUCTION_FLAT_THRESHOLD, ratioCap);
}

/**
 * Deductible amount under 医療費控除. Excess over `effectiveThreshold`
 * up to the ¥2,000,000 statutory cap.
 */
export function deductibleAmount(
  expenses: readonly MedicalExpense[],
  annualIncome: number,
): number {
  const total = totalNetExpenses(expenses);
  const threshold = effectiveThreshold(annualIncome);
  const overThreshold = Math.max(0, total - threshold);
  return Math.min(MEDICAL_DEDUCTION_MAX, overThreshold);
}

/**
 * Rough refund: deduction × (所得税 marginal rate + 住民税 ~10%). We use
 * the 1.10 multiplier on the income-tax marginal rate to approximate the
 * resident-tax portion that flows through the same deduction.
 */
export function estimatedTaxRefund(deductible: number, marginalIncomeTaxRate: number): number {
  if (deductible <= 0 || marginalIncomeTaxRate <= 0) return 0;
  return Math.floor(deductible * (marginalIncomeTaxRate + 0.1));
}

/**
 * Look up the income-tax marginal rate that applies to a given
 * 課税所得. Wraps the canonical FY2026 brackets in `tax-data/`.
 */
export function pickMarginalRate(taxableIncome: number): number {
  if (!Number.isFinite(taxableIncome) || taxableIncome <= 0) return 0;
  for (const b of INCOME_TAX_BRACKETS) {
    if (taxableIncome >= b.lowerBound && taxableIncome <= b.upperBound) return b.rate;
  }
  // Top bracket fallback (shouldn't reach — Infinity upperBound covers it).
  const top = INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.length - 1];
  return top ? top.rate : 0;
}

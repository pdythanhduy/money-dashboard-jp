/**
 * 確定申告 (kakutei shinkoku) helper.
 *
 * Aggregates inputs the user already has elsewhere in the app — salary
 * result from Calculator, 医療費 from Phase 5L, ふるさと納税 from Phase 5M —
 * plus three manual lines (生命保険料, 地震保険料, 国民年金 extra) into a
 * single deduction list, then computes 課税所得 → estimated 所得税 →
 * refund-vs-due against the year's withheld tax.
 *
 * This is an ESTIMATE for planning. It does NOT replace e-Tax, and is
 * deliberately conservative on edge cases (老人控除, 配偶者特別, 旧制度
 * 生保 etc.) — the disclaimer surfaces this to the user.
 */

import { calculateIncomeTaxFromTaxable } from '@/lib/tax-calculator';
import type { TakeHomeResult } from '@/types/tax';

/** New-regime (2012+) cap per category. */
export const LIFE_INSURANCE_DEDUCTION_MAX = 40_000;
/** 地震保険料控除 cap (all-in). */
export const EARTHQUAKE_INSURANCE_DEDUCTION_MAX = 50_000;
/** 社会保険料 is always 100% deductible. */
export const SOCIAL_INSURANCE_FULL_DEDUCTION = true;
/** ふるさと納税 self-burden — only the portion above this is deductible. */
export const FURUSATO_SELF_BURDEN = 2_000;
/** 住民税 所得割 rate (10% combined: 4% 道府県 + 6% 市町村). */
export const RESIDENT_TAX_INCOME_RATE = 0.10;

export interface KakuteiInput {
  /** Fiscal year being filed (e.g. 2025 = filing in early 2026). */
  fiscalYear: number;
  /** Latest take-home result from the Calculator. */
  salaryResult: TakeHomeResult | null;
  /** Net 医療費 above the 100K / 5%-of-income threshold. */
  medicalDeductibleAmount: number;
  /** Total ふるさと納税 yen donated in `fiscalYear`. */
  furusatoDonationTotal: number;
  /** Annual 生命保険料 (新制度 only — UI documents this in the field hint). */
  lifeInsurancePremium: number;
  /** Annual 地震保険料. */
  earthquakeInsurancePremium: number;
  /** Optional extra 国民年金 paid (for people who paid 国民年金 outside
   *  salary 厚生年金). Added to social insurance line. */
  publicPensionContribution: number;
}

export interface DeductionLine {
  /** i18n key under `kakutei.deductions.*`. */
  key: string;
  amount: number;
  /** Optional human note rendered in the UI (e.g. "from Calculator"). */
  note?: string;
}

export interface KakuteiSummary {
  fiscalYear: number;
  grossIncome: number;
  /** 給与所得 (after 給与所得控除). */
  employmentIncomeAmount: number;
  deductions: DeductionLine[];
  totalDeductions: number;
  taxableIncome: number;
  /** Includes 復興特別所得税 (handled by calculateIncomeTaxFromTaxable). */
  estimatedIncomeTax: number;
  /** 源泉徴収済の所得税. */
  withheldTax: number;
  /** estimatedIncomeTax - withheldTax. Negative = refund due to user. */
  refundOrDue: number;
  isRefund: boolean;
  /** Estimated 住民税 所得割 for *next* year (≈10% × taxable income). */
  residentTaxImpact: number;
}

/**
 * 新生命保険料控除 (post-2012 contracts). The 3-tier formula in NTA
 * documentation, in yen:
 *
 *   premium ≤ ¥20,000          → deduction = premium
 *   ¥20,000 < premium ≤ ¥40,000 → deduction = premium / 2 + 10,000
 *   ¥40,000 < premium ≤ ¥80,000 → deduction = premium / 4 + 20,000
 *   premium > ¥80,000           → deduction = 40,000 (cap)
 */
export function computeLifeInsuranceDeduction(premium: number): number {
  if (!Number.isFinite(premium) || premium <= 0) return 0;
  if (premium <= 20_000) return premium;
  if (premium <= 40_000) return Math.floor(premium / 2 + 10_000);
  if (premium <= 80_000) return Math.floor(premium / 4 + 20_000);
  return LIFE_INSURANCE_DEDUCTION_MAX;
}

/**
 * 地震保険料控除 — 100% of premium, capped at ¥50,000.
 */
export function computeEarthquakeInsuranceDeduction(premium: number): number {
  if (!Number.isFinite(premium) || premium <= 0) return 0;
  return Math.min(premium, EARTHQUAKE_INSURANCE_DEDUCTION_MAX);
}

function emptySummary(fiscalYear: number): KakuteiSummary {
  return {
    fiscalYear,
    grossIncome: 0,
    employmentIncomeAmount: 0,
    deductions: [],
    totalDeductions: 0,
    taxableIncome: 0,
    estimatedIncomeTax: 0,
    withheldTax: 0,
    refundOrDue: 0,
    isRefund: false,
    residentTaxImpact: 0,
  };
}

export function buildKakuteiSummary(input: KakuteiInput): KakuteiSummary {
  if (!input.salaryResult) {
    return emptySummary(input.fiscalYear);
  }

  const sr = input.salaryResult;
  const b = sr.breakdown;

  const lifeIns = computeLifeInsuranceDeduction(input.lifeInsurancePremium);
  const earthquakeIns = computeEarthquakeInsuranceDeduction(input.earthquakeInsurancePremium);
  // 社会保険料控除 = what Calculator already deducted PLUS any extra 国民年金 the user paid outside salary.
  const socialIns = Math.max(0, b.socialInsuranceDeduction + Math.max(0, input.publicPensionContribution));
  const furusatoNet = Math.max(0, input.furusatoDonationTotal - FURUSATO_SELF_BURDEN);

  const lines: DeductionLine[] = [
    { key: 'basic', amount: b.basicDeductionNationalTax },
    { key: 'social_insurance', amount: socialIns },
  ];
  if (lifeIns > 0) lines.push({ key: 'life_insurance', amount: lifeIns });
  if (earthquakeIns > 0) lines.push({ key: 'earthquake_insurance', amount: earthquakeIns });
  if (input.medicalDeductibleAmount > 0) {
    lines.push({ key: 'medical', amount: input.medicalDeductibleAmount });
  }
  if (furusatoNet > 0) lines.push({ key: 'furusato', amount: furusatoNet });
  if (b.spouseDeduction > 0) lines.push({ key: 'spouse', amount: b.spouseDeduction });
  if (b.dependentDeduction > 0) lines.push({ key: 'dependent', amount: b.dependentDeduction });
  if (b.workingStudentDeduction > 0) {
    lines.push({ key: 'working_student', amount: b.workingStudentDeduction });
  }

  const totalDeductions = lines.reduce((s, l) => s + l.amount, 0);

  // 課税所得 floor 1000 per NTA convention.
  const rawTaxable = b.employmentIncome - totalDeductions;
  const taxableIncome = rawTaxable > 0 ? Math.floor(rawTaxable / 1000) * 1000 : 0;

  const tax = calculateIncomeTaxFromTaxable(taxableIncome);
  const estimatedIncomeTax = tax.total;

  const withheldTax = sr.incomeTax;
  const refundOrDue = estimatedIncomeTax - withheldTax;
  const isRefund = refundOrDue < 0;

  // 住民税 所得割 next year ≈ 10% × taxable (resident-tax basic deduction is
  // ¥430K vs national ¥480K-580K, so this is a rough approximation —
  // surfaced as "estimate" in the UI).
  const residentTaxImpact = Math.max(0, Math.floor(taxableIncome * RESIDENT_TAX_INCOME_RATE));

  return {
    fiscalYear: input.fiscalYear,
    grossIncome: sr.grossAnnual,
    employmentIncomeAmount: b.employmentIncome,
    deductions: lines,
    totalDeductions,
    taxableIncome,
    estimatedIncomeTax,
    withheldTax,
    refundOrDue,
    isRefund,
    residentTaxImpact,
  };
}

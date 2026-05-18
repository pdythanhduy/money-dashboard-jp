/**
 * 所得控除 other than 基礎控除 and 社会保険料控除.
 *
 * Phase 1 supports: 勤労学生控除, 配偶者控除, 扶養控除.
 * Skipped for now: 配偶者特別控除, 障害者控除, 寡婦控除, 医療費控除,
 * iDeCo (小規模企業共済等掛金控除), 生命保険料控除, 地震保険料控除.
 *
 * All deductions verified for 令和7年/令和8年.
 */

// ---------------------------------------------------------------------------
// 勤労学生控除 (working student)
// ---------------------------------------------------------------------------

/**
 * 勤労学生控除 amount applied to 所得税 課税所得. ¥260,000 for 住民税
 * (handled separately when we wire residentTax).
 *
 * Income cap was raised from ¥750k to ¥850k from 令和7年.
 *
 * @see https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1175.htm
 */
export const WORKING_STUDENT_DEDUCTION_NATIONAL_TAX = 270_000;
export const WORKING_STUDENT_DEDUCTION_RESIDENT_TAX = 260_000;
/** 合計所得金額 ceiling to qualify (令和7年 onward). */
export const WORKING_STUDENT_INCOME_CEILING = 850_000;

// ---------------------------------------------------------------------------
// 配偶者控除 (spouse deduction)
// ---------------------------------------------------------------------------

/**
 * 配偶者控除 amount by taxpayer 合計所得金額 and spouse age.
 *
 * Spouse must have 合計所得金額 ≤ ¥580,000 (raised from ¥480k in 令和7年).
 * Taxpayer must have 合計所得金額 ≤ ¥10,000,000 (above that, no deduction).
 *
 * @see https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1191.htm
 */
export interface SpouseDeductionRow {
  taxpayerIncomeUpperBound: number;
  /** Spouse under 70. */
  generalDeduction: number;
  /** Spouse 70+. */
  elderlyDeduction: number;
}

export const SPOUSE_DEDUCTION_NATIONAL_TAX: readonly SpouseDeductionRow[] = [
  { taxpayerIncomeUpperBound:  9_000_000, generalDeduction: 380_000, elderlyDeduction: 480_000 },
  { taxpayerIncomeUpperBound:  9_500_000, generalDeduction: 260_000, elderlyDeduction: 320_000 },
  { taxpayerIncomeUpperBound: 10_000_000, generalDeduction: 130_000, elderlyDeduction: 160_000 },
  { taxpayerIncomeUpperBound:   Infinity, generalDeduction:       0, elderlyDeduction:       0 },
];

/** Maximum spouse 合計所得金額 to qualify (令和7年). */
export const SPOUSE_INCOME_CEILING = 580_000;

// ---------------------------------------------------------------------------
// 扶養控除 (dependent deduction)
// ---------------------------------------------------------------------------

/**
 * 扶養控除 amounts. Dependents under 16 receive NO deduction
 * (since 2011, when child allowance 子ども手当 replaced it).
 *
 * @see https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1180.htm
 */
export const DEPENDENT_DEDUCTION = {
  /** 16+, not 19-22, not 70+. */
  general:                  380_000,
  /** 特定扶養親族 — age 19-22 (typical university student). */
  specific_19_to_22:        630_000,
  /** 老人扶養親族 同居老親等 — age 70+, lives with taxpayer. */
  elderly_70_plus_coresident: 580_000,
  /** 老人扶養親族 (other) — age 70+, lives apart. */
  elderly_70_plus_apart:    480_000,
} as const;

/** Dependents under this age receive no deduction. */
export const DEPENDENT_MIN_AGE = 16;

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
// 住民税 amounts (different from 所得税)
// ---------------------------------------------------------------------------

/**
 * 住民税 spouse deduction. Amounts are smaller than 所得税's table.
 * Same eligibility rules (taxpayer income ≤ ¥10M, spouse income ≤ ¥580k).
 */
export const SPOUSE_DEDUCTION_RESIDENT_TAX: readonly SpouseDeductionRow[] = [
  { taxpayerIncomeUpperBound:  9_000_000, generalDeduction: 330_000, elderlyDeduction: 380_000 },
  { taxpayerIncomeUpperBound:  9_500_000, generalDeduction: 220_000, elderlyDeduction: 260_000 },
  { taxpayerIncomeUpperBound: 10_000_000, generalDeduction: 110_000, elderlyDeduction: 130_000 },
  { taxpayerIncomeUpperBound:   Infinity, generalDeduction:       0, elderlyDeduction:       0 },
];

/**
 * 住民税 dependent deduction (smaller than 所得税 amounts). 16-under still
 * receive no deduction (same as 所得税).
 */
export const DEPENDENT_DEDUCTION_RESIDENT_TAX = {
  general:                    330_000,
  specific_19_to_22:          450_000,
  elderly_70_plus_coresident: 450_000,
  elderly_70_plus_apart:      380_000,
} as const;

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
// 配偶者特別控除 (spouse special deduction) — 令和7年改正 後 (FY2026)
// ---------------------------------------------------------------------------

/**
 * 配偶者特別控除 is a 2D table: rows by taxpayer 合計所得金額, columns by
 * spouse 合計所得金額. It kicks in when spouse 合計所得 > ¥580,000 (the
 * 配偶者控除 ceiling, raised from ¥480k in 令和7年改正). Upper limit on
 * spouse 合計所得 = ¥1,330,000. Taxpayer 合計所得 must be ≤ ¥10,000,000.
 *
 * @see https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1195.htm
 */
export interface SpouseSpecialDeductionTier {
  spouseIncomeUpperBound: number;
  deduction: number;
}

export interface SpouseSpecialDeductionRow {
  taxpayerIncomeUpperBound: number;
  /** Per-spouse-income tier deductions. Iterate; first matching tier wins. */
  tiers: readonly SpouseSpecialDeductionTier[];
}

/** Spouse 合計所得金額 ceiling above which 配偶者特別控除 = 0. */
export const SPOUSE_SPECIAL_INCOME_CEILING = 1_330_000;
/** Taxpayer 合計所得金額 ceiling above which both spouse deductions = 0. */
export const TAXPAYER_SPOUSE_INCOME_CEILING = 10_000_000;

export const SPOUSE_SPECIAL_DEDUCTION_NATIONAL_TAX: readonly SpouseSpecialDeductionRow[] = [
  {
    taxpayerIncomeUpperBound: 9_000_000,
    tiers: [
      { spouseIncomeUpperBound:   950_000, deduction: 380_000 },
      { spouseIncomeUpperBound: 1_000_000, deduction: 360_000 },
      { spouseIncomeUpperBound: 1_050_000, deduction: 310_000 },
      { spouseIncomeUpperBound: 1_100_000, deduction: 260_000 },
      { spouseIncomeUpperBound: 1_150_000, deduction: 210_000 },
      { spouseIncomeUpperBound: 1_200_000, deduction: 160_000 },
      { spouseIncomeUpperBound: 1_250_000, deduction: 110_000 },
      { spouseIncomeUpperBound: 1_300_000, deduction:  60_000 },
      { spouseIncomeUpperBound: 1_330_000, deduction:  30_000 },
    ],
  },
  {
    taxpayerIncomeUpperBound: 9_500_000,
    tiers: [
      { spouseIncomeUpperBound:   950_000, deduction: 260_000 },
      { spouseIncomeUpperBound: 1_000_000, deduction: 240_000 },
      { spouseIncomeUpperBound: 1_050_000, deduction: 210_000 },
      { spouseIncomeUpperBound: 1_100_000, deduction: 180_000 },
      { spouseIncomeUpperBound: 1_150_000, deduction: 140_000 },
      { spouseIncomeUpperBound: 1_200_000, deduction: 110_000 },
      { spouseIncomeUpperBound: 1_250_000, deduction:  80_000 },
      { spouseIncomeUpperBound: 1_300_000, deduction:  40_000 },
      { spouseIncomeUpperBound: 1_330_000, deduction:  20_000 },
    ],
  },
  {
    taxpayerIncomeUpperBound: 10_000_000,
    tiers: [
      { spouseIncomeUpperBound:   950_000, deduction: 130_000 },
      { spouseIncomeUpperBound: 1_000_000, deduction: 120_000 },
      { spouseIncomeUpperBound: 1_050_000, deduction: 110_000 },
      { spouseIncomeUpperBound: 1_100_000, deduction:  90_000 },
      { spouseIncomeUpperBound: 1_150_000, deduction:  70_000 },
      { spouseIncomeUpperBound: 1_200_000, deduction:  60_000 },
      { spouseIncomeUpperBound: 1_250_000, deduction:  40_000 },
      { spouseIncomeUpperBound: 1_300_000, deduction:  20_000 },
      { spouseIncomeUpperBound: 1_330_000, deduction:  10_000 },
    ],
  },
];

/**
 * 住民税 配偶者特別控除 — top tier capped at ¥330k (vs national ¥380k).
 * Lower tiers mirror the national table once the resident-tax cap is binding.
 * Standardized nationwide via 地方税法.
 *
 * @see https://www.tax.metro.tokyo.lg.jp/kazei/kojin_ju.html
 */
export const SPOUSE_SPECIAL_DEDUCTION_RESIDENT_TAX: readonly SpouseSpecialDeductionRow[] = [
  {
    taxpayerIncomeUpperBound: 9_000_000,
    tiers: [
      { spouseIncomeUpperBound:   950_000, deduction: 330_000 },
      { spouseIncomeUpperBound: 1_000_000, deduction: 330_000 },
      { spouseIncomeUpperBound: 1_050_000, deduction: 310_000 },
      { spouseIncomeUpperBound: 1_100_000, deduction: 260_000 },
      { spouseIncomeUpperBound: 1_150_000, deduction: 210_000 },
      { spouseIncomeUpperBound: 1_200_000, deduction: 160_000 },
      { spouseIncomeUpperBound: 1_250_000, deduction: 110_000 },
      { spouseIncomeUpperBound: 1_300_000, deduction:  60_000 },
      { spouseIncomeUpperBound: 1_330_000, deduction:  30_000 },
    ],
  },
  {
    taxpayerIncomeUpperBound: 9_500_000,
    tiers: [
      { spouseIncomeUpperBound:   950_000, deduction: 220_000 },
      { spouseIncomeUpperBound: 1_000_000, deduction: 220_000 },
      { spouseIncomeUpperBound: 1_050_000, deduction: 210_000 },
      { spouseIncomeUpperBound: 1_100_000, deduction: 180_000 },
      { spouseIncomeUpperBound: 1_150_000, deduction: 140_000 },
      { spouseIncomeUpperBound: 1_200_000, deduction: 110_000 },
      { spouseIncomeUpperBound: 1_250_000, deduction:  80_000 },
      { spouseIncomeUpperBound: 1_300_000, deduction:  40_000 },
      { spouseIncomeUpperBound: 1_330_000, deduction:  20_000 },
    ],
  },
  {
    taxpayerIncomeUpperBound: 10_000_000,
    tiers: [
      { spouseIncomeUpperBound:   950_000, deduction: 110_000 },
      { spouseIncomeUpperBound: 1_000_000, deduction: 110_000 },
      { spouseIncomeUpperBound: 1_050_000, deduction: 110_000 },
      { spouseIncomeUpperBound: 1_100_000, deduction:  90_000 },
      { spouseIncomeUpperBound: 1_150_000, deduction:  70_000 },
      { spouseIncomeUpperBound: 1_200_000, deduction:  60_000 },
      { spouseIncomeUpperBound: 1_250_000, deduction:  40_000 },
      { spouseIncomeUpperBound: 1_300_000, deduction:  20_000 },
      { spouseIncomeUpperBound: 1_330_000, deduction:  10_000 },
    ],
  },
];

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

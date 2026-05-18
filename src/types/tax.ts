/**
 * Domain types for the Japanese tax & social insurance calculator.
 *
 * All monetary values are integer yen (JPY has no minor unit). All rates are
 * stored as decimal fractions (0.0985), never as percent (9.85), to avoid
 * unit-confusion bugs when multiplying.
 */

// ---------------------------------------------------------------------------
// Geography
// ---------------------------------------------------------------------------

/**
 * Prefectures supported in Phase 1 — the 8 with the largest Vietnamese
 * communities in Japan. Adding a prefecture requires adding its 協会けんぽ
 * rate to `kenpo-rates.ts`.
 */
export type Prefecture =
  | 'tokyo'
  | 'osaka'
  | 'aichi'
  | 'kanagawa'
  | 'saitama'
  | 'chiba'
  | 'hyogo'
  | 'fukuoka';

/**
 * Municipalities supported for 国民健康保険 (freelance only). Each city sets
 * its own rates, so this list is intentionally narrow. Salaried workers use
 * `Prefecture` instead (協会けんぽ is prefecture-level).
 */
export type Municipality = 'osaka-shi' | 'tokyo-23ku';

// ---------------------------------------------------------------------------
// Income classification
// ---------------------------------------------------------------------------

/**
 * - `salary`: 給与所得 — applies 給与所得控除, 健康保険 (協会けんぽ),
 *   厚生年金, 雇用保険.
 * - `business`: 事業所得 — applies 国民健康保険 + 国民年金. No 雇用保険.
 */
export type IncomeCategory = 'salary' | 'business';

/**
 * Required for `business` category (国保 lookup is municipality-specific).
 * Ignored for `salary`.
 */
export type FreelanceMunicipality = Municipality;

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface SalaryInput {
  /** 年収 (gross annual income, integer yen). Must be > 0. */
  annualIncome: number;
  /** Age in years. Used for 介護保険 (40-64) and 勤労学生控除 eligibility checks. */
  age: number;
  category: IncomeCategory;
  /** Required for `salary`. */
  prefecture?: Prefecture;
  /** Required for `business`. */
  municipality?: FreelanceMunicipality;
  /** Whether the taxpayer is a 勤労学生 (working student). Default: false. */
  isWorkingStudent?: boolean;
  /** Whether the taxpayer has a spouse who qualifies for 配偶者控除. Default: false. */
  hasSpouse?: boolean;
  /** Spouse age (used for 老人控除対象配偶者 ≥70). Required if hasSpouse. */
  spouseAge?: number;
  /** Dependent family members claimed under 扶養控除. */
  dependents?: Dependent[];
}

export interface Dependent {
  /** Age in years at year end. */
  age: number;
  /** 同居 vs 別居 (only matters for 老人扶養親族, age ≥ 70). */
  livesWithTaxpayer?: boolean;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export interface TakeHomeResult {
  grossAnnual: number;

  /** 所得税 + 復興特別所得税 combined (annual yen, rounded down to 100円). */
  incomeTax: number;
  /** 住民税 (annual yen, includes 所得割 + 均等割). */
  residentTax: number;
  /** 健康保険 + 介護保険 (employee portion, annual yen). 0 for freelance — see `nationalHealthInsurance`. */
  healthInsurance: number;
  /** 厚生年金 (employee portion, annual yen). 0 for freelance — see `nationalPension`. */
  pension: number;
  /** 雇用保険 (employee portion, annual yen). 0 for freelance. */
  employmentInsurance: number;

  /** 国民健康保険 (annual yen). Non-zero only for `business` category. */
  nationalHealthInsurance: number;
  /** 国民年金 (annual yen). Non-zero only for `business` category. */
  nationalPension: number;

  totalDeductions: number;
  takeHomeAnnual: number;
  takeHomeMonthly: number;

  breakdown: TakeHomeBreakdown;
}

export interface TakeHomeBreakdown {
  /** 給与所得控除 (employment income deduction). 0 for business. */
  employmentIncomeDeduction: number;
  /** 給与所得 (employment income after 給与所得控除). For business this equals 事業所得 = annualIncome. */
  employmentIncome: number;
  /** 合計所得金額 — sum of all income categories. Currently same as `employmentIncome`. */
  totalIncome: number;

  /** 所得税 basic deduction (tiered ¥0–¥950,000 since 令和7年). */
  basicDeductionNationalTax: number;
  /** 住民税 basic deduction (flat ¥430,000 — unchanged in 令和7年 reform). */
  basicDeductionResidentTax: number;

  /** 社会保険料控除 (deducted from taxable income — sum of insurance + pension employee payments). */
  socialInsuranceDeduction: number;

  /** Other 所得控除 — spouse, dependents, working student. */
  spouseDeduction: number;
  dependentDeduction: number;
  workingStudentDeduction: number;

  /** 課税所得 for 所得税 (rounded down to nearest ¥1,000). */
  taxableIncomeForNationalTax: number;
  /** 課税所得 for 住民税 (rounded down to nearest ¥1,000). */
  taxableIncomeForResidentTax: number;

  /** 基準所得税 (所得税 before 復興税). */
  baseIncomeTax: number;
  /** 復興特別所得税 (2.1% of base income tax, until 令和8年; drops to 1.1% in 令和9年). */
  reconstructionSurtax: number;

  /** 住民税 所得割 (income-based portion). */
  residentTaxIncomeBased: number;
  /** 住民税 均等割 (per-capita flat, includes 森林環境税). */
  residentTaxPerCapita: number;

  /** 標準報酬月額 grade used for 健保/厚年 calc. Undefined for freelance. */
  standardMonthlyRemuneration?: number;
}

// ---------------------------------------------------------------------------
// Table row types (for data files in src/lib/tax-data/)
// ---------------------------------------------------------------------------

export interface IncomeTaxBracket {
  /** Inclusive lower bound of 課税所得 in yen. */
  lowerBound: number;
  /** Inclusive upper bound. `Infinity` for the top bracket. */
  upperBound: number;
  /** Marginal rate as decimal (0.05, 0.10, ...). */
  rate: number;
  /** 控除額 (subtracted after applying rate). */
  deduction: number;
}

export interface EmploymentIncomeDeductionRow {
  /** Inclusive upper bound of 年収 for this row. `Infinity` for top row. */
  incomeUpperBound: number;
  /** Function computing the deduction from gross income (¥). */
  compute: (grossIncome: number) => number;
}

export interface BasicDeductionRow {
  /** Inclusive upper bound of 合計所得 for this row. */
  totalIncomeUpperBound: number;
  /** Deduction amount in yen. */
  deduction: number;
}

export interface StandardRemunerationGrade {
  /** 健康保険 grade (1–50). */
  healthGrade: number;
  /** 厚生年金 grade (1–32, caps at 32). */
  pensionGrade: number;
  /** 標準報酬月額 used for premium calculation. */
  monthlyAmount: number;
  /** Inclusive lower bound of actual monthly remuneration. */
  lowerBound: number;
  /** Exclusive upper bound. `Infinity` for top grade. */
  upperBound: number;
}

export interface KenpoRate {
  /** General 健康保険料率 (employer + employee combined, decimal). */
  healthRate: number;
  /** 介護保険料率 (age 40–64, employer + employee combined). Currently nationwide-uniform. */
  longTermCareRate: number;
}

export interface KokuhoComponentRate {
  /** 所得割率 applied to 旧ただし書き所得 (decimal). */
  incomeRate: number;
  /** 均等割 per insured person, annual yen. */
  perPersonAmount: number;
  /** 平等割 per household, annual yen. `null` if this component doesn't use 平等割. */
  perHouseholdAmount: number | null;
  /** Annual cap in yen. */
  annualCap: number;
}

export interface KokuhoRateSet {
  /** 医療分 / 基礎分. */
  medical: KokuhoComponentRate;
  /** 後期高齢者支援金分. */
  elderlySupport: KokuhoComponentRate;
  /** 介護分 (40-64 only). */
  longTermCare: KokuhoComponentRate;
  /** 子ども・子育て支援金分. `null` if the municipality has not implemented this. */
  childcareSupport: KokuhoComponentRate | null;
}

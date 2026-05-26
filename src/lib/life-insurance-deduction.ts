/**
 * 生命保険料控除 calculator — 新制度 only (Phase 1).
 *
 * 新制度 applies to contracts signed 2012-01-01 onward. The 3 independent
 * categories are: 一般生命保険料 / 介護医療保険料 / 個人年金保険料.
 *
 * Per-category and total caps differ between 所得税 and 住民税:
 *   所得税: per-category cap ¥40,000, total cap ¥120,000.
 *   住民税: per-category cap ¥28,000, total cap ¥70,000.
 *
 * 旧制度 (pre-2012) is not modeled — minority of users, can be added later.
 *
 * @see https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1140.htm
 */

/**
 * Per-category deduction under 新制度 for 所得税. Annual premium → deduction.
 * Piecewise: full up to ¥20,000; tapered above; capped at ¥40,000.
 */
function lifeInsuranceDeductionNewNational(annualPremium: number): number {
  if (annualPremium <= 0) return 0;
  if (annualPremium <= 20_000) return annualPremium;
  if (annualPremium <= 40_000) return Math.floor(annualPremium / 2) + 10_000;
  if (annualPremium <= 80_000) return Math.floor(annualPremium / 4) + 20_000;
  return 40_000;
}

/**
 * Per-category deduction under 新制度 for 住民税. Smaller caps and break-
 * points than national. Capped at ¥28,000 per category.
 */
function lifeInsuranceDeductionNewResident(annualPremium: number): number {
  if (annualPremium <= 0) return 0;
  if (annualPremium <= 12_000) return annualPremium;
  if (annualPremium <= 32_000) return Math.floor(annualPremium / 2) + 6_000;
  if (annualPremium <= 56_000) return Math.floor(annualPremium / 4) + 14_000;
  return 28_000;
}

export interface LifeInsurancePremiumsNew {
  /** 一般生命保険料 (新制度) annual premium in yen. */
  generalNew?: number;
  /** 介護医療保険料 (新制度) annual premium in yen. */
  careMedicalNew?: number;
  /** 個人年金保険料 (新制度) annual premium in yen. */
  personalPensionNew?: number;
}

const LIFE_INSURANCE_TOTAL_CAP_NATIONAL = 120_000;
const LIFE_INSURANCE_TOTAL_CAP_RESIDENT = 70_000;

/**
 * Sum per-category 新制度 deductions then apply overall cap.
 * National (所得税) total cap = ¥120,000.
 */
export function calculateLifeInsuranceDeductionNational(
  premiums: LifeInsurancePremiumsNew | undefined,
): number {
  if (!premiums) return 0;
  const general = lifeInsuranceDeductionNewNational(premiums.generalNew ?? 0);
  const care = lifeInsuranceDeductionNewNational(premiums.careMedicalNew ?? 0);
  const pension = lifeInsuranceDeductionNewNational(premiums.personalPensionNew ?? 0);
  return Math.min(general + care + pension, LIFE_INSURANCE_TOTAL_CAP_NATIONAL);
}

/**
 * Sum per-category 新制度 deductions then apply overall cap.
 * Resident (住民税) total cap = ¥70,000.
 */
export function calculateLifeInsuranceDeductionResident(
  premiums: LifeInsurancePremiumsNew | undefined,
): number {
  if (!premiums) return 0;
  const general = lifeInsuranceDeductionNewResident(premiums.generalNew ?? 0);
  const care = lifeInsuranceDeductionNewResident(premiums.careMedicalNew ?? 0);
  const pension = lifeInsuranceDeductionNewResident(premiums.personalPensionNew ?? 0);
  return Math.min(general + care + pension, LIFE_INSURANCE_TOTAL_CAP_RESIDENT);
}

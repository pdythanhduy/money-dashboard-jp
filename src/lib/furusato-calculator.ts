/**
 * ふるさと納税 (Furusato Nōzei) limit calculator.
 *
 * Computes the upper donation amount a filer can claim with only the
 * statutory ¥2,000 self-burden, plus the three-part deduction breakdown
 * (income-tax, resident-tax basic, resident-tax special).
 *
 * Formula (官公庁 standard, no portal-specific tweaks):
 *
 *   maxDonation = (residentTaxableIncome × 0.10 × 0.20)
 *                 / (0.90 - incomeTaxMarginalRate × reconstructionMultiplier)
 *                 + 2_000
 *
 * The 0.20 cap is the 住民税所得割 share (max 20% of the 所得割), the
 * 0.90 is (1 - 住民税 10% income rate), and the reconstruction multiplier
 * applies the 復興特別所得税 surtax to the marginal rate.
 *
 * Pure, hard-coded. No portal API, no exchange-rate fetch.
 */

export interface FurusatoLimitInput {
  /** 課税所得 used for the resident-tax 所得割 perspective. Yen, integer. */
  residentTaxableIncome: number;
  /** Marginal 所得税 rate as decimal (0..0.45). */
  incomeTaxMarginalRate: number;
  /**
   * 復興特別所得税 multiplier applied to the marginal rate.
   * - 令和6-8年: 1.021 (default)
   * - 令和9-29年: 1.011 (drops to 1.1%)
   */
  reconstructionMultiplier?: number;
}

export interface FurusatoLimitResult {
  maxDonation: number;
  incomeTaxReduction: number;
  residentTaxBasicReduction: number;
  residentTaxSpecialReduction: number;
  selfBurden: number;
}

export const FURUSATO_SELF_BURDEN = 2_000;
export const RECONSTRUCTION_MULTIPLIER_DEFAULT = 1.021;
const RESIDENT_TAX_INCOME_RATE = 0.10;
const FURUSATO_SPECIAL_CAP = 0.20;

function validate(input: FurusatoLimitInput): void {
  if (!Number.isFinite(input.residentTaxableIncome) || input.residentTaxableIncome < 0) {
    throw new Error(`residentTaxableIncome must be >= 0, got ${input.residentTaxableIncome}`);
  }
  if (
    !Number.isFinite(input.incomeTaxMarginalRate)
    || input.incomeTaxMarginalRate < 0
    || input.incomeTaxMarginalRate > 0.45
  ) {
    throw new Error(`incomeTaxMarginalRate must be in [0, 0.45], got ${input.incomeTaxMarginalRate}`);
  }
}

/**
 * Compute the ふるさと納税 upper limit + 3-part deduction breakdown.
 * Returns ¥2,000 max donation (= self-burden only) when income is zero —
 * the user effectively cannot benefit beyond the floor.
 */
export function computeFurusatoLimit(input: FurusatoLimitInput): FurusatoLimitResult {
  validate(input);

  const reconstruction = input.reconstructionMultiplier ?? RECONSTRUCTION_MULTIPLIER_DEFAULT;
  const marginalWithSurtax = input.incomeTaxMarginalRate * reconstruction;
  const denominator = 1 - RESIDENT_TAX_INCOME_RATE - marginalWithSurtax;

  if (input.residentTaxableIncome === 0 || denominator <= 0) {
    return {
      maxDonation: FURUSATO_SELF_BURDEN,
      incomeTaxReduction: 0,
      residentTaxBasicReduction: 0,
      residentTaxSpecialReduction: 0,
      selfBurden: FURUSATO_SELF_BURDEN,
    };
  }

  const specialDeductionCap =
    (input.residentTaxableIncome * RESIDENT_TAX_INCOME_RATE * FURUSATO_SPECIAL_CAP) / denominator;
  const maxDonation = Math.floor(specialDeductionCap + FURUSATO_SELF_BURDEN);
  const net = Math.max(0, maxDonation - FURUSATO_SELF_BURDEN);

  const incomeTaxReduction = Math.floor(net * marginalWithSurtax);
  const residentTaxBasicReduction = Math.floor(net * RESIDENT_TAX_INCOME_RATE);
  const residentTaxSpecialReduction = Math.floor(
    net * (1 - RESIDENT_TAX_INCOME_RATE - marginalWithSurtax),
  );

  return {
    maxDonation,
    incomeTaxReduction,
    residentTaxBasicReduction,
    residentTaxSpecialReduction,
    selfBurden: FURUSATO_SELF_BURDEN,
  };
}

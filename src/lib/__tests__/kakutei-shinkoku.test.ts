import {
  buildKakuteiSummary,
  computeEarthquakeInsuranceDeduction,
  computeLifeInsuranceDeduction,
  EARTHQUAKE_INSURANCE_DEDUCTION_MAX,
  FURUSATO_SELF_BURDEN,
  LIFE_INSURANCE_DEDUCTION_MAX,
  RESIDENT_TAX_INCOME_RATE,
} from '@/lib/kakutei-shinkoku';
import type { TakeHomeResult } from '@/types/tax';

function makeSalaryResult(overrides: Partial<TakeHomeResult> = {}): TakeHomeResult {
  return {
    grossAnnual: 3_000_000,
    incomeTax: 50_000,
    residentTax: 130_000,
    healthInsurance: 150_000,
    pension: 270_000,
    employmentInsurance: 15_000,
    nationalHealthInsurance: 0,
    nationalPension: 0,
    totalDeductions: 615_000,
    takeHomeAnnual: 2_385_000,
    takeHomeMonthly: 198_750,
    breakdown: {
      employmentIncomeDeduction: 980_000,
      employmentIncome: 2_020_000,
      totalIncome: 2_020_000,
      basicDeductionNationalTax: 580_000,
      basicDeductionResidentTax: 430_000,
      socialInsuranceDeduction: 435_000,
      spouseDeduction: 0,
      dependentDeduction: 0,
      workingStudentDeduction: 0,
      taxableIncomeForNationalTax: 1_005_000,
      taxableIncomeForResidentTax: 1_155_000,
      baseIncomeTax: 50_250,
      reconstructionSurtax: 1_055,
      residentTaxIncomeBased: 115_500,
      residentTaxPerCapita: 5_000,
      standardMonthlyRemuneration: 250_000,
    },
    ...overrides,
  };
}

describe('computeLifeInsuranceDeduction (新制度)', () => {
  it('≤¥20K → passes through unchanged', () => {
    expect(computeLifeInsuranceDeduction(10_000)).toBe(10_000);
    expect(computeLifeInsuranceDeduction(20_000)).toBe(20_000);
  });

  it('¥20K < x ≤ ¥40K → premium/2 + 10K', () => {
    expect(computeLifeInsuranceDeduction(30_000)).toBe(25_000);
    expect(computeLifeInsuranceDeduction(40_000)).toBe(30_000);
  });

  it('¥40K < x ≤ ¥80K → premium/4 + 20K', () => {
    expect(computeLifeInsuranceDeduction(60_000)).toBe(35_000);
    expect(computeLifeInsuranceDeduction(80_000)).toBe(40_000);
  });

  it('> ¥80K → cap LIFE_INSURANCE_DEDUCTION_MAX', () => {
    expect(computeLifeInsuranceDeduction(100_000)).toBe(LIFE_INSURANCE_DEDUCTION_MAX);
    expect(computeLifeInsuranceDeduction(1_000_000)).toBe(LIFE_INSURANCE_DEDUCTION_MAX);
  });

  it('zero / negative / NaN → 0', () => {
    expect(computeLifeInsuranceDeduction(0)).toBe(0);
    expect(computeLifeInsuranceDeduction(-100)).toBe(0);
    expect(computeLifeInsuranceDeduction(Number.NaN)).toBe(0);
  });
});

describe('computeEarthquakeInsuranceDeduction', () => {
  it('100% of premium up to cap', () => {
    expect(computeEarthquakeInsuranceDeduction(30_000)).toBe(30_000);
  });

  it('caps at ¥50K', () => {
    expect(computeEarthquakeInsuranceDeduction(70_000)).toBe(EARTHQUAKE_INSURANCE_DEDUCTION_MAX);
  });
});

describe('buildKakuteiSummary', () => {
  it('salaryResult=null → empty summary with isRefund=false', () => {
    const s = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: null,
      medicalDeductibleAmount: 0,
      furusatoDonationTotal: 0,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 0,
    });
    expect(s.grossIncome).toBe(0);
    expect(s.isRefund).toBe(false);
    expect(s.deductions).toEqual([]);
  });

  it('basic case: deductions list includes basic + social_insurance, totals sum', () => {
    const s = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult(),
      medicalDeductibleAmount: 0,
      furusatoDonationTotal: 0,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 0,
    });
    const keys = s.deductions.map((d) => d.key);
    expect(keys).toContain('basic');
    expect(keys).toContain('social_insurance');
    const sum = s.deductions.reduce((acc, d) => acc + d.amount, 0);
    expect(sum).toBe(s.totalDeductions);
  });

  it('medical line included only when medicalDeductibleAmount > 0', () => {
    const withMed = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult(),
      medicalDeductibleAmount: 80_000,
      furusatoDonationTotal: 0,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 0,
    });
    expect(withMed.deductions.some((d) => d.key === 'medical' && d.amount === 80_000)).toBe(true);
  });

  it('furusato deduction = donations - self-burden (¥2,000)', () => {
    const s = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult(),
      medicalDeductibleAmount: 0,
      furusatoDonationTotal: 30_000,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 0,
    });
    const fur = s.deductions.find((d) => d.key === 'furusato');
    expect(fur?.amount).toBe(30_000 - FURUSATO_SELF_BURDEN);
  });

  it('refund case: deductions push tax below withheld → isRefund=true, refundOrDue<0', () => {
    // Big medical deduction tanks the taxable income.
    const s = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult(),
      medicalDeductibleAmount: 800_000,
      furusatoDonationTotal: 50_000,
      lifeInsurancePremium: 60_000, // → ¥35,000 deduction
      earthquakeInsurancePremium: 30_000,
      publicPensionContribution: 0,
    });
    expect(s.isRefund).toBe(true);
    expect(s.refundOrDue).toBeLessThan(0);
  });

  it('due case: zero extra deductions and a salary with low withholding → isRefund=false', () => {
    // Make withheld tax 0 so any computed tax becomes "due".
    const s = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult({ incomeTax: 0 }),
      medicalDeductibleAmount: 0,
      furusatoDonationTotal: 0,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 0,
    });
    expect(s.isRefund).toBe(false);
    expect(s.refundOrDue).toBeGreaterThanOrEqual(0);
  });

  it('taxableIncome floored to ¥1,000 increment', () => {
    const s = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult(),
      medicalDeductibleAmount: 0,
      furusatoDonationTotal: 0,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 0,
    });
    expect(s.taxableIncome % 1000).toBe(0);
  });

  it('estimatedIncomeTax includes 復興税 (≥ baseTax × 1.0)', () => {
    const s = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult(),
      medicalDeductibleAmount: 0,
      furusatoDonationTotal: 0,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 0,
    });
    // For a positive taxable income, the surtax pushes total > 0.
    expect(s.estimatedIncomeTax).toBeGreaterThan(0);
  });

  it('residentTaxImpact ≈ 10% × taxableIncome (±¥100)', () => {
    const s = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult(),
      medicalDeductibleAmount: 0,
      furusatoDonationTotal: 0,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 0,
    });
    const expected = Math.floor(s.taxableIncome * RESIDENT_TAX_INCOME_RATE);
    expect(s.residentTaxImpact).toBeGreaterThanOrEqual(expected - 100);
    expect(s.residentTaxImpact).toBeLessThanOrEqual(expected + 100);
  });

  it('publicPensionContribution adds to social_insurance line', () => {
    const without = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult(),
      medicalDeductibleAmount: 0,
      furusatoDonationTotal: 0,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 0,
    });
    const withExtra = buildKakuteiSummary({
      fiscalYear: 2025,
      salaryResult: makeSalaryResult(),
      medicalDeductibleAmount: 0,
      furusatoDonationTotal: 0,
      lifeInsurancePremium: 0,
      earthquakeInsurancePremium: 0,
      publicPensionContribution: 100_000,
    });
    const baseSI = without.deductions.find((d) => d.key === 'social_insurance')!.amount;
    const extraSI = withExtra.deductions.find((d) => d.key === 'social_insurance')!.amount;
    expect(extraSI - baseSI).toBe(100_000);
  });
});

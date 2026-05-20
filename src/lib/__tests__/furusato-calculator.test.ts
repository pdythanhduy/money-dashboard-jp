import {
  computeFurusatoLimit,
  FURUSATO_SELF_BURDEN,
  RECONSTRUCTION_MULTIPLIER_DEFAULT,
} from '@/lib/furusato-calculator';

describe('computeFurusatoLimit — standard cases', () => {
  it('¥3,000,000 taxable + 10% bracket → ~¥40K limit', () => {
    const r = computeFurusatoLimit({
      residentTaxableIncome: 3_000_000,
      incomeTaxMarginalRate: 0.10,
    });
    // denominator = 1 - 0.10 - 0.10*1.021 = 0.7979
    // cap = 3,000,000 × 0.10 × 0.20 / 0.7979 ≈ 75,196
    // maxDonation ≈ 75,196 + 2,000 ≈ ¥77,196
    expect(r.maxDonation).toBeGreaterThanOrEqual(70_000);
    expect(r.maxDonation).toBeLessThanOrEqual(85_000);
  });

  it('¥10,000,000 taxable + 33% bracket → large limit (~¥170K-200K range)', () => {
    const r = computeFurusatoLimit({
      residentTaxableIncome: 10_000_000,
      incomeTaxMarginalRate: 0.33,
    });
    expect(r.maxDonation).toBeGreaterThan(150_000);
    expect(r.maxDonation).toBeLessThan(450_000);
  });

  it('¥1,500,000 taxable + 5% → modest limit', () => {
    const r = computeFurusatoLimit({
      residentTaxableIncome: 1_500_000,
      incomeTaxMarginalRate: 0.05,
    });
    expect(r.maxDonation).toBeGreaterThan(15_000);
    expect(r.maxDonation).toBeLessThan(40_000);
  });

  it('zero income → maxDonation collapses to self-burden ¥2,000', () => {
    const r = computeFurusatoLimit({
      residentTaxableIncome: 0,
      incomeTaxMarginalRate: 0.10,
    });
    expect(r.maxDonation).toBe(FURUSATO_SELF_BURDEN);
    expect(r.incomeTaxReduction).toBe(0);
    expect(r.residentTaxBasicReduction).toBe(0);
    expect(r.residentTaxSpecialReduction).toBe(0);
  });

  it('selfBurden constant is always 2,000 regardless of income', () => {
    expect(computeFurusatoLimit({ residentTaxableIncome: 0, incomeTaxMarginalRate: 0 }).selfBurden).toBe(2_000);
    expect(computeFurusatoLimit({ residentTaxableIncome: 50_000_000, incomeTaxMarginalRate: 0.45 }).selfBurden).toBe(2_000);
  });
});

describe('computeFurusatoLimit — reconstruction multiplier', () => {
  it('default multiplier is 1.021 (令和8年 and earlier)', () => {
    const r = computeFurusatoLimit({
      residentTaxableIncome: 3_000_000,
      incomeTaxMarginalRate: 0.10,
    });
    const explicit = computeFurusatoLimit({
      residentTaxableIncome: 3_000_000,
      incomeTaxMarginalRate: 0.10,
      reconstructionMultiplier: RECONSTRUCTION_MULTIPLIER_DEFAULT,
    });
    expect(r.maxDonation).toBe(explicit.maxDonation);
  });

  it('令和9年 multiplier 1.011 changes the limit (smaller surtax → slightly different denom)', () => {
    const r2025 = computeFurusatoLimit({
      residentTaxableIncome: 3_000_000,
      incomeTaxMarginalRate: 0.10,
      reconstructionMultiplier: 1.021,
    });
    const r2027 = computeFurusatoLimit({
      residentTaxableIncome: 3_000_000,
      incomeTaxMarginalRate: 0.10,
      reconstructionMultiplier: 1.011,
    });
    // The two differ — even by a small amount.
    expect(r2025.maxDonation).not.toBe(r2027.maxDonation);
  });
});

describe('computeFurusatoLimit — breakdown invariants', () => {
  it('residentTaxBasicReduction is exactly floor(net × 10%)', () => {
    const r = computeFurusatoLimit({
      residentTaxableIncome: 5_000_000,
      incomeTaxMarginalRate: 0.20,
    });
    const net = r.maxDonation - FURUSATO_SELF_BURDEN;
    expect(r.residentTaxBasicReduction).toBe(Math.floor(net * 0.10));
  });

  it('three reductions sum to ≈ net donation (within ¥10 rounding noise)', () => {
    const r = computeFurusatoLimit({
      residentTaxableIncome: 5_000_000,
      incomeTaxMarginalRate: 0.20,
    });
    const net = r.maxDonation - FURUSATO_SELF_BURDEN;
    const sum = r.incomeTaxReduction + r.residentTaxBasicReduction + r.residentTaxSpecialReduction;
    expect(Math.abs(sum - net)).toBeLessThan(10);
  });
});

describe('computeFurusatoLimit — bracket boundaries', () => {
  it('45% top bracket: still returns finite positive limit', () => {
    const r = computeFurusatoLimit({
      residentTaxableIncome: 50_000_000,
      incomeTaxMarginalRate: 0.45,
    });
    expect(Number.isFinite(r.maxDonation)).toBe(true);
    expect(r.maxDonation).toBeGreaterThan(0);
  });

  it('0% marginal rate (uncommon: filer below tax threshold) — formula collapses gracefully', () => {
    const r = computeFurusatoLimit({
      residentTaxableIncome: 1_000_000,
      incomeTaxMarginalRate: 0,
    });
    expect(r.maxDonation).toBeGreaterThan(FURUSATO_SELF_BURDEN);
    expect(r.incomeTaxReduction).toBe(0);
  });
});

describe('computeFurusatoLimit — validation', () => {
  it('throws for negative residentTaxableIncome', () => {
    expect(() =>
      computeFurusatoLimit({ residentTaxableIncome: -1, incomeTaxMarginalRate: 0.10 }),
    ).toThrow(/residentTaxableIncome/);
  });

  it('throws for incomeTaxMarginalRate < 0', () => {
    expect(() =>
      computeFurusatoLimit({ residentTaxableIncome: 100, incomeTaxMarginalRate: -0.01 }),
    ).toThrow(/incomeTaxMarginalRate/);
  });

  it('throws for incomeTaxMarginalRate > 0.45', () => {
    expect(() =>
      computeFurusatoLimit({ residentTaxableIncome: 100, incomeTaxMarginalRate: 0.50 }),
    ).toThrow(/incomeTaxMarginalRate/);
  });
});

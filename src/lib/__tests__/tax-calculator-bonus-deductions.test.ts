/**
 * Test suite for 0.3.0 calculator additions: bonus split, iDeCo,
 * 生命保険料控除, 配偶者特別控除. Existing tax-calculator.test.ts continues
 * to cover the FY2026 baseline behavior.
 *
 * Each fixture is hand-derived against the FY2026 formulas. If a value here
 * disagrees with code output, RE-VERIFY THE FIXTURE FIRST before changing
 * the implementation.
 */

import {
  calculateHealthInsurance,
  calculatePension,
  calculateTakeHome,
} from '@/lib/tax-calculator';
import {
  calculateLifeInsuranceDeductionNational,
  calculateLifeInsuranceDeductionResident,
} from '@/lib/life-insurance-deduction';
import type { SalaryInput } from '@/types/tax';

// ============================================================================
// BONUS SPLIT — Section 1
//
// When `monthlyBaseSalary` is set, the calculator computes 健保/厚年 against
// 標準報酬月額 (based on monthly base, NOT annual/12) plus a per-bonus
// 標準賞与額 contribution with FY2026 caps.
// ============================================================================

describe('Bonus split: low salary, no caps hit', () => {
  // ¥6,000,000/year = ¥400,000 base × 12 + ¥600,000 bonus × 2
  // Tokyo (健保 9.85% + 子育て 0.23%), age 30, no 介護.
  //
  // Monthly grade for ¥400,000 base → 標準報酬月額 ¥410,000 (bin [395k, 425k))
  //   健保+子育て/月  = floor(410,000 × 0.1008 / 2) = floor(20,664) = ¥20,664/月
  //   厚年/月         = floor(410,000 × 0.0915) = ¥37,515/月
  //   Annual monthly:   20,664 × 12 = ¥247,968 健保;  37,515 × 12 = ¥450,180 厚年
  //
  // Bonus per payment = ¥600,000 → 標準賞与額 ¥600,000 (already ¥1k-aligned)
  //   健保+子育て/payment = floor(600,000 × 0.1008 / 2) = floor(30,240) = ¥30,240
  //   厚年/payment        = floor(600,000 × 0.0915) = ¥54,900
  //   2 payments: 健保 = ¥60,480, 厚年 = ¥109,800
  //   Cumulative 標準賞与額 = ¥1,200,000 ≤ ¥5,730,000 cap → all counted (no cap)
  //   Per-payment 標準賞与額 = ¥600,000 ≤ ¥1,500,000 cap → all counted (no cap)
  //
  // TOTAL: 健保 ¥247,968 + ¥60,480 = ¥308,448
  //         厚年 ¥450,180 + ¥109,800 = ¥559,980

  const input: SalaryInput = {
    annualIncome: 6_000_000,
    age: 30,
    category: 'salary',
    prefecture: 'tokyo',
    monthlyBaseSalary: 400_000,
    annualBonus: 1_200_000,
    bonusPaymentCount: 2,
  };

  it('健保 + 子育て (monthly grade ¥410k + 2 bonuses) = ¥308,448', () => {
    expect(calculateHealthInsurance(input)).toBe(308_448);
  });
  it('厚年 (monthly grade ¥410k + 2 bonuses, no cap hit) = ¥559,980', () => {
    expect(calculatePension(input)).toBe(559_980);
  });
});

describe('Bonus split: high salary hits both caps', () => {
  // ¥18,000,000/year = ¥1,000,000 base × 12 + ¥3,000,000 bonus × 2
  // Tokyo, age 30.
  //
  // Monthly grade for ¥1,000,000 → 標準報酬月額 ¥980,000 (bin [955k, 1005k))
  //   健保+子育て/月 = floor(980,000 × 0.1008 / 2) = floor(49,392) = ¥49,392/月
  //   厚年/月 (capped at ¥650k) = floor(650,000 × 0.0915) = ¥59,475/月
  //   Annual: 健保 49,392 × 12 = ¥592,704;  厚年 59,475 × 12 = ¥713,700
  //
  // Bonus per payment = ¥3,000,000 → 標準賞与額 ¥3,000,000
  //   厚年 per payment: capped at ¥1,500,000 → floor(1,500,000 × 0.0915) = ¥137,250
  //   2 payments → ¥274,500 厚年 from bonuses
  //
  //   健保+子育て cumulative cap: ¥5,730,000 across the year.
  //   1st payment: stdBonus = ¥3,000,000, used = min(3M, 5.73M - 0) = ¥3,000,000
  //     premium = floor(3,000,000 × 0.1008 / 2) = floor(151,200) = ¥151,200
  //   2nd payment: stdBonus = ¥3,000,000, remaining cap = 5,730,000 - 3,000,000 = 2,730,000
  //     used = ¥2,730,000
  //     premium = floor(2,730,000 × 0.1008 / 2) = floor(137,592) = ¥137,592
  //   Bonus 健保 total: 151,200 + 137,592 = ¥288,792
  //
  // TOTAL: 健保 ¥592,704 + ¥288,792 = ¥881,496
  //         厚年 ¥713,700 + ¥274,500 = ¥988,200

  const input: SalaryInput = {
    annualIncome: 18_000_000,
    age: 30,
    category: 'salary',
    prefecture: 'tokyo',
    monthlyBaseSalary: 1_000_000,
    annualBonus: 6_000_000,
    bonusPaymentCount: 2,
  };

  it('健保 + 子育て (annual cap ¥5.73M binds on 2nd bonus) = ¥881,496', () => {
    expect(calculateHealthInsurance(input)).toBe(881_496);
  });
  it('厚年 (monthly cap + per-bonus cap ¥1.5M each) = ¥988,200', () => {
    expect(calculatePension(input)).toBe(988_200);
  });
});

describe('Bonus split: zero bonus matches legacy monthly calc', () => {
  // ¥6,000,000 = ¥500,000 × 12 exactly, annualBonus = 0.
  // Should match the LEGACY (annual/12) calc for the same input.

  const detailed: SalaryInput = {
    annualIncome: 6_000_000,
    age: 30,
    category: 'salary',
    prefecture: 'tokyo',
    monthlyBaseSalary: 500_000,
    annualBonus: 0,
    bonusPaymentCount: 2,
  };

  const legacy: SalaryInput = {
    annualIncome: 6_000_000,
    age: 30,
    category: 'salary',
    prefecture: 'tokyo',
  };

  it('健保 in detailed mode (no bonus) equals legacy', () => {
    expect(calculateHealthInsurance(detailed)).toBe(calculateHealthInsurance(legacy));
  });
  it('厚年 in detailed mode (no bonus) equals legacy', () => {
    expect(calculatePension(detailed)).toBe(calculatePension(legacy));
  });
});

describe('Bonus split: validation', () => {
  it('throws when monthlyBaseSalary × 12 + bonus ≠ annualIncome', () => {
    expect(() =>
      calculateTakeHome({
        annualIncome: 6_000_000,
        age: 30,
        category: 'salary',
        prefecture: 'tokyo',
        monthlyBaseSalary: 400_000,
        annualBonus: 500_000, // would imply annualIncome = 5,300,000
      }),
    ).toThrow(/must match within ±¥12/);
  });
  it('throws on negative monthlyBaseSalary', () => {
    expect(() =>
      calculateTakeHome({
        annualIncome: 1_000_000,
        age: 30,
        category: 'salary',
        prefecture: 'tokyo',
        monthlyBaseSalary: -100,
        annualBonus: 0,
      }),
    ).toThrow(/monthlyBaseSalary must be >= 0/);
  });
  it('throws when bonus > 0 but bonusPaymentCount = 0', () => {
    expect(() =>
      calculateTakeHome({
        annualIncome: 6_000_000,
        age: 30,
        category: 'salary',
        prefecture: 'tokyo',
        monthlyBaseSalary: 400_000,
        annualBonus: 1_200_000,
        bonusPaymentCount: 0,
      }),
    ).toThrow(/bonusPaymentCount must be a positive integer/);
  });
});

// ============================================================================
// iDeCo / 小規模企業共済等掛金控除 — Section 2
// ============================================================================

describe('iDeCo deduction', () => {
  // Baseline: ¥6,000,000 Tokyo seishain, no extras.
  const baseInput: SalaryInput = {
    annualIncome: 6_000_000,
    age: 30,
    category: 'salary',
    prefecture: 'tokyo',
  };

  it('iDeCo ¥23,000/月 = ¥276,000/年 reduces both national + resident taxable by ¥276,000', () => {
    const baseline = calculateTakeHome(baseInput);
    const withIdeco = calculateTakeHome({ ...baseInput, idecoMonthlyContribution: 23_000 });
    expect(baseline.breakdown.taxableIncomeForNationalTax - withIdeco.breakdown.taxableIncomeForNationalTax).toBe(276_000);
    expect(baseline.breakdown.taxableIncomeForResidentTax - withIdeco.breakdown.taxableIncomeForResidentTax).toBe(276_000);
  });

  it('iDeCo undefined → idecoDeduction = 0 in breakdown', () => {
    const result = calculateTakeHome(baseInput);
    expect(result.breakdown.idecoDeduction).toBe(0);
  });

  it('iDeCo ¥68,000/月 (max for 第1号) → breakdown idecoDeduction = ¥816,000', () => {
    const result = calculateTakeHome({ ...baseInput, idecoMonthlyContribution: 68_000 });
    expect(result.breakdown.idecoDeduction).toBe(816_000);
  });

  it('negative iDeCo throws', () => {
    expect(() => calculateTakeHome({ ...baseInput, idecoMonthlyContribution: -1 })).toThrow(
      /idecoMonthlyContribution must be >= 0/,
    );
  });
});

// ============================================================================
// 生命保険料控除 (新制度) — Section 3
// ============================================================================

describe('Life insurance deduction — 新制度', () => {
  // Per-category formula (national):
  //   premium ≤ ¥20,000          → deduction = premium
  //   ¥20,000 < premium ≤ ¥40,000 → premium/2 + ¥10,000
  //   ¥40,000 < premium ≤ ¥80,000 → premium/4 + ¥20,000
  //   premium > ¥80,000           → ¥40,000 (cap)

  it('national: premium ¥20,000 → deduction ¥20,000 (full)', () => {
    expect(calculateLifeInsuranceDeductionNational({ generalNew: 20_000 })).toBe(20_000);
  });
  it('national: premium ¥40,000 → deduction = 40,000/2 + 10,000 = ¥30,000', () => {
    expect(calculateLifeInsuranceDeductionNational({ generalNew: 40_000 })).toBe(30_000);
  });
  it('national: premium ¥80,000 → deduction = 80,000/4 + 20,000 = ¥40,000 (per-cat cap)', () => {
    expect(calculateLifeInsuranceDeductionNational({ generalNew: 80_000 })).toBe(40_000);
  });
  it('national: premium ¥120,000 → ¥40,000 (per-cat cap), not higher', () => {
    expect(calculateLifeInsuranceDeductionNational({ generalNew: 120_000 })).toBe(40_000);
  });
  it('national: three categories at ¥80k each → ¥40k × 3 = ¥120,000 (total cap)', () => {
    expect(
      calculateLifeInsuranceDeductionNational({
        generalNew: 80_000,
        careMedicalNew: 80_000,
        personalPensionNew: 80_000,
      }),
    ).toBe(120_000);
  });
  it('national: three categories overpaying caps stays at ¥120,000', () => {
    expect(
      calculateLifeInsuranceDeductionNational({
        generalNew: 200_000,
        careMedicalNew: 200_000,
        personalPensionNew: 200_000,
      }),
    ).toBe(120_000);
  });

  // 住民税 formula caps at ¥28,000 per category, ¥70,000 total.
  it('resident: premium ¥12,000 → ¥12,000 (full)', () => {
    expect(calculateLifeInsuranceDeductionResident({ generalNew: 12_000 })).toBe(12_000);
  });
  it('resident: premium ¥56,000 → ¥28,000 (per-cat cap)', () => {
    expect(calculateLifeInsuranceDeductionResident({ generalNew: 56_000 })).toBe(28_000);
  });
  it('resident: three categories at ¥56k each → ¥70,000 (total cap, not ¥84k)', () => {
    expect(
      calculateLifeInsuranceDeductionResident({
        generalNew: 56_000,
        careMedicalNew: 56_000,
        personalPensionNew: 56_000,
      }),
    ).toBe(70_000);
  });

  it('undefined premiums → 0', () => {
    expect(calculateLifeInsuranceDeductionNational(undefined)).toBe(0);
    expect(calculateLifeInsuranceDeductionResident(undefined)).toBe(0);
  });

  it('end-to-end: applied to both national + resident taxable income', () => {
    const baseInput: SalaryInput = {
      annualIncome: 6_000_000,
      age: 30,
      category: 'salary',
      prefecture: 'tokyo',
    };
    const baseline = calculateTakeHome(baseInput);
    const withLI = calculateTakeHome({
      ...baseInput,
      lifeInsurancePremiums: { generalNew: 80_000, careMedicalNew: 80_000, personalPensionNew: 80_000 },
    });
    // National 生命保険 cap = ¥120,000 → taxable drops by ¥120k
    expect(
      baseline.breakdown.taxableIncomeForNationalTax - withLI.breakdown.taxableIncomeForNationalTax,
    ).toBe(120_000);
    // Resident 生命保険 cap = ¥70,000 → taxable drops by ¥70k
    expect(
      baseline.breakdown.taxableIncomeForResidentTax - withLI.breakdown.taxableIncomeForResidentTax,
    ).toBe(70_000);
  });
});

// ============================================================================
// 配偶者特別控除 — Section 4
// ============================================================================

describe('Spouse special deduction', () => {
  // Taxpayer ¥6,000,000 Tokyo (合計所得 = 6M - 給与所得控除).
  //   給与所得控除 for ¥6M = floor(6,000,000 × 0.20 + 440,000) = ¥1,640,000
  //   給与所得 = 4,360,000  (taxpayer 合計所得 tier "≤ ¥9M")
  //
  // Spouse 年収 ¥1,500,000:
  //   給与所得控除 for ¥1.5M = ¥650,000 (floor, ≤ ¥1.9M)
  //   spouse 合計所得 = 850,000   (in tier ≤ ¥950k)
  //   → 配偶者特別控除 国税 ¥380,000, 住民税 ¥330,000
  //
  // Spouse 年収 ¥2,000,000:
  //   給与所得控除 for ¥2M = floor(2,000,000 × 0.30 + 80,000) = ¥680,000
  //   spouse 合計所得 = 1,320,000  (in tier ≤ ¥1,330,000)
  //   → 配偶者特別控除 国税 ¥30,000, 住民税 ¥30,000
  //
  // Spouse 年収 ¥2,100,000:
  //   給与所得控除 for ¥2.1M = floor(2,100,000 × 0.30 + 80,000) = ¥710,000
  //   spouse 合計所得 = 1,390,000  > ¥1,330,000 ceiling → ¥0

  const baseInput: SalaryInput = {
    annualIncome: 6_000_000,
    age: 30,
    category: 'salary',
    prefecture: 'tokyo',
    hasSpouse: true,
    spouseAge: 30,
  };

  it('spouse 合計所得 ≤ ¥580k (年収 ¥1,030,000) → 配偶者控除 ¥380k', () => {
    const result = calculateTakeHome({ ...baseInput, spouseAnnualIncome: 1_030_000 });
    expect(result.breakdown.spouseDeduction).toBe(380_000);
  });
  it('spouse 合計所得 ¥850k (年収 ¥1.5M) → 配偶者特別控除 国税 ¥380k', () => {
    const result = calculateTakeHome({ ...baseInput, spouseAnnualIncome: 1_500_000 });
    expect(result.breakdown.spouseDeduction).toBe(380_000);
  });
  it('spouse 合計所得 ¥1,320k (年収 ¥2.0M) → 配偶者特別控除 国税 ¥30k', () => {
    const result = calculateTakeHome({ ...baseInput, spouseAnnualIncome: 2_000_000 });
    expect(result.breakdown.spouseDeduction).toBe(30_000);
  });
  it('spouse 合計所得 > ¥1.33M (年収 ¥2.1M) → ¥0 (above 配偶者特別控除 ceiling)', () => {
    const result = calculateTakeHome({ ...baseInput, spouseAnnualIncome: 2_100_000 });
    expect(result.breakdown.spouseDeduction).toBe(0);
  });
  it('hasSpouse=true without spouseAnnualIncome → legacy full 配偶者控除', () => {
    const result = calculateTakeHome(baseInput);
    expect(result.breakdown.spouseDeduction).toBe(380_000);
  });

  // Taxpayer 合計所得 > ¥10M → both deductions = 0.
  it('taxpayer 合計所得 > ¥10M with spouse income in special range → ¥0', () => {
    const result = calculateTakeHome({
      annualIncome: 15_000_000,
      age: 40,
      category: 'salary',
      prefecture: 'tokyo',
      hasSpouse: true,
      spouseAge: 38,
      spouseAnnualIncome: 1_500_000,
    });
    expect(result.breakdown.spouseDeduction).toBe(0);
  });
});

// ============================================================================
// Tokyo 23-ku 国保 — Section 5
//
// Verifies the 4th component (子ども・子育て支援金分) is now included for
// freelancers in tokyo-23ku. Before 0.3.0 this was `null` and the premium
// was under-estimated by ¥3-30k/yr.
// ============================================================================

// ============================================================================
// 地震保険料控除 + 医療費控除 — Section 6 (added in 0.3.x bundle A2)
// ============================================================================

describe('Earthquake insurance + medical deduction', () => {
  const baseInput: SalaryInput = {
    annualIncome: 6_000_000,
    age: 30,
    category: 'salary',
    prefecture: 'tokyo',
  };

  it('地震保険料 ¥30,000 → deduction ¥30,000 (under cap), applied to both 所得税 + 住民税', () => {
    const baseline = calculateTakeHome(baseInput);
    const withEq = calculateTakeHome({ ...baseInput, earthquakeInsurancePremium: 30_000 });
    expect(
      baseline.breakdown.taxableIncomeForNationalTax - withEq.breakdown.taxableIncomeForNationalTax,
    ).toBe(30_000);
    expect(
      baseline.breakdown.taxableIncomeForResidentTax - withEq.breakdown.taxableIncomeForResidentTax,
    ).toBe(30_000);
    expect(withEq.breakdown.earthquakeInsuranceDeduction).toBe(30_000);
  });

  it('地震保険料 ¥80,000 → capped at ¥50,000', () => {
    const result = calculateTakeHome({ ...baseInput, earthquakeInsurancePremium: 80_000 });
    expect(result.breakdown.earthquakeInsuranceDeduction).toBe(50_000);
  });

  it('地震保険料 negative throws', () => {
    expect(() =>
      calculateTakeHome({ ...baseInput, earthquakeInsurancePremium: -1 }),
    ).toThrow(/earthquakeInsurancePremium must be >= 0/);
  });

  it('医療費控除 ¥150,000 → deduction ¥150,000, applied to both taxes', () => {
    const baseline = calculateTakeHome(baseInput);
    const withMed = calculateTakeHome({ ...baseInput, medicalDeductible: 150_000 });
    expect(
      baseline.breakdown.taxableIncomeForNationalTax - withMed.breakdown.taxableIncomeForNationalTax,
    ).toBe(150_000);
    expect(
      baseline.breakdown.taxableIncomeForResidentTax - withMed.breakdown.taxableIncomeForResidentTax,
    ).toBe(150_000);
    expect(withMed.breakdown.medicalDeduction).toBe(150_000);
  });

  it('医療費控除 ¥3,000,000 → capped at ¥2,000,000', () => {
    const result = calculateTakeHome({ ...baseInput, medicalDeductible: 3_000_000 });
    expect(result.breakdown.medicalDeduction).toBe(2_000_000);
  });

  it('医療費控除 negative throws', () => {
    expect(() => calculateTakeHome({ ...baseInput, medicalDeductible: -1 })).toThrow(
      /medicalDeductible must be >= 0/,
    );
  });

  it('undefined fields → 0 in breakdown', () => {
    const result = calculateTakeHome(baseInput);
    expect(result.breakdown.earthquakeInsuranceDeduction).toBe(0);
    expect(result.breakdown.medicalDeduction).toBe(0);
  });
});

describe('Tokyo 23-ku 国保 — childcare component', () => {
  it('freelance ¥5,000,000 in tokyo-23ku gets all 4 components (incl. 子育て)', () => {
    // 旧ただし書き所得 = 5,000,000 - 430,000 = ¥4,570,000
    // 医療      = min(670k, floor(4,570,000 × 0.0751) + 47,600) = min(670k, 343,207 + 47,600) = ¥390,807
    // 支援      = min(260k, floor(4,570,000 × 0.0280) + 17,600) = min(260k, 127,960 + 17,600) = ¥145,560
    // 介護      = ¥0 (age 30, not 40-64)
    // 子育て    = min(30k, floor(4,570,000 × 0.0027) + 1,873) = min(30k, 12,339 + 1,873) = ¥14,212
    // Total     = 390,807 + 145,560 + 14,212 = ¥550,579
    const result = calculateTakeHome({
      annualIncome: 5_000_000,
      age: 30,
      category: 'business',
      municipality: 'tokyo-23ku',
    });
    expect(result.nationalHealthInsurance).toBe(550_579);
  });
});

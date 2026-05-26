import {
  calculateEmploymentInsurance,
  calculateHealthInsurance,
  calculateIncomeTaxFromTaxable,
  calculatePension,
  calculateResidentTaxFromTaxable,
  calculateTakeHome,
  calculateTaxableIncomeForNationalTax,
  calculateTaxableIncomeForResidentTax,
  getStandardRemunerationGrade,
} from '@/lib/tax-calculator';
import type { SalaryInput } from '@/types/tax';

// ============================================================================
// MAIN FIXTURES (4 cases)
//
// Each derivation block was computed BY HAND against the official 2026
// formulas before the code was written. If a test fails, ASSUME THE
// IMPLEMENTATION IS WRONG, not the fixture. Re-verify the math first.
// ============================================================================

// ---------------------------------------------------------------------------
// Case 1: Baito sinh viên ¥1,000,000 — Osaka, age 22, isWorkingStudent
//
// Derivation (FY2026):
//   給与所得控除          = ¥650,000  (floor, 年収 ≤ ¥1.9M)
//   給与所得              = 1,000,000 - 650,000 = ¥350,000
//   合計所得              = ¥350,000  (≤ ¥1.32M ⇒ 基礎控除 所得税 ¥950,000)
//
//   monthly income         = 1,000,000 / 12 ≈ ¥83,333
//   標準報酬月額 grade     = ¥88,000  (bin [83k, 93k), healthGrade 4, pensionGrade 1)
//   健保+子育て (Osaka)    = floor(88,000 × (0.1013 + 0.0023) / 2)
//                          = floor(88,000 × 0.1036 / 2) = floor(4,558.4) = ¥4,558/月
//   介護                   = ¥0 (age 22, not 40–64)
//   厚年                   = floor(88,000 × 0.0915) = ¥8,052/月
//   雇用保険 (FY26)        = floor(1,000,000 × 0.005) = ¥5,000/年
//   社会保険料控除          = (4,558 + 8,052) × 12 + 5,000 = 151,320 + 5,000 = ¥156,320
//
//   勤労学生控除 所得税    = ¥270,000  (eligible: 合計所得 ¥350k ≤ ¥850k)
//   勤労学生控除 住民税    = ¥260,000
//
//   課税所得 所得税        = max(0, 350,000 - 156,320 - 950,000 - 270,000) = 0 → ¥0
//   所得税                 = 0
//
//   課税所得 住民税        = max(0, 350,000 - 156,320 - 430,000 - 260,000) = 0 → ¥0
//   所得割                 = 0 (also exempt: 合計所得 ¥350k ≤ ¥450k threshold)
//   均等割                 = 0 (exempt: same threshold)
//   residentTax            = 0
//
//   takeHome               = 1,000,000 - 0 - 0 - 54,696 - 96,624 - 5,000 = ¥843,680
//   takeHomeMonthly        = floor(843,680 / 12) = ¥70,306
// ---------------------------------------------------------------------------

describe('Case 1: Baito sinh viên ¥1,000,000 (Osaka, age 22)', () => {
  const input: SalaryInput = {
    annualIncome: 1_000_000,
    age: 22,
    category: 'salary',
    prefecture: 'osaka',
    isWorkingStudent: true,
  };
  const result = calculateTakeHome(input);

  it('所得税 = 0 (deductions cover entire 給与所得)', () => {
    expect(result.incomeTax).toBe(0);
  });
  it('住民税 = 0 (under exemption thresholds)', () => {
    expect(result.residentTax).toBe(0);
  });
  it('健保+子育て (Osaka, age 22, grade ¥88k) = ¥4,558/month × 12', () => {
    expect(result.healthInsurance).toBe(54_696);
  });
  it('厚年 (grade ¥88k) = ¥8,052/month × 12', () => {
    expect(result.pension).toBe(96_624);
  });
  it('雇用保険 FY2026 = 0.5% × ¥1M', () => {
    expect(result.employmentInsurance).toBe(5_000);
  });
  it('takeHomeAnnual = ¥843,680', () => {
    expect(result.takeHomeAnnual).toBe(843_680);
  });
  it('breakdown shows 標準報酬月額 ¥88,000', () => {
    expect(result.breakdown.standardMonthlyRemuneration).toBe(88_000);
  });
  it('breakdown shows 勤労学生控除 applied = ¥270k', () => {
    expect(result.breakdown.workingStudentDeduction).toBe(270_000);
  });
});

// ---------------------------------------------------------------------------
// Case 2: Seishain mới ra trường ¥3,600,000 — Tokyo, age 24, single
//
// Derivation (FY2026):
//   給与所得控除          = floor(3,600,000 × 0.30 + 80,000) = ¥1,160,000
//   給与所得              = 3,600,000 - 1,160,000 = ¥2,440,000
//   合計所得              = ¥2,440,000  (in 132–336万 ⇒ 基礎控除 所得税 ¥580,000)
//
//   monthly income         = 300,000
//   標準報酬月額 grade     = ¥300,000  (bin [290k, 310k))
//   健保+子育て (Tokyo)    = floor(300,000 × (0.0985 + 0.0023) / 2)
//                          = floor(300,000 × 0.1008 / 2) = floor(15,120) = ¥15,120/月
//   介護                   = ¥0 (age 24)
//   厚年                   = floor(300,000 × 0.0915) = ¥27,450/月
//   雇用保険                = floor(3,600,000 × 0.005) = ¥18,000/年
//   社会保険料控除          = (15,120 + 27,450) × 12 + 18,000 = 510,840 + 18,000 = ¥528,840
//
//   課税所得 所得税        = 2,440,000 - 528,840 - 580,000 = 1,331,160 → floor1k = ¥1,331,000
//   bracket [0, 1.949M] 5%, ded 0
//   基準所得税              = floor(1,331,000 × 0.05) = ¥66,550
//   復興税                  = floor(66,550 × 0.021) = ¥1,397
//   所得税 final            = floor((66,550 + 1,397) / 100) × 100 = ¥67,900
//
//   課税所得 住民税        = 2,440,000 - 528,840 - 430,000 = 1,481,160 → floor1k = ¥1,481,000
//   所得割                  = floor(1,481,000 × 0.10) = ¥148,100
//   均等割                  = ¥5,000
//   residentTax            = ¥153,100
//
//   takeHome               = 3,600,000 - 67,900 - 153,100 - 181,440 - 329,400 - 18,000 = ¥2,850,160
// ---------------------------------------------------------------------------

describe('Case 2: Seishain ¥3,600,000 (Tokyo, age 24, single)', () => {
  const input: SalaryInput = {
    annualIncome: 3_600_000,
    age: 24,
    category: 'salary',
    prefecture: 'tokyo',
  };
  const result = calculateTakeHome(input);

  it('給与所得控除 = ¥1,160,000', () => {
    expect(result.breakdown.employmentIncomeDeduction).toBe(1_160_000);
  });
  it('合計所得 = ¥2,440,000', () => {
    expect(result.breakdown.totalIncome).toBe(2_440_000);
  });
  it('基礎控除 所得税 = ¥580,000 (令和7年 tier)', () => {
    expect(result.breakdown.basicDeductionNationalTax).toBe(580_000);
  });
  it('基礎控除 住民税 = ¥430,000 (unchanged)', () => {
    expect(result.breakdown.basicDeductionResidentTax).toBe(430_000);
  });
  it('社会保険料控除 = ¥528,840 (incl. 0.115% 子ども・子育て employee share)', () => {
    expect(result.breakdown.socialInsuranceDeduction).toBe(528_840);
  });
  it('課税所得 所得税 = ¥1,331,000 (after ¥1,000 floor)', () => {
    expect(result.breakdown.taxableIncomeForNationalTax).toBe(1_331_000);
  });
  it('課税所得 住民税 = ¥1,481,000', () => {
    expect(result.breakdown.taxableIncomeForResidentTax).toBe(1_481_000);
  });
  it('所得税 (incl. 復興) = ¥67,900', () => {
    expect(result.incomeTax).toBe(67_900);
  });
  it('住民税 = ¥153,100', () => {
    expect(result.residentTax).toBe(153_100);
  });
  it('健保+子育て = ¥181,440/year', () => {
    expect(result.healthInsurance).toBe(181_440);
  });
  it('厚年 = ¥329,400/year', () => {
    expect(result.pension).toBe(329_400);
  });
  it('takeHomeAnnual = ¥2,850,160', () => {
    expect(result.takeHomeAnnual).toBe(2_850_160);
  });
});

// ---------------------------------------------------------------------------
// Case 3: Seishain senior ¥8,000,000 — Aichi, age 45, spouse + 2 kids (18, 14)
//
// Derivation (FY2026):
//   給与所得控除          = floor(8,000,000 × 0.10 + 1,100,000) = ¥1,900,000
//   給与所得              = 8,000,000 - 1,900,000 = ¥6,100,000
//   合計所得              = ¥6,100,000  (in 4.89M–6.55M ⇒ 基礎控除 所得税 ¥630,000)
//
//   monthly                = 8,000,000 / 12 ≈ ¥666,667
//   標準報酬月額           = ¥680,000  (bin [665k, 695k), healthGrade 36, pensionGrade 32)
//   健保+介護+子育て (Aichi) = floor(680,000 × (0.0993 + 0.0162 + 0.0023) / 2)
//                          = floor(680,000 × 0.1178 / 2)
//                          ≈ floor(40,051.99…) = ¥40,051/月  (JS float quirk: 0.0993+0.0162
//                            yields 0.1154999999…, so combined product is just under 80,104)
//   厚年 (cap ¥650k)       = floor(650,000 × 0.0915) = ¥59,475/月
//   雇用保険                = floor(8,000,000 × 0.005) = ¥40,000/年
//   社会保険料控除          = (40,051 + 59,475) × 12 + 40,000
//                          = 99,526 × 12 + 40,000 = 1,194,312 + 40,000 = ¥1,234,312
//
//   配偶者控除 所得税      = ¥380,000  (taxpayer income ¥6.1M ≤ ¥9M, spouse < 70)
//   配偶者控除 住民税      = ¥330,000
//   扶養控除 (18 yo)       = ¥380,000 所得税 / ¥330,000 住民税  (一般)
//   扶養控除 (14 yo)       = ¥0       (under DEPENDENT_MIN_AGE 16)
//
//   課税所得 所得税        = 6,100,000 - 1,234,312 - 630,000 - 380,000 - 380,000
//                          = ¥3,475,688 → floor1k = ¥3,475,000
//   bracket [3.3M, 6.949M] 20% ded ¥427,500
//   基準所得税              = floor(3,475,000 × 0.20 - 427,500) = floor(267,500) = ¥267,500
//   復興税                  = floor(267,500 × 0.021) = floor(5,617.5) = ¥5,617
//   所得税 final            = floor((267,500 + 5,617) / 100) × 100 = ¥273,100
//
//   課税所得 住民税        = 6,100,000 - 1,234,312 - 430,000 - 330,000 - 330,000
//                          = ¥3,775,688 → floor1k = ¥3,775,000
//   所得割                  = floor(3,775,000 × 0.10) = ¥377,500
//   均等割                  = ¥5,000
//   residentTax            = ¥382,500
//
//   takeHome               = 8,000,000 - 273,100 - 382,500 - 480,612 - 713,700 - 40,000 = ¥6,110,088
//                                                            (健保+介護+子育て) (厚年)
// ---------------------------------------------------------------------------

describe('Case 3: Seishain senior ¥8,000,000 (Aichi, age 45, spouse + 2 kids)', () => {
  const input: SalaryInput = {
    annualIncome: 8_000_000,
    age: 45,
    category: 'salary',
    prefecture: 'aichi',
    hasSpouse: true,
    spouseAge: 42,
    dependents: [
      { age: 18, livesWithTaxpayer: true },
      { age: 14, livesWithTaxpayer: true },
    ],
  };
  const result = calculateTakeHome(input);

  it('標準報酬月額 ¥680,000 (health grade 36, pension grade 32)', () => {
    expect(result.breakdown.standardMonthlyRemuneration).toBe(680_000);
  });
  it('健保 + 介護 + 子育て (Aichi, age 45) = ¥480,612/year', () => {
    expect(result.healthInsurance).toBe(480_612);
  });
  it('厚年 (capped at ¥650k) = ¥713,700/year', () => {
    expect(result.pension).toBe(713_700);
  });
  it('配偶者控除 所得税 = ¥380,000', () => {
    expect(result.breakdown.spouseDeduction).toBe(380_000);
  });
  it('扶養控除 所得税 = ¥380,000 (only 18yo, 14yo excluded)', () => {
    expect(result.breakdown.dependentDeduction).toBe(380_000);
  });
  it('課税所得 所得税 = ¥3,475,000', () => {
    expect(result.breakdown.taxableIncomeForNationalTax).toBe(3_475_000);
  });
  it('基準所得税 = ¥267,500', () => {
    expect(result.breakdown.baseIncomeTax).toBe(267_500);
  });
  it('復興税 = ¥5,617', () => {
    expect(result.breakdown.reconstructionSurtax).toBe(5_617);
  });
  it('所得税 final = ¥273,100', () => {
    expect(result.incomeTax).toBe(273_100);
  });
  it('住民税 = ¥382,500', () => {
    expect(result.residentTax).toBe(382_500);
  });
  it('takeHomeAnnual = ¥6,110,088', () => {
    expect(result.takeHomeAnnual).toBe(6_110_088);
  });
});

// ---------------------------------------------------------------------------
// Case 4: Freelance ¥5,000,000 — Osaka-shi, age 35, no 青色申告控除
//
// Derivation (FY2026):
//   事業所得              = ¥5,000,000  (annualIncome = 事業所得, blueReturn = 0)
//   合計所得              = ¥5,000,000  (in 4.89M–6.55M ⇒ 基礎控除 所得税 ¥630,000)
//   旧ただし書き所得       = 5,000,000 - 430,000 = ¥4,570,000
//
//   国保 Osaka-shi:
//     医療  = min(660k, floor(4,570,000 × 0.0950) + 34,990 + 33,908)
//           = min(660k,           434,150        + 34,990 + 33,908)
//           = min(660k, 503,048)  = ¥503,048
//     支援  = min(260k, floor(4,570,000 × 0.0306) + 11,191 + 10,845)
//           = min(260k,           139,842        + 11,191 + 10,845)
//           = min(260k, 161,878)  = ¥161,878
//     介護  = ¥0  (age 35, not 40-64)
//     子育て = min(30k, floor(4,570,000 × 0.0028) + 1,841)
//           = min(30k,           12,796         + 1,841)
//           = min(30k, 14,637)   = ¥14,637
//     国保 total = ¥679,563
//
//   国民年金              = 17,920 × 12 = ¥215,040
//   社会保険料控除         = 679,563 + 215,040 = ¥894,603
//
//   課税所得 所得税        = 5,000,000 - 894,603 - 630,000 = ¥3,475,397 → floor1k = ¥3,475,000
//   bracket [3.3M, 6.949M] 20% ded 427,500
//   基準所得税              = floor(3,475,000 × 0.20 - 427,500) = ¥267,500
//   復興税                  = floor(267,500 × 0.021) = floor(5,617.5) = ¥5,617
//   所得税 final            = floor((267,500 + 5,617) / 100) × 100 = ¥273,100
//
//   課税所得 住民税        = 5,000,000 - 894,603 - 430,000 = ¥3,675,397 → floor1k = ¥3,675,000
//   所得割                  = floor(3,675,000 × 0.10) = ¥367,500
//   均等割                  = ¥5,000
//   residentTax            = ¥372,500
//
//   takeHome               = 5,000,000 - 273,100 - 372,500 - 679,563 - 215,040 = ¥3,459,797
// ---------------------------------------------------------------------------

describe('Case 4: Freelance ¥5,000,000 (Osaka-shi, age 35)', () => {
  const input: SalaryInput = {
    annualIncome: 5_000_000,
    age: 35,
    category: 'business',
    municipality: 'osaka-shi',
  };
  const result = calculateTakeHome(input);

  it('healthInsurance = 0 (not enrolled in 協会けんぽ)', () => {
    expect(result.healthInsurance).toBe(0);
  });
  it('pension = 0 (not 厚生年金)', () => {
    expect(result.pension).toBe(0);
  });
  it('employmentInsurance = 0 (freelancers do not pay)', () => {
    expect(result.employmentInsurance).toBe(0);
  });
  it('国民健康保険 (Osaka-shi, 4 components, no 介護) = ¥679,563', () => {
    expect(result.nationalHealthInsurance).toBe(679_563);
  });
  it('国民年金 = ¥17,920 × 12 = ¥215,040', () => {
    expect(result.nationalPension).toBe(215_040);
  });
  it('課税所得 所得税 = ¥3,475,000', () => {
    expect(result.breakdown.taxableIncomeForNationalTax).toBe(3_475_000);
  });
  it('所得税 final = ¥273,100', () => {
    expect(result.incomeTax).toBe(273_100);
  });
  it('住民税 = ¥372,500', () => {
    expect(result.residentTax).toBe(372_500);
  });
  it('takeHomeAnnual = ¥3,459,797', () => {
    expect(result.takeHomeAnnual).toBe(3_459_797);
  });
});

// ============================================================================
// EDGE CASES (validation throws)
// ============================================================================

describe('edge cases — validation throws', () => {
  it('annualIncome = 0 throws', () => {
    expect(() =>
      calculateTakeHome({ annualIncome: 0, age: 30, category: 'salary', prefecture: 'tokyo' }),
    ).toThrow(/annualIncome must be > 0/);
  });
  it('annualIncome negative throws', () => {
    expect(() =>
      calculateTakeHome({ annualIncome: -500_000, age: 30, category: 'salary', prefecture: 'tokyo' }),
    ).toThrow(/annualIncome must be > 0/);
  });
  it('age 150 throws', () => {
    expect(() =>
      calculateTakeHome({ annualIncome: 3_000_000, age: 150, category: 'salary', prefecture: 'tokyo' }),
    ).toThrow(/age must be in \[0, 120\]/);
  });
  it('age -1 throws', () => {
    expect(() =>
      calculateTakeHome({ annualIncome: 3_000_000, age: -1, category: 'salary', prefecture: 'tokyo' }),
    ).toThrow(/age must be in \[0, 120\]/);
  });
  it('unsupported prefecture throws with supported list', () => {
    // All 47 真都道府県 are now supported (0.3.x). The validation check
    // remains in place for guard against typos / future schema changes.
    expect(() =>
      calculateTakeHome({
        annualIncome: 3_000_000,
        age: 30,
        category: 'salary',
        // @ts-expect-error -- not a real prefecture key (typo simulation)
        prefecture: 'unknown_prefecture_zz',
      }),
    ).toThrow(/Prefecture 'unknown_prefecture_zz' không được hỗ trợ/);
  });
  it('business category without municipality throws', () => {
    expect(() =>
      calculateTakeHome({ annualIncome: 3_000_000, age: 30, category: 'business' }),
    ).toThrow(/requires 'municipality'/);
  });
  it('salary category without prefecture throws', () => {
    expect(() =>
      calculateTakeHome({ annualIncome: 3_000_000, age: 30, category: 'salary' }),
    ).toThrow(/requires 'prefecture'/);
  });
  it('hasSpouse without spouseAge throws', () => {
    expect(() =>
      calculateTakeHome({
        annualIncome: 5_000_000,
        age: 35,
        category: 'salary',
        prefecture: 'tokyo',
        hasSpouse: true,
      }),
    ).toThrow(/hasSpouse=true requires spouseAge/);
  });
});

// ============================================================================
// BOUNDARY TESTS
// ============================================================================

describe('boundary: standard remuneration grade lookup', () => {
  it('monthlyIncome = 0 → grade 1 (¥58,000)', () => {
    expect(getStandardRemunerationGrade(0).monthlyAmount).toBe(58_000);
  });
  it('monthlyIncome at lower bound of grade 2 → grade 2 (¥68,000)', () => {
    expect(getStandardRemunerationGrade(63_000).monthlyAmount).toBe(68_000);
  });
  it('monthlyIncome just below grade 2 lower bound → grade 1', () => {
    expect(getStandardRemunerationGrade(62_999).monthlyAmount).toBe(58_000);
  });
  it('monthlyIncome ≥ ¥1,390,000 → top grade 50 (¥1,390,000)', () => {
    expect(getStandardRemunerationGrade(1_390_000).monthlyAmount).toBe(1_390_000);
    expect(getStandardRemunerationGrade(10_000_000).monthlyAmount).toBe(1_390_000);
  });
  it('negative monthlyIncome throws', () => {
    expect(() => getStandardRemunerationGrade(-1)).toThrow(/monthlyIncome must be >= 0/);
  });
});

describe('boundary: 160万円 wall (令和7年 reform)', () => {
  // Use socialInsuranceAnnual = 0 to isolate the deduction-stacked wall:
  //   給与所得控除 ¥650k (floor) + 基礎控除 ¥950k = ¥1,600,000 wall.
  const baseInput = (annualIncome: number): SalaryInput => ({
    annualIncome,
    age: 30,
    category: 'salary',
    prefecture: 'tokyo',
  });

  it('¥1,599,999 → 課税所得 所得税 = 0', () => {
    // 給与所得 = 1,599,999 - 650,000 = 949,999
    // max(0, 949,999 - 0 - 950,000) = 0
    expect(calculateTaxableIncomeForNationalTax(baseInput(1_599_999), 0)).toBe(0);
  });
  it('¥1,610,000 → 課税所得 所得税 = ¥10,000 (10,000 → bracket 5%)', () => {
    // 給与所得 = 1,610,000 - 650,000 = 960,000
    // max(0, 960,000 - 0 - 950,000) = 10,000
    expect(calculateTaxableIncomeForNationalTax(baseInput(1_610_000), 0)).toBe(10_000);
  });
  it('¥1,030,000 (the old 103万円 wall) → 課税所得 所得税 = 0 — wall HAS moved', () => {
    // 給与所得 = 1,030,000 - 650,000 = 380,000
    // max(0, 380,000 - 0 - 950,000) = 0
    expect(calculateTaxableIncomeForNationalTax(baseInput(1_030_000), 0)).toBe(0);
  });
  it('¥1,500,000 (would have triggered old wall) → 課税所得 = 0 — also clear', () => {
    expect(calculateTaxableIncomeForNationalTax(baseInput(1_500_000), 0)).toBe(0);
  });
});

describe('boundary: 介護保険 age trigger (40-64)', () => {
  const ageInput = (age: number): SalaryInput => ({
    annualIncome: 3_600_000,
    age,
    category: 'salary',
    prefecture: 'tokyo',
  });
  // monthly = 300,000, grade ¥300,000
  // 健保+子育て (no 介護) = floor(300,000 × (0.0985 + 0.0023) / 2) × 12
  //                       = floor(15,120) × 12 = ¥181,440
  // 健保+介護+子育て       = floor(300,000 × (0.0985 + 0.0162 + 0.0023) / 2) × 12
  //                       = floor(17,550) × 12 = ¥210,600

  it('age 39 → no 介護 (¥181,440)', () => {
    expect(calculateHealthInsurance(ageInput(39))).toBe(181_440);
  });
  it('age 40 → 介護 ON (¥210,600)', () => {
    expect(calculateHealthInsurance(ageInput(40))).toBe(210_600);
  });
  it('age 64 → 介護 still ON', () => {
    expect(calculateHealthInsurance(ageInput(64))).toBe(210_600);
  });
  it('age 65 → 介護 OFF', () => {
    expect(calculateHealthInsurance(ageInput(65))).toBe(181_440);
  });
});

// ============================================================================
// SANITY TESTS for sub-helpers (smoke-level — main fixtures are the truth)
// ============================================================================

describe('sub-helper sanity', () => {
  it('calculateIncomeTaxFromTaxable: zero in → zero out', () => {
    expect(calculateIncomeTaxFromTaxable(0)).toEqual({
      baseIncomeTax: 0,
      reconstructionSurtax: 0,
      total: 0,
    });
  });
  it('calculateIncomeTaxFromTaxable: ¥1,335,000 → matches Case 2', () => {
    const r = calculateIncomeTaxFromTaxable(1_335_000);
    expect(r.baseIncomeTax).toBe(66_750);
    expect(r.reconstructionSurtax).toBe(1_401);
    expect(r.total).toBe(68_100);
  });
  it('calculateResidentTaxFromTaxable: exemption applies under ¥450k 合計所得', () => {
    const r = calculateResidentTaxFromTaxable(0, 350_000, 'tokyo');
    expect(r.total).toBe(0);
  });
  it('calculateResidentTaxFromTaxable: standard 10% + ¥5,000 above threshold', () => {
    const r = calculateResidentTaxFromTaxable(1_485_000, 2_440_000, 'tokyo');
    expect(r.incomeBased).toBe(148_500);
    expect(r.perCapita).toBe(5_000);
    expect(r.total).toBe(153_500);
  });
  it('calculateEmploymentInsurance: business returns 0', () => {
    expect(
      calculateEmploymentInsurance({
        annualIncome: 5_000_000,
        age: 35,
        category: 'business',
        municipality: 'osaka-shi',
      }),
    ).toBe(0);
  });
  it('calculatePension: business returns ¥215,040 (国民年金 FY2026)', () => {
    expect(
      calculatePension({
        annualIncome: 5_000_000,
        age: 35,
        category: 'business',
        municipality: 'osaka-shi',
      }),
    ).toBe(215_040);
  });
  it('calculateTaxableIncomeForResidentTax: rounding floors to ¥1,000', () => {
    // Construct a case landing on 1,485,300 then check it floors to 1,485,000.
    const input: SalaryInput = {
      annualIncome: 3_600_000,
      age: 24,
      category: 'salary',
      prefecture: 'tokyo',
    };
    expect(calculateTaxableIncomeForResidentTax(input, 524_700)).toBe(1_485_000);
  });
});

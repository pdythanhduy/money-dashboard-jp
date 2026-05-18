/**
 * 給与所得控除 (employment income deduction).
 *
 * MAJOR REFORM effective 令和7年12月1日, applies to 令和7年/令和8年 returns.
 * The minimum floor was raised from ¥550,000 to ¥650,000, lifting the lowest
 * bracket from ¥1,625,000 to ¥1,900,000.
 *
 * Formula by 年収 (gross annual salary):
 * - ≤¥1,900,000          : ¥650,000 (floor)
 * - ¥1,900,001–¥3,600,000: income × 30% + ¥80,000
 * - ¥3,600,001–¥6,600,000: income × 20% + ¥440,000
 * - ¥6,600,001–¥8,500,000: income × 10% + ¥1,100,000
 * - >¥8,500,000           : ¥1,950,000 (cap)
 *
 * @see https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1410.htm
 */

export function calculateEmploymentIncomeDeduction(grossAnnualIncome: number): number {
  if (grossAnnualIncome <= 1_900_000) return 650_000;
  if (grossAnnualIncome <= 3_600_000) return Math.floor(grossAnnualIncome * 0.30 +    80_000);
  if (grossAnnualIncome <= 6_600_000) return Math.floor(grossAnnualIncome * 0.20 +   440_000);
  if (grossAnnualIncome <= 8_500_000) return Math.floor(grossAnnualIncome * 0.10 + 1_100_000);
  return 1_950_000;
}

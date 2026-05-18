/**
 * 標準報酬月額 (standard monthly remuneration) — 50-grade table for 健康保険,
 * 32-grade table for 厚生年金.
 *
 * Both tables are NATIONWIDE — only the rate varies by prefecture.
 * Effective 令和8年3月分から (March 2026). Structure unchanged from FY2025.
 *
 * @see https://www.cells.co.jp/hyoujyun/hyoujyunhousyu.php
 */

import type { StandardRemunerationGrade } from '@/types/tax';

/**
 * The 50-grade 健康保険 table. 厚生年金 caps at grade 32 (¥650,000) — for
 * grades 33-50 the pensionGrade field stays at 32.
 *
 * `lowerBound` inclusive, `upperBound` exclusive. Grade 1 has no lower bound
 * (effectively 0); grade 50 has no upper bound (Infinity).
 */
export const STANDARD_REMUNERATION_GRADES: readonly StandardRemunerationGrade[] = [
  { healthGrade:  1, pensionGrade:  1, monthlyAmount:    58_000, lowerBound:           0, upperBound:    63_000 },
  { healthGrade:  2, pensionGrade:  1, monthlyAmount:    68_000, lowerBound:      63_000, upperBound:    73_000 },
  { healthGrade:  3, pensionGrade:  1, monthlyAmount:    78_000, lowerBound:      73_000, upperBound:    83_000 },
  { healthGrade:  4, pensionGrade:  1, monthlyAmount:    88_000, lowerBound:      83_000, upperBound:    93_000 },
  { healthGrade:  5, pensionGrade:  2, monthlyAmount:    98_000, lowerBound:      93_000, upperBound:   101_000 },
  { healthGrade:  6, pensionGrade:  3, monthlyAmount:   104_000, lowerBound:     101_000, upperBound:   107_000 },
  { healthGrade:  7, pensionGrade:  4, monthlyAmount:   110_000, lowerBound:     107_000, upperBound:   114_000 },
  { healthGrade:  8, pensionGrade:  5, monthlyAmount:   118_000, lowerBound:     114_000, upperBound:   122_000 },
  { healthGrade:  9, pensionGrade:  6, monthlyAmount:   126_000, lowerBound:     122_000, upperBound:   130_000 },
  { healthGrade: 10, pensionGrade:  7, monthlyAmount:   134_000, lowerBound:     130_000, upperBound:   138_000 },
  { healthGrade: 11, pensionGrade:  8, monthlyAmount:   142_000, lowerBound:     138_000, upperBound:   146_000 },
  { healthGrade: 12, pensionGrade:  9, monthlyAmount:   150_000, lowerBound:     146_000, upperBound:   155_000 },
  { healthGrade: 13, pensionGrade: 10, monthlyAmount:   160_000, lowerBound:     155_000, upperBound:   165_000 },
  { healthGrade: 14, pensionGrade: 11, monthlyAmount:   170_000, lowerBound:     165_000, upperBound:   175_000 },
  { healthGrade: 15, pensionGrade: 12, monthlyAmount:   180_000, lowerBound:     175_000, upperBound:   185_000 },
  { healthGrade: 16, pensionGrade: 13, monthlyAmount:   190_000, lowerBound:     185_000, upperBound:   195_000 },
  { healthGrade: 17, pensionGrade: 14, monthlyAmount:   200_000, lowerBound:     195_000, upperBound:   210_000 },
  { healthGrade: 18, pensionGrade: 15, monthlyAmount:   220_000, lowerBound:     210_000, upperBound:   230_000 },
  { healthGrade: 19, pensionGrade: 16, monthlyAmount:   240_000, lowerBound:     230_000, upperBound:   250_000 },
  { healthGrade: 20, pensionGrade: 17, monthlyAmount:   260_000, lowerBound:     250_000, upperBound:   270_000 },
  { healthGrade: 21, pensionGrade: 18, monthlyAmount:   280_000, lowerBound:     270_000, upperBound:   290_000 },
  { healthGrade: 22, pensionGrade: 19, monthlyAmount:   300_000, lowerBound:     290_000, upperBound:   310_000 },
  { healthGrade: 23, pensionGrade: 20, monthlyAmount:   320_000, lowerBound:     310_000, upperBound:   330_000 },
  { healthGrade: 24, pensionGrade: 21, monthlyAmount:   340_000, lowerBound:     330_000, upperBound:   350_000 },
  { healthGrade: 25, pensionGrade: 22, monthlyAmount:   360_000, lowerBound:     350_000, upperBound:   370_000 },
  { healthGrade: 26, pensionGrade: 23, monthlyAmount:   380_000, lowerBound:     370_000, upperBound:   395_000 },
  { healthGrade: 27, pensionGrade: 24, monthlyAmount:   410_000, lowerBound:     395_000, upperBound:   425_000 },
  { healthGrade: 28, pensionGrade: 25, monthlyAmount:   440_000, lowerBound:     425_000, upperBound:   455_000 },
  { healthGrade: 29, pensionGrade: 26, monthlyAmount:   470_000, lowerBound:     455_000, upperBound:   485_000 },
  { healthGrade: 30, pensionGrade: 27, monthlyAmount:   500_000, lowerBound:     485_000, upperBound:   515_000 },
  { healthGrade: 31, pensionGrade: 28, monthlyAmount:   530_000, lowerBound:     515_000, upperBound:   545_000 },
  { healthGrade: 32, pensionGrade: 29, monthlyAmount:   560_000, lowerBound:     545_000, upperBound:   575_000 },
  { healthGrade: 33, pensionGrade: 30, monthlyAmount:   590_000, lowerBound:     575_000, upperBound:   605_000 },
  { healthGrade: 34, pensionGrade: 31, monthlyAmount:   620_000, lowerBound:     605_000, upperBound:   635_000 },
  { healthGrade: 35, pensionGrade: 32, monthlyAmount:   650_000, lowerBound:     635_000, upperBound:   665_000 },
  { healthGrade: 36, pensionGrade: 32, monthlyAmount:   680_000, lowerBound:     665_000, upperBound:   695_000 },
  { healthGrade: 37, pensionGrade: 32, monthlyAmount:   710_000, lowerBound:     695_000, upperBound:   730_000 },
  { healthGrade: 38, pensionGrade: 32, monthlyAmount:   750_000, lowerBound:     730_000, upperBound:   770_000 },
  { healthGrade: 39, pensionGrade: 32, monthlyAmount:   790_000, lowerBound:     770_000, upperBound:   810_000 },
  { healthGrade: 40, pensionGrade: 32, monthlyAmount:   830_000, lowerBound:     810_000, upperBound:   855_000 },
  { healthGrade: 41, pensionGrade: 32, monthlyAmount:   880_000, lowerBound:     855_000, upperBound:   905_000 },
  { healthGrade: 42, pensionGrade: 32, monthlyAmount:   930_000, lowerBound:     905_000, upperBound:   955_000 },
  { healthGrade: 43, pensionGrade: 32, monthlyAmount:   980_000, lowerBound:     955_000, upperBound: 1_005_000 },
  { healthGrade: 44, pensionGrade: 32, monthlyAmount: 1_030_000, lowerBound:   1_005_000, upperBound: 1_055_000 },
  { healthGrade: 45, pensionGrade: 32, monthlyAmount: 1_090_000, lowerBound:   1_055_000, upperBound: 1_115_000 },
  { healthGrade: 46, pensionGrade: 32, monthlyAmount: 1_150_000, lowerBound:   1_115_000, upperBound: 1_175_000 },
  { healthGrade: 47, pensionGrade: 32, monthlyAmount: 1_210_000, lowerBound:   1_175_000, upperBound: 1_235_000 },
  { healthGrade: 48, pensionGrade: 32, monthlyAmount: 1_270_000, lowerBound:   1_235_000, upperBound: 1_295_000 },
  { healthGrade: 49, pensionGrade: 32, monthlyAmount: 1_330_000, lowerBound:   1_295_000, upperBound: 1_355_000 },
  { healthGrade: 50, pensionGrade: 32, monthlyAmount: 1_390_000, lowerBound:   1_355_000, upperBound:    Infinity },
];

/** 厚生年金 caps at grade 32 (¥650,000). Used to clamp pension calculation. */
export const PENSION_MAX_STANDARD_REMUNERATION = 650_000;

/**
 * Look up the 標準報酬月額 grade for a given actual monthly income.
 * Throws on negative input.
 */
export function getStandardRemunerationGrade(monthlyIncome: number): StandardRemunerationGrade {
  if (monthlyIncome < 0) {
    throw new Error(`monthlyIncome must be >= 0, got ${monthlyIncome}`);
  }
  for (const grade of STANDARD_REMUNERATION_GRADES) {
    if (monthlyIncome >= grade.lowerBound && monthlyIncome < grade.upperBound) {
      return grade;
    }
  }
  // Top grade has upperBound = Infinity, so this should be unreachable.
  throw new Error(`No grade matched monthlyIncome=${monthlyIncome} — table is incomplete`);
}

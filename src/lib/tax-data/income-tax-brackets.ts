/**
 * 所得税 (national income tax) 7-bracket progressive table.
 *
 * Unchanged since 2015. Verified for 令和7年/令和8年 (FY2025/FY2026).
 *
 * @see https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm
 */

import type { IncomeTaxBracket } from '@/types/tax';

export const INCOME_TAX_BRACKETS: readonly IncomeTaxBracket[] = [
  { lowerBound:           0, upperBound:   1_949_000, rate: 0.05, deduction:         0 },
  { lowerBound:   1_950_000, upperBound:   3_299_000, rate: 0.10, deduction:    97_500 },
  { lowerBound:   3_300_000, upperBound:   6_949_000, rate: 0.20, deduction:   427_500 },
  { lowerBound:   6_950_000, upperBound:   8_999_000, rate: 0.23, deduction:   636_000 },
  { lowerBound:   9_000_000, upperBound:  17_999_000, rate: 0.33, deduction: 1_536_000 },
  { lowerBound:  18_000_000, upperBound:  39_999_000, rate: 0.40, deduction: 2_796_000 },
  { lowerBound:  40_000_000, upperBound:    Infinity, rate: 0.45, deduction: 4_796_000 },
];

/**
 * 復興特別所得税 surtax rate applied to 基準所得税額.
 *
 * - 令和8年 (2026): 2.1%
 * - 令和9年 (2027) onwards: 1.1% (extended through 令和29年/2047)
 *
 * @see https://www.all-senmonka.jp/moneyizm/money/314224/
 */
export const RECONSTRUCTION_SURTAX_RATE = 0.021;

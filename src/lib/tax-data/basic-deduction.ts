/**
 * 基礎控除 (basic deduction) — TWO tables.
 *
 * 1. 所得税 basic deduction: NEW tiered table effective 令和7年12月1日,
 *    applies to 令和7年/令和8年 returns. The low-income bracket jumped from
 *    ¥480k to ¥950k. This is the change that shifts the famous "103万円の壁"
 *    to "160万円の壁" (¥650k 給与所得控除 + ¥950k 基礎控除).
 *
 *    @see https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1199.htm
 *
 * 2. 住民税 basic deduction: UNCHANGED at ¥430k flat (with phaseout above
 *    ¥24M). The 令和7年 reform did NOT touch resident-tax deductions.
 *
 *    @see https://biz.moneyforward.com/payroll/basic/111924/
 */

import type { BasicDeductionRow } from '@/types/tax';

/**
 * 所得税 basic deduction by 合計所得金額 (令和7年・令和8年).
 */
export const BASIC_DEDUCTION_NATIONAL_TAX: readonly BasicDeductionRow[] = [
  { totalIncomeUpperBound:   1_320_000, deduction: 950_000 },
  { totalIncomeUpperBound:   3_360_000, deduction: 580_000 },
  { totalIncomeUpperBound:   4_890_000, deduction: 680_000 },
  { totalIncomeUpperBound:   6_550_000, deduction: 630_000 },
  { totalIncomeUpperBound:  23_500_000, deduction: 580_000 },
  { totalIncomeUpperBound:  24_000_000, deduction: 480_000 },
  { totalIncomeUpperBound:  24_500_000, deduction: 320_000 },
  { totalIncomeUpperBound:  25_000_000, deduction: 160_000 },
  { totalIncomeUpperBound:    Infinity, deduction:       0 },
];

/**
 * 住民税 basic deduction by 合計所得金額.
 */
export const BASIC_DEDUCTION_RESIDENT_TAX: readonly BasicDeductionRow[] = [
  { totalIncomeUpperBound:  24_000_000, deduction: 430_000 },
  { totalIncomeUpperBound:  24_500_000, deduction: 290_000 },
  { totalIncomeUpperBound:  25_000_000, deduction: 150_000 },
  { totalIncomeUpperBound:    Infinity, deduction:       0 },
];

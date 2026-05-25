/**
 * Statutory caps applied to 標準賞与額 (standard bonus remuneration).
 *
 * 健康保険 / 介護保険:
 *   Cumulative 標準賞与額 within a fiscal year (April → March) is capped at
 *   ¥5,730,000. Premiums on bonus amounts above the cap are not collected.
 *   The same cap covers 介護保険 since 介護 is calculated against the same
 *   標準賞与額 as 健保.
 *   @see 健康保険法 第45条第3項
 *
 * 厚生年金保険:
 *   Per-payment cap on 標準賞与額 = ¥1,500,000. Each bonus is treated
 *   independently — there is no cumulative annual cap (unlike 健保).
 *   @see 厚生年金保険法 第24条の4
 *
 * 標準賞与額 itself = bonus payment amount, rounded down to ¥1,000 increments
 * (see `standardBonusAmount` in tax-calculator.ts).
 */

export const KENPO_BONUS_ANNUAL_CAP = 5_730_000;
export const KOSEI_NENKIN_BONUS_PER_PAYMENT_CAP = 1_500_000;

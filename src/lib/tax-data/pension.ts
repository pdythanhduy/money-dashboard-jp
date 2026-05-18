/**
 * Pension rates.
 *
 * 厚生年金保険料率: 18.3% (total, employer+employee), fixed since 2017-09.
 * Employee pays half (9.15%). Applied to 標準報酬月額 (capped at grade 32 =
 * ¥650,000 — see `standard-remuneration.ts`).
 *
 * @see https://www.nenkin.go.jp/service/kounen/hokenryo/hoshu/20150515-01.html
 *
 * 国民年金保険料 (FY2026): ¥17,920/month — for freelance / self-employed.
 * FY2025 was ¥17,510. Adjusted annually based on wage indexation.
 *
 * @see https://seikatsunomado.com/2026/01/24/令和8年度の年金額/
 */

export const KOSEI_NENKIN_RATE_TOTAL = 0.183;
export const KOSEI_NENKIN_RATE_EMPLOYEE = 0.0915;

/** Monthly 国民年金 premium for FY2026 (令和8年4月1日〜令和9年3月31日). */
export const KOKUMIN_NENKIN_MONTHLY_FY2026 = 17_920;

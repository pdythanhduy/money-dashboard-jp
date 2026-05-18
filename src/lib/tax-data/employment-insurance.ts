/**
 * 雇用保険料率 (employment insurance) — general industry, FY2026.
 *
 * Effective 2026-04-01 → 2027-03-31. Employee portion REDUCED from 0.6%
 * (FY2025) to 0.5% (FY2026). Applied to actual gross income (NOT 標準報酬月額).
 *
 * For agricultural/forestry/sake/construction the rates differ; not supported
 * in Phase 1.
 *
 * @see https://www.chukidan.jp/navi/column/insurance/13837/
 * @see https://www.mhlw.go.jp/content/001692566.pdf
 */

/** FY2026 general industry. */
export const EMPLOYMENT_INSURANCE_RATE_EMPLOYEE = 0.005;
export const EMPLOYMENT_INSURANCE_RATE_EMPLOYER = 0.0085;

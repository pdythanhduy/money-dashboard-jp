/**
 * 協会けんぽ (Japan Health Insurance Association) prefectural rates.
 *
 * Effective 令和8年3月分 (March 2026 billing) — payable from April 2026.
 * Rates are TOTAL (employer + employee combined). Employee pays half.
 *
 * 介護保険料率 is NATIONWIDE UNIFORM at 1.62% (FY2026), applied only to
 * insured persons aged 40–64.
 *
 * 子ども・子育て支援金率 0.23% (FY2026, NATIONWIDE UNIFORM) is included on
 * top of 健保 — bundled into `totalRate` in tax-calculator.ts via
 * `CHILDCARE_SUPPORT_RATE_FY2026`. Employee pays half (0.115%).
 *
 * @see https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/rate_prefectures/r08/index.html
 * @see https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/003/index.html
 */

import type { KenpoRate, Prefecture } from '@/types/tax';

const LONG_TERM_CARE_RATE_FY2026 = 0.0162;

/**
 * 子ども・子育て支援金 rate (NEW from FY2026, effective 令和8年4月分). Applied
 * to 標準報酬月額 + 標準賞与額 on top of 健康保険料率. Nationwide uniform —
 * does not vary by prefecture. Employee pays half (0.115%).
 *
 * Funds the 子ども・子育て支援金 system (こども家庭庁); collected via 健保
 * premium for both 協会けんぽ and 組合健保.
 */
export const CHILDCARE_SUPPORT_RATE_FY2026 = 0.0023;

export const KENPO_RATES: Readonly<Record<Prefecture, KenpoRate>> = {
  tokyo:    { healthRate: 0.0985, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  osaka:    { healthRate: 0.1013, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  aichi:    { healthRate: 0.0993, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  kanagawa: { healthRate: 0.0992, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  saitama:  { healthRate: 0.0967, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  chiba:    { healthRate: 0.0973, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  hyogo:    { healthRate: 0.1012, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  fukuoka:  { healthRate: 0.1011, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
};

/** Age range eligible for 介護保険 (long-term care insurance) contributions. */
export const LONG_TERM_CARE_AGE_MIN = 40;
export const LONG_TERM_CARE_AGE_MAX = 64;

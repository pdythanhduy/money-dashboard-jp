/**
 * 協会けんぽ (Japan Health Insurance Association) prefectural rates.
 *
 * Effective 令和8年3月分 (March 2026 billing) — payable from April 2026.
 * Rates are TOTAL (employer + employee combined). Employee pays half.
 *
 * 介護保険料率 is NATIONWIDE UNIFORM at 1.62% (FY2026), applied only to
 * insured persons aged 40–64.
 *
 * 子ども・子育て支援金率 0.23% (FY2026) is NOT yet included here.
 * TODO(FY2026-09): wire once the official 協会けんぽ guidance on whether the
 *   employee-portion is paid separately or rolled into 健康保険料 is settled.
 *   Tracking: see RATES_VERSION.md "Pending guidance" section.
 *   @see https://www.kyoukaikenpo.or.jp/lp/2026hokenryou/
 *
 * @see https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/rate_prefectures/r08/index.html
 */

import type { KenpoRate, Prefecture } from '@/types/tax';

const LONG_TERM_CARE_RATE_FY2026 = 0.0162;

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

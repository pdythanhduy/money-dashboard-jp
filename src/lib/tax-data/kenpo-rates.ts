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

/**
 * Full 47-prefecture FY2026 (令和8年度) 健康保険料率 table. Order: north →
 * south by 都道府県コード. Verified against the official source URL above
 * — saga is highest (10.55%), niigata is lowest (9.21%). The 8 prefectures
 * shipped in 0.2.x cross-check identical to the new table.
 */
export const KENPO_RATES: Readonly<Record<Prefecture, KenpoRate>> = {
  // Hokkaido / Tohoku
  hokkaido:  { healthRate: 0.1028, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  aomori:    { healthRate: 0.0985, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  iwate:     { healthRate: 0.0951, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  miyagi:    { healthRate: 0.1010, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  akita:     { healthRate: 0.1001, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  yamagata:  { healthRate: 0.0975, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  fukushima: { healthRate: 0.0950, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  // Kanto
  ibaraki:   { healthRate: 0.0952, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  tochigi:   { healthRate: 0.0982, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  gunma:     { healthRate: 0.0968, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  saitama:   { healthRate: 0.0967, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  chiba:     { healthRate: 0.0973, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  tokyo:     { healthRate: 0.0985, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  kanagawa:  { healthRate: 0.0992, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  // Chubu
  niigata:   { healthRate: 0.0921, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  toyama:    { healthRate: 0.0959, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  ishikawa:  { healthRate: 0.0970, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  fukui:     { healthRate: 0.0971, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  yamanashi: { healthRate: 0.0955, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  nagano:    { healthRate: 0.0963, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  gifu:      { healthRate: 0.0980, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  shizuoka:  { healthRate: 0.0961, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  aichi:     { healthRate: 0.0993, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  mie:       { healthRate: 0.0977, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  // Kansai
  shiga:     { healthRate: 0.0988, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  kyoto:     { healthRate: 0.0989, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  osaka:     { healthRate: 0.1013, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  hyogo:     { healthRate: 0.1012, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  nara:      { healthRate: 0.0991, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  wakayama:  { healthRate: 0.1006, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  // Chugoku
  tottori:   { healthRate: 0.0986, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  shimane:   { healthRate: 0.0994, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  okayama:   { healthRate: 0.1005, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  hiroshima: { healthRate: 0.0978, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  yamaguchi: { healthRate: 0.1015, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  // Shikoku
  tokushima: { healthRate: 0.1024, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  kagawa:    { healthRate: 0.1002, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  ehime:     { healthRate: 0.0998, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  kochi:     { healthRate: 0.1005, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  // Kyushu / Okinawa
  fukuoka:   { healthRate: 0.1011, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  saga:      { healthRate: 0.1055, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  nagasaki:  { healthRate: 0.1006, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  kumamoto:  { healthRate: 0.1008, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  oita:      { healthRate: 0.1008, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  miyazaki:  { healthRate: 0.0977, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  kagoshima: { healthRate: 0.1013, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
  okinawa:   { healthRate: 0.0944, longTermCareRate: LONG_TERM_CARE_RATE_FY2026 },
};

/** Age range eligible for 介護保険 (long-term care insurance) contributions. */
export const LONG_TERM_CARE_AGE_MIN = 40;
export const LONG_TERM_CARE_AGE_MAX = 64;

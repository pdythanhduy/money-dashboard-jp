/**
 * 住民税 (resident tax) — per-prefecture rate set.
 *
 * All 8 supported prefectures currently use the standard ¥5,000 均等割
 * (¥1,000 都道府県 + ¥3,000 市町村 + ¥1,000 森林環境税). Most use the
 * standard 10% 所得割 (4 % + 6 %).
 *
 * The `incomeRate` and `perCapita` fields exist so we can override later
 * — e.g. 神奈川県 adds ¥300 水源環境税 to its 均等割, and a handful of
 * 都道府県 use 11% combined 所得割 historically (rare, mostly returning
 * to 10% by FY2025).
 *
 * @see https://www.tax.metro.tokyo.lg.jp/kazei/kojin_ju.html
 */

import type { Prefecture } from '@/types/tax';

export interface ResidentTaxRate {
  /** 所得割率 (combined 都道府県 + 市町村). */
  incomeRate: number;
  /** 均等割 annual yen (includes 森林環境税). */
  perCapita: number;
}

const STANDARD: ResidentTaxRate = {
  incomeRate: 0.10,
  perCapita: 5_000,
};

/**
 * All 47 prefectures use the STANDARD 10% 所得割 + ¥5,000 均等割 (incl
 * 森林環境税) as their nominal rate set per 地方税法. A few prefectures
 * collect a small environmental surcharge added to 均等割:
 *   - 神奈川県: +¥300 水源環境税 → ¥5,300 (not yet modeled here)
 *   - 宮城県, 福島県, 岩手県: +¥1,200/¥1,000/¥500 復興/環境系 surcharges
 *   - 兵庫県: +¥800 環境税, etc.
 *
 * Modeled as STANDARD for now since the surcharges are small relative to
 * a typical user's tax bill (<0.5%) and adding per-prefecture overrides
 * complicates calc verification. Re-visit if accuracy demands it.
 */
export const RESIDENT_TAX_RATES: Readonly<Record<Prefecture, ResidentTaxRate>> = {
  hokkaido:  STANDARD,
  aomori:    STANDARD,
  iwate:     STANDARD,
  miyagi:    STANDARD,
  akita:     STANDARD,
  yamagata:  STANDARD,
  fukushima: STANDARD,
  ibaraki:   STANDARD,
  tochigi:   STANDARD,
  gunma:     STANDARD,
  saitama:   STANDARD,
  chiba:     STANDARD,
  tokyo:     STANDARD,
  kanagawa:  STANDARD,
  niigata:   STANDARD,
  toyama:    STANDARD,
  ishikawa:  STANDARD,
  fukui:     STANDARD,
  yamanashi: STANDARD,
  nagano:    STANDARD,
  gifu:      STANDARD,
  shizuoka:  STANDARD,
  aichi:     STANDARD,
  mie:       STANDARD,
  shiga:     STANDARD,
  kyoto:     STANDARD,
  osaka:     STANDARD,
  hyogo:     STANDARD,
  nara:      STANDARD,
  wakayama:  STANDARD,
  tottori:   STANDARD,
  shimane:   STANDARD,
  okayama:   STANDARD,
  hiroshima: STANDARD,
  yamaguchi: STANDARD,
  tokushima: STANDARD,
  kagawa:    STANDARD,
  ehime:     STANDARD,
  kochi:     STANDARD,
  fukuoka:   STANDARD,
  saga:      STANDARD,
  nagasaki:  STANDARD,
  kumamoto:  STANDARD,
  oita:      STANDARD,
  miyazaki:  STANDARD,
  kagoshima: STANDARD,
  okinawa:   STANDARD,
};

/**
 * 非課税限度額 for 所得割 (single, no dependents). Below this 合計所得 the
 * 所得割 portion is fully waived.
 */
export const RESIDENT_TAX_INCOME_BASED_EXEMPTION_SINGLE = 450_000;

/**
 * 非課税限度額 for 均等割 (single, no dependents).
 */
export const RESIDENT_TAX_PER_CAPITA_EXEMPTION_SINGLE = 450_000;

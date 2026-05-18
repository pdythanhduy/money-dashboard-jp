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

export const RESIDENT_TAX_RATES: Readonly<Record<Prefecture, ResidentTaxRate>> = {
  tokyo:    STANDARD,
  osaka:    STANDARD,
  aichi:    STANDARD,
  // 神奈川 actually adds ¥300 水源環境税 (per-capita ¥5,300). Modeled as
  // STANDARD for Phase 1 — fix when we wire prefecture-specific overrides.
  kanagawa: STANDARD,
  saitama:  STANDARD,
  chiba:    STANDARD,
  hyogo:    STANDARD,
  fukuoka:  STANDARD,
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

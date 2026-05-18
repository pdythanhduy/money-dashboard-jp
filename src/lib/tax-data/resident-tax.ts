/**
 * 住民税 (resident tax) constants — Tokyo 23-ku model, used as default for
 * all prefectures in Phase 1. Most prefectures use the standard 10% 所得割 +
 * ¥5,000 均等割; minor regional surcharges (e.g. 神奈川県 ¥300 水源環境税)
 * are not modeled.
 *
 * @see https://www.tax.metro.tokyo.lg.jp/kazei/kojin_ju.html
 */

/** 所得割率 — combined 都道府県民税 + 区市町村民税. */
export const RESIDENT_TAX_INCOME_RATE = 0.10;

/**
 * 均等割 annual amount, includes ¥1,000 森林環境税 (national surcharge
 * collected via 住民税 since 令和6年度).
 *
 * Breakdown: 都民税 ¥1,000 + 区市町村民税 ¥3,000 + 森林環境税 ¥1,000.
 */
export const RESIDENT_TAX_PER_CAPITA = 5_000;

/**
 * 非課税限度額 for 所得割 (single, no dependents, 23区).
 * Below this 合計所得 the 所得割 portion is fully waived.
 */
export const RESIDENT_TAX_INCOME_BASED_EXEMPTION_SINGLE = 450_000;

/**
 * 非課税限度額 for 均等割 (single, no dependents, 23区). 均等割 is also
 * waived under this threshold (overlapping with 所得割 exemption).
 */
export const RESIDENT_TAX_PER_CAPITA_EXEMPTION_SINGLE = 450_000;

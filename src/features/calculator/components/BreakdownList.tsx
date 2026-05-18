/**
 * Phase 5B — BreakdownList
 *
 * Detailed line-by-line breakdown of the calculation: every intermediate
 * value from gross income down to take-home. Useful for trust-building
 * and for power-users who want to verify the math.
 *
 * TODO(Phase 5B):
 * - Section 1 (税金): gross → 給与所得控除 → 給与所得 → 合計所得 →
 *   基礎控除 → 社会保険料控除 → spouse/dependent/student deductions →
 *   課税所得 → bracket × rate − deduction → 復興税 → 所得税 final
 * - Section 2 (住民税): same flow with 住民税 deduction amounts
 * - Section 3 (社会保険): monthly income → 標準報酬月額 grade →
 *   健保 / 介護 / 厚年 monthly → ×12 annual
 * - Source links at section bottoms (NTA URLs)
 * - Each row: label left, value right (right-aligned ¥, comma-grouped)
 * - Reads from `useCalculatorStore(s => s.result.breakdown)`
 */

export function BreakdownList() {
  return null;
}

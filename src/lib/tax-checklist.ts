/**
 * Yearly Japan-life tax/admin checklist.
 *
 * Purely a self-reminder: "have I checked X?". The app does NOT file
 * taxes, give legal/tax advice, or claim correctness — every item maps
 * to an action the user takes outside the app (consulting 源泉徴収票,
 * submitting 確定申告, etc.).
 *
 * Item IDs are stable across years so the store can map progress per
 * year × item.
 */

export type TaxChecklistItemId =
  | 'gensen'
  | 'kakutei'
  | 'furusato'
  | 'medical'
  | 'dependent';

export const TAX_CHECKLIST_ITEM_IDS: readonly TaxChecklistItemId[] = [
  'gensen',
  'kakutei',
  'furusato',
  'medical',
  'dependent',
];

/**
 * Default items for a given fiscal year. Returns a fresh array so callers
 * can attach mutable per-item state (checked, note) without affecting the
 * canonical list.
 *
 * Year is purely a label here — items don't currently change between
 * years. The seam exists so future-year-specific items (e.g. one-off
 * 定額減税 confirmation) can be added without breaking the store shape.
 */
export function defaultChecklistItems(_year: number): TaxChecklistItemId[] {
  return [...TAX_CHECKLIST_ITEM_IDS];
}

/**
 * Returns true when "now" sits inside the reminder window for `taxYear`'s
 * checklist — January 1 through March 15 (Japan's 確定申告 filing window).
 * Outside that window the Dashboard hides the reminder card even when
 * the checklist is incomplete.
 */
export function isTaxSeason(now: Date): boolean {
  const month = now.getMonth(); // 0 = Jan
  const day = now.getDate();
  // Jan + Feb: always in season.
  if (month === 0 || month === 1) return true;
  // March 1–15: still in season.
  if (month === 2 && day <= 15) return true;
  return false;
}

/**
 * `taxYear` for a given moment in time. Japan's tax year is the
 * calendar year; the 確定申告 filed Jan–Mar reports the PREVIOUS calendar
 * year. So in January 2027, the "current year's checklist" is for 2026.
 */
export function currentTaxYear(now: Date): number {
  // Up to Mar 15: previous calendar year (still filing the last year).
  if (isTaxSeason(now)) return now.getFullYear() - 1;
  // After Mar 15: this calendar year (preparing for next Jan).
  return now.getFullYear();
}

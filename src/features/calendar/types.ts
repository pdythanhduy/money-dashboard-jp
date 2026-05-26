/**
 * Calendar domain types — events aggregated from the rest of the app plus
 * preset JP fiscal/tax events and national holidays.
 *
 * Stored data still lives in its own feature store; calendar just READS.
 */

export type CalendarEventKind =
  // Aggregated from user data:
  | 'kakeibo_expense'
  | 'medical_expense'
  | 'furusato_donation'
  | 'remittance'
  | 'trip'
  | 'document_expiry'
  | 'recurring_expense'
  | 'payday'
  // Preset, from `jp-fiscal-events.ts`:
  | 'tax_filing'         // 確定申告 deadline
  | 'resident_tax'       // 住民税 quarterly payment
  | 'year_end_adjustment'// 年末調整
  | 'bonus_typical';     // typical 賞与 month (July / December)

/** A single dated event displayed on the calendar grid. */
export interface CalendarEvent {
  /** Stable id within `date` (`${kind}-${sourceId}`). Used as React key. */
  id: string;
  /** ISO date `YYYY-MM-DD` (local). Multi-day events emit one event per day. */
  date: string;
  kind: CalendarEventKind;
  /** Short label shown in the day-detail list. i18n at render time, not here. */
  labelKey: string;
  /** Optional dynamic params for the i18n label. */
  labelParams?: Readonly<Record<string, string | number>>;
  /** Optional amount in yen. Negative = outflow, positive = inflow / scheduled income. */
  amountJpy?: number;
}

/** A JP national holiday. Renders the day cell with `colors.danger` text. */
export interface JpHoliday {
  /** ISO date `YYYY-MM-DD`. */
  date: string;
  /** Official Japanese name (e.g. `元日`, `成人の日`). Always shown verbatim. */
  nameJa: string;
  /** Vietnamese gloss, shown in the day-detail modal. */
  nameVi: string;
  /** `true` when the date is a 振替休日 (substitute holiday). */
  isSubstitute?: boolean;
}

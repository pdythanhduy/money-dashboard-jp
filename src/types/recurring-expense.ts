/**
 * Recurring kakeibo expense template (rent, utilities, subscriptions, etc.).
 *
 * One row = "every month on day N, log an expense for ¥amount under
 * `category` with label `name`." The store doesn't auto-fire — the
 * `useRecurringSync` hook runs `findDueRecurrings` on mount + on date
 * change and dispatches `addEntry` for each due row.
 *
 * Idempotency is per-month: `lastGeneratedYearMonth` is set after a
 * successful generation, so re-launching the app the same month does NOT
 * duplicate the entry.
 */

import type { ExpenseCategory } from '@/lib/kakeibo-math';

export interface RecurringExpense {
  id: string;
  /** Human label rendered on auto-generated entries (e.g. "Tiền điện", "Wifi Softbank"). */
  name: string;
  /** Yen, integer, > 0. */
  amount: number;
  category: ExpenseCategory;
  /** 1–31. Clamped to the last day of the month when month is shorter. */
  dayOfMonth: number;
  note?: string;
  /** User can pause without deleting (e.g. cancelled subscription temp). */
  active: boolean;
  createdAt: string;
  /** "YYYY-MM" of the month an auto-entry was last generated from this row. */
  lastGeneratedYearMonth?: string;
}

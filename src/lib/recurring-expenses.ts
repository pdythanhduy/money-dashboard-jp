/**
 * Pure helpers for the recurring-expense → entry materialization step.
 *
 * `findDueRecurrings(list, now)` returns the recurrings that should fire
 * an entry "right now": active + the dayOfMonth has been reached this
 * month + we haven't already generated an entry for them this month.
 *
 * `isoFromDayOfMonth(year, month, day)` clamps day to the last valid day
 * of the month — so `dayOfMonth=31` in February produces Feb 28/29 rather
 * than spilling into March.
 */

import type { RecurringExpense } from '@/types/recurring-expense';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatYearMonth(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

function getDaysInMonth(year: number, month1to12: number): number {
  // `new Date(y, m, 0)` gives last day of month m (1-based) for the given year.
  return new Date(year, month1to12, 0).getDate();
}

export function isoFromDayOfMonth(year: number, month1to12: number, day: number): string {
  const last = getDaysInMonth(year, month1to12);
  const clamped = Math.min(Math.max(1, day), last);
  return `${year}-${pad2(month1to12)}-${pad2(clamped)}`;
}

export function findDueRecurrings(
  recurrings: readonly RecurringExpense[],
  now: Date,
): RecurringExpense[] {
  const ym = formatYearMonth(now);
  const today = now.getDate();
  const monthEnd = getDaysInMonth(now.getFullYear(), now.getMonth() + 1);
  return recurrings.filter((r) => {
    if (!r.active) return false;
    if (r.lastGeneratedYearMonth === ym) return false;
    // Clamp the recurring's dayOfMonth to month end so day=31 in a
    // 30-day month still fires on day 30.
    const triggerDay = Math.min(Math.max(1, r.dayOfMonth), monthEnd);
    return today >= triggerDay;
  });
}

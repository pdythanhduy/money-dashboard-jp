/**
 * Pure dashboard calculation. No React, no store, no I/O — safe to call
 * from tests with a fixed `now` and a fixed `result`. The `useDashboardData`
 * hook is a thin wrapper that wires this to the Zustand store.
 */

import {
  daysBetween,
  getDayOfMonth,
  getDaysInMonth,
  getDaysUntilPayday,
  getGreeting,
  type Greeting,
} from '@/lib/date-helpers';
import type { TakeHomeResult } from '@/types/tax';

export const DEFAULT_PAYDAY = 25;

export interface UpcomingReminder {
  /** i18n key under `dashboard.upcoming.items.*` */
  i18nKey: string;
  date: Date;
  daysLeft: number;
}

export interface DashboardData {
  hasData: boolean;
  greeting: Greeting;
  today: Date;
  daysUntilPayday: number;
  isPayday: boolean;
  /** Proportional take-home from day 1 through today (yen, floored). */
  proportionalTakeHome: number;
  /** Full monthly take-home from the stored calculation (yen). */
  monthlyTakeHome: number;
  proportionalTax: number;
  proportionalInsurance: number;
  /** Take-home / gross ratio, 0..1. */
  retentionRate: number;
  averageDaily: number;
  daysInMonth: number;
  daysPassed: number;
  upcomingReminders: readonly UpcomingReminder[];
}

const EMPTY: Omit<DashboardData, 'today' | 'greeting' | 'daysUntilPayday' | 'isPayday' | 'daysInMonth' | 'daysPassed' | 'upcomingReminders'> = {
  hasData: false,
  proportionalTakeHome: 0,
  monthlyTakeHome: 0,
  proportionalTax: 0,
  proportionalInsurance: 0,
  retentionRate: 0,
  averageDaily: 0,
};

/**
 * Real reminder inputs the dashboard hook resolves from stores.
 * Pure logic — no store reads here — so tests can drive both paths.
 */
export interface ReminderSources {
  /** Pre-mapped real document reminders from useDocumentsStore + document-reminders lib. */
  documentReminders?: readonly { i18nKey: string; date: Date; daysLeft: number }[];
  /** True if user has a Calculator result on file — gates the 確定申告 system reminder. */
  hasKakuteiContext?: boolean;
}

export function computeDashboardData(
  now: Date,
  result: TakeHomeResult | null,
  payday: number = DEFAULT_PAYDAY,
  reminders: ReminderSources = {},
): DashboardData {
  const greeting = getGreeting(now);
  const daysUntilPayday = getDaysUntilPayday(now, payday);
  const isPayday = daysUntilPayday === 0;
  const daysInMonth = getDaysInMonth(now);
  const daysPassed = getDayOfMonth(now);
  const upcomingReminders = computeUpcomingReminders(now, reminders);

  if (!result) {
    return {
      ...EMPTY,
      today: now,
      greeting,
      daysUntilPayday,
      isPayday,
      daysInMonth,
      daysPassed,
      upcomingReminders,
    };
  }

  const monthlyTakeHome = result.takeHomeMonthly;
  const ratio = daysPassed / daysInMonth;
  const proportionalTakeHome = Math.floor(monthlyTakeHome * ratio);

  const monthlyTax = Math.floor((result.incomeTax + result.residentTax) / 12);
  const proportionalTax = Math.floor(monthlyTax * ratio);

  const monthlyInsurance = Math.floor(
    (result.healthInsurance +
      result.pension +
      result.employmentInsurance +
      result.nationalHealthInsurance +
      result.nationalPension) /
      12,
  );
  const proportionalInsurance = Math.floor(monthlyInsurance * ratio);

  const retentionRate = result.grossAnnual > 0 ? result.takeHomeAnnual / result.grossAnnual : 0;
  const averageDaily = Math.floor(monthlyTakeHome / daysInMonth);

  return {
    hasData: true,
    today: now,
    greeting,
    daysUntilPayday,
    isPayday,
    proportionalTakeHome,
    monthlyTakeHome,
    proportionalTax,
    proportionalInsurance,
    retentionRate,
    averageDaily,
    daysInMonth,
    daysPassed,
    upcomingReminders,
  };
}

const KAKUTEI_WINDOW_DAYS = 90;

/**
 * Surfaced reminders are 100% real:
 *
 *   1. Document reminders — pre-mapped from `useDocumentsStore` via
 *      `computeDocumentReminders` (separate pure lib in `@/lib/document-reminders`).
 *      Empty list when the user has no documents.
 *
 *   2. 確定申告 — system-level "annual tax filing deadline" cue. Surfaced
 *      ONLY when (a) user has a Calculator result on file (`hasKakuteiContext`)
 *      AND (b) the next March 15 is within 90 days. Outside that window it's
 *      noise — kept out of the list intentionally.
 *
 * No placeholder zairyuCard / Dec 31 — those required user data which we
 * pull through the documents path.
 */
function computeUpcomingReminders(
  now: Date,
  reminders: ReminderSources,
): readonly UpcomingReminder[] {
  const out: UpcomingReminder[] = [];

  if (reminders.documentReminders && reminders.documentReminders.length > 0) {
    for (const r of reminders.documentReminders) {
      out.push({ i18nKey: r.i18nKey, date: r.date, daysLeft: r.daysLeft });
    }
  }

  if (reminders.hasKakuteiContext) {
    const date = nextKakuteiShinkokuDeadline(now);
    const daysLeft = daysBetween(now, date);
    if (daysLeft >= 0 && daysLeft <= KAKUTEI_WINDOW_DAYS) {
      out.push({ i18nKey: 'kakuteiShinkoku', date, daysLeft });
    }
  }

  return out.sort((a, b) => a.daysLeft - b.daysLeft);
}

function nextKakuteiShinkokuDeadline(now: Date): Date {
  // Filing window Feb 16 — March 15. March 15 is the hard deadline.
  const thisYear = new Date(now.getFullYear(), 2, 15);
  if (daysBetween(now, thisYear) >= 0) return thisYear;
  return new Date(now.getFullYear() + 1, 2, 15);
}

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

export interface ReminderSources {
  /** ISO date of user's zairyu card expiry; null if not added. */
  zairyuCardExpiry?: string | null;
  /** Whether user has any kakutei wizard draft in progress / has run Calculator. */
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

/**
 * Surface a reminder ONLY when the user has actual data backing it.
 *
 * - 確定申告 (kakuteiShinkoku): only within 90 days of next March 15 deadline,
 *   AND only if the user has run the Calculator at least once (otherwise the
 *   wizard has nothing to summarize).
 * - 在留カード (zairyuCard): only if user added one via Documents tab with an
 *   expiry date; surface when within 90 days of that expiry.
 *
 * Past-dated reminders are dropped.
 */
function computeUpcomingReminders(
  now: Date,
  reminders: ReminderSources,
): readonly UpcomingReminder[] {
  const out: Array<{ i18nKey: string; date: Date; daysLeft: number }> = [];

  if (reminders.hasKakuteiContext) {
    const date = nextKakuteiShinkokuDeadline(now);
    const daysLeft = daysBetween(now, date);
    if (daysLeft >= 0 && daysLeft <= 90) {
      out.push({ i18nKey: 'kakuteiShinkoku', date, daysLeft });
    }
  }

  if (reminders.zairyuCardExpiry) {
    const date = new Date(reminders.zairyuCardExpiry);
    if (!Number.isNaN(date.getTime())) {
      const daysLeft = daysBetween(now, date);
      if (daysLeft >= 0 && daysLeft <= 90) {
        out.push({ i18nKey: 'zairyuCard', date, daysLeft });
      }
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

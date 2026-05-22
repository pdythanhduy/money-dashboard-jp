/**
 * Today-anchored kakeibo summary for the Dashboard hero card.
 *
 * Pure function. No React. Tests pin `now` to specific dates.
 *
 * Semantics:
 *   monthBudgetTotal = sum of every category budget the user has set
 *   remainingThisMonth = monthBudgetTotal − monthSpent (can be negative)
 *   dailyRemainingAvg  = remainingThisMonth / daysRemainingInMonth (incl. today)
 *   todayVsAvg:
 *     'no_budget' when no budgets set (monthBudgetTotal === 0)
 *     'under' when todaySpent ≤ dailyRemainingAvg
 *     'over' when todaySpent > dailyRemainingAvg
 */

import { filterEntriesByMonth, type BudgetTarget, type KakeiboEntry } from '@/lib/kakeibo-math';

export type TodayVsAvg = 'under' | 'over' | 'no_budget';

export interface DailySpendingResult {
  todaySpent: number;
  monthSpent: number;
  monthBudgetTotal: number;
  remainingThisMonth: number;
  daysRemainingInMonth: number;
  /** Floor of `remainingThisMonth / daysRemainingInMonth`. 0 when no budget. */
  dailyRemainingAvg: number;
  todayVsAvg: TodayVsAvg;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatYearMonth(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
}

function formatIsoDate(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function getDaysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

export function computeDailySpending(
  entries: readonly KakeiboEntry[],
  budgets: readonly BudgetTarget[],
  now: Date,
): DailySpendingResult {
  const ym = formatYearMonth(now);
  const today = formatIsoDate(now);

  const inMonth = filterEntriesByMonth(entries as KakeiboEntry[], ym);
  const monthSpent = inMonth.reduce((sum, e) => sum + e.amount, 0);
  const todaySpent = inMonth.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);

  const monthBudgetTotal = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
  const remainingThisMonth = monthBudgetTotal - monthSpent;

  const daysInMonth = getDaysInMonth(now.getFullYear(), now.getMonth() + 1);
  const daysRemainingInMonth = Math.max(1, daysInMonth - now.getDate() + 1);

  let dailyRemainingAvg = 0;
  let todayVsAvg: TodayVsAvg = 'no_budget';
  if (monthBudgetTotal > 0) {
    dailyRemainingAvg = Math.floor(remainingThisMonth / daysRemainingInMonth);
    todayVsAvg = todaySpent > dailyRemainingAvg ? 'over' : 'under';
  }

  return {
    todaySpent,
    monthSpent,
    monthBudgetTotal,
    remainingThisMonth,
    daysRemainingInMonth,
    dailyRemainingAvg,
    todayVsAvg,
  };
}

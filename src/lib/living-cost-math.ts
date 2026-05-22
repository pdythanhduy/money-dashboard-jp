/**
 * Salary-anchored living-cost computation for the Dashboard hero card.
 *
 * `computeLivingCost` is the salary-first variant: when the user has a
 * `takeHomeMonthly` from the Calculator, we subtract active fixed costs
 * (recurrings) + variable spend and surface the per-day allowance the
 * user can still afford this month.
 *
 * `computeDailySpending` in `./daily-spending` remains the
 * budget-based fallback (sum of category budgets). The dashboard
 * picks whichever is most informative — see `chooseDailyCostMode`.
 *
 * Status thresholds (per-day allowance, yen):
 *   safe    ≥ 2,500
 *   warning ≥ 1,000
 *   danger  <  1,000  OR  remainingThisMonth < 0
 */

import { filterEntriesByMonth, type KakeiboEntry } from '@/lib/kakeibo-math';
import type { RecurringExpense } from '@/types/recurring-expense';

export type LivingCostStatus = 'safe' | 'warning' | 'danger';

export const SAFE_DAILY_THRESHOLD = 2_500;
export const WARNING_DAILY_THRESHOLD = 1_000;

export interface LivingCostInput {
  takeHomeMonthly: number;
  entries: readonly KakeiboEntry[];
  recurrings: readonly RecurringExpense[];
  now: Date;
}

export interface LivingCostResult {
  takeHomeMonthly: number;
  /** Sum of active recurrings (treats them as fixed monthly cost). */
  totalFixedCost: number;
  /** Variable kakeibo spend so far this month (excludes recurrings already posted? See note). */
  totalVariableSpent: number;
  /** totalFixedCost + totalVariableSpent. */
  totalSpent: number;
  /** Today's variable spend (entries with date === today). */
  todaySpent: number;
  /** takeHomeMonthly − totalFixedCost − totalVariableSpent. May be negative. */
  remainingThisMonth: number;
  /** Days from today through month-end (incl. today, clamped ≥ 1). */
  remainingDaysInMonth: number;
  /** floor(remainingThisMonth / remainingDaysInMonth). May be negative. */
  dailyAllowance: number;
  status: LivingCostStatus;
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

function sumActiveRecurrings(recurrings: readonly RecurringExpense[]): number {
  return recurrings.reduce((sum, r) => (r.active ? sum + r.amount : sum), 0);
}

function statusFor(remainingThisMonth: number, dailyAllowance: number): LivingCostStatus {
  if (remainingThisMonth < 0) return 'danger';
  if (dailyAllowance < WARNING_DAILY_THRESHOLD) return 'danger';
  if (dailyAllowance < SAFE_DAILY_THRESHOLD) return 'warning';
  return 'safe';
}

export function computeLivingCost(input: LivingCostInput): LivingCostResult {
  const ym = formatYearMonth(input.now);
  const today = formatIsoDate(input.now);

  const inMonth = filterEntriesByMonth(input.entries as KakeiboEntry[], ym);
  const totalVariableSpent = inMonth.reduce((sum, e) => sum + e.amount, 0);
  const todaySpent = inMonth.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);

  const totalFixedCost = sumActiveRecurrings(input.recurrings);
  const totalSpent = totalFixedCost + totalVariableSpent;
  const remainingThisMonth = input.takeHomeMonthly - totalSpent;

  const daysInMonth = getDaysInMonth(input.now.getFullYear(), input.now.getMonth() + 1);
  const remainingDaysInMonth = Math.max(1, daysInMonth - input.now.getDate() + 1);

  const dailyAllowance = Math.floor(remainingThisMonth / remainingDaysInMonth);

  return {
    takeHomeMonthly: input.takeHomeMonthly,
    totalFixedCost,
    totalVariableSpent,
    totalSpent,
    todaySpent,
    remainingThisMonth,
    remainingDaysInMonth,
    dailyAllowance,
    status: statusFor(remainingThisMonth, dailyAllowance),
  };
}

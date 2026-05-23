/**
 * One-glance "am I OK this month?" summary for the Dashboard's
 * financial-health card.
 *
 * Composes the existing salary-anchored and budget-anchored helpers
 * (computeLivingCost, buildMonthlyReport, computeAllBudgetStatuses) and
 * returns one normalized shape the card renders without further math.
 *
 * Pure function. No React, no I/O.
 *
 * Modes:
 *   'salary'    user has takeHomeMonthly > 0 → salary-anchored status,
 *               dailyAllowance, remainingThisMonth all populated.
 *   'budget'    no salary but at least one budget is set → fall back to
 *               sum-of-budgets math; status follows the daily-spending
 *               todayVsAvg flag.
 *   'no_income' no salary AND no budgets → no status (caller hides the
 *               card unless there's other content like top category or
 *               recurrings worth showing).
 */

import { computeDailySpending } from '@/lib/daily-spending';
import {
  buildMonthlyReport,
  computeAllBudgetStatuses,
  filterEntriesByMonth,
  type BudgetTarget,
  type ExpenseCategory,
  type KakeiboEntry,
} from '@/lib/kakeibo-math';
import { computeLivingCost, type LivingCostStatus } from '@/lib/living-cost-math';
import type { RecurringExpense } from '@/types/recurring-expense';

export type FinancialHealthStatus = LivingCostStatus | 'no_income';

export interface FinancialHealthInput {
  takeHomeMonthly?: number;
  entries: readonly KakeiboEntry[];
  recurrings: readonly RecurringExpense[];
  budgets: readonly BudgetTarget[];
  yearMonth: string;
  now?: Date;
}

export interface FinancialHealthTopCategory {
  category: ExpenseCategory;
  amount: number;
  /** 0..1 — share of this month's variable spend. */
  percent: number;
}

export interface FinancialHealthBudgetSummary {
  total: number;
  safe: number;
  warning: number;
  over: number;
}

export interface FinancialHealthResult {
  mode: 'salary' | 'budget' | 'no_income';
  status: FinancialHealthStatus;
  todaySpent: number;
  /** Only set in salary mode. */
  remainingThisMonth?: number;
  /** Only set in salary or budget mode (whichever produced it). */
  dailyAllowance?: number;
  /** Sum of active recurrings. 0 if none. */
  fixedCostTotal: number;
  /** Only set when takeHomeMonthly > 0 AND fixedCostTotal > 0. 0..1+. */
  fixedCostBurdenPercent?: number;
  /** Only set when month has at least one entry. */
  topCategory?: FinancialHealthTopCategory;
  /** Only set when budgets.length > 0. */
  budgetSummary?: FinancialHealthBudgetSummary;
  /** True when the result has nothing worth rendering — caller hides the card. */
  isEmpty: boolean;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatIsoDate(now: Date): string {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

function sumActiveRecurrings(recurrings: readonly RecurringExpense[]): number {
  return recurrings.reduce((sum, r) => (r.active ? sum + r.amount : sum), 0);
}

export function computeFinancialHealth(input: FinancialHealthInput): FinancialHealthResult {
  const now = input.now ?? new Date();
  const today = formatIsoDate(now);
  const takeHome = input.takeHomeMonthly ?? 0;

  const inMonth = filterEntriesByMonth(input.entries as KakeiboEntry[], input.yearMonth);
  const todaySpent = inMonth.filter((e) => e.date === today).reduce((s, e) => s + e.amount, 0);

  const fixedCostTotal = sumActiveRecurrings(input.recurrings);
  const monthReport = buildMonthlyReport(input.entries as KakeiboEntry[], input.yearMonth);

  // Mode selection: salary > budget > no_income.
  let mode: FinancialHealthResult['mode'];
  let status: FinancialHealthStatus;
  let remainingThisMonth: number | undefined;
  let dailyAllowance: number | undefined;

  if (takeHome > 0) {
    mode = 'salary';
    const lc = computeLivingCost({
      takeHomeMonthly: takeHome,
      entries: input.entries,
      recurrings: input.recurrings,
      now,
    });
    status = lc.status;
    remainingThisMonth = lc.remainingThisMonth;
    dailyAllowance = lc.dailyAllowance;
  } else if (input.budgets.length > 0) {
    mode = 'budget';
    const bg = computeDailySpending(input.entries, input.budgets, now);
    dailyAllowance = bg.dailyRemainingAvg;
    status =
      bg.todayVsAvg === 'no_budget'
        ? 'no_income'
        : bg.todayVsAvg === 'over'
          ? 'danger'
          : 'safe';
  } else {
    mode = 'no_income';
    status = 'no_income';
  }

  const result: FinancialHealthResult = {
    mode,
    status,
    todaySpent,
    fixedCostTotal,
    isEmpty: false,
  };
  if (remainingThisMonth !== undefined) result.remainingThisMonth = remainingThisMonth;
  if (dailyAllowance !== undefined) result.dailyAllowance = dailyAllowance;

  if (takeHome > 0 && fixedCostTotal > 0) {
    result.fixedCostBurdenPercent = fixedCostTotal / takeHome;
  }

  if (monthReport.totalSpent > 0 && monthReport.byCategory.length > 0) {
    const top = monthReport.byCategory[0]!;
    result.topCategory = {
      category: top.category,
      amount: top.total,
      percent: top.percentOfMonth,
    };
  }

  if (input.budgets.length > 0) {
    const statuses = computeAllBudgetStatuses(
      input.entries as KakeiboEntry[],
      input.yearMonth,
      input.budgets as BudgetTarget[],
    );
    let safe = 0;
    let warning = 0;
    let over = 0;
    for (const s of statuses) {
      if (s.severity === 'safe') safe += 1;
      else if (s.severity === 'warning') warning += 1;
      else over += 1;
    }
    result.budgetSummary = { total: statuses.length, safe, warning, over };
  }

  // Empty = nothing meaningful to show. Card should be hidden by the parent.
  result.isEmpty =
    mode === 'no_income' &&
    fixedCostTotal === 0 &&
    monthReport.totalSpent === 0 &&
    input.budgets.length === 0;

  return result;
}

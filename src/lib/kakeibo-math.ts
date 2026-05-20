/**
 * Pure 家計簿 math: monthly reports, budget thresholds, month-over-month
 * deltas, and a 50/30/20-inspired ratio table for auto-suggesting budgets
 * from the user's take-home. No React, no SQLite, no I/O.
 *
 * Categories are a closed enum (UI maps each to an icon + i18n label).
 * `savings` and `remittance` live alongside spend categories on purpose:
 * Vietnamese users in Japan frequently treat 仕送り as a fixed line item,
 * and auto-savings transfers ARE money leaving the take-home pool — even
 * if they're not "spent."
 */

export type ExpenseCategory =
  | 'rent'
  | 'food'
  | 'utilities'
  | 'communication'
  | 'transport'
  | 'entertainment'
  | 'health'
  | 'shopping'
  | 'education'
  | 'savings'
  | 'remittance'
  | 'other';

export const ALL_EXPENSE_CATEGORIES: readonly ExpenseCategory[] = [
  'rent',
  'food',
  'utilities',
  'communication',
  'transport',
  'entertainment',
  'health',
  'shopping',
  'education',
  'savings',
  'remittance',
  'other',
];

export interface KakeiboEntry {
  id: string;
  /** ISO date, e.g. "2026-05-12". */
  date: string;
  /** ¥, positive integer. */
  amount: number;
  category: ExpenseCategory;
  /** Free-text vendor / note tag (Lawson, JR pass, ...). */
  label?: string;
  note?: string;
  /** User flag — does NOT auto-repeat. We re-enter monthly to keep state simple. */
  isRecurring?: boolean;
}

export interface CategoryTotals {
  category: ExpenseCategory;
  total: number;
  count: number;
  /** Share of the month's totalSpent — 0..1. */
  percentOfMonth: number;
}

export interface MonthlyReport {
  /** "YYYY-MM". */
  yearMonth: string;
  totalSpent: number;
  totalIncome?: number;
  /** totalIncome - totalSpent. Negative = deficit. */
  surplus?: number;
  /** Sorted DESC by total. */
  byCategory: CategoryTotals[];
  entryCount: number;
}

export interface BudgetTarget {
  category: ExpenseCategory;
  monthlyLimit: number;
}

export interface BudgetStatus {
  category: ExpenseCategory;
  spent: number;
  limit: number;
  remaining: number;
  /** spent / limit. May exceed 1. Infinity when limit=0 (treated as 'over'). */
  percentUsed: number;
  severity: 'safe' | 'warning' | 'over';
}

/**
 * 50/30/20-inspired starting point tuned for VN-in-JP renters.
 * Sum is 1.00 exactly so suggestBudgetsFromIncome doesn't over/under-allocate.
 */
export const DEFAULT_BUDGET_RATIOS: Record<ExpenseCategory, number> = {
  rent: 0.30,
  food: 0.15,
  utilities: 0.05,
  communication: 0.03,
  transport: 0.05,
  entertainment: 0.05,
  health: 0.03,
  shopping: 0.05,
  education: 0.02,
  savings: 0.20,
  remittance: 0.05,
  other: 0.02,
};

export function filterEntriesByMonth(entries: KakeiboEntry[], yearMonth: string): KakeiboEntry[] {
  return entries.filter((e) => e.date.startsWith(yearMonth));
}

export function buildMonthlyReport(
  entries: KakeiboEntry[],
  yearMonth: string,
  totalIncome?: number,
): MonthlyReport {
  const inMonth = filterEntriesByMonth(entries, yearMonth);
  const totalSpent = inMonth.reduce((sum, e) => sum + e.amount, 0);

  const buckets = new Map<ExpenseCategory, { total: number; count: number }>();
  for (const e of inMonth) {
    const cur = buckets.get(e.category) ?? { total: 0, count: 0 };
    buckets.set(e.category, { total: cur.total + e.amount, count: cur.count + 1 });
  }

  const byCategory: CategoryTotals[] = Array.from(buckets.entries())
    .map(([category, v]) => ({
      category,
      total: v.total,
      count: v.count,
      percentOfMonth: totalSpent > 0 ? v.total / totalSpent : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const report: MonthlyReport = {
    yearMonth,
    totalSpent,
    byCategory,
    entryCount: inMonth.length,
  };
  if (typeof totalIncome === 'number') {
    report.totalIncome = totalIncome;
    report.surplus = totalIncome - totalSpent;
  }
  return report;
}

export function computeBudgetStatus(
  spent: number,
  limit: number,
  category: ExpenseCategory,
): BudgetStatus {
  // limit=0 means "no budget set, but user asked for status" — treat as over.
  if (limit <= 0) {
    return {
      category,
      spent,
      limit,
      remaining: -spent,
      percentUsed: spent > 0 ? Number.POSITIVE_INFINITY : 0,
      severity: spent > 0 ? 'over' : 'safe',
    };
  }
  const percentUsed = spent / limit;
  let severity: BudgetStatus['severity'];
  if (percentUsed > 1) severity = 'over';
  else if (percentUsed >= 0.8) severity = 'warning';
  else severity = 'safe';
  return {
    category,
    spent,
    limit,
    remaining: limit - spent,
    percentUsed,
    severity,
  };
}

export function computeAllBudgetStatuses(
  entries: KakeiboEntry[],
  yearMonth: string,
  budgets: BudgetTarget[],
): BudgetStatus[] {
  const inMonth = filterEntriesByMonth(entries, yearMonth);
  const spentByCat = new Map<ExpenseCategory, number>();
  for (const e of inMonth) {
    spentByCat.set(e.category, (spentByCat.get(e.category) ?? 0) + e.amount);
  }
  return budgets.map((b) =>
    computeBudgetStatus(spentByCat.get(b.category) ?? 0, b.monthlyLimit, b.category),
  );
}

export interface MonthComparison {
  totalDelta: number;
  /** current/prev - 1. Infinity when prev=0 and curr>0. */
  totalDeltaPercent: number;
  byCategoryDelta: Array<{
    category: ExpenseCategory;
    delta: number;
    deltaPercent: number;
  }>;
}

export function compareMonths(prev: MonthlyReport, current: MonthlyReport): MonthComparison {
  const totalDelta = current.totalSpent - prev.totalSpent;
  const totalDeltaPercent =
    prev.totalSpent > 0
      ? totalDelta / prev.totalSpent
      : current.totalSpent > 0
        ? Number.POSITIVE_INFINITY
        : 0;

  const prevByCat = new Map(prev.byCategory.map((c) => [c.category, c.total]));
  const currByCat = new Map(current.byCategory.map((c) => [c.category, c.total]));
  const cats = new Set<ExpenseCategory>([...prevByCat.keys(), ...currByCat.keys()]);

  const byCategoryDelta = Array.from(cats).map((category) => {
    const p = prevByCat.get(category) ?? 0;
    const c = currByCat.get(category) ?? 0;
    const delta = c - p;
    const deltaPercent =
      p > 0 ? delta / p : c > 0 ? Number.POSITIVE_INFINITY : 0;
    return { category, delta, deltaPercent };
  });

  return { totalDelta, totalDeltaPercent, byCategoryDelta };
}

/**
 * Map a take-home figure to a 12-row budget proposal using
 * `DEFAULT_BUDGET_RATIOS`. Floors each line to integer yen so total ≤
 * input.
 */
export function suggestBudgetsFromIncome(takeHomeMonthly: number): BudgetTarget[] {
  if (!Number.isFinite(takeHomeMonthly) || takeHomeMonthly <= 0) {
    return ALL_EXPENSE_CATEGORIES.map((category) => ({ category, monthlyLimit: 0 }));
  }
  return ALL_EXPENSE_CATEGORIES.map((category) => ({
    category,
    monthlyLimit: Math.floor(takeHomeMonthly * DEFAULT_BUDGET_RATIOS[category]),
  }));
}

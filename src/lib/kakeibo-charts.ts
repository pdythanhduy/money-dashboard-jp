/**
 * Pure chart-math + rule-based insights for the Kakeibo Charts tab.
 *
 * All functions are React-free + I/O-free. Tests pin `now` to specific
 * dates so day/month math is deterministic.
 *
 *   buildDailySpendingSeries        — one bar per day of the selected month
 *   buildMonthlySpendingSeries      — last N months, zero-filled
 *   buildCategorySpendingSeries     — category-sorted DESC with percent
 *   buildLastNDaysSpendingSeries    — sliding-window for the mini Dashboard chart
 *   buildSpendingInsights           — rule-based copy points (no AI)
 */

import {
  buildMonthlyReport,
  filterEntriesByMonth,
  type ExpenseCategory,
  type KakeiboEntry,
} from '@/lib/kakeibo-math';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function ymToParts(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map((x) => Number.parseInt(x, 10));
  return { year: y ?? 1970, month: m ?? 1 };
}

function getDaysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

function shiftYearMonth(ym: string, deltaMonths: number): string {
  const { year, month } = ymToParts(ym);
  const total = year * 12 + (month - 1) + deltaMonths;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${ny}-${pad2(nm)}`;
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ---------------------------------------------------------------------------
// 1. Daily series
// ---------------------------------------------------------------------------

export interface DailySpendingPoint {
  date: string;
  day: number;
  amount: number;
  isToday: boolean;
}

export function buildDailySpendingSeries(
  entries: readonly KakeiboEntry[],
  yearMonth: string,
  now?: Date,
): DailySpendingPoint[] {
  const { year, month } = ymToParts(yearMonth);
  const daysInMonth = getDaysInMonth(year, month);
  const todayIso = now ? isoDate(now) : null;

  const inMonth = filterEntriesByMonth(entries as KakeiboEntry[], yearMonth);
  const sumByDate = new Map<string, number>();
  for (const e of inMonth) {
    sumByDate.set(e.date, (sumByDate.get(e.date) ?? 0) + e.amount);
  }

  const out: DailySpendingPoint[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${pad2(month)}-${pad2(day)}`;
    out.push({
      date,
      day,
      amount: sumByDate.get(date) ?? 0,
      isToday: todayIso === date,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. Monthly series
// ---------------------------------------------------------------------------

export interface MonthlySpendingPoint {
  yearMonth: string;
  /** Short label e.g. "5月" / "T5". UI translates if desired. */
  label: string;
  amount: number;
}

export function buildMonthlySpendingSeries(
  entries: readonly KakeiboEntry[],
  monthsBack: number,
  now: Date,
): MonthlySpendingPoint[] {
  const currentYm = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}`;
  const out: MonthlySpendingPoint[] = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const ym = shiftYearMonth(currentYm, -i);
    const report = buildMonthlyReport(entries as KakeiboEntry[], ym);
    const { month } = ymToParts(ym);
    out.push({
      yearMonth: ym,
      label: `${month}`,
      amount: report.totalSpent,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 3. Category series
// ---------------------------------------------------------------------------

export interface CategorySpendingPoint {
  category: ExpenseCategory;
  amount: number;
  /** 0..100 rounded to one decimal. */
  percent: number;
}

export function buildCategorySpendingSeries(
  entries: readonly KakeiboEntry[],
  yearMonth: string,
): CategorySpendingPoint[] {
  const report = buildMonthlyReport(entries as KakeiboEntry[], yearMonth);
  if (report.totalSpent === 0) return [];
  return report.byCategory.map((c) => ({
    category: c.category,
    amount: c.total,
    percent: Math.round(c.percentOfMonth * 1000) / 10,
  }));
}

// ---------------------------------------------------------------------------
// 4. Last-N-days series (Dashboard mini chart)
// ---------------------------------------------------------------------------

export interface LastNDaysPoint {
  date: string;
  /** Short label "DD/MM" — UI can shorten further. */
  label: string;
  amount: number;
  isToday: boolean;
}

export function buildLastNDaysSpendingSeries(
  entries: readonly KakeiboEntry[],
  n: number,
  now: Date,
): LastNDaysPoint[] {
  const todayIso = isoDate(now);
  const sumByDate = new Map<string, number>();
  for (const e of entries) {
    sumByDate.set(e.date, (sumByDate.get(e.date) ?? 0) + e.amount);
  }
  const out: LastNDaysPoint[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const date = isoDate(d);
    out.push({
      date,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      amount: sumByDate.get(date) ?? 0,
      isToday: date === todayIso,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// 5. Rule-based insights
// ---------------------------------------------------------------------------

export type InsightType =
  | 'top_category'
  | 'month_over_month'
  | 'today_over_daily_allowance'
  | 'high_food_ratio'
  | 'safe_month';

export type InsightSeverity = 'info' | 'warning' | 'danger' | 'success';

export interface SpendingInsight {
  type: InsightType;
  severity: InsightSeverity;
  titleKey: string;
  bodyKey: string;
  values: Record<string, string | number>;
}

interface InsightInput {
  entries: readonly KakeiboEntry[];
  yearMonth: string;
  takeHomeMonthly?: number;
  dailyAllowance?: number;
  now?: Date;
}

const HIGH_FOOD_RATIO_THRESHOLD = 0.35;
const SAFE_MONTH_RATIO = 0.70;
/** Avoid "high food" insight on near-empty months — needs a meaningful base. */
const HIGH_FOOD_MIN_TOTAL = 10_000;
/** Avoid "safe month" celebration on day 1 — wait until the month is at least
 *  half-over OR the user has enough entries to make the average meaningful. */
const SAFE_MONTH_MIN_MONTH_PROGRESS = 0.5;
const SAFE_MONTH_MIN_ENTRY_COUNT = 7;

function monthProgress(yearMonth: string, now: Date): number {
  const { year, month } = ymToParts(yearMonth);
  // Only meaningful if `now` is inside the same month.
  if (year !== now.getFullYear() || month !== now.getMonth() + 1) return 1;
  const daysInMonth = getDaysInMonth(year, month);
  return now.getDate() / daysInMonth;
}

export function buildSpendingInsights(input: InsightInput): SpendingInsight[] {
  const now = input.now ?? new Date();
  const todayIso = isoDate(now);
  const report = buildMonthlyReport(input.entries as KakeiboEntry[], input.yearMonth);
  const insights: SpendingInsight[] = [];

  if (report.totalSpent > 0 && report.byCategory.length > 0) {
    const top = report.byCategory[0]!;
    insights.push({
      type: 'top_category',
      severity: 'info',
      titleKey: 'kakeibo.insights.topCategory.title',
      bodyKey: 'kakeibo.insights.topCategory.body',
      values: { category: `kakeibo.categories.${top.category}`, amount: top.total },
    });
  }

  const prevYm = shiftYearMonth(input.yearMonth, -1);
  const prev = buildMonthlyReport(input.entries as KakeiboEntry[], prevYm);
  if (prev.totalSpent > 0 || report.totalSpent > 0) {
    const delta = report.totalSpent - prev.totalSpent;
    if (delta > 0 && prev.totalSpent > 0) {
      insights.push({
        type: 'month_over_month',
        severity: 'warning',
        titleKey: 'kakeibo.insights.monthIncrease.title',
        bodyKey: 'kakeibo.insights.monthIncrease.body',
        values: { amount: delta },
      });
    } else if (delta < 0 && prev.totalSpent > 0) {
      insights.push({
        type: 'month_over_month',
        severity: 'success',
        titleKey: 'kakeibo.insights.monthDecrease.title',
        bodyKey: 'kakeibo.insights.monthDecrease.body',
        values: { amount: Math.abs(delta) },
      });
    }
  }

  if (input.dailyAllowance !== undefined && input.dailyAllowance >= 0) {
    const todaySpent = input.entries
      .filter((e) => e.date === todayIso)
      .reduce((s, e) => s + e.amount, 0);
    if (todaySpent > input.dailyAllowance) {
      insights.push({
        type: 'today_over_daily_allowance',
        severity: 'danger',
        titleKey: 'kakeibo.insights.todayOver.title',
        bodyKey: 'kakeibo.insights.todayOver.body',
        values: { amount: todaySpent - input.dailyAllowance },
      });
    }
  }

  if (report.totalSpent >= HIGH_FOOD_MIN_TOTAL) {
    const food = report.byCategory.find((c) => c.category === 'food');
    if (food && food.percentOfMonth > HIGH_FOOD_RATIO_THRESHOLD) {
      insights.push({
        type: 'high_food_ratio',
        severity: 'warning',
        titleKey: 'kakeibo.insights.highFood.title',
        bodyKey: 'kakeibo.insights.highFood.body',
        values: { percent: Math.round(food.percentOfMonth * 100) },
      });
    }
  }

  if (
    input.takeHomeMonthly !== undefined &&
    input.takeHomeMonthly > 0 &&
    report.totalSpent < input.takeHomeMonthly * SAFE_MONTH_RATIO &&
    (monthProgress(input.yearMonth, now) >= SAFE_MONTH_MIN_MONTH_PROGRESS ||
      report.entryCount >= SAFE_MONTH_MIN_ENTRY_COUNT)
  ) {
    insights.push({
      type: 'safe_month',
      severity: 'success',
      titleKey: 'kakeibo.insights.safeMonth.title',
      bodyKey: 'kakeibo.insights.safeMonth.body',
      values: {},
    });
  }

  return insights;
}

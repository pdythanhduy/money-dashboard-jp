/**
 * Pure budget math for the Trip & Business Budget Planner.
 *
 *   buildTripSummary           — totals + per-category diff + settlement
 *   buildTripDailySeries       — every date startDate→endDate, summed
 *   buildTripCategoryComparison — sorted DESC by actual
 *   getTripLifecycleStatus     — upcoming / active / ended / cancelled
 *   buildTripInsights          — copy-points for the insight card
 *
 * No React, no I/O. Pin `now` in tests for deterministic lifecycle output.
 */

import type {
  TripBudget,
  TripExpenseCategory,
  TripStatus,
} from '@/types/trip-budget';

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

export type DiffStatus = 'under' | 'over' | 'even';

export type SettlementStatus =
  | 'company_owes_user'
  | 'user_owes_company'
  | 'even'
  | 'none';

export interface CategorySummary {
  category: TripExpenseCategory;
  planned: number;
  actual: number;
  /** actual - planned. Positive = over. */
  diff: number;
  diffStatus: DiffStatus;
}

export interface TripSummary {
  plannedTotal: number;
  actualTotal: number;
  /** actualTotal − plannedTotal. Positive = over budget. */
  diff: number;
  diffStatus: DiffStatus;
  /** 0..whatever; 0 when plannedTotal is 0 (avoid Infinity). */
  progressPercent: number;
  reimbursableTotal: number;
  companyAdvanceAmount: number;
  /** companyAdvanceAmount − reimbursableTotal. Positive = unspent advance to return. */
  settlementAmount: number;
  settlementStatus: SettlementStatus;
  byCategory: CategorySummary[];
  /** First category whose actual > planned (largest diff). */
  topOverCategory?: TripExpenseCategory;
}

function diffStatusOf(diff: number): DiffStatus {
  if (diff > 0) return 'over';
  if (diff < 0) return 'under';
  return 'even';
}

function settlementStatusOf(advance: number, reimbursable: number): SettlementStatus {
  if (advance === 0 && reimbursable === 0) return 'none';
  const settlement = advance - reimbursable;
  if (settlement > 0) return 'user_owes_company';
  if (settlement < 0) return 'company_owes_user';
  return 'even';
}

export function buildTripSummary(trip: TripBudget): TripSummary {
  const plannedByCategory = new Map<TripExpenseCategory, number>();
  for (const p of trip.plannedItems) {
    plannedByCategory.set(p.category, (plannedByCategory.get(p.category) ?? 0) + p.plannedAmount);
  }

  const actualByCategory = new Map<TripExpenseCategory, number>();
  let reimbursableTotal = 0;
  for (const a of trip.actualExpenses) {
    actualByCategory.set(a.category, (actualByCategory.get(a.category) ?? 0) + a.amount);
    if (a.reimbursable) reimbursableTotal += a.amount;
  }

  const plannedTotal = [...plannedByCategory.values()].reduce((s, n) => s + n, 0);
  const actualTotal = [...actualByCategory.values()].reduce((s, n) => s + n, 0);
  const diff = actualTotal - plannedTotal;

  const cats = new Set<TripExpenseCategory>([
    ...plannedByCategory.keys(),
    ...actualByCategory.keys(),
  ]);
  const byCategory: CategorySummary[] = [];
  for (const c of cats) {
    const planned = plannedByCategory.get(c) ?? 0;
    const actual = actualByCategory.get(c) ?? 0;
    const d = actual - planned;
    byCategory.push({ category: c, planned, actual, diff: d, diffStatus: diffStatusOf(d) });
  }

  // Stable sort: largest absolute diff first, then category name (deterministic).
  byCategory.sort((a, b) => b.diff - a.diff || a.category.localeCompare(b.category));

  const topOverCategory = byCategory.find((c) => c.diff > 0)?.category;

  const companyAdvanceAmount = trip.companyAdvanceAmount ?? 0;
  const settlementAmount = companyAdvanceAmount - reimbursableTotal;

  return {
    plannedTotal,
    actualTotal,
    diff,
    diffStatus: diffStatusOf(diff),
    progressPercent: plannedTotal > 0 ? Math.round((actualTotal / plannedTotal) * 100) : 0,
    reimbursableTotal,
    companyAdvanceAmount,
    settlementAmount,
    settlementStatus: settlementStatusOf(companyAdvanceAmount, reimbursableTotal),
    byCategory,
    ...(topOverCategory ? { topOverCategory } : {}),
  };
}

// ---------------------------------------------------------------------------
// Daily series
// ---------------------------------------------------------------------------

export interface TripDailyPoint {
  date: string;
  amount: number;
  isTripDay: boolean;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseIsoDate(iso: string): Date | null {
  // Strict YYYY-MM-DD parse — avoid timezone shenanigans by constructing in
  // local time. Returns null on malformed input.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

export function buildTripDailySeries(trip: TripBudget): TripDailyPoint[] {
  const start = parseIsoDate(trip.startDate);
  const end = parseIsoDate(trip.endDate);
  if (!start || !end || end.getTime() < start.getTime()) return [];

  const sumByDate = new Map<string, number>();
  for (const a of trip.actualExpenses) {
    sumByDate.set(a.date, (sumByDate.get(a.date) ?? 0) + a.amount);
  }

  const out: TripDailyPoint[] = [];
  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate() + 1)) {
    const date = isoDate(d);
    out.push({ date, amount: sumByDate.get(date) ?? 0, isTripDay: true });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Category comparison
// ---------------------------------------------------------------------------

export function buildTripCategoryComparison(trip: TripBudget): CategorySummary[] {
  return [...buildTripSummary(trip).byCategory].sort((a, b) => b.actual - a.actual);
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

export type TripLifecycle = 'upcoming' | 'active' | 'ended' | 'cancelled';

export function getTripLifecycleStatus(trip: TripBudget, now: Date): TripLifecycle {
  if (trip.status === 'cancelled') return 'cancelled';
  const today = isoDate(now);
  // String compare works for ISO YYYY-MM-DD — lexical order == chronological.
  if (today < trip.startDate) return 'upcoming';
  if (today > trip.endDate) return 'ended';
  return 'active';
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export type TripInsightType =
  | 'over_budget'
  | 'under_budget'
  | 'top_over_category'
  | 'no_actual_yet'
  | 'business_settlement';

export type TripInsightSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface TripInsight {
  type: TripInsightType;
  severity: TripInsightSeverity;
  titleKey: string;
  bodyKey: string;
  values: Record<string, string | number>;
}

export function buildTripInsights(trip: TripBudget): TripInsight[] {
  const s = buildTripSummary(trip);
  const out: TripInsight[] = [];

  if (s.actualTotal === 0) {
    out.push({
      type: 'no_actual_yet',
      severity: 'info',
      titleKey: 'trip.insights.noActualYet.title',
      bodyKey: 'trip.insights.noActualYet.body',
      values: {},
    });
  }

  if (s.diff > 0) {
    out.push({
      type: 'over_budget',
      severity: 'warning',
      titleKey: 'trip.insights.overBudget.title',
      bodyKey: 'trip.insights.overBudget.body',
      values: { amount: s.diff },
    });
  } else if (s.diff < 0 && s.plannedTotal > 0) {
    out.push({
      type: 'under_budget',
      severity: 'success',
      titleKey: 'trip.insights.underBudget.title',
      bodyKey: 'trip.insights.underBudget.body',
      values: { amount: Math.abs(s.diff) },
    });
  }

  if (s.topOverCategory) {
    const top = s.byCategory.find((c) => c.category === s.topOverCategory)!;
    out.push({
      type: 'top_over_category',
      severity: 'warning',
      titleKey: 'trip.insights.topOverCategory.title',
      bodyKey: 'trip.insights.topOverCategory.body',
      values: { category: `trip.category.${top.category}`, amount: top.diff },
    });
  }

  if (s.settlementStatus !== 'none') {
    out.push({
      type: 'business_settlement',
      severity: 'info',
      titleKey: 'trip.insights.businessSettlement.title',
      bodyKey: `trip.settlement.${s.settlementStatus === 'user_owes_company' ? 'userOwesCompany' : s.settlementStatus === 'company_owes_user' ? 'companyOwesUser' : 'even'}`,
      values: { amount: Math.abs(s.settlementAmount) },
    });
  }

  return out;
}

// Re-export TripStatus for convenience to consumers that only import the math lib.
export type { TripStatus };

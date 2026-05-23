/**
 * "How does this week compare to last week?" — pure helper for the
 * Dashboard's WeeklyReviewCard.
 *
 * Week boundaries: ISO weeks, Monday→Sunday (00:00 local → 23:59:59
 * local). Crosses month and year boundaries cleanly because we operate
 * on ISO date strings (YYYY-MM-DD lexicographic compare) without any
 * Date math beyond computing the Monday anchor.
 *
 * Pure. No React, no I/O, no `new Date()` outside the explicit `now`
 * input. Tests pin `now` to specific Mondays / Sundays / month edges.
 */

import type { ExpenseCategory, KakeiboEntry } from '@/lib/kakeibo-math';

export interface WeeklyReviewInput {
  entries: readonly KakeiboEntry[];
  now: Date;
}

export interface WeeklyReviewTopCategory {
  category: ExpenseCategory;
  amount: number;
}

export interface WeeklyReviewResult {
  /** False when both this week and last week are empty — caller hides the card. */
  hasData: boolean;
  thisWeekTotal: number;
  lastWeekTotal: number;
  /** thisWeekTotal − lastWeekTotal. */
  diff: number;
  diffStatus: 'up' | 'down' | 'same';
  /** Highest-spend category in THIS week. Undefined when this week is empty. */
  topCategory?: WeeklyReviewTopCategory;
  /** ISO date (YYYY-MM-DD) of the Monday that starts this week. */
  weekStart: string;
  /** ISO date (YYYY-MM-DD) of the Sunday that ends this week (inclusive). */
  weekEnd: string;
}

/** Same-week magnitude tolerance — under this, call it "same as last week". */
const SAME_TOLERANCE_YEN = 500;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Returns the Monday of the week containing `d`, at 00:00 local. */
function mondayOf(d: Date): Date {
  // JavaScript getDay(): Sunday = 0, Monday = 1, ..., Saturday = 6.
  // We want offset to Monday: Sun = 6 days back, Mon = 0, Tue = 1, etc.
  const dow = d.getDay();
  const offsetToMonday = dow === 0 ? 6 : dow - 1;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - offsetToMonday);
  return monday;
}

/** Adds `days` to `d` at the same local hour. */
function addDays(d: Date, days: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
}

/**
 * Returns the ISO date range [startISO, endISO] for the week containing
 * `anchor`. Both inclusive. Works across month / year boundaries.
 */
function weekRange(anchor: Date): { start: string; end: string } {
  const start = mondayOf(anchor);
  const end = addDays(start, 6);
  return { start: isoDate(start), end: isoDate(end) };
}

/**
 * Filter `entries` to those whose ISO date string falls within
 * [startISO, endISO] inclusive. Lexicographic string compare is safe
 * because YYYY-MM-DD is zero-padded.
 */
function entriesInRange(
  entries: readonly KakeiboEntry[],
  startISO: string,
  endISO: string,
): KakeiboEntry[] {
  return entries.filter((e) => e.date >= startISO && e.date <= endISO);
}

function totalAmount(list: readonly KakeiboEntry[]): number {
  return list.reduce((sum, e) => sum + e.amount, 0);
}

function topCategoryOf(list: readonly KakeiboEntry[]): WeeklyReviewTopCategory | undefined {
  if (list.length === 0) return undefined;
  const buckets = new Map<ExpenseCategory, number>();
  for (const e of list) {
    buckets.set(e.category, (buckets.get(e.category) ?? 0) + e.amount);
  }
  let best: WeeklyReviewTopCategory | undefined;
  for (const [category, amount] of buckets) {
    if (!best || amount > best.amount) best = { category, amount };
  }
  return best;
}

export function computeWeeklyReview(input: WeeklyReviewInput): WeeklyReviewResult {
  const thisWeek = weekRange(input.now);
  const lastWeekAnchor = addDays(mondayOf(input.now), -7);
  const lastWeek = weekRange(lastWeekAnchor);

  const thisWeekEntries = entriesInRange(input.entries, thisWeek.start, thisWeek.end);
  const lastWeekEntries = entriesInRange(input.entries, lastWeek.start, lastWeek.end);

  const thisWeekTotal = totalAmount(thisWeekEntries);
  const lastWeekTotal = totalAmount(lastWeekEntries);
  const diff = thisWeekTotal - lastWeekTotal;

  let diffStatus: WeeklyReviewResult['diffStatus'];
  if (Math.abs(diff) < SAME_TOLERANCE_YEN) diffStatus = 'same';
  else if (diff > 0) diffStatus = 'up';
  else diffStatus = 'down';

  const result: WeeklyReviewResult = {
    hasData: thisWeekTotal > 0 || lastWeekTotal > 0,
    thisWeekTotal,
    lastWeekTotal,
    diff,
    diffStatus,
    weekStart: thisWeek.start,
    weekEnd: thisWeek.end,
  };

  const top = topCategoryOf(thisWeekEntries);
  if (top) result.topCategory = top;

  return result;
}


/**
 * Pure aggregation over a HistoryEntry[]. No React, no store — testable
 * with fixture arrays.
 */

import type { HistoryEntry, HistoryFilter } from '@/types/history';

export interface HistoryStats {
  totalCount: number;
  highestTakeHome: number;
  averageTakeHome: number;
  totalTaxEstimated: number;
  filteredEntries: HistoryEntry[];
  /**
   * Last 6 calendar months ending at `now`, oldest-first. ONE point per
   * month, derived from the most-recent entry that fell in that month. A
   * month with no entries is rendered as `takeHome = null` so the chart
   * can break the line (vs. linearly interpolating across a gap and
   * suggesting income data that doesn't exist).
   */
  monthlyTrend: MonthlyTrendPoint[];
}

export interface MonthlyTrendPoint {
  /** ISO year-month, e.g. `"2026-03"`. Stable React key + label lookup. */
  yearMonth: string;
  /** 1-based month number (1..12). For i18n label rendering. */
  month: number;
  /** 4-digit calendar year. */
  year: number;
  /** Take-home of the LAST entry in this month. `null` = no entry. */
  takeHome: number | null;
  /** Monthly gross (annual / 12) of the same entry. `null` when no entry. */
  gross: number | null;
}

/** Default number of months the trend chart spans. */
export const TREND_MONTHS_BACK = 6;

export function filterEntries(entries: readonly HistoryEntry[], filter: HistoryFilter): HistoryEntry[] {
  if (filter === 'all') return [...entries];
  return entries.filter((e) => e.input.category === filter);
}

/**
 * Format a timestamp into local-time `"YYYY-MM"`. Local matters: a calc
 * created at 11pm Tokyo on the 31st still belongs to that local month
 * even though UTC has rolled over.
 */
function timestampToYearMonth(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Build the rolling-window list of `monthsBack` `YYYY-MM` strings ending
 * at the month of `reference` (oldest first).
 */
function lastNYearMonths(monthsBack: number, reference: Date): string[] {
  const out: string[] = [];
  const y = reference.getFullYear();
  const m = reference.getMonth(); // 0-based
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(y, m - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

/**
 * Aggregate entries into 6 (or `monthsBack`) per-month data points ending
 * at `reference` (default: now). Pure: deterministic for fixed inputs.
 */
export function computeMonthlyTrend(
  entries: readonly HistoryEntry[],
  monthsBack: number = TREND_MONTHS_BACK,
  reference: Date = new Date(),
): MonthlyTrendPoint[] {
  // Bucket entries by YYYY-MM, keeping only the newest in each bucket.
  const newestPerMonth = new Map<string, HistoryEntry>();
  for (const e of entries) {
    const ym = timestampToYearMonth(e.timestamp);
    const incumbent = newestPerMonth.get(ym);
    if (!incumbent || e.timestamp > incumbent.timestamp) {
      newestPerMonth.set(ym, e);
    }
  }

  return lastNYearMonths(monthsBack, reference).map((yearMonth) => {
    const [yStr, mStr] = yearMonth.split('-');
    const year = Number.parseInt(yStr!, 10);
    const month = Number.parseInt(mStr!, 10);
    const e = newestPerMonth.get(yearMonth);
    return {
      yearMonth,
      year,
      month,
      takeHome: e ? e.result.takeHomeMonthly : null,
      gross: e ? Math.floor(e.result.grossAnnual / 12) : null,
    };
  });
}

export function computeHistoryStats(
  entries: readonly HistoryEntry[],
  filter: HistoryFilter,
): HistoryStats {
  const filteredEntries = filterEntries(entries, filter);

  // Aggregates always over `entries` (not filteredEntries) so the four
  // headline stats reflect the user's full history, while the chart +
  // list show the filtered subset.
  const monthlyTakeHomes = entries.map((e) => e.result.takeHomeMonthly);
  const highestTakeHome = monthlyTakeHomes.length > 0 ? Math.max(...monthlyTakeHomes) : 0;
  const averageTakeHome =
    monthlyTakeHomes.length > 0
      ? Math.floor(monthlyTakeHomes.reduce((s, v) => s + v, 0) / monthlyTakeHomes.length)
      : 0;
  const totalTaxEstimated = entries.reduce(
    (sum, e) => sum + e.result.incomeTax + e.result.residentTax,
    0,
  );

  return {
    totalCount: entries.length,
    highestTakeHome,
    averageTakeHome,
    totalTaxEstimated,
    filteredEntries,
    monthlyTrend: computeMonthlyTrend(filteredEntries),
  };
}

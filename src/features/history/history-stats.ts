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
  trendData: TrendPoint[];
}

export interface TrendPoint {
  date: number;
  takeHome: number;
  gross: number;
}

export function filterEntries(entries: readonly HistoryEntry[], filter: HistoryFilter): HistoryEntry[] {
  if (filter === 'all') return [...entries];
  return entries.filter((e) => e.input.category === filter);
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

  const trendData: TrendPoint[] = [...filteredEntries]
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((e) => ({
      date: e.timestamp,
      takeHome: e.result.takeHomeMonthly,
      gross: Math.floor(e.result.grossAnnual / 12),
    }));

  return {
    totalCount: entries.length,
    highestTakeHome,
    averageTakeHome,
    totalTaxEstimated,
    filteredEntries,
    trendData,
  };
}

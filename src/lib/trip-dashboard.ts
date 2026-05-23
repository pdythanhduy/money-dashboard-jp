/**
 * Pick the one trip worth surfacing on the Dashboard.
 *
 * Priority:
 *   1. Active trip (today is between startDate and endDate, not cancelled).
 *   2. Soonest upcoming trip (startDate > today, not cancelled).
 *   3. Most recently ended trip whose endDate was within the last 7 days
 *      (so users can still log lingering reimbursements).
 *   4. Otherwise null — don't clutter the Dashboard.
 *
 * `cancelled` trips are always ignored.
 */

import { getTripLifecycleStatus } from '@/lib/trip-budget-math';
import type { TripBudget } from '@/types/trip-budget';

const RECENT_ENDED_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysAfter(now: Date, endDate: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(endDate);
  if (!m) return Number.POSITIVE_INFINITY;
  const end = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Math.floor((now.getTime() - end.getTime()) / MS_PER_DAY);
}

export function selectFeaturedTrip(
  trips: readonly TripBudget[],
  now: Date,
): TripBudget | null {
  const candidates = trips.filter((t) => t.status !== 'cancelled');

  // 1. Active wins.
  const active = candidates.filter((t) => getTripLifecycleStatus(t, now) === 'active');
  if (active.length > 0) {
    // If somehow multiple active, prefer the earliest start (longest-running).
    return [...active].sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
  }

  // 2. Soonest upcoming.
  const upcoming = candidates.filter((t) => getTripLifecycleStatus(t, now) === 'upcoming');
  if (upcoming.length > 0) {
    return [...upcoming].sort((a, b) => a.startDate.localeCompare(b.startDate))[0] ?? null;
  }

  // 3. Recently ended (within 7 days).
  const recentEnded = candidates
    .filter((t) => getTripLifecycleStatus(t, now) === 'ended')
    .filter((t) => daysAfter(now, t.endDate) <= RECENT_ENDED_WINDOW_DAYS)
    .sort((a, b) => b.endDate.localeCompare(a.endDate));
  if (recentEnded.length > 0) return recentEnded[0] ?? null;

  return null;
}

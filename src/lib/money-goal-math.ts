/**
 * Planning math for money goals — operates on the existing `Goal` type
 * from `@/store/goalsStore` so there is one source of truth for goal
 * data. No parallel `MoneyGoal` type; the spec's data model is realized
 * by extending `Goal` with optional `category`, `status`,
 * `monthlyContribution`, `updatedAt` fields.
 *
 * Pure functions only. No React, no I/O. `now` is an explicit param so
 * tests pin time deterministically.
 */

import {
  getSavedTotal,
  getGoalStatus,
  type Goal,
} from '@/store/goalsStore';

export type GoalHealth = 'on_track' | 'behind' | 'completed' | 'no_deadline';

export interface MoneyGoalHealth {
  progressPercent: number;
  remainingAmount: number;
  /** Whole months remaining until `deadline`. Undefined when no deadline. */
  monthsLeft?: number;
  /**
   * What the user needs to save per month to hit the target by deadline.
   * Undefined when no deadline. Floors at 0 if already completed.
   */
  requiredMonthlySaving?: number;
  health: GoalHealth;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Returns YYYY-MM-DD for `d` in local time. */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** True iff `s` matches `YYYY-MM-DD` AND parses to a valid Date. */
export function isValidIsoDate(s: string | undefined | null): boolean {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map((n) => parseInt(n, 10));
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

/**
 * Whole months from `now` (local midnight) to `deadlineISO` (local
 * midnight), rounded UP so partial months count as the next milestone.
 * Returns 0 if deadline is today or in the past.
 */
export function monthsUntilDeadline(deadlineISO: string, now: Date): number {
  if (!isValidIsoDate(deadlineISO)) return 0;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = deadlineISO.split('-').map((n) => parseInt(n, 10));
  const deadline = new Date(y!, m! - 1, d!);
  if (deadline.getTime() <= today.getTime()) return 0;
  // Calendar-month delta + day-overflow adjustment.
  let months = (deadline.getFullYear() - today.getFullYear()) * 12 +
    (deadline.getMonth() - today.getMonth());
  if (deadline.getDate() < today.getDate()) months -= 1;
  // Always at least 1 month when deadline is in the future so the user
  // sees a non-zero "saving per month" suggestion.
  return Math.max(1, months);
}

export interface ComputeHealthInput {
  goal: Goal;
  now?: Date;
}

export function computeGoalHealth(input: ComputeHealthInput): MoneyGoalHealth {
  const now = input.now ?? new Date();
  const saved = getSavedTotal(input.goal);
  const status = getGoalStatus(input.goal);
  const target = input.goal.targetAmount;
  const progressPercent = target > 0 ? saved / target : 0;
  const remainingAmount = Math.max(0, target - saved);

  // Completed: explicit status OR contributions cover target.
  if (status === 'completed' || saved >= target) {
    return {
      progressPercent,
      remainingAmount: 0,
      health: 'completed',
    };
  }

  // No deadline → no pacing math.
  if (!input.goal.deadline || !isValidIsoDate(input.goal.deadline)) {
    return {
      progressPercent,
      remainingAmount,
      health: 'no_deadline',
    };
  }

  const monthsLeft = monthsUntilDeadline(input.goal.deadline, now);
  // monthsLeft is guaranteed >= 1 by the helper unless deadline already
  // passed (then it returns 0). Treat 0 as "deadline passed but not
  // completed" → behind.
  if (monthsLeft === 0) {
    return {
      progressPercent,
      remainingAmount,
      monthsLeft: 0,
      requiredMonthlySaving: remainingAmount,
      health: 'behind',
    };
  }

  const requiredMonthlySaving = Math.ceil(remainingAmount / monthsLeft);
  // On track if user's planned monthly contribution >= what's required.
  // Without a planned contribution we cannot judge — treat as on_track
  // (encouraging) since no overspend has happened.
  const planned = input.goal.monthlyContribution;
  const health: GoalHealth =
    planned === undefined || planned >= requiredMonthlySaving ? 'on_track' : 'behind';

  return {
    progressPercent,
    remainingAmount,
    monthsLeft,
    requiredMonthlySaving,
    health,
  };
}

/**
 * Featured-goal selector for the Dashboard:
 *   1. Prefer active goals with the nearest future `deadline`.
 *   2. Else active goals with the largest `remainingAmount`.
 *   3. Returns null when no active goals exist.
 */
export function selectFeaturedGoal(goals: readonly Goal[], now?: Date): Goal | null {
  const reference = now ?? new Date();
  const todayISO = isoDate(reference);
  const active = goals.filter((g) => getGoalStatus(g) === 'active');
  if (active.length === 0) return null;

  const withDeadline = active.filter(
    (g) => g.deadline && isValidIsoDate(g.deadline) && g.deadline >= todayISO,
  );
  if (withDeadline.length > 0) {
    return [...withDeadline].sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))[0]!;
  }

  return [...active].sort((a, b) => {
    const aRem = a.targetAmount - getSavedTotal(a);
    const bRem = b.targetAmount - getSavedTotal(b);
    return bRem - aRem;
  })[0]!;
}

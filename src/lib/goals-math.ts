/**
 * Pure projection math for savings goals.
 *
 * Given current `saved`, `target`, an optional `deadline`, and an optional
 * `takeHomeMonthly` (from Calculator), produce monthly-target +
 * savings-rate-required + months-at-default-pace estimates. Tests cover
 * deadlines past/future/today, with and without income context.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30;

export const DEFAULT_SAVINGS_RATE = 0.20;

export interface GoalProgress {
  saved: number;
  target: number;
  /** ISO date; omit for open-ended goals. */
  deadline?: string;
  /** Optional context from useCalculatorStore.lastResult.takeHomeMonthly. */
  takeHomeMonthly?: number;
}

export interface GoalProjection {
  /** Raw progress ratio. May exceed 1 if user over-saved — UI clamps for the bar. */
  progressPercent: number;
  remaining: number;
  isCompleted: boolean;
  monthsToDeadline?: number;
  monthlyTarget?: number;
  /** `monthlyTarget / takeHomeMonthly`. Undefined when either input missing. */
  savingsRateRequired?: number;
  /** Months to reach `target` saving DEFAULT_SAVINGS_RATE of take-home. */
  monthsAtDefaultPace?: number;
}

function monthsBetween(now: Date, deadline: Date): number {
  const dayDiff = (deadline.getTime() - now.getTime()) / MS_PER_DAY;
  if (dayDiff <= 0) return 0;
  return Math.max(1, Math.ceil(dayDiff / DAYS_PER_MONTH));
}

export function computeGoalProjection(
  progress: GoalProgress,
  now: Date = new Date(),
): GoalProjection {
  if (!Number.isFinite(progress.target) || progress.target <= 0) {
    throw new Error(`target must be > 0, got ${progress.target}`);
  }
  if (!Number.isFinite(progress.saved) || progress.saved < 0) {
    throw new Error(`saved must be >= 0, got ${progress.saved}`);
  }

  const remaining = Math.max(0, progress.target - progress.saved);
  const isCompleted = progress.saved >= progress.target;
  const progressPercent = progress.target > 0 ? progress.saved / progress.target : 0;

  const projection: GoalProjection = {
    progressPercent,
    remaining,
    isCompleted,
  };

  if (progress.deadline) {
    const deadlineDate = new Date(progress.deadline);
    if (!Number.isNaN(deadlineDate.getTime())) {
      const months = monthsBetween(now, deadlineDate);
      projection.monthsToDeadline = months;
      if (months > 0 && remaining > 0) {
        projection.monthlyTarget = Math.ceil(remaining / months);
        if (progress.takeHomeMonthly && progress.takeHomeMonthly > 0) {
          projection.savingsRateRequired = projection.monthlyTarget / progress.takeHomeMonthly;
        }
      } else if (months === 0 && remaining > 0) {
        // Deadline today or in the past: surface "you'd need everything now".
        projection.monthlyTarget = remaining;
        if (progress.takeHomeMonthly && progress.takeHomeMonthly > 0) {
          projection.savingsRateRequired = remaining / progress.takeHomeMonthly;
        }
      }
    }
  }

  if (progress.takeHomeMonthly && progress.takeHomeMonthly > 0 && remaining > 0) {
    const defaultMonthlySave = progress.takeHomeMonthly * DEFAULT_SAVINGS_RATE;
    if (defaultMonthlySave > 0) {
      projection.monthsAtDefaultPace = Math.ceil(remaining / defaultMonthlySave);
    }
  }

  return projection;
}

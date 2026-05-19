/**
 * Hourly-wage → annual-income calculator.
 *
 * Used by Calculator "Hourly mode" so baito users can describe their
 * schedule (¥/h × hours/day × days/week + optional 夜勤 / OT / weekend
 * allowances) and get a yearly figure that flows into the existing
 * `calculateTakeHome` engine unchanged.
 *
 * Pure — no React, no I/O, no `Date.now()`. Hard-coded multipliers
 * (1.25× standard for night / OT / weekend) come from labour law minimums;
 * callers can override per job.
 */

const DEFAULT_NIGHT_MULTIPLIER = 1.25;     // 22:00–05:00 deemed wage
const DEFAULT_OT_MULTIPLIER = 1.25;        // > 8 h/day or > 40 h/week
const DEFAULT_WEEKEND_MULTIPLIER = 1.25;   // employer-discretion typical
const DEFAULT_WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

export interface HourlyJobInput {
  /** ¥/hour, must be > 0. */
  hourlyRate: number;
  /** Regular hours worked per workday. 0.5–24 inclusive. */
  hoursPerDay: number;
  /** Workdays per week. 0–7 inclusive (0 = baito off this year, returns 0). */
  daysPerWeek: number;
  /** Defaults to 52. Students often pick ~40 for semester-only schedules. */
  weeksPerYear?: number;

  // Allowances — all optional, all add to the base unless the source field is 0/undefined.

  /** Hours per workday inside the 22:00–05:00 window. Paid at `nightShiftMultiplier`. */
  nightHoursPerDay?: number;
  /** Multiplier applied to night hours. Default 1.25. */
  nightShiftMultiplier?: number;

  /** Hours per workday past the 8-hour standard. Paid at `overtimeMultiplier`. */
  overtimeHoursPerDay?: number;
  overtimeMultiplier?: number;

  /** Whole weekend days worked per month. Paid at `weekendMultiplier`. */
  weekendDaysPerMonth?: number;
  weekendMultiplier?: number;
}

export interface HourlyBreakdown {
  baseAnnual: number;
  nightAllowanceAnnual: number;
  overtimeAllowanceAnnual: number;
  weekendAllowanceAnnual: number;
  totalAnnual: number;
}

function validate(input: HourlyJobInput): void {
  if (!Number.isFinite(input.hourlyRate) || input.hourlyRate <= 0) {
    throw new Error(`hourlyRate must be > 0, got ${input.hourlyRate}`);
  }
  if (!Number.isFinite(input.hoursPerDay) || input.hoursPerDay < 0 || input.hoursPerDay > 24) {
    throw new Error(`hoursPerDay must be in [0, 24], got ${input.hoursPerDay}`);
  }
  if (!Number.isFinite(input.daysPerWeek) || input.daysPerWeek < 0 || input.daysPerWeek > 7) {
    throw new Error(`daysPerWeek must be in [0, 7], got ${input.daysPerWeek}`);
  }
}

/**
 * Compute the annualized take-home-pre-tax-pre-insurance income from an
 * hourly schedule + allowances. Each allowance counts only the EXTRA over
 * the base rate (multiplier − 1), because base hours are already paid in
 * `baseAnnual`.
 */
export function computeHourlyAnnual(input: HourlyJobInput): HourlyBreakdown {
  validate(input);

  const weeks = input.weeksPerYear ?? DEFAULT_WEEKS_PER_YEAR;
  const baseAnnual = Math.floor(input.hourlyRate * input.hoursPerDay * input.daysPerWeek * weeks);

  // Night premium: only the (multiplier − 1) portion, because the base
  // hours including the night ones were already counted in `baseAnnual`.
  const nightHours = input.nightHoursPerDay ?? 0;
  const nightMult = input.nightShiftMultiplier ?? DEFAULT_NIGHT_MULTIPLIER;
  const nightAllowanceAnnual =
    nightHours > 0
      ? Math.floor(input.hourlyRate * nightHours * input.daysPerWeek * weeks * (nightMult - 1))
      : 0;

  const otHours = input.overtimeHoursPerDay ?? 0;
  const otMult = input.overtimeMultiplier ?? DEFAULT_OT_MULTIPLIER;
  const overtimeAllowanceAnnual =
    otHours > 0
      ? Math.floor(input.hourlyRate * otHours * input.daysPerWeek * weeks * (otMult - 1))
      : 0;

  const weekendDays = input.weekendDaysPerMonth ?? 0;
  const weekendMult = input.weekendMultiplier ?? DEFAULT_WEEKEND_MULTIPLIER;
  const weekendAllowanceAnnual =
    weekendDays > 0
      ? Math.floor(input.hourlyRate * input.hoursPerDay * weekendDays * MONTHS_PER_YEAR * (weekendMult - 1))
      : 0;

  return {
    baseAnnual,
    nightAllowanceAnnual,
    overtimeAllowanceAnnual,
    weekendAllowanceAnnual,
    totalAnnual: baseAnnual + nightAllowanceAnnual + overtimeAllowanceAnnual + weekendAllowanceAnnual,
  };
}

export interface MultiJobBreakdown {
  /** Per-job breakdowns in the order they were passed in. */
  perJob: HourlyBreakdown[];
  /** Sum of every job's `totalAnnual`. Each job is floored individually
   *  by `computeHourlyAnnual`; the sum is already integer. */
  totalAnnual: number;
}

/**
 * Aggregate multiple hourly jobs for users who hold more than one baito
 * at once (combini sáng + nhà hàng tối + dạy thêm cuối tuần). Validation
 * propagates from `computeHourlyAnnual` — if any job is invalid the call
 * throws and no partial result is returned.
 */
export function computeMultiJobAnnual(jobs: readonly HourlyJobInput[]): MultiJobBreakdown {
  const perJob = jobs.map((j) => computeHourlyAnnual(j));
  const totalAnnual = perJob.reduce((sum, b) => sum + b.totalAnnual, 0);
  return { perJob, totalAnnual };
}

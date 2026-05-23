import {
  computeLivingCost,
  SAFE_DAILY_THRESHOLD,
  WARNING_DAILY_THRESHOLD,
} from '@/lib/living-cost-math';
import type { KakeiboEntry } from '@/lib/kakeibo-math';
import type { RecurringExpense } from '@/types/recurring-expense';

function entry(id: string, date: string, amount: number, cat: KakeiboEntry['category'] = 'food'): KakeiboEntry {
  return { id, date, amount, category: cat };
}

function rec(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: overrides.id ?? 'r-rent',
    name: overrides.name ?? 'Rent',
    amount: overrides.amount ?? 80_000,
    category: overrides.category ?? 'rent',
    dayOfMonth: overrides.dayOfMonth ?? 1,
    active: overrides.active ?? true,
    autoPost: overrides.autoPost ?? true,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    ...(overrides.lastGeneratedYearMonth !== undefined
      ? { lastGeneratedYearMonth: overrides.lastGeneratedYearMonth }
      : {}),
    ...(overrides.note !== undefined ? { note: overrides.note } : {}),
  };
}

describe('computeLivingCost — salary-based daily allowance', () => {
  it('subtracts active recurrings + variable spend from take-home', () => {
    // May 22 of 31-day month → daysRemainingInMonth = 10
    // takeHome 240_000, rent 80_000 (active), food entries 30_000 → remaining 130K
    // dailyAllowance = 130_000 / 10 = 13_000 → safe
    const r = computeLivingCost({
      takeHomeMonthly: 240_000,
      entries: [
        entry('a', '2026-05-05', 20_000, 'food'),
        entry('b', '2026-05-22', 10_000, 'food'),
      ],
      recurrings: [rec({ active: true, amount: 80_000 })],
      now: new Date(2026, 4, 22),
    });
    expect(r.totalFixedCost).toBe(80_000);
    expect(r.totalVariableSpent).toBe(30_000);
    expect(r.totalSpent).toBe(110_000);
    expect(r.remainingThisMonth).toBe(130_000);
    expect(r.remainingDaysInMonth).toBe(10);
    expect(r.dailyAllowance).toBe(13_000);
    expect(r.status).toBe('safe');
  });

  it('inactive recurring is excluded from fixed cost total', () => {
    const r = computeLivingCost({
      takeHomeMonthly: 200_000,
      entries: [],
      recurrings: [
        rec({ id: 'r1', amount: 80_000, active: true }),
        rec({ id: 'r2', name: 'Paused Netflix', amount: 1_500, active: false }),
      ],
      now: new Date(2026, 4, 22),
    });
    expect(r.totalFixedCost).toBe(80_000);
  });

  it('captures today-only spend in todaySpent', () => {
    const r = computeLivingCost({
      takeHomeMonthly: 200_000,
      entries: [
        entry('y', '2026-05-21', 5_000),
        entry('t', '2026-05-22', 2_000),
      ],
      recurrings: [],
      now: new Date(2026, 4, 22),
    });
    expect(r.totalVariableSpent).toBe(7_000);
    expect(r.todaySpent).toBe(2_000);
  });

  it('status danger when remainingThisMonth < 0 (overspent)', () => {
    const r = computeLivingCost({
      takeHomeMonthly: 100_000,
      entries: [entry('a', '2026-05-10', 80_000)],
      recurrings: [rec({ amount: 50_000 })],
      now: new Date(2026, 4, 22),
    });
    expect(r.remainingThisMonth).toBeLessThan(0);
    expect(r.status).toBe('danger');
  });

  it('status warning when dailyAllowance < SAFE threshold but ≥ WARNING threshold', () => {
    // Want dailyAllowance e.g. 1500 (1000 ≤ 1500 < 2500) → warning
    // 10 days left, remaining 15_000 → take-home 15_000 with no costs
    const r = computeLivingCost({
      takeHomeMonthly: 15_000,
      entries: [],
      recurrings: [],
      now: new Date(2026, 4, 22),
    });
    expect(r.dailyAllowance).toBe(1_500);
    expect(r.dailyAllowance).toBeGreaterThanOrEqual(WARNING_DAILY_THRESHOLD);
    expect(r.dailyAllowance).toBeLessThan(SAFE_DAILY_THRESHOLD);
    expect(r.status).toBe('warning');
  });

  it('status danger when dailyAllowance below WARNING threshold (e.g. ¥800/day)', () => {
    // 10 days left, want dailyAllowance < 1000 → take-home 8_000
    const r = computeLivingCost({
      takeHomeMonthly: 8_000,
      entries: [],
      recurrings: [],
      now: new Date(2026, 4, 22),
    });
    expect(r.dailyAllowance).toBe(800);
    expect(r.status).toBe('danger');
  });

  it('end-of-month: 1 day remaining clamp', () => {
    const r = computeLivingCost({
      takeHomeMonthly: 30_000,
      entries: [],
      recurrings: [],
      now: new Date(2026, 4, 31),
    });
    expect(r.remainingDaysInMonth).toBe(1);
    expect(r.dailyAllowance).toBe(30_000);
  });
});

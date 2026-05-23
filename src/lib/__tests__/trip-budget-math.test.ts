import {
  buildTripCategoryComparison,
  buildTripDailySeries,
  buildTripInsights,
  buildTripSummary,
  getTripLifecycleStatus,
} from '@/lib/trip-budget-math';
import type {
  TripActualExpense,
  TripBudget,
  TripPlanItem,
  TripType,
} from '@/types/trip-budget';

function plan(
  id: string,
  category: TripPlanItem['category'],
  plannedAmount: number,
  label?: string,
): TripPlanItem {
  return label ? { id, category, plannedAmount, label } : { id, category, plannedAmount };
}

function actual(
  id: string,
  date: string,
  category: TripActualExpense['category'],
  amount: number,
  reimbursable?: boolean,
): TripActualExpense {
  return reimbursable !== undefined
    ? { id, date, category, amount, reimbursable }
    : { id, date, category, amount };
}

function trip(overrides: Partial<TripBudget> = {}): TripBudget {
  return {
    id: 't1',
    title: 'Kyoto weekend',
    type: 'travel' as TripType,
    status: 'planned',
    startDate: '2026-06-10',
    endDate: '2026-06-12',
    currency: 'JPY',
    plannedItems: [],
    actualExpenses: [],
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('buildTripSummary — totals', () => {
  it('plannedTotal and actualTotal sum correctly across categories', () => {
    const t = trip({
      plannedItems: [
        plan('p1', 'hotel', 30_000),
        plan('p2', 'food', 12_000),
        plan('p3', 'transport', 8_000),
      ],
      actualExpenses: [
        actual('a1', '2026-06-10', 'hotel', 32_000),
        actual('a2', '2026-06-11', 'food', 9_000),
      ],
    });
    const s = buildTripSummary(t);
    expect(s.plannedTotal).toBe(50_000);
    expect(s.actualTotal).toBe(41_000);
  });

  it('over-budget diff is positive', () => {
    const t = trip({
      plannedItems: [plan('p1', 'food', 10_000)],
      actualExpenses: [actual('a1', '2026-06-10', 'food', 15_000)],
    });
    const s = buildTripSummary(t);
    expect(s.diff).toBe(5_000);
    expect(s.diffStatus).toBe('over');
  });

  it('under-budget diff is negative + diffStatus under', () => {
    const t = trip({
      plannedItems: [plan('p1', 'food', 10_000)],
      actualExpenses: [actual('a1', '2026-06-10', 'food', 4_000)],
    });
    const s = buildTripSummary(t);
    expect(s.diff).toBe(-6_000);
    expect(s.diffStatus).toBe('under');
  });

  it('progressPercent is 0 when no plan, even with actuals', () => {
    const t = trip({ actualExpenses: [actual('a1', '2026-06-10', 'food', 5_000)] });
    expect(buildTripSummary(t).progressPercent).toBe(0);
  });
});

describe('buildTripSummary — per-category', () => {
  it('byCategory shows planned/actual diff per category', () => {
    const t = trip({
      plannedItems: [plan('p1', 'hotel', 30_000), plan('p2', 'food', 10_000)],
      actualExpenses: [actual('a1', '2026-06-10', 'hotel', 28_000), actual('a2', '2026-06-11', 'food', 12_000)],
    });
    const s = buildTripSummary(t);
    const hotel = s.byCategory.find((c) => c.category === 'hotel');
    const food = s.byCategory.find((c) => c.category === 'food');
    expect(hotel?.diff).toBe(-2_000);
    expect(food?.diff).toBe(2_000);
  });

  it('topOverCategory = category with largest positive diff', () => {
    const t = trip({
      plannedItems: [plan('p1', 'food', 5_000), plan('p2', 'shopping', 3_000)],
      actualExpenses: [
        actual('a1', '2026-06-10', 'food', 8_000), // +3K
        actual('a2', '2026-06-10', 'shopping', 12_000), // +9K
      ],
    });
    expect(buildTripSummary(t).topOverCategory).toBe('shopping');
  });

  it('topOverCategory undefined when nothing is over', () => {
    const t = trip({
      plannedItems: [plan('p1', 'food', 10_000)],
      actualExpenses: [actual('a1', '2026-06-10', 'food', 6_000)],
    });
    expect(buildTripSummary(t).topOverCategory).toBeUndefined();
  });
});

describe('buildTripSummary — business settlement', () => {
  it('reimbursableTotal sums only reimbursable=true actuals', () => {
    const t = trip({
      type: 'business',
      companyAdvanceAmount: 50_000,
      actualExpenses: [
        actual('a1', '2026-06-10', 'hotel', 30_000, true),
        actual('a2', '2026-06-10', 'food', 5_000, false),
        actual('a3', '2026-06-11', 'transport', 8_000, true),
      ],
    });
    const s = buildTripSummary(t);
    expect(s.reimbursableTotal).toBe(38_000);
  });

  it('user_owes_company when advance > reimbursable (extra advance to return)', () => {
    const t = trip({
      type: 'business',
      companyAdvanceAmount: 50_000,
      actualExpenses: [actual('a1', '2026-06-10', 'hotel', 30_000, true)],
    });
    const s = buildTripSummary(t);
    expect(s.settlementAmount).toBe(20_000);
    expect(s.settlementStatus).toBe('user_owes_company');
  });

  it('company_owes_user when reimbursable > advance', () => {
    const t = trip({
      type: 'business',
      companyAdvanceAmount: 10_000,
      actualExpenses: [actual('a1', '2026-06-10', 'hotel', 40_000, true)],
    });
    const s = buildTripSummary(t);
    expect(s.settlementAmount).toBe(-30_000);
    expect(s.settlementStatus).toBe('company_owes_user');
  });

  it('even when advance equals reimbursable', () => {
    const t = trip({
      type: 'business',
      companyAdvanceAmount: 25_000,
      actualExpenses: [actual('a1', '2026-06-10', 'food', 25_000, true)],
    });
    expect(buildTripSummary(t).settlementStatus).toBe('even');
  });

  it('settlementStatus none when no advance AND no reimbursable', () => {
    const t = trip({
      actualExpenses: [actual('a1', '2026-06-10', 'food', 10_000)],
    });
    expect(buildTripSummary(t).settlementStatus).toBe('none');
  });
});

describe('buildTripDailySeries', () => {
  it('includes every date from startDate to endDate inclusive', () => {
    const t = trip({ startDate: '2026-06-10', endDate: '2026-06-12' });
    const series = buildTripDailySeries(t);
    expect(series.map((p) => p.date)).toEqual(['2026-06-10', '2026-06-11', '2026-06-12']);
    expect(series.every((p) => p.isTripDay)).toBe(true);
  });

  it('sums multiple actuals on the same date', () => {
    const t = trip({
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      actualExpenses: [
        actual('a1', '2026-06-11', 'food', 3_000),
        actual('a2', '2026-06-11', 'transport', 2_500),
        actual('a3', '2026-06-12', 'hotel', 18_000),
      ],
    });
    const series = buildTripDailySeries(t);
    expect(series.find((p) => p.date === '2026-06-11')?.amount).toBe(5_500);
    expect(series.find((p) => p.date === '2026-06-12')?.amount).toBe(18_000);
    expect(series.find((p) => p.date === '2026-06-10')?.amount).toBe(0);
  });

  it('returns [] on invalid range (end before start)', () => {
    const t = trip({ startDate: '2026-06-15', endDate: '2026-06-10' });
    expect(buildTripDailySeries(t)).toEqual([]);
  });

  it('returns [] on malformed date strings', () => {
    const t = trip({ startDate: 'not-a-date', endDate: '2026-06-12' });
    expect(buildTripDailySeries(t)).toEqual([]);
  });
});

describe('buildTripCategoryComparison', () => {
  it('sorts by actual descending', () => {
    const t = trip({
      plannedItems: [plan('p1', 'hotel', 30_000), plan('p2', 'food', 10_000)],
      actualExpenses: [
        actual('a1', '2026-06-10', 'food', 25_000),
        actual('a2', '2026-06-11', 'hotel', 12_000),
        actual('a3', '2026-06-12', 'shopping', 18_000),
      ],
    });
    const out = buildTripCategoryComparison(t);
    expect(out.map((c) => c.category)).toEqual(['food', 'shopping', 'hotel']);
  });
});

describe('getTripLifecycleStatus', () => {
  it('cancelled status overrides date checks', () => {
    const t = trip({ status: 'cancelled' });
    expect(getTripLifecycleStatus(t, new Date('2026-06-11'))).toBe('cancelled');
  });

  it('upcoming when now is before startDate', () => {
    const t = trip({ startDate: '2026-06-10', endDate: '2026-06-12' });
    expect(getTripLifecycleStatus(t, new Date(2026, 5, 5))).toBe('upcoming');
  });

  it('active during the date range (inclusive)', () => {
    const t = trip({ startDate: '2026-06-10', endDate: '2026-06-12' });
    expect(getTripLifecycleStatus(t, new Date(2026, 5, 10))).toBe('active');
    expect(getTripLifecycleStatus(t, new Date(2026, 5, 11))).toBe('active');
    expect(getTripLifecycleStatus(t, new Date(2026, 5, 12))).toBe('active');
  });

  it('ended when now is after endDate', () => {
    const t = trip({ startDate: '2026-06-10', endDate: '2026-06-12' });
    expect(getTripLifecycleStatus(t, new Date(2026, 5, 13))).toBe('ended');
  });
});

describe('buildTripInsights', () => {
  it('emits no_actual_yet when actualTotal is 0', () => {
    const t = trip({ plannedItems: [plan('p1', 'food', 10_000)] });
    const out = buildTripInsights(t);
    expect(out.find((i) => i.type === 'no_actual_yet')).toBeDefined();
  });

  it('emits over_budget + top_over_category when overspent', () => {
    const t = trip({
      plannedItems: [plan('p1', 'food', 5_000)],
      actualExpenses: [actual('a1', '2026-06-10', 'food', 8_000)],
    });
    const out = buildTripInsights(t);
    expect(out.find((i) => i.type === 'over_budget')?.values.amount).toBe(3_000);
    expect(out.find((i) => i.type === 'top_over_category')?.values.category).toBe('trip.category.food');
  });

  it('emits under_budget (success) when under and plan > 0', () => {
    const t = trip({
      plannedItems: [plan('p1', 'food', 10_000)],
      actualExpenses: [actual('a1', '2026-06-10', 'food', 4_000)],
    });
    expect(buildTripInsights(t).find((i) => i.type === 'under_budget')?.severity).toBe('success');
  });

  it('emits business_settlement when advance or reimbursable > 0', () => {
    const t = trip({
      type: 'business',
      companyAdvanceAmount: 50_000,
      actualExpenses: [actual('a1', '2026-06-10', 'hotel', 30_000, true)],
    });
    expect(buildTripInsights(t).find((i) => i.type === 'business_settlement')).toBeDefined();
  });
});

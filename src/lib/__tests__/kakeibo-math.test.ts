import {
  buildMonthlyReport,
  compareMonths,
  computeAllBudgetStatuses,
  computeBudgetStatus,
  DEFAULT_BUDGET_RATIOS,
  filterEntriesByMonth,
  suggestBudgetsFromIncome,
  type KakeiboEntry,
} from '@/lib/kakeibo-math';

const e = (id: string, date: string, amount: number, category: KakeiboEntry['category']): KakeiboEntry => ({
  id,
  date,
  amount,
  category,
});

describe('filterEntriesByMonth', () => {
  it('returns only entries whose date prefix matches yearMonth', () => {
    const list: KakeiboEntry[] = [
      e('1', '2026-04-30', 1, 'food'),
      e('2', '2026-05-01', 2, 'food'),
      e('3', '2026-05-15', 3, 'rent'),
      e('4', '2026-05-31', 4, 'transport'),
      e('5', '2026-06-01', 5, 'food'),
    ];
    const out = filterEntriesByMonth(list, '2026-05');
    expect(out.map((x) => x.id)).toEqual(['2', '3', '4']);
  });
});

describe('buildMonthlyReport', () => {
  it('empty input → totalSpent 0, byCategory empty', () => {
    const r = buildMonthlyReport([], '2026-05');
    expect(r.totalSpent).toBe(0);
    expect(r.byCategory).toEqual([]);
    expect(r.entryCount).toBe(0);
    expect(r.surplus).toBeUndefined();
  });

  it('sums correctly and percentOfMonth adds up to ~1.0', () => {
    const entries = [
      e('1', '2026-05-01', 60_000, 'rent'),
      e('2', '2026-05-02', 20_000, 'food'),
      e('3', '2026-05-15', 20_000, 'food'),
    ];
    const r = buildMonthlyReport(entries, '2026-05');
    expect(r.totalSpent).toBe(100_000);
    expect(r.entryCount).toBe(3);
    const sumPct = r.byCategory.reduce((s, c) => s + c.percentOfMonth, 0);
    expect(sumPct).toBeCloseTo(1, 6);
  });

  it('sorts byCategory DESC by total', () => {
    const entries = [
      e('1', '2026-05-01', 5_000, 'food'),
      e('2', '2026-05-02', 80_000, 'rent'),
      e('3', '2026-05-03', 20_000, 'transport'),
    ];
    const r = buildMonthlyReport(entries, '2026-05');
    expect(r.byCategory.map((c) => c.category)).toEqual(['rent', 'transport', 'food']);
  });

  it('with totalIncome → surplus = income - spent', () => {
    const entries = [e('1', '2026-05-01', 200_000, 'rent')];
    const r = buildMonthlyReport(entries, '2026-05', 300_000);
    expect(r.totalIncome).toBe(300_000);
    expect(r.surplus).toBe(100_000);
  });
});

describe('computeBudgetStatus', () => {
  it('boundary: spent ¥40K of ¥50K → percentUsed 0.8, severity warning', () => {
    const s = computeBudgetStatus(40_000, 50_000, 'food');
    expect(s.percentUsed).toBeCloseTo(0.8, 6);
    expect(s.severity).toBe('warning');
    expect(s.remaining).toBe(10_000);
  });

  it('spent ¥48K of ¥50K → 0.96 warning', () => {
    const s = computeBudgetStatus(48_000, 50_000, 'food');
    expect(s.severity).toBe('warning');
  });

  it('spent ¥55K of ¥50K → 1.10 over, remaining negative', () => {
    const s = computeBudgetStatus(55_000, 50_000, 'food');
    expect(s.severity).toBe('over');
    expect(s.remaining).toBe(-5_000);
  });

  it('limit=0 with spending → percentUsed Infinity, severity over', () => {
    const s = computeBudgetStatus(1_000, 0, 'food');
    expect(s.percentUsed).toBe(Number.POSITIVE_INFINITY);
    expect(s.severity).toBe('over');
  });

  it('limit=0 with no spending → safe (zero state)', () => {
    const s = computeBudgetStatus(0, 0, 'food');
    expect(s.severity).toBe('safe');
  });
});

describe('computeAllBudgetStatuses', () => {
  it('returns one status per budget entry, summing only that category', () => {
    const entries = [
      e('1', '2026-05-01', 60_000, 'rent'),
      e('2', '2026-05-02', 20_000, 'food'),
      e('3', '2026-05-03', 5_000, 'food'),
    ];
    const out = computeAllBudgetStatuses(entries, '2026-05', [
      { category: 'rent', monthlyLimit: 50_000 },
      { category: 'food', monthlyLimit: 30_000 },
    ]);
    expect(out).toHaveLength(2);
    expect(out[0]!.spent).toBe(60_000);
    expect(out[0]!.severity).toBe('over');
    expect(out[1]!.spent).toBe(25_000);
    // 25_000 / 30_000 = 0.833 → warning
    expect(out[1]!.severity).toBe('warning');
  });
});

describe('compareMonths', () => {
  it('¥100K → ¥120K → +¥20K (+20%)', () => {
    const prev = buildMonthlyReport([e('1', '2026-04-01', 100_000, 'food')], '2026-04');
    const curr = buildMonthlyReport([e('2', '2026-05-01', 120_000, 'food')], '2026-05');
    const c = compareMonths(prev, curr);
    expect(c.totalDelta).toBe(20_000);
    expect(c.totalDeltaPercent).toBeCloseTo(0.2, 6);
  });

  it('prev totalSpent=0 + curr>0 → totalDeltaPercent Infinity (handled, not NaN)', () => {
    const prev = buildMonthlyReport([], '2026-04');
    const curr = buildMonthlyReport([e('1', '2026-05-01', 10_000, 'food')], '2026-05');
    const c = compareMonths(prev, curr);
    expect(c.totalDeltaPercent).toBe(Number.POSITIVE_INFINITY);
    expect(c.totalDelta).toBe(10_000);
  });

  it('covers categories appearing only in one month', () => {
    const prev = buildMonthlyReport([e('1', '2026-04-01', 5_000, 'transport')], '2026-04');
    const curr = buildMonthlyReport([e('2', '2026-05-01', 7_000, 'food')], '2026-05');
    const c = compareMonths(prev, curr);
    const cats = c.byCategoryDelta.map((d) => d.category).sort();
    expect(cats).toEqual(['food', 'transport']);
  });
});

describe('suggestBudgetsFromIncome', () => {
  it('produces 12 budgets summing close to (but ≤) take-home', () => {
    const out = suggestBudgetsFromIncome(300_000);
    expect(out).toHaveLength(12);
    const sum = out.reduce((s, b) => s + b.monthlyLimit, 0);
    expect(sum).toBeLessThanOrEqual(300_000);
    // Ratios add to 1.0 so floor-loss is ≤ 12.
    expect(sum).toBeGreaterThanOrEqual(300_000 - 12);
  });

  it('applies DEFAULT_BUDGET_RATIOS: rent is 30%, savings is 20%', () => {
    const out = suggestBudgetsFromIncome(200_000);
    const rent = out.find((b) => b.category === 'rent')!;
    const savings = out.find((b) => b.category === 'savings')!;
    expect(rent.monthlyLimit).toBe(Math.floor(200_000 * DEFAULT_BUDGET_RATIOS.rent));
    expect(savings.monthlyLimit).toBe(Math.floor(200_000 * DEFAULT_BUDGET_RATIOS.savings));
  });

  it('zero or negative income → all limits 0', () => {
    expect(suggestBudgetsFromIncome(0).every((b) => b.monthlyLimit === 0)).toBe(true);
    expect(suggestBudgetsFromIncome(-100).every((b) => b.monthlyLimit === 0)).toBe(true);
  });
});

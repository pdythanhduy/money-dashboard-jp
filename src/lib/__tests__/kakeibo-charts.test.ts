import {
  buildCategorySpendingSeries,
  buildDailySpendingSeries,
  buildLastNDaysSpendingSeries,
  buildMonthlySpendingSeries,
  buildSpendingInsights,
} from '@/lib/kakeibo-charts';
import type { KakeiboEntry } from '@/lib/kakeibo-math';

function e(id: string, date: string, amount: number, cat: KakeiboEntry['category'] = 'food'): KakeiboEntry {
  return { id, date, amount, category: cat };
}

describe('buildDailySpendingSeries', () => {
  it('includes every day in May 2026 (31 days)', () => {
    const out = buildDailySpendingSeries([], '2026-05');
    expect(out).toHaveLength(31);
    expect(out[0]?.day).toBe(1);
    expect(out[30]?.day).toBe(31);
  });

  it('sums multiple entries on the same date', () => {
    const out = buildDailySpendingSeries(
      [e('a', '2026-05-10', 500), e('b', '2026-05-10', 200), e('c', '2026-05-11', 1_000)],
      '2026-05',
    );
    expect(out.find((p) => p.day === 10)?.amount).toBe(700);
    expect(out.find((p) => p.day === 11)?.amount).toBe(1_000);
  });

  it('February 2026 has 28 days', () => {
    const out = buildDailySpendingSeries([], '2026-02');
    expect(out).toHaveLength(28);
  });

  it('February 2028 has 29 days (leap)', () => {
    const out = buildDailySpendingSeries([], '2028-02');
    expect(out).toHaveLength(29);
  });

  it('flags isToday when now is provided', () => {
    const out = buildDailySpendingSeries([e('a', '2026-05-22', 100)], '2026-05', new Date(2026, 4, 22));
    expect(out.find((p) => p.day === 22)?.isToday).toBe(true);
    expect(out.find((p) => p.day === 21)?.isToday).toBe(false);
  });
});

describe('buildMonthlySpendingSeries', () => {
  it('includes zero months and sorts ascending', () => {
    const entries = [e('a', '2026-03-10', 10_000), e('b', '2026-05-10', 30_000)];
    const out = buildMonthlySpendingSeries(entries, 6, new Date(2026, 4, 22));
    expect(out).toHaveLength(6);
    // 2025-12, 2026-01, 02, 03, 04, 05 in ascending order
    expect(out.map((p) => p.yearMonth)).toEqual([
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
    ]);
    expect(out.find((p) => p.yearMonth === '2026-03')?.amount).toBe(10_000);
    expect(out.find((p) => p.yearMonth === '2026-05')?.amount).toBe(30_000);
    expect(out.find((p) => p.yearMonth === '2026-04')?.amount).toBe(0);
  });
});

describe('buildCategorySpendingSeries', () => {
  it('returns [] when no spending', () => {
    expect(buildCategorySpendingSeries([], '2026-05')).toEqual([]);
  });

  it('sorts descending by amount and percent sums close to 100', () => {
    const out = buildCategorySpendingSeries(
      [
        e('a', '2026-05-01', 60_000, 'rent'),
        e('b', '2026-05-02', 20_000, 'food'),
        e('c', '2026-05-03', 10_000, 'transport'),
      ],
      '2026-05',
    );
    expect(out.map((c) => c.category)).toEqual(['rent', 'food', 'transport']);
    const sum = out.reduce((s, c) => s + c.percent, 0);
    expect(sum).toBeCloseTo(100, 0);
  });
});

describe('buildLastNDaysSpendingSeries', () => {
  it('includes today and the previous n-1 days, ascending', () => {
    const out = buildLastNDaysSpendingSeries(
      [e('a', '2026-05-22', 1_000), e('b', '2026-05-19', 500)],
      7,
      new Date(2026, 4, 22),
    );
    expect(out).toHaveLength(7);
    expect(out[6]?.isToday).toBe(true);
    expect(out[6]?.amount).toBe(1_000);
    expect(out[3]?.amount).toBe(500); // May 19 = today - 3 → index 3
  });

  it('handles month boundary', () => {
    const out = buildLastNDaysSpendingSeries(
      [e('a', '2026-04-30', 800)],
      3,
      new Date(2026, 4, 2),
    );
    expect(out.map((p) => p.date)).toEqual(['2026-04-30', '2026-05-01', '2026-05-02']);
    expect(out[0]?.amount).toBe(800);
  });
});

describe('buildSpendingInsights', () => {
  it('returns top_category when monthly spend > 0', () => {
    const out = buildSpendingInsights({
      entries: [e('a', '2026-05-10', 60_000, 'rent'), e('b', '2026-05-12', 20_000, 'food')],
      yearMonth: '2026-05',
      now: new Date(2026, 4, 22),
    });
    expect(out.find((i) => i.type === 'top_category')?.values.category).toBe('kakeibo.categories.rent');
  });

  it('detects month-over-month INCREASE (warning)', () => {
    const out = buildSpendingInsights({
      entries: [e('p', '2026-04-10', 10_000), e('c', '2026-05-10', 30_000)],
      yearMonth: '2026-05',
      now: new Date(2026, 4, 22),
    });
    const mom = out.find((i) => i.type === 'month_over_month');
    expect(mom?.severity).toBe('warning');
    expect(mom?.values.amount).toBe(20_000);
  });

  it('detects today over daily allowance', () => {
    const out = buildSpendingInsights({
      entries: [e('t', '2026-05-22', 12_000)],
      yearMonth: '2026-05',
      dailyAllowance: 5_000,
      now: new Date(2026, 4, 22),
    });
    expect(out.find((i) => i.type === 'today_over_daily_allowance')?.values.amount).toBe(7_000);
  });

  it('detects high food ratio (>35%)', () => {
    // Food 50K + rent 50K = 100K, food = 50%
    const out = buildSpendingInsights({
      entries: [e('a', '2026-05-10', 50_000, 'food'), e('b', '2026-05-10', 50_000, 'rent')],
      yearMonth: '2026-05',
      now: new Date(2026, 4, 22),
    });
    expect(out.find((i) => i.type === 'high_food_ratio')?.values.percent).toBe(50);
  });

  it('emits safe_month when totalSpent < 70% of take-home', () => {
    const out = buildSpendingInsights({
      entries: [e('a', '2026-05-10', 100_000, 'rent')],
      yearMonth: '2026-05',
      takeHomeMonthly: 200_000,
      now: new Date(2026, 4, 22), // day 22/31 ≈ 71% → ≥ 50% month-progress gate passes
    });
    expect(out.find((i) => i.type === 'safe_month')).toBeDefined();
  });

  it('does NOT emit safe_month on day 1 with tiny spending (gate blocks)', () => {
    const out = buildSpendingInsights({
      entries: [e('a', '2026-05-01', 100, 'food')],
      yearMonth: '2026-05',
      takeHomeMonthly: 200_000,
      now: new Date(2026, 4, 1),
    });
    expect(out.find((i) => i.type === 'safe_month')).toBeUndefined();
  });

  it('emits safe_month early in month when entry count ≥ 7 (entry-count gate)', () => {
    const entries = Array.from({ length: 7 }, (_, i) => e(`e${i}`, '2026-05-03', 500, 'food'));
    const out = buildSpendingInsights({
      entries,
      yearMonth: '2026-05',
      takeHomeMonthly: 200_000,
      now: new Date(2026, 4, 3),
    });
    expect(out.find((i) => i.type === 'safe_month')).toBeDefined();
  });

  it('does NOT emit high_food_ratio when total monthly spend < ¥10,000', () => {
    const out = buildSpendingInsights({
      entries: [e('a', '2026-05-10', 4_000, 'food'), e('b', '2026-05-10', 2_000, 'rent')],
      yearMonth: '2026-05',
      now: new Date(2026, 4, 22),
    });
    expect(out.find((i) => i.type === 'high_food_ratio')).toBeUndefined();
  });
});

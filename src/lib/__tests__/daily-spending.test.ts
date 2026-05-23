import { computeDailySpending } from '@/lib/daily-spending';
import type { BudgetTarget, KakeiboEntry } from '@/lib/kakeibo-math';

function e(id: string, date: string, amount: number, category: KakeiboEntry['category'] = 'food'): KakeiboEntry {
  return { id, date, amount, category };
}

describe('computeDailySpending', () => {
  it('no budgets set → todayVsAvg = no_budget, dailyRemainingAvg = 0', () => {
    const now = new Date(2026, 4, 22); // May 22
    const r = computeDailySpending([e('1', '2026-05-22', 1_000)], [], now);
    expect(r.todayVsAvg).toBe('no_budget');
    expect(r.dailyRemainingAvg).toBe(0);
    expect(r.monthBudgetTotal).toBe(0);
    expect(r.todaySpent).toBe(1_000);
  });

  it('sums all budgets across categories for monthBudgetTotal', () => {
    const budgets: BudgetTarget[] = [
      { category: 'rent', monthlyLimit: 80_000 },
      { category: 'food', monthlyLimit: 30_000 },
      { category: 'transport', monthlyLimit: 10_000 },
    ];
    const r = computeDailySpending([], budgets, new Date(2026, 4, 22));
    expect(r.monthBudgetTotal).toBe(120_000);
  });

  it('today spent < daily avg → under', () => {
    // May 22 of 31-day month → daysRemainingInMonth = 31 - 22 + 1 = 10
    // Budget ¥100K, no other spend, today ¥3K → remaining 100K-3K=97K, avg 9700, 3K<9700 → under
    const budgets: BudgetTarget[] = [{ category: 'food', monthlyLimit: 100_000 }];
    const entries = [e('today', '2026-05-22', 3_000)];
    const r = computeDailySpending(entries, budgets, new Date(2026, 4, 22));
    expect(r.todaySpent).toBe(3_000);
    expect(r.daysRemainingInMonth).toBe(10);
    expect(r.dailyRemainingAvg).toBe(Math.floor(97_000 / 10));
    expect(r.todayVsAvg).toBe('under');
  });

  it('today spent > daily avg → over', () => {
    // Same setup but today ¥15K → avg 9700 → over.
    const budgets: BudgetTarget[] = [{ category: 'food', monthlyLimit: 100_000 }];
    const entries = [e('today', '2026-05-22', 15_000)];
    const r = computeDailySpending(entries, budgets, new Date(2026, 4, 22));
    expect(r.todayVsAvg).toBe('over');
  });

  it('overspent month → negative remainingThisMonth + still produces a status (over)', () => {
    const budgets: BudgetTarget[] = [{ category: 'food', monthlyLimit: 50_000 }];
    const entries = [
      e('a', '2026-05-01', 60_000),
      e('b', '2026-05-22', 1_000),
    ];
    const r = computeDailySpending(entries, budgets, new Date(2026, 4, 22));
    expect(r.monthSpent).toBe(61_000);
    expect(r.remainingThisMonth).toBe(-11_000);
    expect(r.todayVsAvg).toBe('over');
  });

  it('end-of-month edge: last day → daysRemainingInMonth = 1', () => {
    const budgets: BudgetTarget[] = [{ category: 'food', monthlyLimit: 30_000 }];
    const r = computeDailySpending([], budgets, new Date(2026, 4, 31));
    expect(r.daysRemainingInMonth).toBe(1);
    expect(r.dailyRemainingAvg).toBe(30_000);
  });
});

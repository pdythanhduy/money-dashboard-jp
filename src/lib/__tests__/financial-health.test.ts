import {
  computeFinancialHealth,
  type FinancialHealthInput,
} from '@/lib/financial-health';
import type { BudgetTarget, KakeiboEntry } from '@/lib/kakeibo-math';
import type { RecurringExpense } from '@/types/recurring-expense';

function e(
  id: string,
  date: string,
  amount: number,
  category: KakeiboEntry['category'] = 'food',
): KakeiboEntry {
  return { id, date, amount, category };
}

function r(
  id: string,
  name: string,
  amount: number,
  active: boolean = true,
  category: KakeiboEntry['category'] = 'rent',
): RecurringExpense {
  return {
    id,
    name,
    amount,
    category,
    dayOfMonth: 1,
    active,
    autoPost: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

function b(category: KakeiboEntry['category'], monthlyLimit: number): BudgetTarget {
  return { category, monthlyLimit };
}

const NOW = new Date('2026-05-15T12:00:00.000Z');
const YM = '2026-05';

function input(partial: Partial<FinancialHealthInput> = {}): FinancialHealthInput {
  return {
    takeHomeMonthly: 0,
    entries: [],
    recurrings: [],
    budgets: [],
    yearMonth: YM,
    now: NOW,
    ...partial,
  };
}

describe('computeFinancialHealth', () => {
  describe('mode selection', () => {
    it('returns no_income with isEmpty=true when nothing is configured', () => {
      const result = computeFinancialHealth(input());
      expect(result.mode).toBe('no_income');
      expect(result.status).toBe('no_income');
      expect(result.isEmpty).toBe(true);
      expect(result.fixedCostTotal).toBe(0);
      expect(result.todaySpent).toBe(0);
      expect(result.remainingThisMonth).toBeUndefined();
      expect(result.dailyAllowance).toBeUndefined();
      expect(result.topCategory).toBeUndefined();
      expect(result.budgetSummary).toBeUndefined();
      expect(result.fixedCostBurdenPercent).toBeUndefined();
    });

    it('uses salary mode when takeHomeMonthly > 0', () => {
      const result = computeFinancialHealth(input({ takeHomeMonthly: 300_000 }));
      expect(result.mode).toBe('salary');
      expect(['safe', 'warning', 'danger']).toContain(result.status);
      expect(typeof result.remainingThisMonth).toBe('number');
      expect(typeof result.dailyAllowance).toBe('number');
    });

    it('falls back to budget mode when no salary but budgets exist', () => {
      const result = computeFinancialHealth(input({ budgets: [b('food', 30_000)] }));
      expect(result.mode).toBe('budget');
      expect(typeof result.dailyAllowance).toBe('number');
      expect(result.remainingThisMonth).toBeUndefined();
    });
  });

  describe('isEmpty rule', () => {
    it('isEmpty=false when only recurrings exist (no salary, no entries, no budgets)', () => {
      const result = computeFinancialHealth(input({ recurrings: [r('1', 'Rent', 80_000)] }));
      expect(result.isEmpty).toBe(false);
      expect(result.fixedCostTotal).toBe(80_000);
    });

    it('isEmpty=false when only entries exist (no salary, no budgets, no recurrings)', () => {
      const result = computeFinancialHealth(input({ entries: [e('a', '2026-05-10', 500)] }));
      expect(result.isEmpty).toBe(false);
      expect(result.topCategory?.amount).toBe(500);
    });

    it('isEmpty=false when only budgets exist', () => {
      const result = computeFinancialHealth(input({ budgets: [b('food', 30_000)] }));
      expect(result.isEmpty).toBe(false);
      expect(result.mode).toBe('budget');
    });
  });

  describe('todaySpent', () => {
    it('counts only entries dated today', () => {
      const entries = [
        e('a', '2026-05-15', 1_200, 'food'), // today
        e('b', '2026-05-14', 800, 'food'),
        e('c', '2026-05-15', 300, 'transport'), // today
        e('d', '2026-04-15', 9_999, 'food'), // previous month, ignored
      ];
      const result = computeFinancialHealth(input({ entries }));
      expect(result.todaySpent).toBe(1_500);
    });
  });

  describe('topCategory', () => {
    it('picks the highest-spend category', () => {
      const entries = [
        e('a', '2026-05-01', 18_400, 'food'),
        e('b', '2026-05-02', 9_000, 'transport'),
        e('c', '2026-05-03', 5_000, 'food'),
      ];
      const result = computeFinancialHealth(input({ entries }));
      expect(result.topCategory).toEqual({
        category: 'food',
        amount: 23_400,
        percent: 23_400 / (23_400 + 9_000),
      });
    });

    it('is undefined when month has no spending', () => {
      const result = computeFinancialHealth(input({ entries: [e('a', '2026-04-01', 1_000)] }));
      expect(result.topCategory).toBeUndefined();
    });
  });

  describe('budgetSummary', () => {
    it('counts safe / warning / over correctly', () => {
      const entries = [
        e('safe', '2026-05-01', 1_000, 'food'), // 1k/10k = 10% → safe
        e('warn', '2026-05-01', 8_500, 'transport'), // 8.5k/10k = 85% → warning
        e('over', '2026-05-01', 12_000, 'shopping'), // 12k/10k = 120% → over
      ];
      const budgets = [b('food', 10_000), b('transport', 10_000), b('shopping', 10_000)];
      const result = computeFinancialHealth(input({ entries, budgets }));
      expect(result.budgetSummary).toEqual({ total: 3, safe: 1, warning: 1, over: 1 });
    });

    it('is undefined when no budgets configured', () => {
      const result = computeFinancialHealth(input({ entries: [e('a', '2026-05-01', 500)] }));
      expect(result.budgetSummary).toBeUndefined();
    });
  });

  describe('fixedCostBurdenPercent', () => {
    it('only computes when takeHomeMonthly > 0 AND fixedCostTotal > 0', () => {
      const recurrings = [r('rent', 'Rent', 80_000), r('wifi', 'Wifi', 5_000)];
      const salary = computeFinancialHealth(input({ takeHomeMonthly: 200_000, recurrings }));
      expect(salary.fixedCostBurdenPercent).toBeCloseTo(0.425, 4);

      const noSalary = computeFinancialHealth(input({ recurrings }));
      expect(noSalary.fixedCostBurdenPercent).toBeUndefined();
      expect(noSalary.fixedCostTotal).toBe(85_000);

      const noRecurrings = computeFinancialHealth(input({ takeHomeMonthly: 200_000 }));
      expect(noRecurrings.fixedCostBurdenPercent).toBeUndefined();
    });

    it('ignores inactive recurrings in the total', () => {
      const recurrings = [r('a', 'A', 80_000, true), r('b', 'B', 5_000, false)];
      const result = computeFinancialHealth(input({ takeHomeMonthly: 200_000, recurrings }));
      expect(result.fixedCostTotal).toBe(80_000);
      expect(result.fixedCostBurdenPercent).toBeCloseTo(0.4, 4);
    });
  });

  describe('status thresholds (salary mode regression guard)', () => {
    it('safe when daily allowance is plentiful', () => {
      // 300k − 0 fixed − 0 spent over 17 remaining days ≈ ¥17k/day → safe
      const result = computeFinancialHealth(input({ takeHomeMonthly: 300_000 }));
      expect(result.status).toBe('safe');
    });

    it('danger when remainingThisMonth goes negative', () => {
      const entries = [e('a', '2026-05-01', 350_000, 'food')];
      const result = computeFinancialHealth(input({ takeHomeMonthly: 300_000, entries }));
      expect(result.status).toBe('danger');
      expect(result.remainingThisMonth).toBeLessThan(0);
    });
  });
});

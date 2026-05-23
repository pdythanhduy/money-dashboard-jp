jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-crypto', () => ({
  randomUUID: () => `id-${Math.random().toString(36).slice(2)}`,
}));

import {
  computeGoalHealth,
  isValidIsoDate,
  monthsUntilDeadline,
  selectFeaturedGoal,
} from '@/lib/money-goal-math';
import type { Goal } from '@/store/goalsStore';

const NOW = new Date(2026, 4, 24, 12, 0, 0); // 2026-05-24 (Sun) noon local

function goal(partial: Partial<Goal> = {}): Goal {
  return {
    id: partial.id ?? 'g-1',
    title: partial.title ?? 'Test',
    icon: partial.icon ?? 'piggy',
    targetAmount: partial.targetAmount ?? 100_000,
    contributions: partial.contributions ?? [],
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00.000Z',
    ...(partial.deadline ? { deadline: partial.deadline } : {}),
    ...(partial.note ? { note: partial.note } : {}),
    ...(partial.category ? { category: partial.category } : {}),
    ...(partial.status ? { status: partial.status } : {}),
    ...(partial.monthlyContribution !== undefined
      ? { monthlyContribution: partial.monthlyContribution }
      : {}),
    ...(partial.updatedAt ? { updatedAt: partial.updatedAt } : {}),
  };
}

describe('isValidIsoDate', () => {
  it('accepts well-formed dates', () => {
    expect(isValidIsoDate('2026-05-24')).toBe(true);
    expect(isValidIsoDate('2025-12-31')).toBe(true);
    expect(isValidIsoDate('2027-02-28')).toBe(true);
  });

  it('rejects malformed strings', () => {
    expect(isValidIsoDate('')).toBe(false);
    expect(isValidIsoDate(undefined)).toBe(false);
    expect(isValidIsoDate('2026/05/24')).toBe(false);
    expect(isValidIsoDate('2026-5-4')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
  });
});

describe('monthsUntilDeadline', () => {
  it('0 when deadline is today or past', () => {
    expect(monthsUntilDeadline('2026-05-24', NOW)).toBe(0);
    expect(monthsUntilDeadline('2026-01-01', NOW)).toBe(0);
  });

  it('rounds partial months down then clamps to >= 1', () => {
    expect(monthsUntilDeadline('2026-06-25', NOW)).toBe(1); // 1 month + 1 day → 1
    expect(monthsUntilDeadline('2026-07-25', NOW)).toBe(2);
    expect(monthsUntilDeadline('2027-05-24', NOW)).toBe(12);
  });

  it('returns at least 1 when deadline is in the future', () => {
    expect(monthsUntilDeadline('2026-05-25', NOW)).toBe(1); // tomorrow
    expect(monthsUntilDeadline('2026-06-23', NOW)).toBe(1); // just under a month → clamp 1
  });
});

describe('computeGoalHealth', () => {
  it('health=completed when explicit status=completed', () => {
    const g = goal({ status: 'completed', contributions: [{ id: 'c', date: '2026-05-01', amount: 50_000 }] });
    const h = computeGoalHealth({ goal: g, now: NOW });
    expect(h.health).toBe('completed');
    expect(h.remainingAmount).toBe(0);
  });

  it('health=completed when contributions cover target (legacy goal without status)', () => {
    const g = goal({
      targetAmount: 50_000,
      contributions: [{ id: 'c', date: '2026-04-01', amount: 50_000 }],
    });
    const h = computeGoalHealth({ goal: g, now: NOW });
    expect(h.health).toBe('completed');
  });

  it('health=no_deadline when goal has no deadline', () => {
    const g = goal({ targetAmount: 100_000 });
    const h = computeGoalHealth({ goal: g, now: NOW });
    expect(h.health).toBe('no_deadline');
    expect(h.monthsLeft).toBeUndefined();
    expect(h.requiredMonthlySaving).toBeUndefined();
    expect(h.remainingAmount).toBe(100_000);
  });

  it('health=on_track when no plannedMonthly provided (encouraging default)', () => {
    const g = goal({ targetAmount: 100_000, deadline: '2026-10-24' });
    const h = computeGoalHealth({ goal: g, now: NOW });
    expect(h.health).toBe('on_track');
    expect(h.monthsLeft).toBe(5);
    expect(h.requiredMonthlySaving).toBe(20_000); // 100k / 5
  });

  it('health=on_track when plannedMonthly >= required', () => {
    const g = goal({
      targetAmount: 100_000,
      deadline: '2026-10-24',
      monthlyContribution: 25_000,
    });
    const h = computeGoalHealth({ goal: g, now: NOW });
    expect(h.health).toBe('on_track');
  });

  it('health=behind when plannedMonthly < required', () => {
    const g = goal({
      targetAmount: 100_000,
      deadline: '2026-10-24',
      monthlyContribution: 10_000,
    });
    const h = computeGoalHealth({ goal: g, now: NOW });
    expect(h.health).toBe('behind');
    expect(h.requiredMonthlySaving).toBe(20_000);
  });

  it('progressPercent / remainingAmount reflect contributions', () => {
    const g = goal({
      targetAmount: 100_000,
      contributions: [
        { id: 'c1', date: '2026-03-01', amount: 20_000 },
        { id: 'c2', date: '2026-04-01', amount: 10_000 },
      ],
    });
    const h = computeGoalHealth({ goal: g, now: NOW });
    expect(h.progressPercent).toBe(0.3);
    expect(h.remainingAmount).toBe(70_000);
  });

  it('handles deadline already passed but not completed → behind, requires full remaining', () => {
    const g = goal({
      targetAmount: 100_000,
      deadline: '2026-04-01', // past
      contributions: [{ id: 'c', date: '2026-03-01', amount: 30_000 }],
    });
    const h = computeGoalHealth({ goal: g, now: NOW });
    expect(h.health).toBe('behind');
    expect(h.monthsLeft).toBe(0);
    expect(h.requiredMonthlySaving).toBe(70_000);
  });
});

describe('selectFeaturedGoal', () => {
  it('returns null when no goals', () => {
    expect(selectFeaturedGoal([], NOW)).toBeNull();
  });

  it('returns null when no ACTIVE goals (paused / completed / cancelled excluded)', () => {
    const gs = [
      goal({ id: 'a', status: 'paused' }),
      goal({ id: 'b', status: 'cancelled' }),
      goal({ id: 'c', status: 'completed' }),
    ];
    expect(selectFeaturedGoal(gs, NOW)).toBeNull();
  });

  it('prefers active with NEAREST future deadline', () => {
    const gs = [
      goal({ id: 'far', deadline: '2027-01-01' }),
      goal({ id: 'soon', deadline: '2026-06-15' }),
      goal({ id: 'no-deadline' }),
    ];
    const picked = selectFeaturedGoal(gs, NOW);
    expect(picked?.id).toBe('soon');
  });

  it('ignores deadlines already in the past', () => {
    const gs = [
      goal({ id: 'past', deadline: '2026-04-01' }),
      goal({ id: 'future', deadline: '2026-09-01' }),
    ];
    expect(selectFeaturedGoal(gs, NOW)?.id).toBe('future');
  });

  it('falls back to largest remaining when no goals have future deadlines', () => {
    const gs = [
      goal({ id: 'big', targetAmount: 200_000, contributions: [{ id: 'c', date: '2026-05-01', amount: 10_000 }] }),
      goal({ id: 'small', targetAmount: 50_000 }),
    ];
    expect(selectFeaturedGoal(gs, NOW)?.id).toBe('big');
  });
});

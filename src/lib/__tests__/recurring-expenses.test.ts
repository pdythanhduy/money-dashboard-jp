import {
  findDueRecurrings,
  isoFromDayOfMonth,
} from '@/lib/recurring-expenses';
import type { RecurringExpense } from '@/types/recurring-expense';

function rec(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: overrides.id ?? 'r1',
    name: overrides.name ?? 'Tiền điện',
    amount: overrides.amount ?? 8_000,
    category: overrides.category ?? 'utilities',
    dayOfMonth: overrides.dayOfMonth ?? 15,
    active: overrides.active ?? true,
    autoPost: overrides.autoPost ?? false,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    ...(overrides.lastGeneratedYearMonth !== undefined
      ? { lastGeneratedYearMonth: overrides.lastGeneratedYearMonth }
      : {}),
    ...(overrides.note !== undefined ? { note: overrides.note } : {}),
  };
}

describe('findDueRecurrings', () => {
  it('empty list → no dues', () => {
    expect(findDueRecurrings([], new Date(2026, 4, 20))).toEqual([]);
  });

  it('active, day=15, today=20 → due', () => {
    const r = rec({ id: 'r-elec', dayOfMonth: 15 });
    const out = findDueRecurrings([r], new Date(2026, 4, 20));
    expect(out.map((x) => x.id)).toEqual(['r-elec']);
  });

  it('active, day=25, today=20 → not due yet', () => {
    const r = rec({ id: 'r-rent', dayOfMonth: 25 });
    expect(findDueRecurrings([r], new Date(2026, 4, 20))).toEqual([]);
  });

  it('inactive recurring → excluded even past trigger day', () => {
    const r = rec({ id: 'r-off', dayOfMonth: 1, active: false });
    expect(findDueRecurrings([r], new Date(2026, 4, 20))).toEqual([]);
  });

  it('already generated this month → excluded', () => {
    const r = rec({ id: 'r-already', dayOfMonth: 1, lastGeneratedYearMonth: '2026-05' });
    expect(findDueRecurrings([r], new Date(2026, 4, 20))).toEqual([]);
  });

  it('mix of 3 recurrings returns only the due ones', () => {
    const list = [
      rec({ id: 'a', dayOfMonth: 1 }),                                           // due
      rec({ id: 'b', dayOfMonth: 28 }),                                          // not yet
      rec({ id: 'c', dayOfMonth: 5, lastGeneratedYearMonth: '2026-05' }),        // already done
    ];
    expect(findDueRecurrings(list, new Date(2026, 4, 20)).map((r) => r.id)).toEqual(['a']);
  });

  it('clamps day=31 in February (28-day) → fires on Feb 28 (today=28)', () => {
    const r = rec({ id: 'r-feb', dayOfMonth: 31 });
    // Feb 27 → not yet (clamp=28)
    expect(findDueRecurrings([r], new Date(2026, 1, 27))).toEqual([]);
    // Feb 28 → due
    expect(findDueRecurrings([r], new Date(2026, 1, 28)).map((x) => x.id)).toEqual(['r-feb']);
  });

  it('clamps day=31 in April (30-day) → fires on Apr 30', () => {
    const r = rec({ id: 'r-apr', dayOfMonth: 31 });
    expect(findDueRecurrings([r], new Date(2026, 3, 29))).toEqual([]);
    expect(findDueRecurrings([r], new Date(2026, 3, 30)).map((x) => x.id)).toEqual(['r-apr']);
  });
});

describe('isoFromDayOfMonth', () => {
  it('keeps in-range day untouched', () => {
    expect(isoFromDayOfMonth(2026, 5, 15)).toBe('2026-05-15');
  });

  it('clamps day=31 in February to last day of month (28 or 29)', () => {
    expect(isoFromDayOfMonth(2026, 2, 31)).toBe('2026-02-28');
    expect(isoFromDayOfMonth(2024, 2, 31)).toBe('2024-02-29'); // leap
  });

  it('clamps day=31 in 30-day months', () => {
    expect(isoFromDayOfMonth(2026, 4, 31)).toBe('2026-04-30');
    expect(isoFromDayOfMonth(2026, 6, 31)).toBe('2026-06-30');
    expect(isoFromDayOfMonth(2026, 9, 31)).toBe('2026-09-30');
    expect(isoFromDayOfMonth(2026, 11, 31)).toBe('2026-11-30');
  });

  it('clamps day < 1 to 1', () => {
    expect(isoFromDayOfMonth(2026, 5, 0)).toBe('2026-05-01');
  });
});

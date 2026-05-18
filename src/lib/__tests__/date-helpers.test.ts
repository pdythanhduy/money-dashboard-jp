import {
  daysBetween,
  formatDateJa,
  formatDateVi,
  getDayOfMonth,
  getDaysInMonth,
  getDaysUntilPayday,
  getGreeting,
} from '@/lib/date-helpers';

describe('getDaysInMonth', () => {
  it('January = 31', () => {
    expect(getDaysInMonth(new Date(2026, 0, 15))).toBe(31);
  });
  it('April = 30', () => {
    expect(getDaysInMonth(new Date(2026, 3, 15))).toBe(30);
  });
  it('February 2026 = 28 (non-leap)', () => {
    expect(getDaysInMonth(new Date(2026, 1, 15))).toBe(28);
  });
  it('February 2024 = 29 (leap)', () => {
    expect(getDaysInMonth(new Date(2024, 1, 15))).toBe(29);
  });
});

describe('getDayOfMonth', () => {
  it('returns calendar day-of-month', () => {
    expect(getDayOfMonth(new Date(2026, 4, 19))).toBe(19);
  });
});

describe('getGreeting', () => {
  const at = (h: number, m = 0) => new Date(2026, 4, 19, h, m);
  it('5:00 → morning', () => {
    expect(getGreeting(at(5))).toBe('morning');
  });
  it('10:59 → morning', () => {
    expect(getGreeting(at(10, 59))).toBe('morning');
  });
  it('11:00 → afternoon', () => {
    expect(getGreeting(at(11))).toBe('afternoon');
  });
  it('16:59 → afternoon', () => {
    expect(getGreeting(at(16, 59))).toBe('afternoon');
  });
  it('17:00 → evening', () => {
    expect(getGreeting(at(17))).toBe('evening');
  });
  it('23:00 → evening', () => {
    expect(getGreeting(at(23))).toBe('evening');
  });
  it('4:59 → evening (pre-dawn)', () => {
    expect(getGreeting(at(4, 59))).toBe('evening');
  });
});

describe('getDaysUntilPayday (default 25)', () => {
  it('day 1 → 24 days to payday', () => {
    expect(getDaysUntilPayday(new Date(2026, 4, 1))).toBe(24);
  });
  it('day 24 → 1 day to payday', () => {
    expect(getDaysUntilPayday(new Date(2026, 4, 24))).toBe(1);
  });
  it('day 25 → 0 (payday today)', () => {
    expect(getDaysUntilPayday(new Date(2026, 4, 25))).toBe(0);
  });
  it('day 26 in 31-day month → 30 days (5 + 25)', () => {
    expect(getDaysUntilPayday(new Date(2026, 4, 26))).toBe(30);
  });
  it('day 30 in 30-day month (Apr) → 25 days (0 + 25)', () => {
    expect(getDaysUntilPayday(new Date(2026, 3, 30))).toBe(25);
  });
  it('day 28 in Feb 2026 (28-day month) → 25 days', () => {
    expect(getDaysUntilPayday(new Date(2026, 1, 28))).toBe(25);
  });
  it('day 29 in Feb 2024 (leap) → 25 days', () => {
    expect(getDaysUntilPayday(new Date(2024, 1, 29))).toBe(25);
  });
  it('custom payday 10, day 5 → 5 days', () => {
    expect(getDaysUntilPayday(new Date(2026, 4, 5), 10)).toBe(5);
  });
  it('throws for invalid payday', () => {
    expect(() => getDaysUntilPayday(new Date(), 0)).toThrow(/payday must be/);
    expect(() => getDaysUntilPayday(new Date(), 32)).toThrow(/payday must be/);
    expect(() => getDaysUntilPayday(new Date(), 1.5)).toThrow(/payday must be/);
  });
});

describe('daysBetween', () => {
  it('same day → 0', () => {
    expect(daysBetween(new Date(2026, 4, 19), new Date(2026, 4, 19))).toBe(0);
  });
  it('+1 day', () => {
    expect(daysBetween(new Date(2026, 4, 19), new Date(2026, 4, 20))).toBe(1);
  });
  it('cross-month', () => {
    expect(daysBetween(new Date(2026, 4, 25), new Date(2026, 5, 5))).toBe(11);
  });
  it('past date → negative', () => {
    expect(daysBetween(new Date(2026, 4, 19), new Date(2026, 4, 17))).toBe(-2);
  });
  it('time-of-day ignored', () => {
    expect(
      daysBetween(new Date(2026, 4, 19, 23, 59), new Date(2026, 4, 20, 0, 1)),
    ).toBe(1);
  });
});

describe('formatDateVi / formatDateJa', () => {
  // 2026-05-19 is Tuesday (verified)
  const tue = new Date(2026, 4, 19);
  it('Vietnamese format', () => {
    expect(formatDateVi(tue)).toBe('Thứ Ba, 19/5/2026');
  });
  it('Japanese format', () => {
    expect(formatDateJa(tue)).toBe('火曜日 5月19日');
  });
});

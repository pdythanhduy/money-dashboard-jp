import { computeHourlyAnnual } from '@/lib/hourly-wage-calculator';

describe('computeHourlyAnnual — base only', () => {
  it('¥1,200/h × 8h × 5d × 52w = ¥2,496,000', () => {
    const out = computeHourlyAnnual({ hourlyRate: 1_200, hoursPerDay: 8, daysPerWeek: 5 });
    expect(out.baseAnnual).toBe(2_496_000);
    expect(out.nightAllowanceAnnual).toBe(0);
    expect(out.overtimeAllowanceAnnual).toBe(0);
    expect(out.weekendAllowanceAnnual).toBe(0);
    expect(out.totalAnnual).toBe(2_496_000);
  });

  it('fractional hoursPerDay (7.5h × 5d × 52w × ¥1,200) = 2,340,000', () => {
    const out = computeHourlyAnnual({ hourlyRate: 1_200, hoursPerDay: 7.5, daysPerWeek: 5 });
    expect(out.baseAnnual).toBe(2_340_000);
  });

  it('weeksPerYear override — student semester 40 weeks', () => {
    const out = computeHourlyAnnual({ hourlyRate: 1_200, hoursPerDay: 8, daysPerWeek: 5, weeksPerYear: 40 });
    expect(out.baseAnnual).toBe(1_920_000);
  });

  it('flooring — irregular rate 1207 × 7.5 × 5 × 52 = floor', () => {
    // 1207 × 7.5 × 5 × 52 = 2,353,650 — already integer
    const out = computeHourlyAnnual({ hourlyRate: 1_207, hoursPerDay: 7.5, daysPerWeek: 5 });
    expect(out.baseAnnual).toBe(2_353_650);
  });
});

describe('computeHourlyAnnual — individual allowances', () => {
  const base = { hourlyRate: 1_200, hoursPerDay: 8, daysPerWeek: 5 };

  it('night-only: 4 night hours × 5d × 52w × ¥1,200 × 0.25 = ¥312,000', () => {
    const out = computeHourlyAnnual({ ...base, nightHoursPerDay: 4 });
    expect(out.nightAllowanceAnnual).toBe(312_000);
    expect(out.overtimeAllowanceAnnual).toBe(0);
    expect(out.weekendAllowanceAnnual).toBe(0);
    expect(out.totalAnnual).toBe(2_496_000 + 312_000);
  });

  it('overtime-only: 2 OT hours × 5d × 52w × ¥1,200 × 0.25 = ¥156,000', () => {
    const out = computeHourlyAnnual({ ...base, overtimeHoursPerDay: 2 });
    expect(out.overtimeAllowanceAnnual).toBe(156_000);
    expect(out.totalAnnual).toBe(2_496_000 + 156_000);
  });

  it('weekend-only: 4 weekend days/month × 8h × 12 × ¥1,200 × 0.25 = ¥115,200', () => {
    const out = computeHourlyAnnual({ ...base, weekendDaysPerMonth: 4 });
    expect(out.weekendAllowanceAnnual).toBe(115_200);
    expect(out.totalAnnual).toBe(2_496_000 + 115_200);
  });

  it('all three allowances combined', () => {
    const out = computeHourlyAnnual({
      ...base,
      nightHoursPerDay: 4,
      overtimeHoursPerDay: 2,
      weekendDaysPerMonth: 4,
    });
    expect(out.totalAnnual).toBe(2_496_000 + 312_000 + 156_000 + 115_200);
  });

  it('custom multiplier 1.5× (heavy OT)', () => {
    // 2 OT × 5d × 52w × ¥1,200 × 0.5 = 312,000
    const out = computeHourlyAnnual({ ...base, overtimeHoursPerDay: 2, overtimeMultiplier: 1.5 });
    expect(out.overtimeAllowanceAnnual).toBe(312_000);
  });

  it('zero allowance fields → all allowance amounts = 0', () => {
    const out = computeHourlyAnnual({
      ...base,
      nightHoursPerDay: 0,
      overtimeHoursPerDay: 0,
      weekendDaysPerMonth: 0,
    });
    expect(out.nightAllowanceAnnual).toBe(0);
    expect(out.overtimeAllowanceAnnual).toBe(0);
    expect(out.weekendAllowanceAnnual).toBe(0);
  });
});

describe('computeHourlyAnnual — validation', () => {
  it('throws for negative or zero hourlyRate', () => {
    expect(() => computeHourlyAnnual({ hourlyRate: 0, hoursPerDay: 8, daysPerWeek: 5 })).toThrow(/hourlyRate/);
    expect(() => computeHourlyAnnual({ hourlyRate: -100, hoursPerDay: 8, daysPerWeek: 5 })).toThrow(/hourlyRate/);
  });

  it('throws for hoursPerDay > 24', () => {
    expect(() => computeHourlyAnnual({ hourlyRate: 1_200, hoursPerDay: 25, daysPerWeek: 5 })).toThrow(/hoursPerDay/);
  });

  it('throws for daysPerWeek > 7', () => {
    expect(() => computeHourlyAnnual({ hourlyRate: 1_200, hoursPerDay: 8, daysPerWeek: 8 })).toThrow(/daysPerWeek/);
  });
});

describe('computeHourlyAnnual — edge cases', () => {
  it('daysPerWeek = 0 → baseAnnual = 0, allowances skipped, no throw', () => {
    const out = computeHourlyAnnual({ hourlyRate: 1_200, hoursPerDay: 8, daysPerWeek: 0 });
    expect(out.baseAnnual).toBe(0);
    expect(out.totalAnnual).toBe(0);
  });
});

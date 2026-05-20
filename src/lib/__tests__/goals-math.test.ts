import { computeGoalProjection, DEFAULT_SAVINGS_RATE } from '@/lib/goals-math';

describe('computeGoalProjection — progress + completion', () => {
  it('50% progress: ¥500K saved of ¥1M target', () => {
    const r = computeGoalProjection({ saved: 500_000, target: 1_000_000 });
    expect(r.progressPercent).toBe(0.5);
    expect(r.remaining).toBe(500_000);
    expect(r.isCompleted).toBe(false);
  });

  it('completed: saved >= target', () => {
    const r = computeGoalProjection({ saved: 1_200_000, target: 1_000_000 });
    expect(r.isCompleted).toBe(true);
    expect(r.remaining).toBe(0);
    expect(r.progressPercent).toBeGreaterThan(1);
  });

  it('open-ended (no deadline) → monthly fields undefined', () => {
    const r = computeGoalProjection({ saved: 0, target: 500_000 });
    expect(r.monthsToDeadline).toBeUndefined();
    expect(r.monthlyTarget).toBeUndefined();
    expect(r.savingsRateRequired).toBeUndefined();
  });
});

describe('computeGoalProjection — deadline math', () => {
  // Fix "now" so the deadline math is reproducible.
  const now = new Date('2026-05-20T00:00:00Z');

  it('6 months out, ¥600K remaining → monthlyTarget ¥100K', () => {
    const deadline = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
    const r = computeGoalProjection({ saved: 0, target: 600_000, deadline }, now);
    expect(r.monthsToDeadline).toBe(6);
    expect(r.monthlyTarget).toBe(100_000);
  });

  it('savingsRateRequired = monthlyTarget / takeHomeMonthly', () => {
    const deadline = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
    const r = computeGoalProjection(
      { saved: 0, target: 600_000, deadline, takeHomeMonthly: 250_000 },
      now,
    );
    expect(r.monthlyTarget).toBe(100_000);
    expect(r.savingsRateRequired).toBeCloseTo(0.4, 3);
  });

  it('past deadline → monthsToDeadline = 0, monthlyTarget = full remaining', () => {
    const deadline = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const r = computeGoalProjection({ saved: 100, target: 1_000, deadline }, now);
    expect(r.monthsToDeadline).toBe(0);
    expect(r.monthlyTarget).toBe(900);
  });

  it('today as deadline → monthsToDeadline = 0', () => {
    const r = computeGoalProjection({ saved: 100, target: 1_000, deadline: now.toISOString() }, now);
    expect(r.monthsToDeadline).toBe(0);
  });
});

describe('computeGoalProjection — default-pace projection', () => {
  it('¥1M target, ¥0 saved, ¥300K take-home → 17 months at 20% rate', () => {
    // 300_000 × 0.20 = 60_000 / month; 1_000_000 / 60_000 = 16.67 → ceil 17
    const r = computeGoalProjection({
      saved: 0,
      target: 1_000_000,
      takeHomeMonthly: 300_000,
    });
    expect(r.monthsAtDefaultPace).toBe(17);
  });

  it('completed goal → monthsAtDefaultPace undefined', () => {
    const r = computeGoalProjection({
      saved: 1_000_000,
      target: 500_000,
      takeHomeMonthly: 300_000,
    });
    expect(r.monthsAtDefaultPace).toBeUndefined();
  });

  it('DEFAULT_SAVINGS_RATE is 20%', () => {
    expect(DEFAULT_SAVINGS_RATE).toBe(0.20);
  });
});

describe('computeGoalProjection — validation', () => {
  it('throws on target <= 0', () => {
    expect(() => computeGoalProjection({ saved: 0, target: 0 })).toThrow(/target/);
    expect(() => computeGoalProjection({ saved: 0, target: -100 })).toThrow(/target/);
  });

  it('throws on saved < 0', () => {
    expect(() => computeGoalProjection({ saved: -100, target: 1_000 })).toThrow(/saved/);
  });
});

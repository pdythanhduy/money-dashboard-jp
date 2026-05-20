import {
  buildYearlySummary,
  compareProviders,
  computeAmountVND,
  computeRemittanceGoalProgress,
  TAX_GIFT_THRESHOLD_JPY,
  type RemittanceEntry,
} from '@/lib/remittance-math';

const e = (
  id: string,
  date: string,
  amountJPY: number,
  rate: number,
  provider: RemittanceEntry['provider'] = 'wise',
  feeJPY = 500,
  recipient?: string,
): RemittanceEntry => ({
  id,
  date,
  amountJPY,
  feeJPY,
  exchangeRate: rate,
  amountVND: computeAmountVND(amountJPY, rate),
  provider,
  ...(recipient ? { recipient } : {}),
});

describe('computeAmountVND', () => {
  it('50_000 × 169.5 → 8_475_000 (whole result, no fractional rate)', () => {
    expect(computeAmountVND(50_000, 169.5)).toBe(8_475_000);
  });

  it('floors fractional results', () => {
    expect(computeAmountVND(100, 169.99)).toBe(16_999);
    expect(computeAmountVND(123, 1.337)).toBe(164);
  });

  it('returns 0 for non-finite / non-positive inputs', () => {
    expect(computeAmountVND(0, 169)).toBe(0);
    expect(computeAmountVND(100, 0)).toBe(0);
    expect(computeAmountVND(-10, 169)).toBe(0);
    expect(computeAmountVND(Number.NaN, 169)).toBe(0);
  });
});

describe('buildYearlySummary', () => {
  it('empty input → all zeros, entryCount 0', () => {
    const s = buildYearlySummary([], 2026);
    expect(s.totalSentJPY).toBe(0);
    expect(s.totalSentVND).toBe(0);
    expect(s.entryCount).toBe(0);
    expect(s.bestRate).toBe(0);
    expect(s.worstRate).toBe(0);
    expect(s.avgExchangeRate).toBe(0);
    expect(s.byProvider).toEqual([]);
  });

  it('aggregates totals across 3 same-year entries', () => {
    const entries = [
      e('1', '2026-01-15', 50_000, 170),
      e('2', '2026-06-01', 100_000, 168),
      e('3', '2026-09-01', 50_000, 171),
    ];
    const s = buildYearlySummary(entries, 2026);
    expect(s.entryCount).toBe(3);
    expect(s.totalSentJPY).toBe(200_000);
    expect(s.totalFeesJPY).toBe(1_500);
    expect(s.totalSentVND).toBe(
      computeAmountVND(50_000, 170) +
        computeAmountVND(100_000, 168) +
        computeAmountVND(50_000, 171),
    );
  });

  it('skips entries from other years', () => {
    const entries = [
      e('1', '2025-12-31', 50_000, 170),
      e('2', '2026-01-01', 60_000, 169),
      e('3', '2027-01-01', 70_000, 168),
    ];
    const s = buildYearlySummary(entries, 2026);
    expect(s.entryCount).toBe(1);
    expect(s.totalSentJPY).toBe(60_000);
  });

  it('avgExchangeRate is weighted by amountJPY (not arithmetic mean)', () => {
    // 50K @ 170 + 50K @ 180 → naive = 175; weighted = (50*170 + 50*180)/100 = 175 (same)
    // Use uneven amounts so naive ≠ weighted:
    // 10K @ 200 + 90K @ 170 → naive = 185; weighted = (10*200 + 90*170)/100 = 173
    const entries = [e('1', '2026-01-01', 10_000, 200), e('2', '2026-06-01', 90_000, 170)];
    const s = buildYearlySummary(entries, 2026);
    expect(s.avgExchangeRate).toBeCloseTo(173, 1);
  });

  it('best/worst rate over the year', () => {
    const entries = [
      e('1', '2026-01-01', 1_000, 165),
      e('2', '2026-06-01', 1_000, 172),
      e('3', '2026-09-01', 1_000, 168),
    ];
    const s = buildYearlySummary(entries, 2026);
    expect(s.bestRate).toBe(172);
    expect(s.worstRate).toBe(165);
  });

  it('byProvider aggregates per provider', () => {
    const entries = [
      e('1', '2026-01-01', 50_000, 170, 'wise', 500),
      e('2', '2026-02-01', 30_000, 168, 'wise', 600),
      e('3', '2026-03-01', 40_000, 169, 'remitly', 0),
    ];
    const s = buildYearlySummary(entries, 2026);
    const wise = s.byProvider.find((p) => p.provider === 'wise');
    const remitly = s.byProvider.find((p) => p.provider === 'remitly');
    expect(wise?.count).toBe(2);
    expect(wise?.totalJPY).toBe(80_000);
    expect(wise?.totalFees).toBe(1_100);
    expect(remitly?.count).toBe(1);
    expect(remitly?.totalJPY).toBe(40_000);
  });
});

describe('computeRemittanceGoalProgress', () => {
  it('¥600K of ¥1M target → 60%, remaining ¥400K', () => {
    const r = computeRemittanceGoalProgress(600_000, 1_000_000, new Date('2026-06-30T00:00:00Z'));
    expect(r.percent).toBeCloseTo(0.6, 6);
    expect(r.remaining).toBe(400_000);
  });

  it('daysLeftInYear: 2026-12-15 → 16 days to Dec 31', () => {
    const r = computeRemittanceGoalProgress(0, 1_000_000, new Date('2026-12-15T00:00:00Z'));
    expect(r.daysLeftInYear).toBe(16);
  });

  it('monthlyTargetRemaining = ceil(remaining / daysLeft × 30)', () => {
    // ¥400K remaining, 16 days left → 400_000/16*30 = 750_000
    const r = computeRemittanceGoalProgress(600_000, 1_000_000, new Date('2026-12-15T00:00:00Z'));
    expect(r.monthlyTargetRemaining).toBe(750_000);
  });

  it('target 0 → percent 0, no monthly target', () => {
    const r = computeRemittanceGoalProgress(100, 0);
    expect(r.percent).toBe(0);
    expect(r.monthlyTargetRemaining).toBe(0);
  });
});

describe('compareProviders', () => {
  it('sorts DESC by effectiveRate (rate high + fee low = winner)', () => {
    const entries = [
      // Wise: rate 170, fee tiny → high effective rate
      e('1', '2026-01-01', 100_000, 170, 'wise', 500),
      // Western Union: rate 168, fat fee → lower effective rate
      e('2', '2026-02-01', 100_000, 168, 'western_union', 3_000),
      // Remitly: rate 169, zero fee → between
      e('3', '2026-03-01', 100_000, 169, 'remitly', 0),
    ];
    const ranked = compareProviders(entries);
    expect(ranked.map((r) => r.provider)).toEqual(['wise', 'remitly', 'western_union']);
    expect(ranked[0]!.avgFee).toBe(500);
  });

  it('skips providers without entries (empty input → empty output)', () => {
    expect(compareProviders([])).toEqual([]);
  });
});

describe('TAX_GIFT_THRESHOLD_JPY', () => {
  it('is exactly ¥1,100,000 per recipient per calendar year (暦年贈与)', () => {
    expect(TAX_GIFT_THRESHOLD_JPY).toBe(1_100_000);
  });
});

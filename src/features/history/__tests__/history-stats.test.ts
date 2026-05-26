import {
  computeHistoryStats,
  computeMonthlyTrend,
  filterEntries,
  TREND_MONTHS_BACK,
} from '@/features/history/history-stats';
import type { HistoryEntry } from '@/types/history';
import type { SalaryInput, TakeHomeResult } from '@/types/tax';

function makeResult(overrides: Partial<TakeHomeResult> = {}): TakeHomeResult {
  return {
    grossAnnual:                3_600_000,
    incomeTax:                     68_100,
    residentTax:                  153_500,
    healthInsurance:              177_300,
    pension:                      329_400,
    employmentInsurance:           18_000,
    nationalHealthInsurance:            0,
    nationalPension:                    0,
    totalDeductions:              746_300,
    takeHomeAnnual:             2_853_700,
    takeHomeMonthly:              237_808,
    breakdown: {
      employmentIncomeDeduction:  1_160_000,
      employmentIncome:           2_440_000,
      totalIncome:                2_440_000,
      basicDeductionNationalTax:    580_000,
      basicDeductionResidentTax:    430_000,
      socialInsuranceDeduction:     524_700,
      spouseDeduction:                    0,
      dependentDeduction:                 0,
      workingStudentDeduction:            0,
      idecoDeduction:                     0,
      lifeInsuranceDeductionNational:     0,
      lifeInsuranceDeductionResident:     0,
      earthquakeInsuranceDeduction:       0,
      medicalDeduction:                   0,
      taxableIncomeForNationalTax: 1_335_000,
      taxableIncomeForResidentTax: 1_485_000,
      baseIncomeTax:                 66_750,
      reconstructionSurtax:           1_401,
      residentTaxIncomeBased:       148_500,
      residentTaxPerCapita:           5_000,
      standardMonthlyRemuneration:  300_000,
    },
    ...overrides,
  };
}

function makeEntry(
  ts: number,
  category: 'salary' | 'business',
  takeHomeMonthly: number,
  takeHomeAnnual: number,
  gross: number,
  incomeTax = 68_100,
  residentTax = 153_500,
): HistoryEntry {
  const input: SalaryInput = category === 'salary'
    ? { annualIncome: gross, age: 24, category: 'salary', prefecture: 'tokyo' }
    : { annualIncome: gross, age: 35, category: 'business', municipality: 'osaka-shi' };
  return {
    id: `id-${ts}`,
    timestamp: ts,
    input,
    result: makeResult({
      grossAnnual: gross,
      takeHomeMonthly,
      takeHomeAnnual,
      incomeTax,
      residentTax,
    }),
  };
}

describe('filterEntries', () => {
  const a = makeEntry(1, 'salary', 100, 1200, 1500);
  const b = makeEntry(2, 'business', 200, 2400, 3000);

  it('all returns shallow copy of input', () => {
    const out = filterEntries([a, b], 'all');
    expect(out).toEqual([a, b]);
    expect(out).not.toBe([a, b]);
  });
  it('salary filter keeps only salary', () => {
    expect(filterEntries([a, b], 'salary')).toEqual([a]);
  });
  it('business filter keeps only business', () => {
    expect(filterEntries([a, b], 'business')).toEqual([b]);
  });
});

describe('computeHistoryStats — empty', () => {
  it('returns zeros for empty input', () => {
    const stats = computeHistoryStats([], 'all');
    expect(stats.totalCount).toBe(0);
    expect(stats.highestTakeHome).toBe(0);
    expect(stats.averageTakeHome).toBe(0);
    expect(stats.totalTaxEstimated).toBe(0);
    expect(stats.filteredEntries).toEqual([]);
    // monthlyTrend always materializes TREND_MONTHS_BACK slots even on
    // empty input — the chart needs a stable x-axis. Every slot is null.
    expect(stats.monthlyTrend).toHaveLength(TREND_MONTHS_BACK);
    expect(stats.monthlyTrend.every((p) => p.takeHome === null)).toBe(true);
  });
});

describe('computeHistoryStats — single entry', () => {
  it('highest = average = the single value', () => {
    const e = makeEntry(1000, 'salary', 250_000, 3_000_000, 3_600_000);
    const stats = computeHistoryStats([e], 'all');
    expect(stats.totalCount).toBe(1);
    expect(stats.highestTakeHome).toBe(250_000);
    expect(stats.averageTakeHome).toBe(250_000);
    expect(stats.totalTaxEstimated).toBe(68_100 + 153_500);
  });
});

describe('computeHistoryStats — multiple entries', () => {
  const entries = [
    makeEntry(3000, 'salary',   200_000, 2_400_000, 3_000_000, 60_000, 120_000),
    makeEntry(1000, 'salary',   300_000, 3_600_000, 4_500_000, 80_000, 160_000),
    makeEntry(2000, 'business', 400_000, 4_800_000, 6_000_000, 100_000, 200_000),
  ];

  it('aggregates count, highest, average, total tax across ALL entries', () => {
    const stats = computeHistoryStats(entries, 'salary');
    expect(stats.totalCount).toBe(3);
    expect(stats.highestTakeHome).toBe(400_000);
    // (200_000 + 300_000 + 400_000) / 3 = 300_000
    expect(stats.averageTakeHome).toBe(300_000);
    expect(stats.totalTaxEstimated).toBe(60_000 + 120_000 + 80_000 + 160_000 + 100_000 + 200_000);
  });

  it('filteredEntries respects filter; aggregates do not', () => {
    const stats = computeHistoryStats(entries, 'business');
    expect(stats.filteredEntries).toHaveLength(1);
    expect(stats.filteredEntries[0]?.input.category).toBe('business');
    // headline still over all 3
    expect(stats.totalCount).toBe(3);
  });

  it('monthlyTrend always renders TREND_MONTHS_BACK consecutive slots', () => {
    const stats = computeHistoryStats(entries, 'all');
    expect(stats.monthlyTrend).toHaveLength(TREND_MONTHS_BACK);
    // Slots are oldest-first; year/month strictly increasing.
    for (let i = 1; i < stats.monthlyTrend.length; i += 1) {
      const prev = stats.monthlyTrend[i - 1]!;
      const cur = stats.monthlyTrend[i]!;
      expect(cur.yearMonth > prev.yearMonth).toBe(true);
    }
  });

  it('monthlyTrend uses takeHomeMonthly and monthly gross (annual / 12)', () => {
    // Place all 3 fixture entries in the same calendar month (today) so
    // only the newest survives the per-month dedup.
    const now = Date.now();
    const recentEntries = [
      makeEntry(now - 2000, 'salary', 200_000, 2_400_000, 3_000_000),
      makeEntry(now - 1000, 'salary', 300_000, 3_600_000, 4_500_000),
      makeEntry(now,        'salary', 400_000, 4_800_000, 6_000_000),
    ];
    const stats = computeHistoryStats(recentEntries, 'all');
    const lastSlot = stats.monthlyTrend[stats.monthlyTrend.length - 1]!;
    expect(lastSlot.takeHome).toBe(400_000); // newest wins per-month
    expect(lastSlot.gross).toBe(Math.floor(6_000_000 / 12));
  });
});

// ----------------------------------------------------------------------------
// Focused tests for computeMonthlyTrend (deterministic via fixed reference)
// ----------------------------------------------------------------------------

describe('computeMonthlyTrend', () => {
  /** Fixed reference month so the rolling window is reproducible. */
  const REFERENCE = new Date(2026, 5, 15); // 2026-06-15 (month is 0-indexed)
  // Helpers — convert local YYYY-MM-day to a timestamp deterministically.
  const ts = (year: number, monthOneBased: number, day = 15): number =>
    new Date(year, monthOneBased - 1, day).getTime();

  it('returns N consecutive months ending at reference (oldest first)', () => {
    const out = computeMonthlyTrend([], 6, REFERENCE);
    expect(out.map((p) => p.yearMonth)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ]);
    expect(out.every((p) => p.takeHome === null && p.gross === null)).toBe(true);
  });

  it('places an entry in the calendar month it was created (local time)', () => {
    const entry = makeEntry(ts(2026, 4, 10), 'salary', 250_000, 3_000_000, 4_000_000);
    const out = computeMonthlyTrend([entry], 6, REFERENCE);
    const april = out.find((p) => p.yearMonth === '2026-04')!;
    expect(april.takeHome).toBe(250_000);
    expect(april.gross).toBe(Math.floor(4_000_000 / 12));
    // Other months stay null.
    expect(out.filter((p) => p.takeHome !== null)).toHaveLength(1);
  });

  it('within a month, the most-recent entry wins (later timestamp)', () => {
    const early = makeEntry(ts(2026, 3, 5),  'salary', 200_000, 2_400_000, 3_000_000);
    const late  = makeEntry(ts(2026, 3, 28), 'salary', 280_000, 3_360_000, 4_200_000);
    const out = computeMonthlyTrend([early, late], 6, REFERENCE);
    const march = out.find((p) => p.yearMonth === '2026-03')!;
    expect(march.takeHome).toBe(280_000);
  });

  it('drops entries older than the window', () => {
    const old = makeEntry(ts(2025, 11, 15), 'salary', 999_999, 1, 1);
    const recent = makeEntry(ts(2026, 6, 1), 'salary', 250_000, 3_000_000, 4_000_000);
    const out = computeMonthlyTrend([old, recent], 6, REFERENCE);
    // 2025-11 falls outside [2026-01 .. 2026-06] → not surfaced.
    expect(out.find((p) => p.takeHome === 999_999)).toBeUndefined();
    expect(out.find((p) => p.yearMonth === '2026-06')?.takeHome).toBe(250_000);
  });

  it('handles a sparse trend (gaps create null slots)', () => {
    const entries = [
      makeEntry(ts(2026, 1, 20), 'salary', 220_000, 2_640_000, 3_300_000),
      makeEntry(ts(2026, 4, 20), 'salary', 260_000, 3_120_000, 3_900_000),
      makeEntry(ts(2026, 6, 20), 'salary', 280_000, 3_360_000, 4_200_000),
    ];
    const out = computeMonthlyTrend(entries, 6, REFERENCE);
    const takeHomes = out.map((p) => p.takeHome);
    expect(takeHomes).toEqual([
      220_000, // 2026-01
      null,    // 2026-02 (gap)
      null,    // 2026-03 (gap)
      260_000, // 2026-04
      null,    // 2026-05 (gap)
      280_000, // 2026-06
    ]);
  });

  it('respects custom monthsBack', () => {
    const out = computeMonthlyTrend([], 3, REFERENCE);
    expect(out.map((p) => p.yearMonth)).toEqual(['2026-04', '2026-05', '2026-06']);
  });
});

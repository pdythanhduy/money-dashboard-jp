import { computeHistoryStats, filterEntries } from '@/features/history/history-stats';
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
    expect(stats.trendData).toEqual([]);
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

  it('trendData is sorted ascending by timestamp', () => {
    const stats = computeHistoryStats(entries, 'all');
    expect(stats.trendData.map((p) => p.date)).toEqual([1000, 2000, 3000]);
  });

  it('trendData uses takeHomeMonthly and monthly gross (annual / 12)', () => {
    const stats = computeHistoryStats(entries, 'all');
    expect(stats.trendData[0]).toEqual({
      date: 1000,
      takeHome: 300_000,
      gross: Math.floor(4_500_000 / 12),
    });
  });
});

import { computeDashboardData } from '@/features/dashboard/dashboard-logic';
import type { TakeHomeResult } from '@/types/tax';

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

describe('computeDashboardData — no stored result', () => {
  it('returns hasData=false but still fills time fields', () => {
    const now = new Date(2026, 4, 19, 10, 30); // Tue May 19 2026, 10:30
    const data = computeDashboardData(now, null);
    expect(data.hasData).toBe(false);
    expect(data.greeting).toBe('morning');
    expect(data.daysInMonth).toBe(31);
    expect(data.daysPassed).toBe(19);
    expect(data.daysUntilPayday).toBe(6);
    expect(data.proportionalTakeHome).toBe(0);
    expect(data.monthlyTakeHome).toBe(0);
  });
});

describe('computeDashboardData — with stored result', () => {
  const result = makeResult();

  it('day 1 of 31-day month → small proportional (~1/31)', () => {
    const data = computeDashboardData(new Date(2026, 4, 1, 9), result);
    expect(data.hasData).toBe(true);
    expect(data.daysInMonth).toBe(31);
    expect(data.daysPassed).toBe(1);
    // 237,808 × 1/31 = 7,671.22... → floor = 7,671
    expect(data.proportionalTakeHome).toBe(7_671);
    expect(data.monthlyTakeHome).toBe(237_808);
  });

  it('mid-month (day 15 of 31) → roughly half', () => {
    const data = computeDashboardData(new Date(2026, 4, 15, 12), result);
    // 237,808 × 15/31 = 115,068.387... → floor = 115,068
    expect(data.proportionalTakeHome).toBe(115_068);
  });

  it('last day of 30-day month → full monthly', () => {
    const data = computeDashboardData(new Date(2026, 3, 30, 23), result);
    expect(data.daysInMonth).toBe(30);
    expect(data.daysPassed).toBe(30);
    expect(data.proportionalTakeHome).toBe(237_808);
  });

  it('Feb 28 → full monthly (28-day month)', () => {
    const data = computeDashboardData(new Date(2026, 1, 28), result);
    expect(data.daysInMonth).toBe(28);
    expect(data.daysPassed).toBe(28);
    expect(data.proportionalTakeHome).toBe(237_808);
  });

  it('retention rate = takeHome / gross', () => {
    const data = computeDashboardData(new Date(2026, 4, 19), result);
    expect(data.retentionRate).toBeCloseTo(2_853_700 / 3_600_000, 4);
  });

  it('averageDaily = monthlyTakeHome / daysInMonth, floored', () => {
    const data = computeDashboardData(new Date(2026, 4, 19), result);
    // 237,808 / 31 = 7,671.22 → 7,671
    expect(data.averageDaily).toBe(7_671);
  });

  it('proportionalTax = (incomeTax + residentTax) / 12 × ratio', () => {
    const data = computeDashboardData(new Date(2026, 4, 31), result);
    // monthly tax = (68,100 + 153,500) / 12 = floor(18,466.66) = 18,466
    // proportional × 31/31 = 18,466
    expect(data.proportionalTax).toBe(18_466);
  });

  it('isPayday true on the 25th', () => {
    expect(computeDashboardData(new Date(2026, 4, 25), result).isPayday).toBe(true);
    expect(computeDashboardData(new Date(2026, 4, 24), result).isPayday).toBe(false);
    expect(computeDashboardData(new Date(2026, 4, 26), result).isPayday).toBe(false);
  });
});

describe('computeDashboardData — upcoming reminders', () => {
  const result = makeResult();

  it('includes 確定申告 deadline before March 15', () => {
    const data = computeDashboardData(new Date(2027, 1, 1), result);
    const kakutei = data.upcomingReminders.find((r) => r.i18nKey === 'kakuteiShinkoku');
    expect(kakutei).toBeDefined();
    // Feb 1 → March 15 = 42 days
    expect(kakutei?.daysLeft).toBe(42);
  });

  it('rolls forward 確定申告 after March 15 passes', () => {
    const data = computeDashboardData(new Date(2026, 5, 1), result); // Jun 1 2026
    const kakutei = data.upcomingReminders.find((r) => r.i18nKey === 'kakuteiShinkoku');
    expect(kakutei).toBeDefined();
    // Should point to 2027-03-15
    expect(kakutei?.date.getFullYear()).toBe(2027);
  });

  it('filters out past dates', () => {
    const data = computeDashboardData(new Date(2027, 0, 1), result); // Jan 1 2027
    // Dec 31 2027 is in the future
    const zairyu = data.upcomingReminders.find((r) => r.i18nKey === 'zairyuCard');
    expect(zairyu?.daysLeft).toBeGreaterThanOrEqual(0);
  });

  it('sorted ascending by daysLeft', () => {
    const data = computeDashboardData(new Date(2026, 4, 19), result);
    const days = data.upcomingReminders.map((r) => r.daysLeft);
    expect(days).toEqual([...days].sort((a, b) => a - b));
  });
});

describe('computeDashboardData — payday override', () => {
  const result = makeResult();
  // 2026-05-19 (Tue). Day 19. Payday default 25 → 6 days until payday.
  const now = new Date(2026, 4, 19);

  it('falls back to DEFAULT_PAYDAY (25) when payday omitted', () => {
    expect(computeDashboardData(now, result).daysUntilPayday).toBe(6);
  });

  it('respects payday from settings — payday=10 (already past), rolls to next month', () => {
    // Day 19, payday 10 → past. Next: (31 - 19) + 10 = 22.
    const data = computeDashboardData(now, result, 10);
    expect(data.daysUntilPayday).toBe(22);
    expect(data.isPayday).toBe(false);
  });
});

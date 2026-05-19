import {
  deductibleAmount,
  effectiveThreshold,
  estimatedTaxRefund,
  MEDICAL_DEDUCTION_FLAT_THRESHOLD,
  MEDICAL_DEDUCTION_MAX,
  netExpense,
  pickMarginalRate,
  totalNetExpenses,
  type MedicalExpense,
} from '@/lib/medical-deduction';

function makeExpense(overrides: Partial<MedicalExpense> = {}): MedicalExpense {
  return {
    id: 'e-1',
    date: '2026-05-01',
    amount: 10_000,
    category: 'doctor_visit',
    ...overrides,
  };
}

describe('netExpense', () => {
  it('subtracts reimbursedAmount', () => {
    expect(netExpense(makeExpense({ amount: 10_000, reimbursedAmount: 3_000 }))).toBe(7_000);
  });

  it('clamps to 0 when reimbursement exceeds amount', () => {
    expect(netExpense(makeExpense({ amount: 5_000, reimbursedAmount: 8_000 }))).toBe(0);
  });

  it('uses 0 when reimbursedAmount missing', () => {
    expect(netExpense(makeExpense({ amount: 4_500 }))).toBe(4_500);
  });
});

describe('totalNetExpenses', () => {
  it('returns 0 for empty array', () => {
    expect(totalNetExpenses([])).toBe(0);
  });
  it('sums net values across multiple entries', () => {
    const items: MedicalExpense[] = [
      makeExpense({ id: 'a', amount: 10_000 }),
      makeExpense({ id: 'b', amount: 20_000, reimbursedAmount: 5_000 }),
      makeExpense({ id: 'c', amount: 7_500 }),
    ];
    expect(totalNetExpenses(items)).toBe(10_000 + 15_000 + 7_500);
  });
});

describe('effectiveThreshold', () => {
  it('income ¥3M → flat ¥100,000 cap wins (5% = ¥150,000)', () => {
    expect(effectiveThreshold(3_000_000)).toBe(MEDICAL_DEDUCTION_FLAT_THRESHOLD);
  });

  it('income ¥1.5M → ratio cap ¥75,000 wins (lower-income bonus)', () => {
    expect(effectiveThreshold(1_500_000)).toBe(75_000);
  });

  it('income 0 / negative / non-finite → flat ¥100,000 fallback', () => {
    expect(effectiveThreshold(0)).toBe(MEDICAL_DEDUCTION_FLAT_THRESHOLD);
    expect(effectiveThreshold(-500)).toBe(MEDICAL_DEDUCTION_FLAT_THRESHOLD);
    expect(effectiveThreshold(Number.NaN)).toBe(MEDICAL_DEDUCTION_FLAT_THRESHOLD);
  });
});

describe('deductibleAmount', () => {
  const income = 5_000_000; // threshold ¥100,000

  it('total ¥150,000 vs ¥100,000 threshold → ¥50,000', () => {
    const items = [makeExpense({ amount: 150_000 })];
    expect(deductibleAmount(items, income)).toBe(50_000);
  });

  it('total ¥80,000 (under threshold) → 0', () => {
    const items = [makeExpense({ amount: 80_000 })];
    expect(deductibleAmount(items, income)).toBe(0);
  });

  it('huge total caps at MEDICAL_DEDUCTION_MAX (¥2,000,000)', () => {
    const items = [makeExpense({ amount: 5_000_000 })];
    expect(deductibleAmount(items, 10_000_000)).toBe(MEDICAL_DEDUCTION_MAX);
  });
});

describe('estimatedTaxRefund', () => {
  it('¥100,000 deductible × 0.20 marginal + 0.10 住民 = ¥30,000', () => {
    expect(estimatedTaxRefund(100_000, 0.20)).toBe(30_000);
  });

  it('zero deductible → 0', () => {
    expect(estimatedTaxRefund(0, 0.33)).toBe(0);
  });
});

describe('pickMarginalRate', () => {
  it('¥3,000,000 taxable → 10%', () => {
    expect(pickMarginalRate(3_000_000)).toBe(0.10);
  });

  it('¥5,000,000 taxable → 20%', () => {
    expect(pickMarginalRate(5_000_000)).toBe(0.20);
  });

  it('¥1,000,000 taxable → 5%', () => {
    expect(pickMarginalRate(1_000_000)).toBe(0.05);
  });

  it('zero / negative → 0 (no marginal rate)', () => {
    expect(pickMarginalRate(0)).toBe(0);
    expect(pickMarginalRate(-100)).toBe(0);
  });
});

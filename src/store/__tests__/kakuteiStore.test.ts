jest.mock('@react-native-async-storage/async-storage', () => {
  let storage: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((k: string) => Promise.resolve(storage[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        storage[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete storage[k];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storage = {};
        return Promise.resolve();
      }),
    },
  };
});

import type { KakuteiSummary } from '@/lib/kakutei-shinkoku';
import { useKakuteiStore } from '@/store/kakuteiStore';

beforeEach(() => {
  useKakuteiStore.getState().resetDraft();
});

function fakeSummary(): KakuteiSummary {
  return {
    fiscalYear: 2025,
    grossIncome: 3_000_000,
    employmentIncomeAmount: 2_020_000,
    deductions: [{ key: 'basic', amount: 580_000 }],
    totalDeductions: 580_000,
    taxableIncome: 1_440_000,
    estimatedIncomeTax: 73_400,
    withheldTax: 100_000,
    refundOrDue: -26_600,
    isRefund: true,
    residentTaxImpact: 144_000,
  };
}

describe('kakuteiStore — defaults', () => {
  it('default fiscalYear is "current year - 1" (filing in early N is for N-1)', () => {
    const d = useKakuteiStore.getState().draft;
    expect(d.fiscalYear).toBe(new Date().getFullYear() - 1);
    expect(d.lifeInsurancePremium).toBe(0);
    expect(d.earthquakeInsurancePremium).toBe(0);
    expect(d.publicPensionContribution).toBe(0);
    expect(d.completedAt).toBeUndefined();
    expect(d.lastSummary).toBeUndefined();
  });
});

describe('kakuteiStore.updateDraftField', () => {
  it('sets one field, leaves others untouched', () => {
    const { updateDraftField, draft } = useKakuteiStore.getState();
    const originalYear = draft.fiscalYear;
    updateDraftField('lifeInsurancePremium', 60_000);
    const d = useKakuteiStore.getState().draft;
    expect(d.lifeInsurancePremium).toBe(60_000);
    expect(d.fiscalYear).toBe(originalYear);
    expect(d.earthquakeInsurancePremium).toBe(0);
  });

  it('clamps negative / NaN to 0', () => {
    const { updateDraftField } = useKakuteiStore.getState();
    updateDraftField('earthquakeInsurancePremium', -500);
    expect(useKakuteiStore.getState().draft.earthquakeInsurancePremium).toBe(0);
    updateDraftField('earthquakeInsurancePremium', Number.NaN);
    expect(useKakuteiStore.getState().draft.earthquakeInsurancePremium).toBe(0);
  });
});

describe('kakuteiStore.saveSummary', () => {
  it('caches summary + sets completedAt to a parseable ISO string', () => {
    const before = Date.now();
    useKakuteiStore.getState().saveSummary(fakeSummary());
    const d = useKakuteiStore.getState().draft;
    expect(d.lastSummary?.refundOrDue).toBe(-26_600);
    expect(d.completedAt).toBeDefined();
    const at = new Date(d.completedAt!).getTime();
    expect(at).toBeGreaterThanOrEqual(before);
  });
});

describe('kakuteiStore.resetDraft', () => {
  it('wipes manual inputs, summary, and completedAt back to defaults', () => {
    const { updateDraftField, saveSummary, resetDraft } = useKakuteiStore.getState();
    updateDraftField('lifeInsurancePremium', 60_000);
    saveSummary(fakeSummary());
    resetDraft();
    const d = useKakuteiStore.getState().draft;
    expect(d.lifeInsurancePremium).toBe(0);
    expect(d.lastSummary).toBeUndefined();
    expect(d.completedAt).toBeUndefined();
  });
});

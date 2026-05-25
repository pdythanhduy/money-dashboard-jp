/**
 * Test the historyStore against its public actions. We mock AsyncStorage
 * (in-memory) and expo-crypto so the store is fully importable in jest.
 */

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

jest.mock('expo-crypto', () => {
  let n = 0;
  return {
    randomUUID: jest.fn(() => `uuid-${++n}`),
  };
});

import { MAX_ENTRIES, useHistoryStore } from '@/store/historyStore';
import type { SalaryInput, TakeHomeResult } from '@/types/tax';

const fakeInput: SalaryInput = {
  annualIncome: 3_600_000,
  age: 24,
  category: 'salary',
  prefecture: 'tokyo',
};

const fakeResult: TakeHomeResult = {
  grossAnnual: 3_600_000,
  incomeTax: 68_100,
  residentTax: 153_500,
  healthInsurance: 177_300,
  pension: 329_400,
  employmentInsurance: 18_000,
  nationalHealthInsurance: 0,
  nationalPension: 0,
  totalDeductions: 746_300,
  takeHomeAnnual: 2_853_700,
  takeHomeMonthly: 237_808,
  breakdown: {
    employmentIncomeDeduction: 1_160_000,
    employmentIncome: 2_440_000,
    totalIncome: 2_440_000,
    basicDeductionNationalTax: 580_000,
    basicDeductionResidentTax: 430_000,
    socialInsuranceDeduction: 524_700,
    spouseDeduction: 0,
    dependentDeduction: 0,
    workingStudentDeduction: 0,
    idecoDeduction: 0,
    lifeInsuranceDeductionNational: 0,
    lifeInsuranceDeductionResident: 0,
    taxableIncomeForNationalTax: 1_335_000,
    taxableIncomeForResidentTax: 1_485_000,
    baseIncomeTax: 66_750,
    reconstructionSurtax: 1_401,
    residentTaxIncomeBased: 148_500,
    residentTaxPerCapita: 5_000,
    standardMonthlyRemuneration: 300_000,
  },
};

beforeEach(() => {
  useHistoryStore.setState({ entries: [], migratedFromLatest: false });
});

describe('historyStore.addEntry', () => {
  it('adds an entry and returns added=true', () => {
    const r = useHistoryStore.getState().addEntry(fakeInput, fakeResult, 'My label', 'A note');
    expect(r.added).toBe(true);
    expect(r.entry?.label).toBe('My label');
    expect(r.entry?.note).toBe('A note');
    expect(r.entry?.id).toMatch(/^uuid-/);
    expect(useHistoryStore.getState().entries).toHaveLength(1);
  });

  it('keeps entries sorted descending by timestamp', () => {
    const realNow = Date.now;
    const times = [1000, 3000, 2000];
    let i = 0;
    Date.now = jest.fn(() => times[i++]!);
    try {
      useHistoryStore.getState().addEntry(fakeInput, fakeResult);
      useHistoryStore.getState().addEntry(fakeInput, fakeResult);
      useHistoryStore.getState().addEntry(fakeInput, fakeResult);
      const entries = useHistoryStore.getState().entries;
      expect(entries.map((e) => e.timestamp)).toEqual([3000, 2000, 1000]);
    } finally {
      Date.now = realNow;
    }
  });

  it('refuses to add past MAX_ENTRIES', () => {
    const store = useHistoryStore.getState();
    // Seed at exactly the cap.
    const stub = Array.from({ length: MAX_ENTRIES }, (_, i) => ({
      id: `seed-${i}`,
      timestamp: i,
      input: fakeInput,
      result: fakeResult,
    }));
    useHistoryStore.setState({ entries: stub });
    const r = store.addEntry(fakeInput, fakeResult);
    expect(r.added).toBe(false);
    expect(r.reason).toBe('limit_reached');
    expect(useHistoryStore.getState().entries).toHaveLength(MAX_ENTRIES);
  });
});

describe('historyStore.updateEntry / deleteEntry / clearAll / getEntryById', () => {
  it('updateEntry mutates only label/note of matching id', () => {
    const r = useHistoryStore.getState().addEntry(fakeInput, fakeResult);
    const id = r.entry!.id;
    useHistoryStore.getState().updateEntry(id, { label: 'New name' });
    const found = useHistoryStore.getState().getEntryById(id);
    expect(found?.label).toBe('New name');
  });

  it('deleteEntry removes the entry', () => {
    const a = useHistoryStore.getState().addEntry(fakeInput, fakeResult).entry!;
    const b = useHistoryStore.getState().addEntry(fakeInput, fakeResult).entry!;
    useHistoryStore.getState().deleteEntry(a.id);
    const remaining = useHistoryStore.getState().entries;
    expect(remaining).toHaveLength(1);
    expect(remaining[0]!.id).toBe(b.id);
  });

  it('clearAll wipes the array', () => {
    useHistoryStore.getState().addEntry(fakeInput, fakeResult);
    useHistoryStore.getState().addEntry(fakeInput, fakeResult);
    useHistoryStore.getState().clearAll();
    expect(useHistoryStore.getState().entries).toEqual([]);
  });

  it('getEntryById returns undefined for missing id', () => {
    expect(useHistoryStore.getState().getEntryById('nope')).toBeUndefined();
  });
});

describe('historyStore.seedFromLatest', () => {
  it('seeds one entry when both stores empty', () => {
    useHistoryStore.getState().seedFromLatest(fakeInput, fakeResult);
    const s = useHistoryStore.getState();
    expect(s.entries).toHaveLength(1);
    expect(s.migratedFromLatest).toBe(true);
  });

  it('is idempotent — second call does nothing', () => {
    useHistoryStore.getState().seedFromLatest(fakeInput, fakeResult);
    useHistoryStore.getState().seedFromLatest(fakeInput, fakeResult);
    expect(useHistoryStore.getState().entries).toHaveLength(1);
  });

  it('does NOT seed when entries already exist', () => {
    useHistoryStore.getState().addEntry(fakeInput, fakeResult);
    useHistoryStore.getState().seedFromLatest(fakeInput, fakeResult);
    expect(useHistoryStore.getState().entries).toHaveLength(1);
  });
});

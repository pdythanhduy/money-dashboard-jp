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
  return { randomUUID: jest.fn(() => `exp-${++n}`) };
});

import { MAX_EXPENSES, useMedicalExpensesStore } from '@/store/medicalExpensesStore';

beforeEach(() => {
  useMedicalExpensesStore.setState({ expenses: [] });
});

describe('medicalExpensesStore.addExpense', () => {
  it('returns added=true with id and persists receiptImageUri', () => {
    const r = useMedicalExpensesStore.getState().addExpense({
      date: '2026-05-01',
      amount: 12_500,
      category: 'dental',
      provider: 'クリニックABC',
      receiptImageUri: 'file:///doc/receipts/abc.jpg',
    });
    expect(r.added).toBe(true);
    expect(r.expense?.id).toMatch(/^exp-/);
    expect(r.expense?.receiptImageUri).toBe('file:///doc/receipts/abc.jpg');
    expect(r.expense?.provider).toBe('クリニックABC');
  });

  it('refuses past MAX_EXPENSES', () => {
    const store = useMedicalExpensesStore.getState();
    for (let i = 0; i < MAX_EXPENSES; i++) {
      store.addExpense({ date: '2026-01-01', amount: 1_000, category: 'other' });
    }
    const r = store.addExpense({ date: '2026-01-02', amount: 999, category: 'pharmacy' });
    expect(r.added).toBe(false);
    expect(r.reason).toBe('limit_reached');
    expect(useMedicalExpensesStore.getState().expenses).toHaveLength(MAX_EXPENSES);
  });

  it('keeps list sorted DESC by date', () => {
    const store = useMedicalExpensesStore.getState();
    store.addExpense({ date: '2026-03-15', amount: 100, category: 'other' });
    store.addExpense({ date: '2026-07-01', amount: 200, category: 'other' });
    store.addExpense({ date: '2026-01-01', amount: 300, category: 'other' });
    const dates = useMedicalExpensesStore.getState().expenses.map((e) => e.date);
    expect(dates).toEqual(['2026-07-01', '2026-03-15', '2026-01-01']);
  });
});

describe('medicalExpensesStore.updateExpense', () => {
  it('mutates only matching id; re-sorts when date changes', () => {
    const { addExpense, updateExpense } = useMedicalExpensesStore.getState();
    const a = addExpense({ date: '2026-01-01', amount: 100, category: 'other' }).expense!;
    addExpense({ date: '2026-06-01', amount: 200, category: 'other' });
    updateExpense(a.id, { date: '2026-12-31', amount: 999 });
    const list = useMedicalExpensesStore.getState().expenses;
    expect(list[0]?.id).toBe(a.id);
    expect(list[0]?.amount).toBe(999);
  });
});

describe('medicalExpensesStore.removeExpense + clearAll + getExpense', () => {
  it('remove deletes one, clearAll wipes, getExpense returns undefined for missing', () => {
    const { addExpense, removeExpense, clearAll, getExpense } = useMedicalExpensesStore.getState();
    const a = addExpense({ date: '2026-04-01', amount: 100, category: 'other' }).expense!;
    addExpense({ date: '2026-05-01', amount: 200, category: 'other' });
    expect(getExpense('nope')).toBeUndefined();
    removeExpense(a.id);
    expect(useMedicalExpensesStore.getState().expenses).toHaveLength(1);
    clearAll();
    expect(useMedicalExpensesStore.getState().expenses).toEqual([]);
  });
});

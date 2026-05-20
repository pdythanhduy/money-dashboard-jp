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
  return { randomUUID: jest.fn(() => `kak-${++n}`) };
});

import { MAX_ENTRIES, useKakeiboStore } from '@/store/kakeiboStore';

beforeEach(() => {
  useKakeiboStore.setState({ entries: [], budgets: [] });
});

describe('kakeiboStore.addEntry', () => {
  it('returns added=true with id, persists optional fields, sorts DESC', () => {
    const r1 = useKakeiboStore.getState().addEntry({
      date: '2026-04-15',
      amount: 80_000,
      category: 'rent',
      label: 'Aoyama 1LDK',
      isRecurring: true,
    });
    expect(r1.added).toBe(true);
    expect(r1.entry?.id).toMatch(/^kak-/);
    expect(r1.entry?.isRecurring).toBe(true);
    useKakeiboStore.getState().addEntry({
      date: '2026-05-01',
      amount: 1_200,
      category: 'food',
      label: 'Lawson',
    });
    const dates = useKakeiboStore.getState().entries.map((e) => e.date);
    expect(dates).toEqual(['2026-05-01', '2026-04-15']);
  });

  it('refuses past MAX_ENTRIES with reason=limit_reached', () => {
    const store = useKakeiboStore.getState();
    // Fast-path: jam state directly to MAX_ENTRIES instead of looping addEntry
    // 5000 times — same observable behavior, far cheaper.
    const filler = Array.from({ length: MAX_ENTRIES }, (_, i) => ({
      id: `seed-${i}`,
      date: '2026-01-01',
      amount: 1,
      category: 'other' as const,
    }));
    useKakeiboStore.setState({ entries: filler });
    const r = store.addEntry({ date: '2026-02-01', amount: 2, category: 'food' });
    expect(r.added).toBe(false);
    expect(r.reason).toBe('limit_reached');
    expect(useKakeiboStore.getState().entries).toHaveLength(MAX_ENTRIES);
  });
});

describe('kakeiboStore.updateEntry + removeEntry + clearEntries', () => {
  it('updateEntry mutates only matching id and re-sorts on date change', () => {
    const { addEntry, updateEntry } = useKakeiboStore.getState();
    const a = addEntry({ date: '2026-05-01', amount: 100, category: 'food' }).entry!;
    addEntry({ date: '2026-05-10', amount: 200, category: 'food' });
    updateEntry(a.id, { date: '2026-05-20', amount: 999 });
    const list = useKakeiboStore.getState().entries;
    expect(list[0]?.id).toBe(a.id);
    expect(list[0]?.amount).toBe(999);
  });

  it('removeEntry deletes one, clearEntries wipes all (budgets stay)', () => {
    const { addEntry, setBudget, removeEntry, clearEntries } = useKakeiboStore.getState();
    const a = addEntry({ date: '2026-05-01', amount: 100, category: 'food' }).entry!;
    addEntry({ date: '2026-05-02', amount: 200, category: 'rent' });
    setBudget('food', 30_000);

    removeEntry(a.id);
    expect(useKakeiboStore.getState().entries).toHaveLength(1);

    clearEntries();
    expect(useKakeiboStore.getState().entries).toEqual([]);
    expect(useKakeiboStore.getState().budgets).toHaveLength(1);
  });
});

describe('kakeiboStore.setBudget', () => {
  it('add new category, update existing, remove with limit=0', () => {
    const { setBudget, getBudget } = useKakeiboStore.getState();
    setBudget('food', 30_000);
    expect(getBudget('food')?.monthlyLimit).toBe(30_000);

    setBudget('food', 35_000);
    expect(getBudget('food')?.monthlyLimit).toBe(35_000);
    expect(useKakeiboStore.getState().budgets).toHaveLength(1);

    setBudget('food', 0);
    expect(getBudget('food')).toBeUndefined();
    expect(useKakeiboStore.getState().budgets).toEqual([]);
  });

  it('setBudgets bulk-replaces, dropping zero/negative rows', () => {
    useKakeiboStore.getState().setBudgets([
      { category: 'rent', monthlyLimit: 80_000 },
      { category: 'food', monthlyLimit: 30_000 },
      { category: 'other', monthlyLimit: 0 },
    ]);
    const b = useKakeiboStore.getState().budgets;
    expect(b).toHaveLength(2);
    expect(b.map((x) => x.category).sort()).toEqual(['food', 'rent']);
  });
});

describe('kakeiboStore.clearAll', () => {
  it('wipes both entries and budgets', () => {
    const { addEntry, setBudget, clearAll } = useKakeiboStore.getState();
    addEntry({ date: '2026-05-01', amount: 100, category: 'food' });
    setBudget('food', 30_000);
    clearAll();
    expect(useKakeiboStore.getState().entries).toEqual([]);
    expect(useKakeiboStore.getState().budgets).toEqual([]);
  });
});

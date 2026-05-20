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
  return { randomUUID: jest.fn(() => `rem-${++n}`) };
});

import { computeAmountVND } from '@/lib/remittance-math';
import { MAX_ENTRIES, useRemittanceStore } from '@/store/remittanceStore';

beforeEach(() => {
  useRemittanceStore.setState({ entries: [], annualGoalJPY: 0 });
});

describe('remittanceStore.addEntry', () => {
  it('returns added=true, computes amountVND, persists optional fields, sorts DESC', () => {
    const r = useRemittanceStore.getState().addEntry({
      date: '2026-04-20',
      amountJPY: 50_000,
      feeJPY: 500,
      exchangeRate: 169.5,
      provider: 'wise',
      recipient: 'Mẹ',
    });
    expect(r.added).toBe(true);
    expect(r.entry?.id).toMatch(/^rem-/);
    expect(r.entry?.amountVND).toBe(computeAmountVND(50_000, 169.5));
    expect(r.entry?.recipient).toBe('Mẹ');

    useRemittanceStore.getState().addEntry({
      date: '2026-05-01',
      amountJPY: 30_000,
      feeJPY: 0,
      exchangeRate: 170,
      provider: 'remitly',
    });
    const dates = useRemittanceStore.getState().entries.map((e) => e.date);
    expect(dates).toEqual(['2026-05-01', '2026-04-20']);
  });

  it('refuses past MAX_ENTRIES', () => {
    const filler = Array.from({ length: MAX_ENTRIES }, (_, i) => ({
      id: `seed-${i}`,
      date: '2026-01-01',
      amountJPY: 1_000,
      feeJPY: 0,
      exchangeRate: 169,
      amountVND: 169_000,
      provider: 'other' as const,
    }));
    useRemittanceStore.setState({ entries: filler });
    const r = useRemittanceStore.getState().addEntry({
      date: '2026-02-01',
      amountJPY: 5_000,
      feeJPY: 0,
      exchangeRate: 170,
      provider: 'wise',
    });
    expect(r.added).toBe(false);
    expect(r.reason).toBe('limit_reached');
    expect(useRemittanceStore.getState().entries).toHaveLength(MAX_ENTRIES);
  });
});

describe('remittanceStore.updateEntry', () => {
  it('re-computes amountVND when amountJPY or exchangeRate changes', () => {
    const { addEntry, updateEntry, getEntry } = useRemittanceStore.getState();
    const a = addEntry({
      date: '2026-05-01',
      amountJPY: 50_000,
      feeJPY: 500,
      exchangeRate: 169,
      provider: 'wise',
    }).entry!;
    const originalVND = a.amountVND;

    updateEntry(a.id, { exchangeRate: 172 });
    const updated = getEntry(a.id)!;
    expect(updated.exchangeRate).toBe(172);
    expect(updated.amountVND).toBe(computeAmountVND(50_000, 172));
    expect(updated.amountVND).not.toBe(originalVND);

    updateEntry(a.id, { amountJPY: 100_000 });
    expect(getEntry(a.id)!.amountVND).toBe(computeAmountVND(100_000, 172));
  });

  it('leaves amountVND alone when only metadata changes (note/recipient)', () => {
    const { addEntry, updateEntry, getEntry } = useRemittanceStore.getState();
    const a = addEntry({
      date: '2026-05-01',
      amountJPY: 50_000,
      feeJPY: 0,
      exchangeRate: 169,
      provider: 'wise',
    }).entry!;
    const before = getEntry(a.id)!.amountVND;
    updateEntry(a.id, { recipient: 'Em trai' });
    const after = getEntry(a.id)!;
    expect(after.amountVND).toBe(before);
    expect(after.recipient).toBe('Em trai');
  });
});

describe('remittanceStore.setAnnualGoal', () => {
  it('persists positive values; clamps negatives to 0', () => {
    const { setAnnualGoal } = useRemittanceStore.getState();
    setAnnualGoal(1_000_000);
    expect(useRemittanceStore.getState().annualGoalJPY).toBe(1_000_000);
    setAnnualGoal(-50);
    expect(useRemittanceStore.getState().annualGoalJPY).toBe(0);
  });
});

describe('remittanceStore.removeEntry + clearAll', () => {
  it('remove deletes one; clearAll wipes entries AND resets goal', () => {
    const { addEntry, removeEntry, clearAll, setAnnualGoal } = useRemittanceStore.getState();
    const a = addEntry({
      date: '2026-05-01',
      amountJPY: 50_000,
      feeJPY: 500,
      exchangeRate: 169,
      provider: 'wise',
    }).entry!;
    addEntry({
      date: '2026-06-01',
      amountJPY: 30_000,
      feeJPY: 200,
      exchangeRate: 170,
      provider: 'remitly',
    });
    setAnnualGoal(500_000);

    removeEntry(a.id);
    expect(useRemittanceStore.getState().entries).toHaveLength(1);
    expect(useRemittanceStore.getState().annualGoalJPY).toBe(500_000);

    clearAll();
    expect(useRemittanceStore.getState().entries).toEqual([]);
    expect(useRemittanceStore.getState().annualGoalJPY).toBe(0);
  });
});

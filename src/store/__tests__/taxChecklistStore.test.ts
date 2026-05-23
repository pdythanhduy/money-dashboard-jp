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

import { useTaxChecklistStore } from '@/store/taxChecklistStore';

beforeEach(() => {
  useTaxChecklistStore.setState({ byYear: {} });
});

describe('taxChecklistStore — defaults', () => {
  it('starts with no checked items', () => {
    expect(useTaxChecklistStore.getState().countChecked(2026)).toBe(0);
    expect(useTaxChecklistStore.getState().isYearComplete(2026)).toBe(false);
    expect(useTaxChecklistStore.getState().getItem(2026, 'gensen')).toBeUndefined();
  });
});

describe('taxChecklistStore — setChecked / toggle', () => {
  it('setChecked persists the boolean for that year × item', () => {
    useTaxChecklistStore.getState().setChecked(2026, 'gensen', true);
    expect(useTaxChecklistStore.getState().getItem(2026, 'gensen')?.checked).toBe(true);
    expect(useTaxChecklistStore.getState().countChecked(2026)).toBe(1);
  });

  it('toggleItem flips between true / false', () => {
    const { toggleItem, getItem } = useTaxChecklistStore.getState();
    toggleItem(2026, 'furusato');
    expect(getItem(2026, 'furusato')?.checked).toBe(true);
    toggleItem(2026, 'furusato');
    expect(getItem(2026, 'furusato')?.checked).toBe(false);
  });

  it('separate years do not bleed into each other', () => {
    const { setChecked, countChecked } = useTaxChecklistStore.getState();
    setChecked(2025, 'gensen', true);
    setChecked(2025, 'kakutei', true);
    expect(countChecked(2025)).toBe(2);
    expect(countChecked(2026)).toBe(0);
  });
});

describe('taxChecklistStore — note', () => {
  it('setNote attaches text without flipping checked', () => {
    const { setNote, getItem } = useTaxChecklistStore.getState();
    setNote(2026, 'medical', '医療費 receipts in drawer');
    expect(getItem(2026, 'medical')?.note).toBe('医療費 receipts in drawer');
    expect(getItem(2026, 'medical')?.checked).toBe(false);
  });

  it('setNote with empty string drops the note field', () => {
    const { setNote, setChecked, getItem } = useTaxChecklistStore.getState();
    setChecked(2026, 'medical', true);
    setNote(2026, 'medical', 'temp');
    expect(getItem(2026, 'medical')?.note).toBe('temp');
    setNote(2026, 'medical', '');
    expect(getItem(2026, 'medical')?.note).toBeUndefined();
    // Checked state preserved.
    expect(getItem(2026, 'medical')?.checked).toBe(true);
  });
});

describe('taxChecklistStore — isYearComplete', () => {
  it('true only when all 5 canonical items are checked for that year', () => {
    const { setChecked, isYearComplete } = useTaxChecklistStore.getState();
    setChecked(2026, 'gensen', true);
    setChecked(2026, 'kakutei', true);
    setChecked(2026, 'furusato', true);
    setChecked(2026, 'medical', true);
    expect(isYearComplete(2026)).toBe(false); // dependent missing
    setChecked(2026, 'dependent', true);
    expect(isYearComplete(2026)).toBe(true);
  });

  it('un-checking any one item flips back to incomplete', () => {
    const { setChecked, isYearComplete } = useTaxChecklistStore.getState();
    for (const id of ['gensen', 'kakutei', 'furusato', 'medical', 'dependent'] as const) {
      setChecked(2026, id, true);
    }
    expect(isYearComplete(2026)).toBe(true);
    setChecked(2026, 'kakutei', false);
    expect(isYearComplete(2026)).toBe(false);
  });
});

describe('taxChecklistStore — clearAll', () => {
  it('wipes all years (used by Settings → Clear all data)', () => {
    const { setChecked, clearAll } = useTaxChecklistStore.getState();
    setChecked(2024, 'gensen', true);
    setChecked(2025, 'kakutei', true);
    setChecked(2026, 'medical', true);
    clearAll();
    expect(useTaxChecklistStore.getState().byYear).toEqual({});
  });
});

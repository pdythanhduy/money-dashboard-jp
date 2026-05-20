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
  return { randomUUID: jest.fn(() => `fur-${++n}`) };
});

import { MAX_DONATIONS, useFurusatoStore } from '@/store/furusatoStore';

beforeEach(() => {
  useFurusatoStore.setState({ donations: [] });
});

describe('furusatoStore.addDonation', () => {
  it('returns added=true with id and persists portalSite + giftName', () => {
    const r = useFurusatoStore.getState().addDonation({
      date: '2026-05-01',
      amount: 10_000,
      targetMunicipality: '大阪市',
      giftName: '和牛 500g',
      portalSite: 'satofuru',
    });
    expect(r.added).toBe(true);
    expect(r.donation?.id).toMatch(/^fur-/);
    expect(r.donation?.giftName).toBe('和牛 500g');
    expect(r.donation?.portalSite).toBe('satofuru');
  });

  it('refuses past MAX_DONATIONS', () => {
    const store = useFurusatoStore.getState();
    for (let i = 0; i < MAX_DONATIONS; i++) {
      store.addDonation({ date: '2026-01-01', amount: 1_000, targetMunicipality: 'X' });
    }
    const r = store.addDonation({ date: '2026-02-01', amount: 2_000, targetMunicipality: 'Y' });
    expect(r.added).toBe(false);
    expect(r.reason).toBe('limit_reached');
    expect(useFurusatoStore.getState().donations).toHaveLength(MAX_DONATIONS);
  });

  it('keeps list sorted DESC by date', () => {
    const store = useFurusatoStore.getState();
    store.addDonation({ date: '2026-03-15', amount: 100, targetMunicipality: 'A' });
    store.addDonation({ date: '2026-07-01', amount: 200, targetMunicipality: 'B' });
    store.addDonation({ date: '2026-01-01', amount: 300, targetMunicipality: 'C' });
    const dates = useFurusatoStore.getState().donations.map((d) => d.date);
    expect(dates).toEqual(['2026-07-01', '2026-03-15', '2026-01-01']);
  });
});

describe('furusatoStore.updateDonation', () => {
  it('mutates only matching id; re-sorts on date change', () => {
    const { addDonation, updateDonation } = useFurusatoStore.getState();
    const a = addDonation({ date: '2026-01-01', amount: 100, targetMunicipality: 'A' }).donation!;
    addDonation({ date: '2026-06-01', amount: 200, targetMunicipality: 'B' });
    updateDonation(a.id, { date: '2026-12-31', amount: 999 });
    const list = useFurusatoStore.getState().donations;
    expect(list[0]?.id).toBe(a.id);
    expect(list[0]?.amount).toBe(999);
  });
});

describe('furusatoStore.removeDonation + clearAll + getDonation', () => {
  it('remove deletes one, clearAll wipes, getDonation returns undefined for missing', () => {
    const { addDonation, removeDonation, clearAll, getDonation } = useFurusatoStore.getState();
    const a = addDonation({ date: '2026-04-01', amount: 100, targetMunicipality: 'A' }).donation!;
    addDonation({ date: '2026-05-01', amount: 200, targetMunicipality: 'B' });
    expect(getDonation('nope')).toBeUndefined();
    removeDonation(a.id);
    expect(useFurusatoStore.getState().donations).toHaveLength(1);
    clearAll();
    expect(useFurusatoStore.getState().donations).toEqual([]);
  });
});

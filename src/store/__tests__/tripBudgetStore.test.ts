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
  return { randomUUID: jest.fn(() => `tb-${++n}`) };
});

import {
  MAX_TRIPS,
  useTripBudgetStore,
} from '@/store/tripBudgetStore';

beforeEach(() => {
  useTripBudgetStore.setState({ trips: [] });
});

describe('tripBudgetStore.addTrip', () => {
  it('adds a trip with sane defaults + sort by startDate DESC', () => {
    const s = useTripBudgetStore.getState();
    s.addTrip({
      title: 'Kyoto',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    });
    const r = s.addTrip({
      title: 'Tokyo biz',
      type: 'business',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      companyAdvanceAmount: 50_000,
    });
    expect(r.ok).toBe(true);
    expect(r.trip?.status).toBe('planned');
    expect(r.trip?.currency).toBe('JPY');
    expect(useTripBudgetStore.getState().trips.map((t) => t.title)).toEqual([
      'Tokyo biz',
      'Kyoto',
    ]);
  });

  it('rejects with invalid_input when end < start', () => {
    const r = useTripBudgetStore.getState().addTrip({
      title: 'Bad',
      type: 'travel',
      startDate: '2026-06-15',
      endDate: '2026-06-10',
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });

  it('rejects with invalid_input when title is blank', () => {
    const r = useTripBudgetStore.getState().addTrip({
      title: '   ',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });

  it('limit_reached past MAX_TRIPS', () => {
    const filler = Array.from({ length: MAX_TRIPS }, (_, i) => ({
      id: `seed-${i}`,
      title: `T${i}`,
      type: 'travel' as const,
      status: 'planned' as const,
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      currency: 'JPY' as const,
      plannedItems: [],
      actualExpenses: [],
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
    }));
    useTripBudgetStore.setState({ trips: filler });
    const r = useTripBudgetStore.getState().addTrip({
      title: 'overflow',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('limit_reached');
  });
});

describe('tripBudgetStore.updateTrip + deleteTrip + clearTrips', () => {
  it('updateTrip mutates fields + bumps updatedAt', async () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    await new Promise((r) => setTimeout(r, 5));
    const r = s.updateTrip(a.id, { title: 'A renamed' });
    expect(r.ok).toBe(true);
    const updated = useTripBudgetStore.getState().getTrip(a.id)!;
    expect(updated.title).toBe('A renamed');
    expect(updated.updatedAt).not.toBe(updated.createdAt);
  });

  it('deleteTrip drops the row; not_found on bogus id', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    expect(s.deleteTrip('does-not-exist').reason).toBe('not_found');
    s.deleteTrip(a.id);
    expect(useTripBudgetStore.getState().trips).toEqual([]);
  });

  it('clearTrips wipes everything', () => {
    const s = useTripBudgetStore.getState();
    s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    });
    s.clearTrips();
    expect(useTripBudgetStore.getState().trips).toEqual([]);
  });
});

describe('tripBudgetStore — nested items', () => {
  it('addPlanItem appends to the trip + rejects 0/negative amounts', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const r = s.addPlanItem(a.id, { category: 'hotel', plannedAmount: 30_000 });
    expect(r.ok).toBe(true);
    expect(r.item?.category).toBe('hotel');
    expect(useTripBudgetStore.getState().getTrip(a.id)?.plannedItems).toHaveLength(1);

    const bad = s.addPlanItem(a.id, { category: 'food', plannedAmount: 0 });
    expect(bad.reason).toBe('invalid_input');
  });

  it('addActualExpense appends + supports reimbursable flag + rejects bad date', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'Biz',
      type: 'business',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      companyAdvanceAmount: 50_000,
    }).trip!;
    const r = s.addActualExpense(a.id, {
      date: '2026-06-11',
      category: 'hotel',
      amount: 30_000,
      reimbursable: true,
    });
    expect(r.ok).toBe(true);
    expect(r.item?.reimbursable).toBe(true);

    const bad = s.addActualExpense(a.id, {
      date: 'nope',
      category: 'food',
      amount: 1_000,
    });
    expect(bad.reason).toBe('invalid_input');
  });
});

describe('tripBudgetStore — lifecycle transitions', () => {
  it('markTripCompleted flips status to completed', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    s.markTripCompleted(a.id);
    expect(useTripBudgetStore.getState().getTrip(a.id)?.status).toBe('completed');
  });

  it('cancelTrip flips status to cancelled', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    s.cancelTrip(a.id);
    expect(useTripBudgetStore.getState().getTrip(a.id)?.status).toBe('cancelled');
  });
});

describe('tripBudgetStore — strict calendar-date validation', () => {
  it('addTrip rejects 2026-02-31 (impossible calendar date)', () => {
    const r = useTripBudgetStore.getState().addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-02-31',
      endDate: '2026-03-05',
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });

  it('addTrip rejects 2026-13-01 (month out of range)', () => {
    const r = useTripBudgetStore.getState().addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-13-01',
      endDate: '2026-13-05',
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });

  it('addTrip rejects 2026-00-10 (zero month)', () => {
    const r = useTripBudgetStore.getState().addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-00-10',
      endDate: '2026-01-15',
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });

  it('addActualExpense rejects invalid calendar date 2026-02-31', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const r = s.addActualExpense(a.id, {
      date: '2026-02-31',
      category: 'food',
      amount: 1_000,
    });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });
});

describe('tripBudgetStore — updateTrip merged-candidate validation', () => {
  it('rejects when changing only startDate pushes it past existing endDate', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const r = s.updateTrip(a.id, { startDate: '2026-06-20' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
    expect(useTripBudgetStore.getState().getTrip(a.id)?.startDate).toBe('2026-06-10');
  });

  it('rejects when changing only endDate pulls it before existing startDate', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const r = s.updateTrip(a.id, { endDate: '2026-06-05' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });

  it('rejects empty title update', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const r = s.updateTrip(a.id, { title: '   ' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });

  it('rejects negative companyAdvanceAmount', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'Biz',
      type: 'business',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const r = s.updateTrip(a.id, { companyAdvanceAmount: -1_000 });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });

  it('rejects when startDate is updated to an impossible calendar date', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const r = s.updateTrip(a.id, { startDate: '2026-02-31' });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_input');
  });
});

describe('tripBudgetStore — item update validation', () => {
  it('updatePlanItem rejects plannedAmount <= 0', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const p = s.addPlanItem(a.id, { category: 'hotel', plannedAmount: 30_000 }).item!;
    expect(s.updatePlanItem(a.id, p.id, { plannedAmount: 0 }).reason).toBe('invalid_input');
    expect(s.updatePlanItem(a.id, p.id, { plannedAmount: -100 }).reason).toBe('invalid_input');
    expect(useTripBudgetStore.getState().getTrip(a.id)?.plannedItems[0]?.plannedAmount).toBe(30_000);
  });

  it('updateActualExpense rejects amount <= 0', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const e = s.addActualExpense(a.id, {
      date: '2026-06-11',
      category: 'food',
      amount: 5_000,
    }).item!;
    expect(s.updateActualExpense(a.id, e.id, { amount: 0 }).reason).toBe('invalid_input');
    expect(useTripBudgetStore.getState().getTrip(a.id)?.actualExpenses[0]?.amount).toBe(5_000);
  });

  it('updateActualExpense rejects invalid ISO date', () => {
    const s = useTripBudgetStore.getState();
    const a = s.addTrip({
      title: 'A',
      type: 'travel',
      startDate: '2026-06-10',
      endDate: '2026-06-12',
    }).trip!;
    const e = s.addActualExpense(a.id, {
      date: '2026-06-11',
      category: 'food',
      amount: 5_000,
    }).item!;
    expect(s.updateActualExpense(a.id, e.id, { date: '2026-02-31' }).reason).toBe(
      'invalid_input',
    );
    expect(useTripBudgetStore.getState().getTrip(a.id)?.actualExpenses[0]?.date).toBe('2026-06-11');
  });
});

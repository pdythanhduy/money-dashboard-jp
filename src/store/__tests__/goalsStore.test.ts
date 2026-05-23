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
  return { randomUUID: jest.fn(() => `goal-${++n}`) };
});

import {
  getGoalCategory,
  getGoalStatus,
  getSavedTotal,
  isGoalCompleted,
  MAX_GOALS,
  useGoalsStore,
} from '@/store/goalsStore';

beforeEach(() => {
  useGoalsStore.setState({ goals: [] });
});

describe('goalsStore.addGoal', () => {
  it('persists icon + deadline + note; returns added=true with id', () => {
    const r = useGoalsStore.getState().addGoal({
      title: 'Mua iPhone 15',
      icon: 'phone',
      targetAmount: 150_000,
      deadline: '2026-12-31',
      note: 'Pro Max 256GB',
    });
    expect(r.added).toBe(true);
    expect(r.goal?.id).toMatch(/^goal-/);
    expect(r.goal?.icon).toBe('phone');
    expect(r.goal?.deadline).toBe('2026-12-31');
    expect(r.goal?.note).toBe('Pro Max 256GB');
    expect(r.goal?.contributions).toEqual([]);
  });

  it('refuses past MAX_GOALS', () => {
    const store = useGoalsStore.getState();
    for (let i = 0; i < MAX_GOALS; i++) {
      store.addGoal({ title: `G${i}`, icon: 'piggy', targetAmount: 1_000 });
    }
    const r = store.addGoal({ title: 'too many', icon: 'piggy', targetAmount: 1_000 });
    expect(r.added).toBe(false);
    expect(r.reason).toBe('limit_reached');
    expect(useGoalsStore.getState().goals).toHaveLength(MAX_GOALS);
  });
});

describe('goalsStore.addSavings', () => {
  it('appends a contribution; getSavedTotal sums them', () => {
    const { addGoal, addSavings } = useGoalsStore.getState();
    const g = addGoal({ title: 'Tết về VN', icon: 'airplane', targetAmount: 500_000 }).goal!;
    addSavings(g.id, { date: '2026-05-01', amount: 50_000 });
    addSavings(g.id, { date: '2026-05-15', amount: 30_000, note: 'thưởng' });
    const updated = useGoalsStore.getState().getGoal(g.id)!;
    expect(updated.contributions).toHaveLength(2);
    expect(getSavedTotal(updated)).toBe(80_000);
    expect(updated.contributions[0]?.note).toBe('thưởng');
  });

  it('isGoalCompleted flips when contributions reach target', () => {
    const { addGoal, addSavings } = useGoalsStore.getState();
    const g = addGoal({ title: 'Mini', icon: 'star', targetAmount: 1_000 }).goal!;
    addSavings(g.id, { date: '2026-05-01', amount: 600 });
    expect(isGoalCompleted(useGoalsStore.getState().getGoal(g.id)!)).toBe(false);
    addSavings(g.id, { date: '2026-05-02', amount: 500 });
    expect(isGoalCompleted(useGoalsStore.getState().getGoal(g.id)!)).toBe(true);
  });
});

describe('goalsStore sort order — active goals first, then completed', () => {
  it('puts a fully-funded goal AFTER newer active goals', () => {
    const { addGoal, addSavings } = useGoalsStore.getState();
    // First goal: will be completed
    const done = addGoal({ title: 'Done', icon: 'star', targetAmount: 100 }).goal!;
    addSavings(done.id, { date: '2026-05-01', amount: 100 });
    // Second goal: active, added LATER → should still sort first (active group, newest)
    addGoal({ title: 'Active newer', icon: 'piggy', targetAmount: 1_000 });
    // Third goal: active, added latest → should be at top of active group
    addGoal({ title: 'Active newest', icon: 'piggy', targetAmount: 2_000 });

    const titles = useGoalsStore.getState().goals.map((g) => g.title);
    expect(titles).toEqual(['Active newest', 'Active newer', 'Done']);
  });
});

describe('goalsStore.updateGoal + removeGoal + removeSavings + clearAll', () => {
  it('update mutates only matching id; remove deletes; clearAll wipes', () => {
    const { addGoal, addSavings, updateGoal, removeGoal, removeSavings, clearAll, getGoal } =
      useGoalsStore.getState();
    const g = addGoal({ title: 'Old', icon: 'piggy', targetAmount: 1_000 }).goal!;
    addSavings(g.id, { date: '2026-05-01', amount: 100 });
    const c1 = useGoalsStore.getState().getGoal(g.id)!.contributions[0]!;

    updateGoal(g.id, { title: 'New title', targetAmount: 2_000 });
    expect(getGoal(g.id)?.title).toBe('New title');
    expect(getGoal(g.id)?.targetAmount).toBe(2_000);
    // createdAt + contributions preserved
    expect(getGoal(g.id)?.contributions).toHaveLength(1);

    removeSavings(g.id, c1.id);
    expect(getGoal(g.id)?.contributions).toEqual([]);

    removeGoal(g.id);
    expect(useGoalsStore.getState().goals).toEqual([]);

    addGoal({ title: 'X', icon: 'piggy', targetAmount: 10 });
    clearAll();
    expect(useGoalsStore.getState().goals).toEqual([]);
  });
});

describe('goalsStore — category + monthlyContribution + status (CP2 extensions)', () => {
  it('persists category and monthlyContribution from addGoal input', () => {
    const r = useGoalsStore.getState().addGoal({
      title: 'Về Tết',
      icon: 'airplane',
      targetAmount: 200_000,
      category: 'home_visit',
      monthlyContribution: 25_000,
    });
    expect(r.goal?.category).toBe('home_visit');
    expect(r.goal?.monthlyContribution).toBe(25_000);
    expect(r.goal?.updatedAt).toBeDefined();
  });

  it('getGoalCategory defaults to "other" for legacy goals lacking the field', () => {
    useGoalsStore.setState({
      goals: [
        {
          id: 'legacy',
          title: 'Old',
          icon: 'piggy',
          targetAmount: 1_000,
          createdAt: '2026-01-01T00:00:00.000Z',
          contributions: [],
        },
      ],
    });
    const g = useGoalsStore.getState().getGoal('legacy')!;
    expect(getGoalCategory(g)).toBe('other');
  });

  it('getGoalStatus derives "active" from contributions when status field is absent', () => {
    useGoalsStore.setState({
      goals: [
        {
          id: 'legacy-active',
          title: 'Old',
          icon: 'piggy',
          targetAmount: 1_000,
          createdAt: '2026-01-01T00:00:00.000Z',
          contributions: [{ id: 'c', date: '2026-05-01', amount: 100 }],
        },
        {
          id: 'legacy-done',
          title: 'Old',
          icon: 'piggy',
          targetAmount: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
          contributions: [{ id: 'c', date: '2026-05-01', amount: 100 }],
        },
      ],
    });
    expect(getGoalStatus(useGoalsStore.getState().getGoal('legacy-active')!)).toBe('active');
    expect(getGoalStatus(useGoalsStore.getState().getGoal('legacy-done')!)).toBe('completed');
  });
});

describe('goalsStore — lifecycle transitions', () => {
  it('pauseGoal / resumeGoal / cancelGoal / markGoalCompleted flip status and bump updatedAt', () => {
    const { addGoal, pauseGoal, resumeGoal, cancelGoal, markGoalCompleted, getGoal } =
      useGoalsStore.getState();
    const g = addGoal({ title: 'Q', icon: 'piggy', targetAmount: 1_000 }).goal!;
    expect(getGoal(g.id)?.updatedAt).toBeDefined();

    pauseGoal(g.id);
    expect(getGoal(g.id)?.status).toBe('paused');
    expect(getGoal(g.id)?.updatedAt).toBeDefined();

    resumeGoal(g.id);
    expect(getGoal(g.id)?.status).toBe('active');

    cancelGoal(g.id);
    expect(getGoal(g.id)?.status).toBe('cancelled');

    markGoalCompleted(g.id);
    expect(getGoal(g.id)?.status).toBe('completed');
    expect(isGoalCompleted(getGoal(g.id)!)).toBe(true);
  });

  it('sort order: active → paused → completed/cancelled', () => {
    const { addGoal, pauseGoal, cancelGoal, markGoalCompleted } = useGoalsStore.getState();
    const a = addGoal({ title: 'Active', icon: 'piggy', targetAmount: 1_000 }).goal!;
    const p = addGoal({ title: 'Paused', icon: 'piggy', targetAmount: 1_000 }).goal!;
    const c = addGoal({ title: 'Cancelled', icon: 'piggy', targetAmount: 1_000 }).goal!;
    const d = addGoal({ title: 'Done', icon: 'piggy', targetAmount: 1_000 }).goal!;
    pauseGoal(p.id);
    cancelGoal(c.id);
    markGoalCompleted(d.id);
    const titles = useGoalsStore.getState().goals.map((g) => g.title);
    // Active first; remaining order determined by createdAt within group.
    expect(titles[0]).toBe('Active');
    // Paused before completed/cancelled.
    expect(titles.indexOf('Paused')).toBeLessThan(titles.indexOf('Done'));
    expect(titles.indexOf('Paused')).toBeLessThan(titles.indexOf('Cancelled'));
    // a.id, p.id, c.id, d.id all used.
    expect([a.id, p.id, c.id, d.id]).toHaveLength(4);
  });
});

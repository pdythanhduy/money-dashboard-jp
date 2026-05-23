import React from 'react';

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
  return { randomUUID: jest.fn(() => `ap-${++n}`) };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void | Promise<void>) => void;
  create: (el: React.ReactElement) => { unmount: () => void };
};

import { useRecurringSync } from '@/features/kakeibo/hooks/useRecurringSync';
import { useKakeiboStore } from '@/store/kakeiboStore';

/**
 * Tiny host component so the hook can mount + run its effect under
 * react-test-renderer. We never read from this component — the
 * assertion looks at store state instead.
 */
function HookHost() {
  useRecurringSync();
  return null;
}

beforeEach(() => {
  useKakeiboStore.setState({ entries: [], budgets: [], recurrings: [] });
});

describe('useRecurringSync × autoPost gating', () => {
  it('does NOT auto-create an entry for a due recurring with autoPost=false (default)', () => {
    // Yesterday so today >= dayOfMonth → due.
    const yesterday = new Date();
    yesterday.setDate(Math.max(1, yesterday.getDate() - 1));
    useKakeiboStore.getState().addRecurring({
      name: 'Tiền điện',
      amount: 8_000,
      category: 'utilities',
      dayOfMonth: yesterday.getDate(),
      // autoPost omitted → defaults false
    });

    let r!: ReturnType<typeof TestRenderer.create>;
    TestRenderer.act(() => {
      r = TestRenderer.create(<HookHost />);
    });
    expect(useKakeiboStore.getState().entries).toHaveLength(0);
    expect(useKakeiboStore.getState().recurrings[0]?.lastGeneratedYearMonth).toBeUndefined();
    TestRenderer.act(() => r.unmount());
  });

  it('auto-creates exactly one entry per month for due recurring with autoPost=true', () => {
    const yesterday = new Date();
    yesterday.setDate(Math.max(1, yesterday.getDate() - 1));
    useKakeiboStore.getState().addRecurring({
      name: 'Rent',
      amount: 80_000,
      category: 'rent',
      dayOfMonth: yesterday.getDate(),
      autoPost: true,
    });

    let r!: ReturnType<typeof TestRenderer.create>;
    TestRenderer.act(() => {
      r = TestRenderer.create(<HookHost />);
    });
    expect(useKakeiboStore.getState().entries).toHaveLength(1);
    expect(useKakeiboStore.getState().entries[0]?.amount).toBe(80_000);
    expect(useKakeiboStore.getState().recurrings[0]?.lastGeneratedYearMonth).toMatch(/^\d{4}-\d{2}$/);
    TestRenderer.act(() => r.unmount());
  });

  it('toggleRecurringAutoPost flips the autoPost flag', () => {
    const { addRecurring, toggleRecurringAutoPost, getRecurring } = useKakeiboStore.getState();
    const a = addRecurring({
      name: 'Wifi',
      amount: 4_500,
      category: 'communication',
      dayOfMonth: 5,
    }).recurring!;
    expect(getRecurring(a.id)?.autoPost).toBe(false);
    toggleRecurringAutoPost(a.id);
    expect(getRecurring(a.id)?.autoPost).toBe(true);
    toggleRecurringAutoPost(a.id);
    expect(getRecurring(a.id)?.autoPost).toBe(false);
  });

  it('pending recurring can be manually materialized via addEntry + markRecurringGenerated', () => {
    // Simulate what the "Thêm vào tháng này" button does.
    const { addRecurring, addEntry, markRecurringGenerated, getRecurring } = useKakeiboStore.getState();
    const yesterday = new Date();
    yesterday.setDate(Math.max(1, yesterday.getDate() - 1));
    const a = addRecurring({
      name: 'Gas',
      amount: 3_200,
      category: 'utilities',
      dayOfMonth: yesterday.getDate(),
    }).recurring!;

    const ym = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}`;
    addEntry({
      date: `${ym}-${String(yesterday.getDate()).padStart(2, '0')}`,
      amount: a.amount,
      category: a.category,
      label: a.name,
      isRecurring: true,
    });
    markRecurringGenerated(a.id, ym);

    expect(useKakeiboStore.getState().entries[0]?.label).toBe('Gas');
    expect(getRecurring(a.id)?.lastGeneratedYearMonth).toBe(ym);
  });
});

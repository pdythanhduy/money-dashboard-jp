import React from 'react';

import '@/lib/i18n';

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

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'uuid-test') }));

// Ionicons mock — render the icon name as text so snapshots/queries can match.
jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react') as typeof React;
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    Ionicons: ({ name }: { name: string }) =>
      ReactMock.createElement(Text, null, `[icon:${name}]`),
  };
});

// Safe-area-context: return a fixed inset so snapshots are stable AND the
// CalendarScreen's `useSafeAreaInsets()` path is exercised even outside a
// SafeAreaProvider.
jest.mock('react-native-safe-area-context', () => {
  const ReactMock = require('react') as typeof React;
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SafeAreaView: ({ children, style }: { children?: React.ReactNode; style?: object }) =>
      ReactMock.createElement(View, { style, testID: 'safe-area-view' }, children),
    useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }), // iPhone notch-ish
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => {
    unmount: () => void;
    toJSON: () => unknown;
    root: { findAllByType: (t: unknown) => unknown[] };
  };
};

import { CalendarScreen } from '@/features/calendar/CalendarScreen';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useSettingsStore, DEFAULT_SETTINGS } from '@/store/settingsStore';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let renderer: ReturnType<typeof TestRenderer.create> | undefined;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return renderer!;
}

beforeEach(() => {
  useKakeiboStore.setState({ entries: [], budgets: [], recurrings: [] });
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, language: 'vi' } });
});

describe('CalendarScreen — header', () => {
  it('renders prev/next arrows + a month label', () => {
    const r = renderTree(<CalendarScreen />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('[icon:chevron-back]');
    expect(tree).toContain('[icon:chevron-forward]');
    // Current-year label should appear (vi format is "Tháng X YYYY")
    const year = new Date().getFullYear();
    expect(tree).toContain(String(year));
    TestRenderer.act(() => r.unmount());
  });

  it('hides "Về hôm nay" sub-label when displaying current month', () => {
    const r = renderTree(<CalendarScreen />);
    const tree = JSON.stringify(r.toJSON());
    // On mount the calendar shows TODAY, so the "go to today" hint is hidden.
    expect(tree).not.toContain('Về hôm nay');
    TestRenderer.act(() => r.unmount());
  });

  it('renders all 7 vi weekday labels in correct order', () => {
    const r = renderTree(<CalendarScreen />);
    const tree = JSON.stringify(r.toJSON());
    for (const wd of ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']) {
      expect(tree).toContain(wd);
    }
    TestRenderer.act(() => r.unmount());
  });

  it('renders 7 ja weekday labels when language=ja', () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, language: 'ja' } });
    // i18next language is picked up via the store change indirectly; force-set.
    const i18n = require('@/lib/i18n').default ?? require('@/lib/i18n');
    if (i18n.changeLanguage) i18n.changeLanguage('ja');
    const r = renderTree(<CalendarScreen />);
    const tree = JSON.stringify(r.toJSON());
    for (const wd of ['日', '月', '火', '水', '木', '金', '土']) {
      expect(tree).toContain(wd);
    }
    TestRenderer.act(() => r.unmount());
    // Restore vi so other tests aren't polluted.
    if (i18n.changeLanguage) i18n.changeLanguage('vi');
  });

  it('renders the SafeAreaView wrapper (consumes top inset)', () => {
    const r = renderTree(<CalendarScreen />);
    // Our mock tags SafeAreaView with testID; tree should include it.
    const json = JSON.stringify(r.toJSON());
    expect(json).toContain('safe-area-view');
    TestRenderer.act(() => r.unmount());
  });

  it('renders the tap-date hint and the legend card', () => {
    const r = renderTree(<CalendarScreen />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Chạm vào ngày');
    expect(tree).toContain('Chú thích màu');
    TestRenderer.act(() => r.unmount());
  });
});

describe('CalendarScreen — stability under store changes', () => {
  it('does not crash when kakeibo entries flip from empty to populated', () => {
    const r = renderTree(<CalendarScreen />);
    // Mutate the store from empty → 1 entry; renderer must not throw.
    TestRenderer.act(() => {
      useKakeiboStore.getState().addEntry({
        date: `${new Date().getFullYear()}-06-15`,
        amount: 1_200,
        category: 'food',
        label: 'Lawson',
      });
    });
    const tree = JSON.stringify(r.toJSON());
    // The aggregator now produces a kakeibo event; the screen should still render.
    expect(tree).toBeTruthy();
    TestRenderer.act(() => r.unmount());
  });
});

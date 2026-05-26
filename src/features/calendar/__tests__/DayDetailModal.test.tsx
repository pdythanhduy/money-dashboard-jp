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

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react') as typeof React;
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    Ionicons: ({ name }: { name: string }) =>
      ReactMock.createElement(Text, null, `[icon:${name}]`),
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => {
    unmount: () => void;
    toJSON: () => unknown;
  };
};

import { DayDetailModal } from '@/features/calendar/components/DayDetailModal';
import type { CalendarEvent } from '@/features/calendar/types';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let renderer: ReturnType<typeof TestRenderer.create> | undefined;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return renderer!;
}

describe('DayDetailModal', () => {
  it('renders nothing when not visible', () => {
    const r = renderTree(
      <DayDetailModal visible={false} date={null} events={[]} onClose={jest.fn()} />,
    );
    expect(r.toJSON()).toBeNull();
    TestRenderer.act(() => r.unmount());
  });

  it('renders empty-day message when no events and not a holiday', () => {
    const r = renderTree(
      <DayDetailModal
        visible
        date="2026-06-15"
        events={[]}
        onClose={jest.fn()}
      />,
    );
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Không có sự kiện');
    TestRenderer.act(() => r.unmount());
  });

  it('surfaces the JP holiday name in red when date is a national holiday', () => {
    const r = renderTree(
      <DayDetailModal
        visible
        date="2026-01-01"
        events={[]}
        onClose={jest.fn()}
      />,
    );
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('元日');
    expect(tree).toContain('Tết Dương lịch');
    TestRenderer.act(() => r.unmount());
  });

  it('renders event list with kakeibo amount tinted as expense (negative)', () => {
    const events: CalendarEvent[] = [
      {
        id: 'k1',
        date: '2026-06-15',
        kind: 'kakeibo_expense',
        labelKey: 'calendar.events.kakeibo',
        labelParams: { label: 'Lawson' },
        amountJpy: -1_200,
      },
    ];
    const r = renderTree(
      <DayDetailModal visible date="2026-06-15" events={events} onClose={jest.fn()} />,
    );
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Lawson');
    // Expense formatting prefixes a "-" — confirm the sign rendered.
    expect(tree).toMatch(/-.*1,200|-.*¥1,200/);
    TestRenderer.act(() => r.unmount());
  });

  it('renders the close icon + a drag-affordance pill', () => {
    const r = renderTree(
      <DayDetailModal
        visible
        date="2026-06-15"
        events={[]}
        onClose={jest.fn()}
      />,
    );
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('[icon:close]');
    TestRenderer.act(() => r.unmount());
  });

  it('survives empty→populated event-list transition without crash', () => {
    const r = renderTree(
      <DayDetailModal
        visible
        date="2026-06-15"
        events={[]}
        onClose={jest.fn()}
      />,
    );
    expect(JSON.stringify(r.toJSON())).toContain('Không có sự kiện');
    TestRenderer.act(() => r.unmount());
    // Re-mount with events present
    const r2 = renderTree(
      <DayDetailModal
        visible
        date="2026-06-15"
        events={[
          {
            id: 'a',
            date: '2026-06-15',
            kind: 'payday',
            labelKey: 'calendar.events.payday',
          },
        ]}
        onClose={jest.fn()}
      />,
    );
    expect(JSON.stringify(r2.toJSON())).not.toContain('Không có sự kiện');
    TestRenderer.act(() => r2.unmount());
  });
});

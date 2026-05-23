import React from 'react';

import '@/lib/i18n';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react') as typeof React;
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, `icon:${name}`),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => {
    unmount: () => void;
    toJSON: () => unknown;
    root: { findAll: (predicate: (n: { props: Record<string, unknown> }) => boolean) => Array<{ props: { onPress?: () => void } }> };
  };
};

import { EntryCard } from '@/features/kakeibo/components/EntryCard';
import type { KakeiboEntry } from '@/lib/kakeibo-math';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let r!: ReturnType<typeof TestRenderer.create>;
  TestRenderer.act(() => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r;
}

const SAMPLE: KakeiboEntry = {
  id: 'e1',
  date: '2026-05-15',
  amount: 1_500,
  category: 'food',
  label: 'Lawson',
};

describe('EntryCard delete affordance', () => {
  it('does NOT render the trash icon when onDelete is not provided', () => {
    const r = renderTree(<EntryCard entry={SAMPLE} onPress={() => undefined} />);
    expect(JSON.stringify(r.toJSON())).not.toContain('icon:trash-outline');
    TestRenderer.act(() => r.unmount());
  });

  it('renders the trash icon when onDelete is provided', () => {
    const r = renderTree(
      <EntryCard entry={SAMPLE} onPress={() => undefined} onDelete={() => undefined} />,
    );
    expect(JSON.stringify(r.toJSON())).toContain('icon:trash-outline');
    TestRenderer.act(() => r.unmount());
  });

  it('localized accessibilityLabel includes the entry name (vi default)', () => {
    const r = renderTree(
      <EntryCard entry={SAMPLE} onPress={() => undefined} onDelete={() => undefined} />,
    );
    const tree = JSON.stringify(r.toJSON());
    // "Xóa Lawson" is the rendered vi label
    expect(tree).toContain('Xóa Lawson');
    TestRenderer.act(() => r.unmount());
  });

  it('tapping the trash icon calls onDelete with the entry — and does NOT call onPress', () => {
    const onDelete = jest.fn();
    const onPress = jest.fn();
    const r = renderTree(<EntryCard entry={SAMPLE} onPress={onPress} onDelete={onDelete} />);
    // RN's test renderer often emits multiple nodes per Pressable; pick the
    // one whose accessibilityLabel matches AND which actually carries the
    // onPress handler (the function ref proves it's the user-facing one).
    const pressables = r.root.findAll(
      (n) =>
        typeof n.props.accessibilityLabel === 'string' &&
        (n.props.accessibilityLabel as string).startsWith('Xóa ') &&
        typeof n.props.onPress === 'function',
    );
    expect(pressables.length).toBeGreaterThanOrEqual(1);
    TestRenderer.act(() => {
      pressables[0]!.props.onPress?.();
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith(SAMPLE);
    expect(onPress).not.toHaveBeenCalled();
    TestRenderer.act(() => r.unmount());
  });
});

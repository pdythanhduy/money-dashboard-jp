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
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, `[icon:${name}]`),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => {
    unmount: () => void;
    toJSON: () => unknown;
    root: { findAllByProps: (props: object) => Array<{ props: Record<string, unknown> }> };
  };
};

import { Text } from 'react-native';

import { DashboardSection } from '@/features/dashboard/components/DashboardSection';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/settingsStore';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let r: ReturnType<typeof TestRenderer.create> | undefined;
  TestRenderer.act(() => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r!;
}

beforeEach(() => {
  useSettingsStore.setState({
    settings: { ...DEFAULT_SETTINGS, collapsedDashboardSections: [] },
  });
});

describe('DashboardSection', () => {
  describe('non-collapsible (default)', () => {
    it('always renders children', () => {
      const r = renderTree(
        <DashboardSection title="TODAY">
          <Text>child-body</Text>
        </DashboardSection>,
      );
      expect(JSON.stringify(r.toJSON())).toContain('child-body');
      TestRenderer.act(() => r.unmount());
    });

    it('does not register a Pressable header', () => {
      const r = renderTree(
        <DashboardSection title="TODAY">
          <Text>x</Text>
        </DashboardSection>,
      );
      // Defensive: when not collapsible, the header is a plain View — no
      // role='button' should appear in the tree.
      const buttons = r.root
        .findAllByProps({ accessibilityRole: 'button' })
        .filter((b) => typeof b.props.onPress === 'function');
      expect(buttons).toHaveLength(0);
      TestRenderer.act(() => r.unmount());
    });
  });

  describe('collapsible', () => {
    it('renders children when not in collapsed list', () => {
      const r = renderTree(
        <DashboardSection title="TREND" id="trend" collapsible>
          <Text>chart-body</Text>
        </DashboardSection>,
      );
      expect(JSON.stringify(r.toJSON())).toContain('chart-body');
      TestRenderer.act(() => r.unmount());
    });

    it('hides children when id is in settings.collapsedDashboardSections', () => {
      useSettingsStore.setState({
        settings: { ...DEFAULT_SETTINGS, collapsedDashboardSections: ['trend'] },
      });
      const r = renderTree(
        <DashboardSection title="TREND" id="trend" collapsible>
          <Text>chart-body</Text>
        </DashboardSection>,
      );
      expect(JSON.stringify(r.toJSON())).not.toContain('chart-body');
      TestRenderer.act(() => r.unmount());
    });

    it('tapping header toggles the persisted collapse state', () => {
      const r = renderTree(
        <DashboardSection title="TREND" id="trend" collapsible>
          <Text>chart-body</Text>
        </DashboardSection>,
      );
      const buttons = r.root.findAllByProps({ accessibilityRole: 'button' });
      expect(buttons.length).toBeGreaterThanOrEqual(1);
      // Open → tap → collapsed.
      TestRenderer.act(() => (buttons[0]!.props.onPress as () => void)());
      expect(useSettingsStore.getState().settings.collapsedDashboardSections).toContain('trend');
      // Tap again → expanded again.
      TestRenderer.act(() => (buttons[0]!.props.onPress as () => void)());
      expect(useSettingsStore.getState().settings.collapsedDashboardSections).not.toContain('trend');
      TestRenderer.act(() => r.unmount());
    });

    it('toggling one section does not affect another section', () => {
      useSettingsStore.setState({
        settings: { ...DEFAULT_SETTINGS, collapsedDashboardSections: ['tracking'] },
      });
      const r = renderTree(
        <DashboardSection title="TREND" id="trend" collapsible>
          <Text>chart-body</Text>
        </DashboardSection>,
      );
      const buttons = r.root.findAllByProps({ accessibilityRole: 'button' });
      TestRenderer.act(() => (buttons[0]!.props.onPress as () => void)());
      const stored = useSettingsStore.getState().settings.collapsedDashboardSections;
      expect(stored).toEqual(expect.arrayContaining(['trend', 'tracking']));
      TestRenderer.act(() => r.unmount());
    });

    it('falls back to non-collapsible if id is missing', () => {
      // Defensive: collapsible without id should still render children
      // and not crash on toggle.
      const r = renderTree(
        // id intentionally omitted to assert defensive behavior
        <DashboardSection title="TREND" collapsible>
          <Text>chart-body</Text>
        </DashboardSection>,
      );
      expect(JSON.stringify(r.toJSON())).toContain('chart-body');
      TestRenderer.act(() => r.unmount());
    });
  });
});

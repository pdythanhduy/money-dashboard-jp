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

import { WhatsNewCard } from '@/features/dashboard/components/WhatsNewCard';
import { APP_BUILD } from '@/lib/app-info';
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
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, lastSeenReleaseNotesBuild: '' } });
});

describe('WhatsNewCard', () => {
  it('renders title + 3 release-note items when build has not been seen', () => {
    const r = renderTree(<WhatsNewCard />);
    const tree = JSON.stringify(r.toJSON());
    // Title interpolates the current APP_VERSION (0.3.0).
    expect(tree).toContain('Có gì mới');
    expect(tree).toContain('賞与');
    expect(tree).toContain('Tab Lịch');
    expect(tree).toContain('iDeCo');
    TestRenderer.act(() => r.unmount());
  });

  it('dismiss button writes APP_BUILD to settings.lastSeenReleaseNotesBuild', () => {
    const r = renderTree(<WhatsNewCard />);
    const buttons = r.root.findAllByProps({ accessibilityRole: 'button' });
    const dismiss = buttons.find(
      (b) =>
        typeof b.props.accessibilityLabel === 'string' &&
        (b.props.accessibilityLabel as string).includes('Đóng'),
    );
    expect(dismiss).toBeDefined();
    TestRenderer.act(() => (dismiss!.props.onPress as () => void)());
    expect(useSettingsStore.getState().settings.lastSeenReleaseNotesBuild).toBe(APP_BUILD);
    TestRenderer.act(() => r.unmount());
  });

  it('renders nothing when lastSeenReleaseNotesBuild === APP_BUILD', () => {
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, lastSeenReleaseNotesBuild: APP_BUILD },
    });
    const r = renderTree(<WhatsNewCard />);
    expect(r.toJSON()).toBeNull();
    TestRenderer.act(() => r.unmount());
  });
});

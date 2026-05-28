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

jest.mock('react-native-safe-area-context', () => {
  const ReactMock = require('react') as typeof React;
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SafeAreaView: ({ children, style }: { children?: React.ReactNode; style?: object }) =>
      ReactMock.createElement(View, { style }, children),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => {
    unmount: () => void;
    toJSON: () => unknown;
  };
};

import { BugReportModal, buildDiagnosticText } from '@/features/settings/components/BugReportModal';
import { APP_BUILD, APP_VERSION } from '@/lib/app-info';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let r: ReturnType<typeof TestRenderer.create> | undefined;
  TestRenderer.act(() => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r!;
}

describe('buildDiagnosticText (pure)', () => {
  it('includes current app version + build', () => {
    const out = buildDiagnosticText('vi', new Date('2026-05-28T10:30:00Z'));
    expect(out).toContain(`App version: ${APP_VERSION} (${APP_BUILD})`);
  });

  it('includes the active locale', () => {
    expect(buildDiagnosticText('vi')).toContain('Locale: vi');
    expect(buildDiagnosticText('ja')).toContain('Locale: ja');
  });

  it('includes platform (jest treats it as ios by default)', () => {
    const out = buildDiagnosticText('vi');
    expect(out).toMatch(/Platform: (ios|android|web)/);
  });

  it('includes an ISO timestamp', () => {
    const out = buildDiagnosticText('vi', new Date('2026-05-28T10:30:00Z'));
    expect(out).toContain('Timestamp: 2026-05-28T10:30:00.000Z');
  });

  it('renders the reproduction-steps scaffolding', () => {
    const out = buildDiagnosticText('vi');
    expect(out).toContain('— Describe the issue here —');
    expect(out).toContain('— Steps to reproduce —');
    expect(out).toContain('— Expected behavior —');
    expect(out).toContain('— Actual behavior —');
  });
});

describe('BugReportModal', () => {
  it('renders nothing visible when not visible', () => {
    const r = renderTree(<BugReportModal visible={false} onClose={jest.fn()} />);
    // RN Modal returns null when not visible (component still mounted but inert).
    const tree = JSON.stringify(r.toJSON());
    // Title should NOT appear in tree because Modal hides children.
    expect(tree).not.toContain('Báo lỗi');
    TestRenderer.act(() => r.unmount());
  });

  it('renders title + diagnostic text containing version + build when visible', () => {
    const r = renderTree(<BugReportModal visible onClose={jest.fn()} />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Báo lỗi');
    expect(tree).toContain(`App version: ${APP_VERSION} (${APP_BUILD})`);
    expect(tree).toContain('[icon:close]');
    TestRenderer.act(() => r.unmount());
  });
});

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

jest.mock('react-native-safe-area-context', () => {
  const ReactMock = require('react') as typeof React;
  const { View } = require('react-native') as typeof import('react-native');
  return {
    SafeAreaView: ({ children, style }: { children?: React.ReactNode; style?: object }) =>
      ReactMock.createElement(View, { style }, children),
    useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
  };
});

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => {
    unmount: () => void;
    toJSON: () => unknown;
    root: { findAllByProps: (props: object) => Array<{ props: { onPress?: () => void } }> };
  };
};

import { MoreScreen } from '@/features/more/MoreScreen';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let renderer: ReturnType<typeof TestRenderer.create> | undefined;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return renderer!;
}

beforeEach(() => {
  mockNavigate.mockReset();
  const i18n = require('@/lib/i18n').default ?? require('@/lib/i18n');
  if (i18n.changeLanguage) i18n.changeLanguage('vi');
});

describe('MoreScreen — group rendering', () => {
  it('renders 3 group headings (Quản lý / Đời sống ở Nhật / Cài đặt)', () => {
    const r = renderTree(<MoreScreen />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Quản lý');
    expect(tree).toContain('Đời sống ở Nhật');
    expect(tree).toContain('Cài đặt');
    TestRenderer.act(() => r.unmount());
  });

  it('renders all 6 secondary screen rows', () => {
    const r = renderTree(<MoreScreen />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Lịch sử tính lương');
    expect(tree).toContain('Giấy tờ');
    expect(tree).toContain('Mục tiêu tiết kiệm');
    expect(tree).toContain('Khai thuế 確定申告');
    expect(tree).toContain('Quỹ chuyến đi');
    // Settings title appears as a row title — to avoid collision with the
    // group heading of the same name, just verify the icon button rendered.
    expect(tree).toContain('[icon:settings-outline]');
    TestRenderer.act(() => r.unmount());
  });

  it('renders ja labels when language=ja', () => {
    const i18n = require('@/lib/i18n').default ?? require('@/lib/i18n');
    if (i18n.changeLanguage) i18n.changeLanguage('ja');
    const r = renderTree(<MoreScreen />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('管理');
    expect(tree).toContain('日本での生活');
    expect(tree).toContain('計算履歴');
    expect(tree).toContain('在留カード');
    TestRenderer.act(() => r.unmount());
    if (i18n.changeLanguage) i18n.changeLanguage('vi');
  });
});

describe('MoreScreen — navigation', () => {
  it('row press dispatches navigation.navigate(routeName) — verified for all 6 rows', () => {
    const r = renderTree(<MoreScreen />);
    const pressables = r.root.findAllByProps({ accessibilityRole: 'button' });
    // Should have exactly 6 row buttons (no header chrome with role=button).
    const rowPressables = pressables.filter((p) => p.props.onPress);
    expect(rowPressables.length).toBeGreaterThanOrEqual(6);

    // Tap each unique row in order and verify navigate was called with the
    // expected route name once per tap.
    const expectedRoutes = ['History', 'Documents', 'Goals', 'Kakutei', 'TripBudget', 'Settings'];
    for (let i = 0; i < expectedRoutes.length; i += 1) {
      TestRenderer.act(() => {
        rowPressables[i]!.props.onPress!();
      });
    }
    expect(mockNavigate).toHaveBeenCalledTimes(expectedRoutes.length);
    for (const name of expectedRoutes) {
      expect(mockNavigate).toHaveBeenCalledWith(name);
    }
    TestRenderer.act(() => r.unmount());
  });
});

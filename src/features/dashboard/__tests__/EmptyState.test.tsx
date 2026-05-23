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
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void) => void;
  create: (el: React.ReactElement) => { unmount: () => void; toJSON: () => unknown };
};

import { EmptyState } from '@/features/dashboard/components/EmptyState';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let r!: ReturnType<typeof TestRenderer.create>;
  TestRenderer.act(() => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r;
}

describe('EmptyState', () => {
  it('renders default title + subtitle when no overrides provided', () => {
    const r = renderTree(<EmptyState onPressCta={jest.fn()} />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Bắt đầu hành trình tài chính');
    expect(tree).toContain('Nhập lương để xem mỗi ngày còn được tiêu bao nhiêu');
    expect(tree).toContain('Tính lương ngay');
    TestRenderer.act(() => r.unmount());
  });

  it('renders custom title + subtitle when provided (zero-income edge)', () => {
    const r = renderTree(
      <EmptyState
        onPressCta={jest.fn()}
        title="Thu nhập quá thấp để tính"
        subtitle="Lần tính gần nhất ra ¥0."
      />,
    );
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Thu nhập quá thấp để tính');
    expect(tree).toContain('Lần tính gần nhất ra ¥0.');
    // Defaults absent.
    expect(tree).not.toContain('Bắt đầu hành trình');
    TestRenderer.act(() => r.unmount());
  });

  it('CTA Pressable carries accessibilityRole and Label', () => {
    const r = renderTree(<EmptyState onPressCta={jest.fn()} />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('"accessibilityRole":"button"');
    expect(tree).toContain('"accessibilityLabel":"Tính lương ngay"');
    TestRenderer.act(() => r.unmount());
  });
});

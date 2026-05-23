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

import { TaxChecklistSection } from '@/features/kakutei/components/TaxChecklistSection';
import { currentTaxYear, TAX_CHECKLIST_ITEM_IDS } from '@/lib/tax-checklist';
import { useTaxChecklistStore } from '@/store/taxChecklistStore';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let r!: ReturnType<typeof TestRenderer.create>;
  TestRenderer.act(() => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r;
}

function snap(r: ReturnType<typeof TestRenderer.create>): string {
  return JSON.stringify(r.toJSON());
}

beforeEach(() => {
  useTaxChecklistStore.setState({ byYear: {} });
});

describe('TaxChecklistSection', () => {
  it('renders the 5 canonical item titles + disclaimer + 0/5 progress on fresh state', () => {
    const r = renderTree(<TaxChecklistSection />);
    const tree = snap(r);
    // All 5 item titles present (using their vi forms — i18n default is vi
    // because device language detection is mocked away)
    expect(tree).toContain('Kiểm tra 源泉徴収票');
    expect(tree).toContain('Kiểm tra có cần 確定申告 không');
    expect(tree).toContain('Kiểm tra ふるさと納税');
    expect(tree).toContain('Kiểm tra 医療費控除');
    expect(tree).toContain('Kiểm tra giấy tờ phụ thuộc / 海外送金');
    // Progress count
    expect(tree).toContain('0/5 xong');
    // Disclaimer
    expect(tree).toContain('KHÔNG phải tư vấn thuế');
    TestRenderer.act(() => r.unmount());
  });

  it('toggles an item checked → store updates and progress count reflects', () => {
    const r = renderTree(<TaxChecklistSection />);
    const year = currentTaxYear(new Date());
    expect(useTaxChecklistStore.getState().countChecked(year)).toBe(0);

    // Find the first checkable row by accessibility label.
    const rows = r.root.findAll(
      (n) =>
        n.props.accessibilityRole === 'checkbox' &&
        typeof n.props.accessibilityLabel === 'string' &&
        (n.props.accessibilityLabel as string).startsWith('Kiểm tra 源泉徴収票'),
    );
    expect(rows.length).toBeGreaterThan(0);
    TestRenderer.act(() => {
      rows[0]!.props.onPress?.();
    });
    expect(useTaxChecklistStore.getState().countChecked(year)).toBe(1);
    TestRenderer.act(() => r.unmount());
  });

  it('shows the completed success message when all 5 items are checked', () => {
    const year = currentTaxYear(new Date());
    const allChecked: Record<string, { checked: boolean }> = {};
    for (const id of TAX_CHECKLIST_ITEM_IDS) {
      allChecked[id] = { checked: true };
    }
    useTaxChecklistStore.setState({ byYear: { [year]: allChecked } });
    const r = renderTree(<TaxChecklistSection />);
    const tree = snap(r);
    expect(tree).toContain('Checklist năm nay đã hoàn tất');
    expect(tree).toContain('5/5 xong');
    TestRenderer.act(() => r.unmount());
  });
});

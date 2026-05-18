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

jest.mock('@expo/vector-icons', () => {
  const ReactMock = require('react') as typeof React;
  const { Text } = require('react-native') as typeof import('react-native');
  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

jest.mock('expo-linear-gradient', () => {
  const ReactMock = require('react') as typeof React;
  const { View } = require('react-native') as typeof import('react-native');
  return {
    LinearGradient: ({ children, style }: { children?: React.ReactNode; style?: object }) =>
      ReactMock.createElement(View, { style }, children),
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

import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { AboutModal } from '@/features/settings/components/AboutModal';
import { ClearDataConfirmModal } from '@/features/settings/components/ClearDataConfirmModal';
import { LanguagePicker } from '@/features/settings/components/LanguagePicker';
import { OnboardingNavigator } from '@/features/onboarding/OnboardingNavigator';
import { useOnboardingStore } from '@/store/onboardingStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/settingsStore';
import { ThemeProvider } from '@/theme';

function renderTree(el: React.ReactElement) {
  let renderer: ReturnType<typeof TestRenderer.create> | undefined;
  TestRenderer.act(() => {
    renderer = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return renderer!;
}

beforeEach(() => {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  useOnboardingStore.setState({ hasCompletedOnboarding: false, currentSlide: 0 });
});

describe('SettingsScreen', () => {
  it('mounts without crashing and renders translated section titles', () => {
    const r = renderTree(<SettingsScreen />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Cá nhân hóa');
    expect(tree).toContain('Pháp lý');
    expect(tree).toContain('Về Kakei');
    TestRenderer.act(() => r.unmount());
  });

  it('shows default values for language/theme/payday', () => {
    const r = renderTree(<SettingsScreen />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Theo hệ thống');
    expect(tree).toContain('Ngày 25');
    TestRenderer.act(() => r.unmount());
  });

  it('reflects settings state changes in display', () => {
    useSettingsStore.getState().updateSetting('language', 'ja');
    useSettingsStore.getState().updateSetting('payday', 10);
    useSettingsStore.getState().updateSetting('defaultPrefecture', 'osaka');
    const r = renderTree(<SettingsScreen />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('日本語');
    expect(tree).toContain('Ngày 10');
    expect(tree).toContain('Osaka');
    TestRenderer.act(() => r.unmount());
  });
});

describe('LanguagePicker', () => {
  it('renders the 3 language options when visible', () => {
    const r = renderTree(
      <LanguagePicker
        visible
        value="system"
        onChange={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Tiếng Việt');
    expect(tree).toContain('日本語');
    expect(tree).toContain('Theo hệ thống');
    TestRenderer.act(() => r.unmount());
  });

  it('renders nothing when not visible', () => {
    const r = renderTree(
      <LanguagePicker
        visible={false}
        value="system"
        onChange={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    // Modal renders nothing in react-test-renderer when visible is false.
    expect(r.toJSON()).toBeNull();
    TestRenderer.act(() => r.unmount());
  });
});

describe('AboutModal', () => {
  it('shows version + build when visible', () => {
    const r = renderTree(<AboutModal visible onClose={jest.fn()} />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('0.1.0');
    expect(tree).toContain('Mã nguồn mở');
    TestRenderer.act(() => r.unmount());
  });
});

describe('ClearDataConfirmModal', () => {
  it('starts on the warning step and lists the bullet items', () => {
    const r = renderTree(
      <ClearDataConfirmModal visible onClose={jest.fn()} onConfirm={jest.fn()} />,
    );
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('KHÔNG THỂ HOÀN TÁC');
    expect(tree).toContain('Toàn bộ lịch sử các lần tính');
    expect(tree).toContain('Tôi hiểu');
    TestRenderer.act(() => r.unmount());
  });
});

describe('OnboardingNavigator', () => {
  it('renders the welcome slide first', () => {
    const r = renderTree(<OnboardingNavigator />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Chào mừng đến Kakei');
    expect(tree).toContain('家計');
    TestRenderer.act(() => r.unmount());
  });

  it('jumps to the feature showcase on slide 1', () => {
    useOnboardingStore.setState({ hasCompletedOnboarding: false, currentSlide: 1 });
    const r = renderTree(<OnboardingNavigator />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('FY2026');
    expect(tree).toContain('令和7年12月');
    TestRenderer.act(() => r.unmount());
  });

  it('renders the initial setup slide last and exposes the finish button', () => {
    useOnboardingStore.setState({ hasCompletedOnboarding: false, currentSlide: 3 });
    const r = renderTree(<OnboardingNavigator />);
    const tree = JSON.stringify(r.toJSON());
    expect(tree).toContain('Thiết lập nhanh');
    expect(tree).toContain('Hoàn tất');
    TestRenderer.act(() => r.unmount());
  });
});

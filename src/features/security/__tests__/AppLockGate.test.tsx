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

jest.mock('expo-local-authentication', () => ({
  __esModule: true,
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(),
}));

import * as LocalAuthentication from 'expo-local-authentication';
import { Text } from 'react-native';

const TestRenderer = require('react-test-renderer') as {
  act: (cb: () => void | Promise<void>) => Promise<void> | void;
  create: (el: React.ReactElement) => {
    unmount: () => void;
    toJSON: () => unknown;
  };
};

import { AppLockGate } from '@/features/security/AppLockGate';
import { useAppLockStore } from '@/store/appLockStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/settingsStore';
import { ThemeProvider } from '@/theme';

const authenticateAsync = LocalAuthentication.authenticateAsync as jest.Mock;

function child() {
  return <Text testID="protected">PROTECTED</Text>;
}

async function renderTree(el: React.ReactElement) {
  let r!: ReturnType<typeof TestRenderer.create>;
  await TestRenderer.act(async () => {
    r = TestRenderer.create(<ThemeProvider>{el}</ThemeProvider>);
  });
  return r;
}

function snap(r: ReturnType<typeof TestRenderer.create>): string {
  return JSON.stringify(r.toJSON());
}

beforeEach(() => {
  authenticateAsync.mockReset();
  useAppLockStore.setState({ locked: false, lastBackgroundAt: null });
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

describe('AppLockGate', () => {
  it('renders children immediately when faceIdEnabled is false', async () => {
    const r = await renderTree(<AppLockGate>{child()}</AppLockGate>);
    expect(snap(r)).toContain('PROTECTED');
    expect(snap(r)).not.toContain('icon:lock-closed');
    await TestRenderer.act(async () => r.unmount());
  });

  it('hides children and shows lock screen when faceIdEnabled is true (cold launch locks)', async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, faceIdEnabled: true } });
    authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });
    const r = await renderTree(<AppLockGate>{child()}</AppLockGate>);
    // Flush the queued auto-prompt promise.
    await TestRenderer.act(async () => {
      await Promise.resolve();
    });
    const tree = snap(r);
    expect(tree).not.toContain('PROTECTED');
    expect(tree).toContain('icon:lock-closed');
    expect(useAppLockStore.getState().locked).toBe(true);
    await TestRenderer.act(async () => r.unmount());
  });

  it('unlocks and reveals children when biometric prompt succeeds on cold launch', async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, faceIdEnabled: true } });
    authenticateAsync.mockResolvedValue({ success: true });
    const r = await renderTree(<AppLockGate>{child()}</AppLockGate>);
    await TestRenderer.act(async () => {
      await Promise.resolve();
    });
    expect(useAppLockStore.getState().locked).toBe(false);
    expect(snap(r)).toContain('PROTECTED');
    await TestRenderer.act(async () => r.unmount());
  });

  it('remains locked after a cancelled prompt — shows the cancelled message', async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, faceIdEnabled: true } });
    authenticateAsync.mockResolvedValue({ success: false, error: 'user_cancel' });
    const r = await renderTree(<AppLockGate>{child()}</AppLockGate>);
    await TestRenderer.act(async () => {
      await Promise.resolve();
    });
    const tree = snap(r);
    expect(useAppLockStore.getState().locked).toBe(true);
    expect(tree).toContain('Bạn đã hủy xác thực');
    expect(tree).not.toContain('PROTECTED');
    await TestRenderer.act(async () => r.unmount());
  });

  it('shows the "unavailable" message when device cannot authenticate', async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, faceIdEnabled: true } });
    authenticateAsync.mockResolvedValue({ success: false, error: 'not_available' });
    const r = await renderTree(<AppLockGate>{child()}</AppLockGate>);
    await TestRenderer.act(async () => {
      await Promise.resolve();
    });
    expect(snap(r)).toContain('Thiết bị chưa hỗ trợ');
    await TestRenderer.act(async () => r.unmount());
  });

  it('shows the "failed" message on a generic authentication failure', async () => {
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, faceIdEnabled: true } });
    authenticateAsync.mockResolvedValue({ success: false, error: 'authentication_failed' });
    const r = await renderTree(<AppLockGate>{child()}</AppLockGate>);
    await TestRenderer.act(async () => {
      await Promise.resolve();
    });
    expect(snap(r)).toContain('Xác thực không thành công');
    await TestRenderer.act(async () => r.unmount());
  });
});

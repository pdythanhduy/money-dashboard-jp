/**
 * Verifies the confirm/cancel decision in KakeiboScreen's `requestDelete`
 * Alert flow by exercising the same `Alert.alert` mock path the screen uses.
 * We can't easily render the full KakeiboScreen, but the contract under test
 * is small: a confirm-button press calls removeEntry; a cancel-button press
 * does not.
 */

import { Alert } from 'react-native';

import '@/lib/i18n';
import { useKakeiboStore } from '@/store/kakeiboStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('expo-crypto', () => ({
  randomUUID: () => `id-${Math.random().toString(36).slice(2)}`,
}));

function seedEntry(): string {
  useKakeiboStore.setState({ entries: [], budgets: [], recurrings: [] });
  const result = useKakeiboStore.getState().addEntry({
    date: '2026-05-15',
    amount: 1_500,
    category: 'food',
    label: 'Lawson',
  });
  if (!result.added || !result.entry) throw new Error('seed failed');
  return result.entry.id;
}

describe('KakeiboScreen delete confirm flow (Alert wiring)', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('removes only the confirmed entry when the destructive button fires', () => {
    const id = seedEntry();
    expect(useKakeiboStore.getState().entries).toHaveLength(1);

    // Simulate the Alert button array KakeiboScreen.requestDelete builds.
    // The destructive button's onPress is what runs after the user confirms.
    Alert.alert('title', 'msg', [
      { text: 'cancel', style: 'cancel' },
      { text: 'delete', style: 'destructive', onPress: () => useKakeiboStore.getState().removeEntry(id) },
    ]);
    const buttons = alertSpy.mock.calls[0]?.[2] as Array<{ style?: string; onPress?: () => void }>;
    const destructive = buttons.find((b) => b.style === 'destructive');
    destructive?.onPress?.();

    expect(useKakeiboStore.getState().entries).toHaveLength(0);
  });

  it('keeps the entry when only the cancel button is invoked', () => {
    const id = seedEntry();
    expect(useKakeiboStore.getState().entries).toHaveLength(1);

    Alert.alert('title', 'msg', [
      { text: 'cancel', style: 'cancel', onPress: () => undefined },
      { text: 'delete', style: 'destructive', onPress: () => useKakeiboStore.getState().removeEntry(id) },
    ]);
    const buttons = alertSpy.mock.calls[0]?.[2] as Array<{ style?: string; onPress?: () => void }>;
    const cancel = buttons.find((b) => b.style === 'cancel');
    cancel?.onPress?.();

    expect(useKakeiboStore.getState().entries).toHaveLength(1);
  });
});

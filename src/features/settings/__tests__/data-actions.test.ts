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
jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `uuid-${++n}`) };
});
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.2.3' } },
}));

import { buildExportPayload, clearAllUserData } from '@/features/settings/data-actions';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useHistoryStore } from '@/store/historyStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/settingsStore';

beforeEach(() => {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
  useHistoryStore.setState({ entries: [], migratedFromLatest: false });
  useCalculatorStore.setState({ lastInput: null, lastResult: null });
  useOnboardingStore.setState({ hasCompletedOnboarding: false, currentSlide: 0 });
});

describe('buildExportPayload', () => {
  it('snapshots empty stores with version + ISO timestamp', () => {
    const p = buildExportPayload();
    expect(p.appVersion).toBe('1.2.3');
    expect(p.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(p.settings).toEqual(DEFAULT_SETTINGS);
    expect(p.history).toEqual([]);
    expect(p.lastCalculation).toEqual({ input: null, result: null });
  });

  it('reflects current settings updates', () => {
    useSettingsStore.getState().updateSetting('language', 'ja');
    useSettingsStore.getState().updateSetting('payday', 10);
    const p = buildExportPayload();
    expect(p.settings.language).toBe('ja');
    expect(p.settings.payday).toBe(10);
  });
});

describe('clearAllUserData', () => {
  it('resets all four stores to their initial state', async () => {
    useSettingsStore.getState().updateSetting('language', 'ja');
    useOnboardingStore.getState().completeOnboarding();
    useCalculatorStore.setState({
      lastInput: { annualIncome: 100, age: 30, category: 'salary', prefecture: 'tokyo' },
      lastResult: null,
    });
    await clearAllUserData();
    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_SETTINGS);
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(false);
    expect(useCalculatorStore.getState().lastInput).toBeNull();
    expect(useHistoryStore.getState().entries).toEqual([]);
  });
});

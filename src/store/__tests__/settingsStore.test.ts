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

import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/settingsStore';

beforeEach(() => {
  useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS } });
});

describe('settingsStore — defaults', () => {
  it('language default is system', () => {
    expect(useSettingsStore.getState().settings.language).toBe('system');
  });
  it('theme default is system', () => {
    expect(useSettingsStore.getState().settings.theme).toBe('system');
  });
  it('payday default is 25', () => {
    expect(useSettingsStore.getState().settings.payday).toBe(25);
  });
  it('notifications and faceId default to false', () => {
    expect(useSettingsStore.getState().settings.notificationsEnabled).toBe(false);
    expect(useSettingsStore.getState().settings.faceIdEnabled).toBe(false);
  });
  it('defaultPrefecture and defaultMunicipality default to null', () => {
    expect(useSettingsStore.getState().settings.defaultPrefecture).toBeNull();
    expect(useSettingsStore.getState().settings.defaultMunicipality).toBeNull();
  });
});

describe('settingsStore — updateSetting', () => {
  it('updates one field, preserves others', () => {
    useSettingsStore.getState().updateSetting('language', 'ja');
    const s = useSettingsStore.getState().settings;
    expect(s.language).toBe('ja');
    expect(s.theme).toBe('system');
    expect(s.payday).toBe(25);
  });
  it('updates payday', () => {
    useSettingsStore.getState().updateSetting('payday', 15);
    expect(useSettingsStore.getState().settings.payday).toBe(15);
  });
  it('updates defaultPrefecture from null', () => {
    useSettingsStore.getState().updateSetting('defaultPrefecture', 'tokyo');
    expect(useSettingsStore.getState().settings.defaultPrefecture).toBe('tokyo');
  });
});

describe('settingsStore — resetToDefaults', () => {
  it('returns to DEFAULT_SETTINGS', () => {
    useSettingsStore.getState().updateSetting('language', 'ja');
    useSettingsStore.getState().updateSetting('theme', 'dark');
    useSettingsStore.getState().updateSetting('payday', 10);
    useSettingsStore.getState().resetToDefaults();
    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  });
});

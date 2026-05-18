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

describe('settingsStore.defaults', () => {
  it('starts with system language, system theme, payday 25', () => {
    const { settings } = useSettingsStore.getState();
    expect(settings.language).toBe('system');
    expect(settings.theme).toBe('system');
    expect(settings.payday).toBe(25);
    expect(settings.defaultPrefecture).toBeNull();
    expect(settings.defaultMunicipality).toBeNull();
    expect(settings.notificationsEnabled).toBe(false);
    expect(settings.faceIdEnabled).toBe(false);
  });
});

describe('settingsStore.updateSetting', () => {
  it('updates a single key without mutating others', () => {
    useSettingsStore.getState().updateSetting('language', 'ja');
    const { settings } = useSettingsStore.getState();
    expect(settings.language).toBe('ja');
    expect(settings.theme).toBe('system');
    expect(settings.payday).toBe(25);
  });

  it('clamps payday below 1 to 1', () => {
    useSettingsStore.getState().updateSetting('payday', -5);
    expect(useSettingsStore.getState().settings.payday).toBe(1);
  });

  it('clamps payday above 31 to 31', () => {
    useSettingsStore.getState().updateSetting('payday', 99);
    expect(useSettingsStore.getState().settings.payday).toBe(31);
  });

  it('floors fractional payday', () => {
    useSettingsStore.getState().updateSetting('payday', 15.7);
    expect(useSettingsStore.getState().settings.payday).toBe(15);
  });

  it('accepts boundary paydays unchanged', () => {
    useSettingsStore.getState().updateSetting('payday', 1);
    expect(useSettingsStore.getState().settings.payday).toBe(1);
    useSettingsStore.getState().updateSetting('payday', 31);
    expect(useSettingsStore.getState().settings.payday).toBe(31);
  });

  it('toggles boolean settings', () => {
    useSettingsStore.getState().updateSetting('notificationsEnabled', true);
    expect(useSettingsStore.getState().settings.notificationsEnabled).toBe(true);
    useSettingsStore.getState().updateSetting('faceIdEnabled', true);
    expect(useSettingsStore.getState().settings.faceIdEnabled).toBe(true);
  });

  it('stores a Prefecture choice', () => {
    useSettingsStore.getState().updateSetting('defaultPrefecture', 'osaka');
    expect(useSettingsStore.getState().settings.defaultPrefecture).toBe('osaka');
  });
});

describe('settingsStore.resetToDefaults', () => {
  it('restores all keys to their defaults', () => {
    const { updateSetting, resetToDefaults } = useSettingsStore.getState();
    updateSetting('language', 'ja');
    updateSetting('theme', 'dark');
    updateSetting('payday', 5);
    updateSetting('defaultPrefecture', 'aichi');
    updateSetting('notificationsEnabled', true);
    resetToDefaults();
    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  });
});

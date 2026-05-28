/**
 * Unit tests for the local JSON backup module.
 *
 * Coverage:
 *   - buildBackupPayload shape
 *   - parseBackupJSON happy path + 3 rejection paths
 *   - summarizeBackup counts via state.<field>
 *   - exportBackup → restoreBackup roundtrip with mocked AsyncStorage
 *   - destructive restore removes keys absent from the payload
 */

jest.mock('@react-native-async-storage/async-storage', () => {
  const fakeStore = new Map<string, string>();
  const api = {
    multiGet: jest.fn(async (keys: string[]) =>
      keys.map((k) => [k, fakeStore.get(k) ?? null] as [string, string | null]),
    ),
    multiSet: jest.fn(async (entries: [string, string][]) => {
      for (const [k, v] of entries) fakeStore.set(k, v);
    }),
    multiRemove: jest.fn(async (keys: string[]) => {
      for (const k of keys) fakeStore.delete(k);
    }),
    getItem: jest.fn(async (k: string) => fakeStore.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      fakeStore.set(k, v);
    }),
    removeItem: jest.fn(async (k: string) => {
      fakeStore.delete(k);
    }),
    clear: jest.fn(async () => {
      fakeStore.clear();
    }),
    // Test-only escape hatches:
    __reset: () => fakeStore.clear(),
    __set: (k: string, v: string) => fakeStore.set(k, v),
    __get: (k: string) => fakeStore.get(k),
  };
  return { __esModule: true, default: api };
});

// Re-import the mocked module to access the __set/__get helpers in tests.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const AsyncStorageMock = require('@react-native-async-storage/async-storage').default as {
  __reset: () => void;
  __set: (k: string, v: string) => void;
  __get: (k: string) => string | undefined;
};

import {
  BACKUP_SCHEMA_VERSION,
  BACKUP_STORE_SLOTS,
  buildBackupPayload,
  exportBackup,
  isBackupPayload,
  parseBackupJSON,
  restoreBackup,
  summarizeBackup,
  type BackupPayload,
} from '@/lib/backup';
import { APP_BUILD, APP_VERSION } from '@/lib/app-info';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useSettingsStore } from '@/store/settingsStore';

beforeEach(() => {
  AsyncStorageMock.__reset();
});

describe('buildBackupPayload', () => {
  it('stamps schemaVersion, exportedAt, appVersion, appBuild', () => {
    const now = new Date('2026-05-28T09:00:00Z');
    const p = buildBackupPayload({ 'kakei-settings-v1': '{"state":{}}' }, now);
    expect(p.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
    expect(p.exportedAt).toBe('2026-05-28T09:00:00.000Z');
    expect(p.appVersion).toBe(APP_VERSION);
    expect(p.appBuild).toBe(APP_BUILD);
    expect(p.stores['kakei-settings-v1']).toBe('{"state":{}}');
  });
});

describe('isBackupPayload', () => {
  it('accepts a well-formed payload', () => {
    const p = buildBackupPayload({});
    expect(isBackupPayload(p)).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isBackupPayload(null)).toBe(false);
    expect(isBackupPayload('string')).toBe(false);
    expect(isBackupPayload(42)).toBe(false);
  });

  it('rejects missing/wrong-type fields', () => {
    expect(isBackupPayload({ schemaVersion: '2', exportedAt: 'x', appVersion: 'x', appBuild: 'x', stores: {} })).toBe(false);
    expect(isBackupPayload({ schemaVersion: 2, exportedAt: 'x', appVersion: 'x', appBuild: 'x' })).toBe(false);
  });

  it('rejects non-string store values', () => {
    expect(isBackupPayload({
      schemaVersion: 2, exportedAt: 'x', appVersion: 'x', appBuild: 'x',
      stores: { 'kakei-settings-v1': { not: 'a string' } },
    })).toBe(false);
  });
});

describe('parseBackupJSON', () => {
  it('returns ok for valid JSON + shape + version', () => {
    const text = JSON.stringify(buildBackupPayload({ 'kakei-settings-v1': '{"state":{}}' }));
    const r = parseBackupJSON(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.schemaVersion).toBe(BACKUP_SCHEMA_VERSION);
  });

  it('rejects invalid JSON with invalid-json', () => {
    const r = parseBackupJSON('{ this is not json }');
    expect(r).toEqual({ ok: false, error: 'invalid-json' });
  });

  it('rejects valid JSON with wrong shape via invalid-shape', () => {
    const r = parseBackupJSON('{"hello":"world"}');
    expect(r).toEqual({ ok: false, error: 'invalid-shape' });
  });

  it('rejects a payload from a newer schema version', () => {
    const future = { ...buildBackupPayload({}), schemaVersion: BACKUP_SCHEMA_VERSION + 5 };
    const r = parseBackupJSON(JSON.stringify(future));
    expect(r).toEqual({ ok: false, error: 'incompatible-version' });
  });
});

describe('summarizeBackup', () => {
  it('counts entries via state.<field> for known countPath slots', () => {
    const kakeiboRaw = JSON.stringify({
      state: { entries: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
    });
    const goalsRaw = JSON.stringify({ state: { goals: [{ id: 'g' }] } });
    const settingsRaw = JSON.stringify({ state: { settings: { language: 'vi' } } });
    const payload = buildBackupPayload({
      'kakei-kakeibo-v1': kakeiboRaw,
      'kakei-goals-v1': goalsRaw,
      'kakei-settings-v1': settingsRaw,
    });
    const summary = summarizeBackup(payload);
    const byLabel = Object.fromEntries(summary.rows.map((r) => [r.label, r]));
    expect(byLabel.kakeibo?.count).toBe(3);
    expect(byLabel.goals?.count).toBe(1);
    expect(byLabel.settings?.present).toBe(true);
    expect(byLabel.settings?.count).toBeNull();
    // Stores absent from the payload show present:false
    expect(byLabel.history?.present).toBe(false);
    expect(summary.totalRecords).toBe(4);
  });

  it('handles malformed inner JSON without crashing', () => {
    const payload = buildBackupPayload({
      'kakei-kakeibo-v1': '{not json}',
    });
    const summary = summarizeBackup(payload);
    const row = summary.rows.find((r) => r.label === 'kakeibo');
    expect(row?.present).toBe(true);
    expect(row?.count).toBeNull();
  });
});

describe('exportBackup → restoreBackup roundtrip', () => {
  it('captures store data and replays it into AsyncStorage + memory', async () => {
    // Seed: write known shape directly to AsyncStorage so exportBackup
    // round-trips real bytes (we don't need real Zustand persist mid-test).
    const seedSettings = JSON.stringify({
      state: { settings: { language: 'ja', theme: 'dark', payday: 28, defaultPrefecture: 'osaka', defaultMunicipality: null, notificationsEnabled: false, faceIdEnabled: true } },
      version: 0,
    });
    const seedKakeibo = JSON.stringify({
      state: { entries: [{ id: 'e1', amount: 1000 }], recurrings: [] },
      version: 0,
    });
    AsyncStorageMock.__set('kakei-settings-v1', seedSettings);
    AsyncStorageMock.__set('kakei-kakeibo-v1', seedKakeibo);

    const payload = await exportBackup(new Date('2026-05-28T10:00:00Z'));
    expect(payload.stores['kakei-settings-v1']).toBe(seedSettings);
    expect(payload.stores['kakei-kakeibo-v1']).toBe(seedKakeibo);
    // Keys we never seeded simply don't appear.
    expect(payload.stores['kakei-goals-v1']).toBeUndefined();

    // Roundtrip: clear, restore, then check in-memory state matches the
    // seed. We don't byte-compare AsyncStorage because Zustand's persist
    // middleware re-serializes after setState — adds `version`, includes
    // all partialize fields, etc. The semantic invariant is what matters.
    AsyncStorageMock.__reset();
    await restoreBackup(payload);
    expect(useSettingsStore.getState().settings.language).toBe('ja');
    expect(useSettingsStore.getState().settings.payday).toBe(28);
    expect(useKakeiboStore.getState().entries).toHaveLength(1);
    expect(useKakeiboStore.getState().entries[0]?.amount).toBe(1000);
  });

  it('destructively resets in-memory state for stores absent from payload', async () => {
    // Seed: kakeibo and furusato have data in memory.
    useKakeiboStore.setState({
      entries: [{ id: 'old', amount: 9000, date: '2026-01-01', category: 'food' } as never],
    });

    // Payload contains ONLY settings — kakeibo should reset to defaults.
    const payload = buildBackupPayload({
      'kakei-settings-v1': JSON.stringify({
        state: { settings: { language: 'vi', theme: 'system', payday: 25, defaultPrefecture: null, defaultMunicipality: null, notificationsEnabled: false, faceIdEnabled: false } },
      }),
    });
    await restoreBackup(payload);

    // Settings applied from payload:
    expect(useSettingsStore.getState().settings.language).toBe('vi');
    // Absent store cleared via its own reset helper:
    expect(useKakeiboStore.getState().entries).toEqual([]);
  });
});

describe('BACKUP_STORE_SLOTS', () => {
  it('covers every required Step-3 store domain', () => {
    const labels = BACKUP_STORE_SLOTS.map((s) => s.label);
    // Brief explicitly names these 8 (biometric prefs live inside settings):
    for (const required of [
      'calculator',
      'kakeibo',
      'goals',
      'documents',
      'tripBudgets',
      'taxChecklist',
      'onboarding',
      'settings',
    ]) {
      expect(labels).toContain(required);
    }
  });

  it('has unique keys', () => {
    const keys = BACKUP_STORE_SLOTS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('restoreBackup with payload containing junk slice', () => {
  it('does not throw when a slice fails to parse mid-restore', async () => {
    const payload: BackupPayload = buildBackupPayload({
      'kakei-settings-v1': '{not-json}',
      'kakei-kakeibo-v1': JSON.stringify({ state: { entries: [], recurrings: [] } }),
    });
    await expect(restoreBackup(payload)).resolves.toBeUndefined();
    // The non-junk slice still rehydrates in memory:
    expect(useKakeiboStore.getState().entries).toEqual([]);
  });
});

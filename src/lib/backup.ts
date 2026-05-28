/**
 * Local JSON backup — export every persist-store slice from AsyncStorage
 * into a single self-describing payload, and restore the inverse.
 *
 * Design notes:
 *
 *   - Treats AsyncStorage as the source of truth. We don't re-derive each
 *     store's shape; we round-trip the exact `kakei-*` / `money-dashboard-*`
 *     keys the persist middleware already writes. This means future store
 *     shape changes are absorbed automatically (subject to schemaVersion).
 *
 *   - Pure helpers (`buildBackupPayload`, `parseBackupJSON`,
 *     `summarizeBackup`, `isBackupPayload`) are React-free and IO-free so
 *     they're trivial to unit-test.
 *
 *   - The IO helpers (`exportBackup`, `restoreBackup`) touch AsyncStorage
 *     and call each store's setter to repaint the in-memory copy without
 *     waiting for the next app launch.
 *
 *   - There is intentionally no cloud sync, no encryption-at-rest, no
 *     network upload. Users own the JSON; sharing/storing it is their
 *     choice via the system Share sheet.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { APP_BUILD, APP_VERSION } from '@/lib/app-info';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useDocumentDeadlineStore } from '@/store/documentDeadlineStore';
import { useDocumentsStore } from '@/store/documentsStore';
import { useFurusatoStore } from '@/store/furusatoStore';
import { useGoalsStore } from '@/store/goalsStore';
import { useHistoryStore } from '@/store/historyStore';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useKakuteiStore } from '@/store/kakuteiStore';
import { useMedicalExpensesStore } from '@/store/medicalExpensesStore';
import { useMultiJobStore } from '@/store/multiJobStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useRemittanceStore } from '@/store/remittanceStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTaxChecklistStore } from '@/store/taxChecklistStore';
import { useTripBudgetStore } from '@/store/tripBudgetStore';

/**
 * Bump when the on-disk export shape changes in a backwards-incompatible
 * way. Importers compare and refuse anything they don't understand.
 */
export const BACKUP_SCHEMA_VERSION = 2;

/**
 * Every persist-store key the app writes to AsyncStorage. The label is
 * an i18n token suffix used by `summarizeBackup` so the preview screen
 * can show user-friendly names like "Kakeibo entries" instead of raw
 * persist keys.
 *
 * Order matters: `summarizeBackup` renders rows in this order so the
 * preview reads top-to-bottom the way users mentally group features
 * (personal → daily-use → annual → secondary).
 */
interface StoreSlot {
  key: string;
  label: string;
  /** Path inside the persisted JSON to count (state.<arrayField>). null → no countable list. */
  countPath?: string;
}

export const BACKUP_STORE_SLOTS: readonly StoreSlot[] = [
  { key: 'kakei-settings-v1', label: 'settings' },
  { key: 'kakei-onboarding-v1', label: 'onboarding' },
  { key: 'money-dashboard-jp-calculator', label: 'calculator' },
  { key: 'money-dashboard-jp-history', label: 'history', countPath: 'entries' },
  { key: 'kakei-kakeibo-v1', label: 'kakeibo', countPath: 'entries' },
  { key: 'kakei-goals-v1', label: 'goals', countPath: 'goals' },
  { key: 'kakei-documents-v1', label: 'documents', countPath: 'documents' },
  { key: 'kakei-document-deadlines-v1', label: 'documentDeadlines', countPath: 'deadlines' },
  { key: 'kakei-trip-budgets-v1', label: 'tripBudgets', countPath: 'trips' },
  { key: 'kakei-tax-checklist-v1', label: 'taxChecklist' },
  { key: 'kakei-medical-v1', label: 'medical', countPath: 'expenses' },
  { key: 'kakei-furusato-v1', label: 'furusato', countPath: 'donations' },
  { key: 'kakei-remittance-v1', label: 'remittance', countPath: 'entries' },
  { key: 'kakei-kakutei-v1', label: 'kakutei' },
  { key: 'kakei-multi-job-v1', label: 'multiJob', countPath: 'jobs' },
];

export interface BackupPayload {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  appBuild: string;
  /** Map of AsyncStorage key → serialized JSON string (exactly as persist wrote it). */
  stores: Record<string, string>;
}

export interface BackupRow {
  /** Untranslated suffix — UI translates as `settings.backup.stores.<label>`. */
  label: string;
  /** Count of items if the store has a known list field; null when not countable. */
  count: number | null;
  /** True if this key exists in the payload at all. */
  present: boolean;
}

export interface BackupSummary {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  appBuild: string;
  rows: BackupRow[];
  /** Sum of countable rows — useful for the "this will overwrite N records" copy. */
  totalRecords: number;
}

// ───────────────────────── pure helpers ─────────────────────────

export function buildBackupPayload(
  rawStores: Record<string, string>,
  now: Date = new Date(),
): BackupPayload {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    appVersion: APP_VERSION,
    appBuild: APP_BUILD,
    stores: rawStores,
  };
}

export function isBackupPayload(value: unknown): value is BackupPayload {
  if (value === null || typeof value !== 'object') return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.schemaVersion !== 'number') return false;
  if (typeof obj.exportedAt !== 'string') return false;
  if (typeof obj.appVersion !== 'string') return false;
  if (typeof obj.appBuild !== 'string') return false;
  if (obj.stores === null || typeof obj.stores !== 'object') return false;
  // All values inside `stores` must be strings (the raw JSON persist wrote).
  for (const v of Object.values(obj.stores as Record<string, unknown>)) {
    if (typeof v !== 'string') return false;
  }
  return true;
}

export type ParseBackupResult =
  | { ok: true; payload: BackupPayload }
  | { ok: false; error: 'invalid-json' | 'invalid-shape' | 'incompatible-version' };

export function parseBackupJSON(text: string): ParseBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalid-json' };
  }
  if (!isBackupPayload(parsed)) {
    return { ok: false, error: 'invalid-shape' };
  }
  if (parsed.schemaVersion > BACKUP_SCHEMA_VERSION) {
    // Older builds shouldn't even try to apply a newer schema; the missing
    // keys would silently wipe user data instead of merging cleanly.
    return { ok: false, error: 'incompatible-version' };
  }
  return { ok: true, payload: parsed };
}

/**
 * Per-store row summary used by the import preview modal. Counts come
 * from the inner `state.<field>` path — that's where Zustand persist
 * nests the actual store state.
 */
export function summarizeBackup(payload: BackupPayload): BackupSummary {
  const rows: BackupRow[] = BACKUP_STORE_SLOTS.map((slot) => {
    const raw = payload.stores[slot.key];
    if (raw === undefined) {
      return { label: slot.label, count: null, present: false };
    }
    if (!slot.countPath) {
      return { label: slot.label, count: null, present: true };
    }
    let count: number | null = null;
    try {
      const inner = JSON.parse(raw) as { state?: Record<string, unknown> };
      const arr = inner?.state?.[slot.countPath];
      if (Array.isArray(arr)) count = arr.length;
    } catch {
      // Leave count null; row is still marked present.
    }
    return { label: slot.label, count, present: true };
  });
  const totalRecords = rows.reduce((sum, r) => sum + (r.count ?? 0), 0);
  return {
    schemaVersion: payload.schemaVersion,
    exportedAt: payload.exportedAt,
    appVersion: payload.appVersion,
    appBuild: payload.appBuild,
    rows,
    totalRecords,
  };
}

// ───────────────────────── IO helpers ─────────────────────────

/**
 * Snapshot every known persist key into a single payload. Keys that
 * AsyncStorage doesn't have (e.g. a feature the user has never opened)
 * are simply omitted — `summarizeBackup` then renders them as "absent"
 * during preview so the user can see what was/wasn't captured.
 */
export async function exportBackup(now?: Date): Promise<BackupPayload> {
  const keys = BACKUP_STORE_SLOTS.map((s) => s.key);
  const pairs = await AsyncStorage.multiGet(keys);
  const stores: Record<string, string> = {};
  for (const [k, v] of pairs) {
    if (v !== null && v !== undefined) stores[k] = v;
  }
  return buildBackupPayload(stores, now);
}

/**
 * Map of persist key → setState invoker that rehydrates the in-memory
 * store from the JSON shape stored on disk. We do this manually instead
 * of trusting `persist.rehydrate()` because some store builds in the
 * project don't expose `rehydrate` on the typed API and we want the
 * change to be visible to subscribers IMMEDIATELY, not on the next tick.
 */
const STORE_REHYDRATERS: Record<string, (rawJSON: string) => void> = {
  'kakei-settings-v1': (raw) => applySliceToStore(useSettingsStore, raw),
  'kakei-onboarding-v1': (raw) => applySliceToStore(useOnboardingStore, raw),
  'money-dashboard-jp-calculator': (raw) => applySliceToStore(useCalculatorStore, raw),
  'money-dashboard-jp-history': (raw) => applySliceToStore(useHistoryStore, raw),
  'kakei-kakeibo-v1': (raw) => applySliceToStore(useKakeiboStore, raw),
  'kakei-goals-v1': (raw) => applySliceToStore(useGoalsStore, raw),
  'kakei-documents-v1': (raw) => applySliceToStore(useDocumentsStore, raw),
  'kakei-document-deadlines-v1': (raw) => applySliceToStore(useDocumentDeadlineStore, raw),
  'kakei-trip-budgets-v1': (raw) => applySliceToStore(useTripBudgetStore, raw),
  'kakei-tax-checklist-v1': (raw) => applySliceToStore(useTaxChecklistStore, raw),
  'kakei-medical-v1': (raw) => applySliceToStore(useMedicalExpensesStore, raw),
  'kakei-furusato-v1': (raw) => applySliceToStore(useFurusatoStore, raw),
  'kakei-remittance-v1': (raw) => applySliceToStore(useRemittanceStore, raw),
  'kakei-kakutei-v1': (raw) => applySliceToStore(useKakuteiStore, raw),
  'kakei-multi-job-v1': (raw) => applySliceToStore(useMultiJobStore, raw),
};

function applySliceToStore(store: { setState: (partial: object) => void }, rawJSON: string): void {
  try {
    const parsed = JSON.parse(rawJSON) as { state?: unknown };
    if (parsed && typeof parsed === 'object' && parsed.state && typeof parsed.state === 'object') {
      store.setState(parsed.state as object);
    }
  } catch {
    // Slice was malformed — better to leave the store at defaults than to
    // crash mid-restore. The caller (restoreBackup) writes to AsyncStorage
    // first so a relaunch would still recover whatever was salvageable.
  }
}

/**
 * Overwrite every known persist key from `payload.stores`, then push the
 * new state into each in-memory store. Stores absent from the payload
 * are *removed* from AsyncStorage so the restore matches the source
 * device exactly — a half-merge would be confusing.
 *
 * Caller is responsible for warning the user this is destructive.
 */
export async function restoreBackup(payload: BackupPayload): Promise<void> {
  const knownKeys = BACKUP_STORE_SLOTS.map((s) => s.key);
  const presentKeys = Object.keys(payload.stores).filter((k) => knownKeys.includes(k));
  const absentKeys = knownKeys.filter((k) => !(k in payload.stores));

  if (presentKeys.length > 0) {
    const entries: [string, string][] = presentKeys.map((k) => {
      const v = payload.stores[k];
      if (typeof v !== 'string') {
        throw new Error(`backup: non-string value for key ${k}`);
      }
      return [k, v];
    });
    await AsyncStorage.multiSet(entries);
  }
  if (absentKeys.length > 0) {
    await AsyncStorage.multiRemove(absentKeys);
  }

  // Rehydrate in-memory copies so the UI reflects the restore without a
  // full app relaunch. Stores absent from the payload reset to defaults
  // via their own reset helpers below.
  for (const k of presentKeys) {
    const rehydrate = STORE_REHYDRATERS[k];
    const raw = payload.stores[k];
    if (rehydrate && typeof raw === 'string') rehydrate(raw);
  }
  if (absentKeys.length > 0) {
    resetAbsentStores(absentKeys);
  }
}

/**
 * For stores that the backup doesn't include, reset to defaults so the
 * device matches the source. We call each store's reset helper instead
 * of `useFoo.setState(initialState)` so any logic encoded in the reset
 * (clearing timers, recomputing derived state) still runs.
 */
function resetAbsentStores(keys: readonly string[]): void {
  for (const key of keys) {
    try {
      switch (key) {
        case 'kakei-settings-v1':
          useSettingsStore.getState().resetToDefaults();
          break;
        case 'kakei-onboarding-v1':
          useOnboardingStore.getState().reset();
          break;
        case 'money-dashboard-jp-calculator':
          useCalculatorStore.getState().reset();
          break;
        case 'money-dashboard-jp-history':
          useHistoryStore.setState({ entries: [], migratedFromLatest: false });
          break;
        case 'kakei-kakeibo-v1':
          useKakeiboStore.getState().clearAll();
          break;
        case 'kakei-goals-v1':
          useGoalsStore.getState().clearAll();
          break;
        case 'kakei-documents-v1':
          useDocumentsStore.getState().clearAll();
          break;
        case 'kakei-document-deadlines-v1':
          useDocumentDeadlineStore.getState().clearDocumentDeadlines();
          break;
        case 'kakei-trip-budgets-v1':
          useTripBudgetStore.getState().clearTrips();
          break;
        case 'kakei-tax-checklist-v1':
          useTaxChecklistStore.getState().clearAll();
          break;
        case 'kakei-medical-v1':
          useMedicalExpensesStore.getState().clearAll();
          break;
        case 'kakei-furusato-v1':
          useFurusatoStore.getState().clearAll();
          break;
        case 'kakei-remittance-v1':
          useRemittanceStore.getState().clearAll();
          break;
        case 'kakei-kakutei-v1':
          useKakuteiStore.getState().resetDraft();
          break;
        case 'kakei-multi-job-v1':
          useMultiJobStore.getState().clearAll();
          break;
      }
    } catch {
      // One failed reset shouldn't abort the whole restore. The disk write
      // already happened; worst case is one store keeps stale in-memory
      // state until the next app launch rehydrates.
    }
  }
}

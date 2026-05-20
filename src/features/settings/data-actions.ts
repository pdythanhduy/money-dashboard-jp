/**
 * Side-effectful helpers for Settings → Dữ liệu:
 *
 *   - `buildExportPayload(...)` — pure builder for the JSON the share sheet
 *     receives. Tested.
 *   - `wipeAllAppData(...)` — clears AsyncStorage + resets every in-memory
 *     store. Untested (touches native AsyncStorage); callers should always
 *     prompt via ClearDataConfirmModal first.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { APP_VERSION } from '@/lib/app-info';
import { cancelAllReminders } from '@/lib/notifications';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useDocumentsStore } from '@/store/documentsStore';
import { useFurusatoStore } from '@/store/furusatoStore';
import { useHistoryStore } from '@/store/historyStore';
import { useMedicalExpensesStore } from '@/store/medicalExpensesStore';
import { useMultiJobStore } from '@/store/multiJobStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { DEFAULT_SETTINGS, useSettingsStore, type AppSettings } from '@/store/settingsStore';
import type { HistoryEntry } from '@/types/history';

/**
 * Bump when the on-disk export shape changes in a backwards-incompatible
 * way. Consumers can branch on this to migrate older exports forward.
 */
export const EXPORT_SCHEMA_VERSION = 1;

export interface ExportPayload {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  settings: AppSettings;
  history: HistoryEntry[];
  historyCount: number;
}

export function buildExportPayload(
  settings: AppSettings,
  history: HistoryEntry[],
  now: Date = new Date(),
): ExportPayload {
  return {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: now.toISOString(),
    appVersion: APP_VERSION,
    settings,
    history,
    historyCount: history.length,
  };
}

export async function wipeAllAppData(): Promise<void> {
  // Cancel system notifications first — the in-memory document store
  // about to be cleared was the source of truth.
  await cancelAllReminders();
  try {
    await AsyncStorage.clear();
  } catch {
    // AsyncStorage.clear can throw if not initialized — fall through, the
    // in-memory resets below still take effect.
  }
  useHistoryStore.setState({ entries: [], migratedFromLatest: false });
  useCalculatorStore.getState().reset();
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS });
  useOnboardingStore.getState().reset();
  useMultiJobStore.getState().clearAll();
  useDocumentsStore.getState().clearAll();
  useMedicalExpensesStore.getState().clearAll();
  useFurusatoStore.getState().clearAll();
}

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
import { useCalculatorStore } from '@/store/calculatorStore';
import { useHistoryStore } from '@/store/historyStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { DEFAULT_SETTINGS, useSettingsStore, type AppSettings } from '@/store/settingsStore';
import type { HistoryEntry } from '@/types/history';

export interface ExportPayload {
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
    exportedAt: now.toISOString(),
    appVersion: APP_VERSION,
    settings,
    history,
    historyCount: history.length,
  };
}

export async function wipeAllAppData(): Promise<void> {
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
}

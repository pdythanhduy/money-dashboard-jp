/**
 * Side-effect actions invoked from SettingsScreen: export user data to a
 * sharable JSON file, and wipe every store back to defaults.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { useCalculatorStore } from '@/store/calculatorStore';
import { useHistoryStore } from '@/store/historyStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore } from '@/store/settingsStore';

export interface ExportPayload {
  exportedAt: string;
  appVersion: string;
  settings: ReturnType<typeof useSettingsStore.getState>['settings'];
  history: ReturnType<typeof useHistoryStore.getState>['entries'];
  lastCalculation: {
    input: ReturnType<typeof useCalculatorStore.getState>['lastInput'];
    result: ReturnType<typeof useCalculatorStore.getState>['lastResult'];
  };
}

export function buildExportPayload(): ExportPayload {
  return {
    exportedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version ?? '0.1.0',
    settings: useSettingsStore.getState().settings,
    history: useHistoryStore.getState().entries,
    lastCalculation: {
      input: useCalculatorStore.getState().lastInput,
      result: useCalculatorStore.getState().lastResult,
    },
  };
}

export async function exportUserData(): Promise<void> {
  const payload = buildExportPayload();
  const json = JSON.stringify(payload, null, 2);
  const file = new File(Paths.cache, `kakei-export-${Date.now()}.json`);
  if (!file.exists) file.create();
  file.write(json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Kakei data export',
      UTI: 'public.json',
    });
  }
}

/**
 * Wipe everything: every Zustand store back to defaults + AsyncStorage
 * cleared (removes anything else that might have been persisted under
 * unknown keys).
 */
export async function clearAllUserData(): Promise<void> {
  useHistoryStore.getState().clearAll();
  useCalculatorStore.getState().reset();
  useSettingsStore.getState().resetToDefaults();
  useOnboardingStore.getState().reset();
  await AsyncStorage.clear();
}

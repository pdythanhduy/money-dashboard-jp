/**
 * History store — array of saved calculations, persisted via AsyncStorage.
 *
 * Entries are always kept sorted descending by `timestamp`. Adding past the
 * MAX_ENTRIES limit returns false so the UI can surface a "history full"
 * warning instead of silently dropping the oldest entry.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { HistoryEntry } from '@/types/history';
import type { SalaryInput, TakeHomeResult } from '@/types/tax';

export const MAX_ENTRIES = 1000;

export interface AddEntryResult {
  added: boolean;
  /** Populated when added=true. */
  entry?: HistoryEntry;
  /** Reason for refusal; only when added=false. */
  reason?: 'limit_reached';
}

interface HistoryStore {
  entries: HistoryEntry[];
  /** Flag set true after the 5C→5D one-shot migration runs. */
  migratedFromLatest: boolean;

  addEntry: (input: SalaryInput, result: TakeHomeResult, label?: string, note?: string) => AddEntryResult;
  updateEntry: (id: string, partial: Partial<Pick<HistoryEntry, 'label' | 'note'>>) => void;
  deleteEntry: (id: string) => void;
  clearAll: () => void;
  getEntryById: (id: string) => HistoryEntry | undefined;
  /** One-shot seed from calculatorStore.lastResult — call from App.tsx. */
  seedFromLatest: (input: SalaryInput, result: TakeHomeResult) => void;
}

function makeEntry(
  input: SalaryInput,
  result: TakeHomeResult,
  label?: string,
  note?: string,
): HistoryEntry {
  const entry: HistoryEntry = {
    id: Crypto.randomUUID(),
    timestamp: Date.now(),
    input,
    result,
  };
  if (label !== undefined) entry.label = label;
  if (note !== undefined) entry.note = note;
  return entry;
}

function sortDesc(entries: HistoryEntry[]): HistoryEntry[] {
  return [...entries].sort((a, b) => b.timestamp - a.timestamp);
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set, get) => ({
      entries: [],
      migratedFromLatest: false,

      addEntry: (input, result, label, note) => {
        const current = get().entries;
        if (current.length >= MAX_ENTRIES) {
          return { added: false, reason: 'limit_reached' };
        }
        const entry = makeEntry(input, result, label, note);
        set({ entries: sortDesc([entry, ...current]) });
        return { added: true, entry };
      },

      updateEntry: (id, partial) => {
        set({
          entries: get().entries.map((e) =>
            e.id === id ? { ...e, ...partial } : e,
          ),
        });
      },

      deleteEntry: (id) => {
        set({ entries: get().entries.filter((e) => e.id !== id) });
      },

      clearAll: () => {
        set({ entries: [] });
      },

      getEntryById: (id) => get().entries.find((e) => e.id === id),

      seedFromLatest: (input, result) => {
        const state = get();
        if (state.migratedFromLatest || state.entries.length > 0) return;
        const entry = makeEntry(input, result);
        set({ entries: [entry], migratedFromLatest: true });
      },
    }),
    {
      name: 'money-dashboard-jp-history',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries,
        migratedFromLatest: state.migratedFromLatest,
      }),
    },
  ),
);

/**
 * Persisted remittance log. Each entry caches `amountVND` so the list
 * doesn't recompute on every render — the store keeps it in sync when
 * either `amountJPY` or `exchangeRate` changes via updateEntry.
 *
 * Sort order: DESC by date (most recent first).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  computeAmountVND,
  type RemittanceEntry,
  type RemittanceProvider,
} from '@/lib/remittance-math';

export const MAX_ENTRIES = 500;

export interface AddEntryResult {
  added: boolean;
  entry?: RemittanceEntry;
  reason?: 'limit_reached';
}

interface AddInput {
  date: string;
  amountJPY: number;
  feeJPY: number;
  exchangeRate: number;
  provider: RemittanceProvider;
  recipient?: string;
  note?: string;
}

interface RemittanceStore {
  entries: RemittanceEntry[];
  /** ¥; 0 = goal not set. */
  annualGoalJPY: number;

  addEntry: (input: AddInput) => AddEntryResult;
  updateEntry: (id: string, partial: Partial<Omit<RemittanceEntry, 'id' | 'amountVND'>>) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;

  setAnnualGoal: (amountJPY: number) => void;

  getEntry: (id: string) => RemittanceEntry | undefined;
}

function sortDescByDate(list: RemittanceEntry[]): RemittanceEntry[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export const useRemittanceStore = create<RemittanceStore>()(
  persist(
    (set, get) => ({
      entries: [],
      annualGoalJPY: 0,

      addEntry: (input) => {
        const current = get().entries;
        if (current.length >= MAX_ENTRIES) {
          return { added: false, reason: 'limit_reached' };
        }
        const entry: RemittanceEntry = {
          id: Crypto.randomUUID(),
          date: input.date,
          amountJPY: input.amountJPY,
          feeJPY: input.feeJPY,
          exchangeRate: input.exchangeRate,
          amountVND: computeAmountVND(input.amountJPY, input.exchangeRate),
          provider: input.provider,
          ...(input.recipient ? { recipient: input.recipient } : {}),
          ...(input.note ? { note: input.note } : {}),
        };
        set({ entries: sortDescByDate([entry, ...current]) });
        return { added: true, entry };
      },

      updateEntry: (id, partial) => {
        set({
          entries: sortDescByDate(
            get().entries.map((e) => {
              if (e.id !== id) return e;
              const next = { ...e, ...partial };
              // Re-derive amountVND whenever either input changes.
              if (partial.amountJPY !== undefined || partial.exchangeRate !== undefined) {
                next.amountVND = computeAmountVND(next.amountJPY, next.exchangeRate);
              }
              return next;
            }),
          ),
        });
      },

      removeEntry: (id) => {
        set({ entries: get().entries.filter((e) => e.id !== id) });
      },

      clearAll: () => set({ entries: [], annualGoalJPY: 0 }),

      setAnnualGoal: (amountJPY) => {
        set({ annualGoalJPY: amountJPY > 0 ? amountJPY : 0 });
      },

      getEntry: (id) => get().entries.find((e) => e.id === id),
    }),
    {
      name: 'kakei-remittance-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ entries: state.entries, annualGoalJPY: state.annualGoalJPY }),
    },
  ),
);

/**
 * Persisted log of 医療費 receipts the user wants tracked for the annual
 * 医療費控除 calculation. Sorted DESC by `date` so the most recent entry
 * is always first in the list.
 *
 * Receipt image URIs are stored as plain strings pointing at the local
 * document directory (see receipt-storage.ts) — never uploaded.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { MedicalCategory, MedicalExpense } from '@/lib/medical-deduction';

export const MAX_EXPENSES = 500;

export interface AddExpenseResult {
  added: boolean;
  expense?: MedicalExpense;
  reason?: 'limit_reached';
}

interface AddInput {
  date: string;
  amount: number;
  category: MedicalCategory;
  provider?: string;
  note?: string;
  receiptImageUri?: string;
  reimbursedAmount?: number;
}

interface MedicalExpensesStore {
  expenses: MedicalExpense[];
  addExpense: (input: AddInput) => AddExpenseResult;
  updateExpense: (id: string, partial: Partial<Omit<MedicalExpense, 'id'>>) => void;
  removeExpense: (id: string) => void;
  clearAll: () => void;
  getExpense: (id: string) => MedicalExpense | undefined;
}

function sortDescByDate(list: MedicalExpense[]): MedicalExpense[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export const useMedicalExpensesStore = create<MedicalExpensesStore>()(
  persist(
    (set, get) => ({
      expenses: [],

      addExpense: (input) => {
        const current = get().expenses;
        if (current.length >= MAX_EXPENSES) {
          return { added: false, reason: 'limit_reached' };
        }
        const expense: MedicalExpense = {
          id: Crypto.randomUUID(),
          date: input.date,
          amount: input.amount,
          category: input.category,
          ...(input.provider ? { provider: input.provider } : {}),
          ...(input.note ? { note: input.note } : {}),
          ...(input.receiptImageUri ? { receiptImageUri: input.receiptImageUri } : {}),
          ...(input.reimbursedAmount !== undefined
            ? { reimbursedAmount: input.reimbursedAmount }
            : {}),
        };
        set({ expenses: sortDescByDate([expense, ...current]) });
        return { added: true, expense };
      },

      updateExpense: (id, partial) => {
        set({
          expenses: sortDescByDate(
            get().expenses.map((e) => (e.id === id ? { ...e, ...partial } : e)),
          ),
        });
      },

      removeExpense: (id) => {
        set({ expenses: get().expenses.filter((e) => e.id !== id) });
      },

      clearAll: () => set({ expenses: [] }),

      getExpense: (id) => get().expenses.find((e) => e.id === id),
    }),
    {
      name: 'kakei-medical-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ expenses: state.expenses }),
    },
  ),
);

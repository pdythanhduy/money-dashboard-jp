/**
 * Persisted 家計簿 (kakeibo) log.
 *
 *   entries — manual expense rows, sorted DESC by date so the most recent
 *             entry is first. Capped at MAX_ENTRIES.
 *   budgets — per-category monthly cap. setBudget(cat, 0) removes that
 *             category's budget (kept symmetric so the UI can wipe a row
 *             by clearing its input).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { BudgetTarget, ExpenseCategory, KakeiboEntry } from '@/lib/kakeibo-math';
import type { RecurringExpense } from '@/types/recurring-expense';

export const MAX_ENTRIES = 5000;
/** Cap on recurring rows — even power users rarely have > ~15 (rent, utilities, mobile, etc.). */
export const MAX_RECURRINGS = 30;

export interface AddEntryResult {
  added: boolean;
  entry?: KakeiboEntry;
  reason?: 'limit_reached';
}

export interface AddRecurringResult {
  added: boolean;
  recurring?: RecurringExpense;
  reason?: 'limit_reached';
}

interface AddEntryInput {
  date: string;
  amount: number;
  category: ExpenseCategory;
  label?: string;
  note?: string;
  isRecurring?: boolean;
}

interface AddRecurringInput {
  name: string;
  amount: number;
  category: ExpenseCategory;
  dayOfMonth: number;
  note?: string;
  active?: boolean;
}

interface KakeiboStore {
  entries: KakeiboEntry[];
  budgets: BudgetTarget[];
  recurrings: RecurringExpense[];

  addEntry: (input: AddEntryInput) => AddEntryResult;
  updateEntry: (id: string, partial: Partial<Omit<KakeiboEntry, 'id'>>) => void;
  removeEntry: (id: string) => void;
  clearEntries: () => void;

  setBudget: (category: ExpenseCategory, limit: number) => void;
  setBudgets: (budgets: BudgetTarget[]) => void;
  removeBudget: (category: ExpenseCategory) => void;
  clearBudgets: () => void;

  addRecurring: (input: AddRecurringInput) => AddRecurringResult;
  updateRecurring: (id: string, partial: Partial<Omit<RecurringExpense, 'id' | 'createdAt'>>) => void;
  removeRecurring: (id: string) => void;
  toggleRecurringActive: (id: string) => void;
  markRecurringGenerated: (id: string, yearMonth: string) => void;
  clearRecurrings: () => void;

  clearAll: () => void;

  getEntry: (id: string) => KakeiboEntry | undefined;
  getBudget: (category: ExpenseCategory) => BudgetTarget | undefined;
  getRecurring: (id: string) => RecurringExpense | undefined;
}

function sortDescByDate(list: KakeiboEntry[]): KakeiboEntry[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export const useKakeiboStore = create<KakeiboStore>()(
  persist(
    (set, get) => ({
      entries: [],
      budgets: [],
      recurrings: [],

      addEntry: (input) => {
        const current = get().entries;
        if (current.length >= MAX_ENTRIES) {
          return { added: false, reason: 'limit_reached' };
        }
        const entry: KakeiboEntry = {
          id: Crypto.randomUUID(),
          date: input.date,
          amount: input.amount,
          category: input.category,
          ...(input.label ? { label: input.label } : {}),
          ...(input.note ? { note: input.note } : {}),
          ...(input.isRecurring ? { isRecurring: true } : {}),
        };
        set({ entries: sortDescByDate([entry, ...current]) });
        return { added: true, entry };
      },

      updateEntry: (id, partial) => {
        set({
          entries: sortDescByDate(
            get().entries.map((e) => (e.id === id ? { ...e, ...partial } : e)),
          ),
        });
      },

      removeEntry: (id) => {
        set({ entries: get().entries.filter((e) => e.id !== id) });
      },

      clearEntries: () => set({ entries: [] }),

      setBudget: (category, limit) => {
        const current = get().budgets;
        if (limit <= 0) {
          set({ budgets: current.filter((b) => b.category !== category) });
          return;
        }
        const exists = current.some((b) => b.category === category);
        if (exists) {
          set({
            budgets: current.map((b) =>
              b.category === category ? { ...b, monthlyLimit: limit } : b,
            ),
          });
        } else {
          set({ budgets: [...current, { category, monthlyLimit: limit }] });
        }
      },

      setBudgets: (budgets) => {
        set({ budgets: budgets.filter((b) => b.monthlyLimit > 0) });
      },

      removeBudget: (category) => {
        set({ budgets: get().budgets.filter((b) => b.category !== category) });
      },

      clearBudgets: () => set({ budgets: [] }),

      addRecurring: (input) => {
        const current = get().recurrings;
        if (current.length >= MAX_RECURRINGS) {
          return { added: false, reason: 'limit_reached' };
        }
        const recurring: RecurringExpense = {
          id: Crypto.randomUUID(),
          name: input.name,
          amount: input.amount,
          category: input.category,
          dayOfMonth: Math.min(Math.max(1, Math.floor(input.dayOfMonth)), 31),
          active: input.active ?? true,
          createdAt: new Date().toISOString(),
          ...(input.note ? { note: input.note } : {}),
        };
        set({ recurrings: [...current, recurring] });
        return { added: true, recurring };
      },

      updateRecurring: (id, partial) => {
        set({
          recurrings: get().recurrings.map((r) =>
            r.id === id ? { ...r, ...partial } : r,
          ),
        });
      },

      removeRecurring: (id) => {
        set({ recurrings: get().recurrings.filter((r) => r.id !== id) });
      },

      toggleRecurringActive: (id) => {
        set({
          recurrings: get().recurrings.map((r) =>
            r.id === id ? { ...r, active: !r.active } : r,
          ),
        });
      },

      markRecurringGenerated: (id, yearMonth) => {
        set({
          recurrings: get().recurrings.map((r) =>
            r.id === id ? { ...r, lastGeneratedYearMonth: yearMonth } : r,
          ),
        });
      },

      clearRecurrings: () => set({ recurrings: [] }),

      clearAll: () => set({ entries: [], budgets: [], recurrings: [] }),

      getEntry: (id) => get().entries.find((e) => e.id === id),
      getBudget: (category) => get().budgets.find((b) => b.category === category),
      getRecurring: (id) => get().recurrings.find((r) => r.id === id),
    }),
    {
      name: 'kakei-kakeibo-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        entries: state.entries,
        budgets: state.budgets,
        recurrings: state.recurrings,
      }),
    },
  ),
);

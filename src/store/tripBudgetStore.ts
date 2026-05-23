/**
 * Persisted Trip & Business Budget Planner store.
 *
 * One row per trip. Nested arrays for `plannedItems` and `actualExpenses`
 * live inside the trip — keeps related data together for the UI and
 * sidesteps cross-store sort joins. Capped per-trip too so a single
 * stuck row can't bloat the persist payload.
 *
 * Sort: trips DESC by `startDate` (newest first).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type {
  TripActualExpense,
  TripBudget,
  TripExpenseCategory,
  TripPlanItem,
  TripStatus,
  TripType,
} from '@/types/trip-budget';

export const MAX_TRIPS = 100;
export const MAX_PLAN_ITEMS_PER_TRIP = 50;
export const MAX_ACTUAL_EXPENSES_PER_TRIP = 500;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Strict calendar-aware ISO date check.
 *
 * Regex alone passes "2026-02-31" and "2026-13-01" — both invalid. We
 * round-trip through `new Date(y, m-1, d)` and require the parts to come
 * back unchanged. Local-time construction is fine: we only need calendar
 * validity, not an absolute timestamp.
 */
export function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(5, 7));
  const d = Number(value.slice(8, 10));
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export type StoreResultReason = 'not_found' | 'limit_reached' | 'invalid_input';

export interface StoreResult<T = unknown> {
  ok: boolean;
  trip?: TripBudget;
  item?: T;
  reason?: StoreResultReason;
}

interface AddTripInput {
  title: string;
  type: TripType;
  startDate: string;
  endDate: string;
  destination?: string;
  companyAdvanceAmount?: number;
  note?: string;
  status?: TripStatus;
}

interface AddPlanItemInput {
  category: TripExpenseCategory;
  plannedAmount: number;
  label?: string;
  note?: string;
}

interface AddActualExpenseInput {
  date: string;
  category: TripExpenseCategory;
  amount: number;
  label?: string;
  note?: string;
  reimbursable?: boolean;
}

interface TripBudgetStore {
  trips: TripBudget[];

  addTrip: (input: AddTripInput) => StoreResult;
  updateTrip: (id: string, partial: Partial<Omit<TripBudget, 'id' | 'createdAt'>>) => StoreResult;
  deleteTrip: (id: string) => StoreResult;
  clearTrips: () => void;
  getTrip: (id: string) => TripBudget | undefined;

  addPlanItem: (tripId: string, input: AddPlanItemInput) => StoreResult<TripPlanItem>;
  updatePlanItem: (
    tripId: string,
    itemId: string,
    partial: Partial<Omit<TripPlanItem, 'id'>>,
  ) => StoreResult;
  deletePlanItem: (tripId: string, itemId: string) => StoreResult;

  addActualExpense: (
    tripId: string,
    input: AddActualExpenseInput,
  ) => StoreResult<TripActualExpense>;
  updateActualExpense: (
    tripId: string,
    expenseId: string,
    partial: Partial<Omit<TripActualExpense, 'id'>>,
  ) => StoreResult;
  deleteActualExpense: (tripId: string, expenseId: string) => StoreResult;

  markTripCompleted: (id: string) => StoreResult;
  cancelTrip: (id: string) => StoreResult;
}

function sortDescByStartDate(list: TripBudget[]): TripBudget[] {
  return [...list].sort((a, b) => b.startDate.localeCompare(a.startDate));
}

function validateTripInput(input: AddTripInput): boolean {
  if (!input.title.trim()) return false;
  if (!isValidIsoDate(input.startDate) || !isValidIsoDate(input.endDate)) return false;
  if (input.endDate < input.startDate) return false;
  if (input.companyAdvanceAmount !== undefined && input.companyAdvanceAmount < 0) return false;
  return true;
}

function nowIso(): string {
  return new Date().toISOString();
}

export const useTripBudgetStore = create<TripBudgetStore>()(
  persist(
    (set, get) => ({
      trips: [],

      addTrip: (input) => {
        if (!validateTripInput(input)) return { ok: false, reason: 'invalid_input' };
        const current = get().trips;
        if (current.length >= MAX_TRIPS) return { ok: false, reason: 'limit_reached' };
        const t: TripBudget = {
          id: Crypto.randomUUID(),
          title: input.title.trim(),
          type: input.type,
          status: input.status ?? 'planned',
          startDate: input.startDate,
          endDate: input.endDate,
          currency: 'JPY',
          plannedItems: [],
          actualExpenses: [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
          ...(input.destination ? { destination: input.destination } : {}),
          ...(input.companyAdvanceAmount !== undefined
            ? { companyAdvanceAmount: input.companyAdvanceAmount }
            : {}),
          ...(input.note ? { note: input.note } : {}),
        };
        set({ trips: sortDescByStartDate([t, ...current]) });
        return { ok: true, trip: t };
      },

      updateTrip: (id, partial) => {
        const t = get().trips.find((x) => x.id === id);
        if (!t) return { ok: false, reason: 'not_found' };
        // Validate the MERGED candidate, not just the partial. Otherwise
        // changing only one of (startDate, endDate) can leave the trip in
        // an invalid range.
        const candidate: TripBudget = { ...t, ...partial };
        if (partial.title !== undefined && !candidate.title.trim()) {
          return { ok: false, reason: 'invalid_input' };
        }
        if (!isValidIsoDate(candidate.startDate) || !isValidIsoDate(candidate.endDate)) {
          return { ok: false, reason: 'invalid_input' };
        }
        if (candidate.endDate < candidate.startDate) {
          return { ok: false, reason: 'invalid_input' };
        }
        if (
          candidate.companyAdvanceAmount !== undefined &&
          candidate.companyAdvanceAmount < 0
        ) {
          return { ok: false, reason: 'invalid_input' };
        }
        const next: TripBudget = { ...candidate, updatedAt: nowIso() };
        set({ trips: sortDescByStartDate(get().trips.map((x) => (x.id === id ? next : x))) });
        return { ok: true, trip: next };
      },

      deleteTrip: (id) => {
        const t = get().trips.find((x) => x.id === id);
        if (!t) return { ok: false, reason: 'not_found' };
        set({ trips: get().trips.filter((x) => x.id !== id) });
        return { ok: true };
      },

      clearTrips: () => set({ trips: [] }),

      getTrip: (id) => get().trips.find((t) => t.id === id),

      addPlanItem: (tripId, input) => {
        const t = get().trips.find((x) => x.id === tripId);
        if (!t) return { ok: false, reason: 'not_found' };
        if (t.plannedItems.length >= MAX_PLAN_ITEMS_PER_TRIP) {
          return { ok: false, reason: 'limit_reached' };
        }
        if (input.plannedAmount <= 0) return { ok: false, reason: 'invalid_input' };
        const item: TripPlanItem = {
          id: Crypto.randomUUID(),
          category: input.category,
          plannedAmount: input.plannedAmount,
          ...(input.label ? { label: input.label } : {}),
          ...(input.note ? { note: input.note } : {}),
        };
        const next: TripBudget = {
          ...t,
          plannedItems: [...t.plannedItems, item],
          updatedAt: nowIso(),
        };
        set({ trips: get().trips.map((x) => (x.id === tripId ? next : x)) });
        return { ok: true, trip: next, item };
      },

      updatePlanItem: (tripId, itemId, partial) => {
        const t = get().trips.find((x) => x.id === tripId);
        if (!t) return { ok: false, reason: 'not_found' };
        const target = t.plannedItems.find((p) => p.id === itemId);
        if (!target) return { ok: false, reason: 'not_found' };
        if (partial.plannedAmount !== undefined && partial.plannedAmount <= 0) {
          return { ok: false, reason: 'invalid_input' };
        }
        const next: TripBudget = {
          ...t,
          plannedItems: t.plannedItems.map((p) => (p.id === itemId ? { ...p, ...partial } : p)),
          updatedAt: nowIso(),
        };
        set({ trips: get().trips.map((x) => (x.id === tripId ? next : x)) });
        return { ok: true, trip: next };
      },

      deletePlanItem: (tripId, itemId) => {
        const t = get().trips.find((x) => x.id === tripId);
        if (!t) return { ok: false, reason: 'not_found' };
        const next: TripBudget = {
          ...t,
          plannedItems: t.plannedItems.filter((p) => p.id !== itemId),
          updatedAt: nowIso(),
        };
        set({ trips: get().trips.map((x) => (x.id === tripId ? next : x)) });
        return { ok: true, trip: next };
      },

      addActualExpense: (tripId, input) => {
        const t = get().trips.find((x) => x.id === tripId);
        if (!t) return { ok: false, reason: 'not_found' };
        if (t.actualExpenses.length >= MAX_ACTUAL_EXPENSES_PER_TRIP) {
          return { ok: false, reason: 'limit_reached' };
        }
        if (input.amount <= 0 || !isValidIsoDate(input.date)) {
          return { ok: false, reason: 'invalid_input' };
        }
        const expense: TripActualExpense = {
          id: Crypto.randomUUID(),
          date: input.date,
          category: input.category,
          amount: input.amount,
          ...(input.label ? { label: input.label } : {}),
          ...(input.note ? { note: input.note } : {}),
          ...(input.reimbursable ? { reimbursable: true } : {}),
        };
        const next: TripBudget = {
          ...t,
          actualExpenses: [...t.actualExpenses, expense],
          updatedAt: nowIso(),
        };
        set({ trips: get().trips.map((x) => (x.id === tripId ? next : x)) });
        return { ok: true, trip: next, item: expense };
      },

      updateActualExpense: (tripId, expenseId, partial) => {
        const t = get().trips.find((x) => x.id === tripId);
        if (!t) return { ok: false, reason: 'not_found' };
        const target = t.actualExpenses.find((e) => e.id === expenseId);
        if (!target) return { ok: false, reason: 'not_found' };
        if (partial.amount !== undefined && partial.amount <= 0) {
          return { ok: false, reason: 'invalid_input' };
        }
        if (partial.date !== undefined && !isValidIsoDate(partial.date)) {
          return { ok: false, reason: 'invalid_input' };
        }
        const next: TripBudget = {
          ...t,
          actualExpenses: t.actualExpenses.map((e) =>
            e.id === expenseId ? { ...e, ...partial } : e,
          ),
          updatedAt: nowIso(),
        };
        set({ trips: get().trips.map((x) => (x.id === tripId ? next : x)) });
        return { ok: true, trip: next };
      },

      deleteActualExpense: (tripId, expenseId) => {
        const t = get().trips.find((x) => x.id === tripId);
        if (!t) return { ok: false, reason: 'not_found' };
        const next: TripBudget = {
          ...t,
          actualExpenses: t.actualExpenses.filter((e) => e.id !== expenseId),
          updatedAt: nowIso(),
        };
        set({ trips: get().trips.map((x) => (x.id === tripId ? next : x)) });
        return { ok: true, trip: next };
      },

      markTripCompleted: (id) => {
        const t = get().trips.find((x) => x.id === id);
        if (!t) return { ok: false, reason: 'not_found' };
        const next: TripBudget = { ...t, status: 'completed', updatedAt: nowIso() };
        set({ trips: get().trips.map((x) => (x.id === id ? next : x)) });
        return { ok: true, trip: next };
      },

      cancelTrip: (id) => {
        const t = get().trips.find((x) => x.id === id);
        if (!t) return { ok: false, reason: 'not_found' };
        const next: TripBudget = { ...t, status: 'cancelled', updatedAt: nowIso() };
        set({ trips: get().trips.map((x) => (x.id === id ? next : x)) });
        return { ok: true, trip: next };
      },
    }),
    {
      name: 'kakei-trip-budgets-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ trips: state.trips }),
    },
  ),
);

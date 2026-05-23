/**
 * Per-year tax/admin checklist state. Maps `year × itemId` →
 * { checked: boolean; note?: string }. Items themselves live in
 * `src/lib/tax-checklist.ts` so the canonical list is one source of
 * truth.
 *
 * No personalized tax/legal advice is stored or displayed — this is a
 * pure self-reminder. Settings → Clear all data wipes it.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { TAX_CHECKLIST_ITEM_IDS, type TaxChecklistItemId } from '@/lib/tax-checklist';

export interface TaxChecklistItemState {
  checked: boolean;
  note?: string;
}

/** year → itemId → state. */
export type TaxChecklistState = Record<number, Partial<Record<TaxChecklistItemId, TaxChecklistItemState>>>;

interface TaxChecklistStore {
  byYear: TaxChecklistState;

  /** True if all canonical items for `year` are checked. */
  isYearComplete: (year: number) => boolean;
  /** Number of checked items for `year`. */
  countChecked: (year: number) => number;
  /** Lookup helper; returns undefined when never touched. */
  getItem: (year: number, id: TaxChecklistItemId) => TaxChecklistItemState | undefined;

  setChecked: (year: number, id: TaxChecklistItemId, checked: boolean) => void;
  setNote: (year: number, id: TaxChecklistItemId, note: string) => void;
  toggleItem: (year: number, id: TaxChecklistItemId) => void;

  /** Wipes ALL years; used by Settings → Clear all data. */
  clearAll: () => void;
}

function updateItem(
  state: TaxChecklistState,
  year: number,
  id: TaxChecklistItemId,
  next: TaxChecklistItemState,
): TaxChecklistState {
  return {
    ...state,
    [year]: {
      ...(state[year] ?? {}),
      [id]: next,
    },
  };
}

export const useTaxChecklistStore = create<TaxChecklistStore>()(
  persist(
    (set, get) => ({
      byYear: {},

      isYearComplete: (year) => {
        const yearState = get().byYear[year];
        if (!yearState) return false;
        return TAX_CHECKLIST_ITEM_IDS.every((id) => yearState[id]?.checked === true);
      },

      countChecked: (year) => {
        const yearState = get().byYear[year];
        if (!yearState) return 0;
        return TAX_CHECKLIST_ITEM_IDS.reduce(
          (n, id) => (yearState[id]?.checked ? n + 1 : n),
          0,
        );
      },

      getItem: (year, id) => get().byYear[year]?.[id],

      setChecked: (year, id, checked) => {
        const existing = get().byYear[year]?.[id] ?? { checked: false };
        set({
          byYear: updateItem(get().byYear, year, id, { ...existing, checked }),
        });
      },

      setNote: (year, id, note) => {
        const existing = get().byYear[year]?.[id] ?? { checked: false };
        const next: TaxChecklistItemState = note
          ? { ...existing, note }
          : { checked: existing.checked };
        set({
          byYear: updateItem(get().byYear, year, id, next),
        });
      },

      toggleItem: (year, id) => {
        const current = get().byYear[year]?.[id]?.checked ?? false;
        get().setChecked(year, id, !current);
      },

      clearAll: () => set({ byYear: {} }),
    }),
    {
      name: 'kakei-tax-checklist-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ byYear: state.byYear }),
    },
  ),
);

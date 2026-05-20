/**
 * Persists the kakutei wizard draft so users can step out and come back
 * without losing their manual inputs (life/earthquake insurance, extra
 * national pension). Also caches the most recent computed summary so the
 * dashboard can flash a "last filing estimate" later if we want.
 *
 * Only one draft is active at a time — there's no list semantics here.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { KakuteiSummary } from '@/lib/kakutei-shinkoku';

/** Numeric draft fields the user types in step 4. */
export type KakuteiDraftField =
  | 'fiscalYear'
  | 'lifeInsurancePremium'
  | 'earthquakeInsurancePremium'
  | 'publicPensionContribution';

export interface KakuteiDraft {
  fiscalYear: number;
  lifeInsurancePremium: number;
  earthquakeInsurancePremium: number;
  publicPensionContribution: number;
  /** ISO timestamp the user finalized + cached the summary. */
  completedAt?: string;
  /** Last computed summary — UI may show as a "last year filing snapshot". */
  lastSummary?: KakuteiSummary;
}

function defaultDraft(): KakuteiDraft {
  // Filing in early year N is for fiscal year N-1.
  const year = new Date().getFullYear() - 1;
  return {
    fiscalYear: year,
    lifeInsurancePremium: 0,
    earthquakeInsurancePremium: 0,
    publicPensionContribution: 0,
  };
}

interface KakuteiStore {
  draft: KakuteiDraft;

  updateDraftField: (key: KakuteiDraftField, value: number) => void;
  saveSummary: (summary: KakuteiSummary) => void;
  resetDraft: () => void;
}

export const useKakuteiStore = create<KakuteiStore>()(
  persist(
    (set, get) => ({
      draft: defaultDraft(),

      updateDraftField: (key, value) => {
        const safe = Number.isFinite(value) && value >= 0 ? value : 0;
        set({ draft: { ...get().draft, [key]: safe } });
      },

      saveSummary: (summary) => {
        set({
          draft: {
            ...get().draft,
            lastSummary: summary,
            completedAt: new Date().toISOString(),
          },
        });
      },

      resetDraft: () => set({ draft: defaultDraft() }),
    }),
    {
      name: 'kakei-kakutei-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ draft: state.draft }),
    },
  ),
);

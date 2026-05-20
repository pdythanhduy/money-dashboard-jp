/**
 * Persisted log of ふるさと納税 donations made within the calendar year.
 * Drives FurusatoScreen's history list + the dashboard remaining-capacity
 * widget. Sorted DESC by date so the most recent donation is first.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type FurusatoPortal = 'satofuru' | 'rakuten' | 'furunavi' | 'other';

export interface FurusatoDonation {
  id: string;
  /** ISO date — e.g. "2026-05-19". */
  date: string;
  /** Yen, integer, > 0. */
  amount: number;
  /** Free-text 自治体 name. */
  targetMunicipality: string;
  /** Optional thank-you gift name. */
  giftName?: string;
  portalSite?: FurusatoPortal;
  note?: string;
}

export const MAX_DONATIONS = 100;

export interface AddDonationResult {
  added: boolean;
  donation?: FurusatoDonation;
  reason?: 'limit_reached';
}

interface AddInput {
  date: string;
  amount: number;
  targetMunicipality: string;
  giftName?: string;
  portalSite?: FurusatoPortal;
  note?: string;
}

interface FurusatoStore {
  donations: FurusatoDonation[];
  addDonation: (input: AddInput) => AddDonationResult;
  updateDonation: (id: string, partial: Partial<Omit<FurusatoDonation, 'id'>>) => void;
  removeDonation: (id: string) => void;
  clearAll: () => void;
  getDonation: (id: string) => FurusatoDonation | undefined;
}

function sortDescByDate(list: FurusatoDonation[]): FurusatoDonation[] {
  return [...list].sort((a, b) => b.date.localeCompare(a.date));
}

export const useFurusatoStore = create<FurusatoStore>()(
  persist(
    (set, get) => ({
      donations: [],

      addDonation: (input) => {
        const current = get().donations;
        if (current.length >= MAX_DONATIONS) {
          return { added: false, reason: 'limit_reached' };
        }
        const donation: FurusatoDonation = {
          id: Crypto.randomUUID(),
          date: input.date,
          amount: input.amount,
          targetMunicipality: input.targetMunicipality,
          ...(input.giftName ? { giftName: input.giftName } : {}),
          ...(input.portalSite ? { portalSite: input.portalSite } : {}),
          ...(input.note ? { note: input.note } : {}),
        };
        set({ donations: sortDescByDate([donation, ...current]) });
        return { added: true, donation };
      },

      updateDonation: (id, partial) => {
        set({
          donations: sortDescByDate(
            get().donations.map((d) => (d.id === id ? { ...d, ...partial } : d)),
          ),
        });
      },

      removeDonation: (id) => {
        set({ donations: get().donations.filter((d) => d.id !== id) });
      },

      clearAll: () => set({ donations: [] }),

      getDonation: (id) => get().donations.find((d) => d.id === id),
    }),
    {
      name: 'kakei-furusato-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ donations: state.donations }),
    },
  ),
);

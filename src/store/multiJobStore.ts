/**
 * Persisted store of `JobProfile`s for users juggling multiple baito.
 * Reads back through Calculator "Multi-job" mode → fed to
 * `computeMultiJobAnnual` → into the existing tax pipeline.
 *
 * Capped at MAX_JOBS to keep the editor form bounded; addJob returns
 * `{ added: false, reason: 'limit_reached' }` for the UI to surface.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { HourlyJobInput } from '@/lib/hourly-wage-calculator';
import type { JobProfile } from '@/types/job-profile';

export const MAX_JOBS = 5;

export interface AddJobResult {
  added: boolean;
  /** Populated when added=true. */
  job?: JobProfile;
  reason?: 'limit_reached';
}

interface MultiJobStore {
  jobs: JobProfile[];
  addJob: (name: string, input: HourlyJobInput, color?: string) => AddJobResult;
  updateJob: (id: string, partial: Partial<Omit<JobProfile, 'id'>>) => void;
  removeJob: (id: string) => void;
  clearAll: () => void;
}

export const useMultiJobStore = create<MultiJobStore>()(
  persist(
    (set, get) => ({
      jobs: [],

      addJob: (name, input, color) => {
        const current = get().jobs;
        if (current.length >= MAX_JOBS) {
          return { added: false, reason: 'limit_reached' };
        }
        const job: JobProfile = {
          id: Crypto.randomUUID(),
          name,
          input,
          ...(color ? { color } : {}),
        };
        set({ jobs: [...current, job] });
        return { added: true, job };
      },

      updateJob: (id, partial) => {
        set({
          jobs: get().jobs.map((j) => (j.id === id ? { ...j, ...partial } : j)),
        });
      },

      removeJob: (id) => {
        set({ jobs: get().jobs.filter((j) => j.id !== id) });
      },

      clearAll: () => set({ jobs: [] }),
    }),
    {
      name: 'kakei-multi-job-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ jobs: state.jobs }),
    },
  ),
);

/**
 * Persisted savings-goal log. Each goal has a target amount + cumulative
 * savings ledger ("I put ¥10K toward this on date X"). Sort order: active
 * goals first, then completed; both sub-lists DESC by createdAt so newest
 * is on top within each group.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** Iconography keys — UI maps these to Ionicons. Closed set so picker stays bounded. */
export type GoalIcon =
  | 'piggy'
  | 'airplane'
  | 'home'
  | 'gift'
  | 'school'
  | 'phone'
  | 'car'
  | 'heart'
  | 'star';

export interface GoalContribution {
  id: string;
  /** ISO date — when the user logged the contribution. */
  date: string;
  /** Yen, integer, > 0. */
  amount: number;
  note?: string;
}

export interface Goal {
  id: string;
  title: string;
  icon: GoalIcon;
  /** Yen, integer, > 0. */
  targetAmount: number;
  /** Optional ISO date — open-ended goals omit. */
  deadline?: string;
  note?: string;
  createdAt: string;
  contributions: GoalContribution[];
}

export const MAX_GOALS = 20;

export interface AddGoalResult {
  added: boolean;
  goal?: Goal;
  reason?: 'limit_reached';
}

interface AddGoalInput {
  title: string;
  icon: GoalIcon;
  targetAmount: number;
  deadline?: string;
  note?: string;
}

interface AddSavingsInput {
  date: string;
  amount: number;
  note?: string;
}

interface GoalsStore {
  goals: Goal[];
  addGoal: (input: AddGoalInput) => AddGoalResult;
  updateGoal: (id: string, partial: Partial<Omit<Goal, 'id' | 'createdAt' | 'contributions'>>) => void;
  removeGoal: (id: string) => void;
  addSavings: (goalId: string, input: AddSavingsInput) => void;
  removeSavings: (goalId: string, contributionId: string) => void;
  clearAll: () => void;
  getGoal: (id: string) => Goal | undefined;
}

function savedTotal(g: Goal): number {
  return g.contributions.reduce((sum, c) => sum + c.amount, 0);
}

function isCompleted(g: Goal): boolean {
  return savedTotal(g) >= g.targetAmount;
}

/**
 * Active goals first, then completed; within each group, newest createdAt
 * comes first.
 */
function sortGoals(list: Goal[]): Goal[] {
  return [...list].sort((a, b) => {
    const aDone = isCompleted(a) ? 1 : 0;
    const bDone = isCompleted(b) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export const useGoalsStore = create<GoalsStore>()(
  persist(
    (set, get) => ({
      goals: [],

      addGoal: (input) => {
        const current = get().goals;
        if (current.length >= MAX_GOALS) {
          return { added: false, reason: 'limit_reached' };
        }
        const goal: Goal = {
          id: Crypto.randomUUID(),
          title: input.title,
          icon: input.icon,
          targetAmount: input.targetAmount,
          createdAt: new Date().toISOString(),
          contributions: [],
          ...(input.deadline ? { deadline: input.deadline } : {}),
          ...(input.note ? { note: input.note } : {}),
        };
        set({ goals: sortGoals([goal, ...current]) });
        return { added: true, goal };
      },

      updateGoal: (id, partial) => {
        set({
          goals: sortGoals(
            get().goals.map((g) => (g.id === id ? { ...g, ...partial } : g)),
          ),
        });
      },

      removeGoal: (id) => {
        set({ goals: get().goals.filter((g) => g.id !== id) });
      },

      addSavings: (goalId, input) => {
        const contribution: GoalContribution = {
          id: Crypto.randomUUID(),
          date: input.date,
          amount: input.amount,
          ...(input.note ? { note: input.note } : {}),
        };
        set({
          goals: sortGoals(
            get().goals.map((g) =>
              g.id === goalId ? { ...g, contributions: [contribution, ...g.contributions] } : g,
            ),
          ),
        });
      },

      removeSavings: (goalId, contributionId) => {
        set({
          goals: sortGoals(
            get().goals.map((g) =>
              g.id === goalId
                ? { ...g, contributions: g.contributions.filter((c) => c.id !== contributionId) }
                : g,
            ),
          ),
        });
      },

      clearAll: () => set({ goals: [] }),

      getGoal: (id) => get().goals.find((g) => g.id === id),
    }),
    {
      name: 'kakei-goals-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ goals: state.goals }),
    },
  ),
);

/** Helpers exported for screens. */
export function getSavedTotal(g: Goal): number {
  return savedTotal(g);
}

export function isGoalCompleted(g: Goal): boolean {
  return isCompleted(g);
}

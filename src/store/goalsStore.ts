/**
 * Persisted savings-goal log. Each goal has a target amount + cumulative
 * savings ledger ("I put ¥10K toward this on date X"). Sort order: active
 * goals first (then paused, then completed/cancelled); within each group
 * newest createdAt on top.
 *
 * Backward-compat: existing persisted goals predate `category`, `status`,
 * `monthlyContribution`, `updatedAt`. Selectors default them — see
 * `getGoalCategory`, `getGoalStatus`, `goal-status.ts` consumers.
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

/**
 * Real-life buckets surfaced to Vietnamese users in Japan. Optional on
 * `Goal` for backward-compat with stores predating this field — selectors
 * default to `'other'`.
 */
export type MoneyGoalCategory =
  | 'home_visit'
  | 'emergency_fund'
  | 'travel'
  | 'moving'
  | 'shopping'
  | 'education'
  | 'other';

export const ALL_MONEY_GOAL_CATEGORIES: readonly MoneyGoalCategory[] = [
  'home_visit',
  'emergency_fund',
  'travel',
  'moving',
  'shopping',
  'education',
  'other',
];

/**
 * Lifecycle state. Pre-extension goals have no `status` field — the
 * `getGoalStatus()` selector derives it from `contributions` totals so
 * old data keeps working without migration.
 */
export type MoneyGoalStatus = 'active' | 'completed' | 'paused' | 'cancelled';

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
  /** Optional — defaults to 'other' for legacy goals (see getGoalCategory). */
  category?: MoneyGoalCategory;
  /**
   * Optional explicit status. When missing, computed from contributions:
   * contributions sum >= targetAmount → 'completed', else 'active'.
   * Set explicitly to enter 'paused' or 'cancelled'.
   */
  status?: MoneyGoalStatus;
  /** Yen the user plans to set aside each month. Pure planning hint. */
  monthlyContribution?: number;
  /** Optional updated-at; defaults to createdAt for legacy goals. */
  updatedAt?: string;
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
  category?: MoneyGoalCategory;
  monthlyContribution?: number;
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

  /** Lifecycle transitions — write `status` + bump `updatedAt`. */
  markGoalCompleted: (id: string) => void;
  pauseGoal: (id: string) => void;
  resumeGoal: (id: string) => void;
  cancelGoal: (id: string) => void;
}

function savedTotal(g: Goal): number {
  return g.contributions.reduce((sum, c) => sum + c.amount, 0);
}

/**
 * Effective status: explicit `goal.status` wins if set, otherwise derived
 * from contributions vs target. Pre-extension goals (no `status` field)
 * stay 'active' until target is reached.
 */
function effectiveStatus(g: Goal): MoneyGoalStatus {
  if (g.status) return g.status;
  return savedTotal(g) >= g.targetAmount ? 'completed' : 'active';
}

function isCompleted(g: Goal): boolean {
  return effectiveStatus(g) === 'completed';
}

/**
 * Active goals first, then paused, then completed/cancelled; within each
 * group, newest createdAt on top.
 */
function statusRank(g: Goal): number {
  switch (effectiveStatus(g)) {
    case 'active':
      return 0;
    case 'paused':
      return 1;
    case 'completed':
      return 2;
    case 'cancelled':
      return 3;
  }
}

function sortGoals(list: Goal[]): Goal[] {
  return [...list].sort((a, b) => {
    const aRank = statusRank(a);
    const bRank = statusRank(b);
    if (aRank !== bRank) return aRank - bRank;
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
        const now = new Date().toISOString();
        const goal: Goal = {
          id: Crypto.randomUUID(),
          title: input.title,
          icon: input.icon,
          targetAmount: input.targetAmount,
          createdAt: now,
          updatedAt: now,
          contributions: [],
          ...(input.deadline ? { deadline: input.deadline } : {}),
          ...(input.note ? { note: input.note } : {}),
          ...(input.category ? { category: input.category } : {}),
          ...(input.monthlyContribution !== undefined
            ? { monthlyContribution: input.monthlyContribution }
            : {}),
        };
        set({ goals: sortGoals([goal, ...current]) });
        return { added: true, goal };
      },

      updateGoal: (id, partial) => {
        const now = new Date().toISOString();
        set({
          goals: sortGoals(
            get().goals.map((g) => (g.id === id ? { ...g, ...partial, updatedAt: now } : g)),
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

      markGoalCompleted: (id) => {
        const now = new Date().toISOString();
        set({
          goals: sortGoals(
            get().goals.map((g) => (g.id === id ? { ...g, status: 'completed', updatedAt: now } : g)),
          ),
        });
      },

      pauseGoal: (id) => {
        const now = new Date().toISOString();
        set({
          goals: sortGoals(
            get().goals.map((g) => (g.id === id ? { ...g, status: 'paused', updatedAt: now } : g)),
          ),
        });
      },

      resumeGoal: (id) => {
        const now = new Date().toISOString();
        set({
          goals: sortGoals(
            get().goals.map((g) => (g.id === id ? { ...g, status: 'active', updatedAt: now } : g)),
          ),
        });
      },

      cancelGoal: (id) => {
        const now = new Date().toISOString();
        set({
          goals: sortGoals(
            get().goals.map((g) => (g.id === id ? { ...g, status: 'cancelled', updatedAt: now } : g)),
          ),
        });
      },
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

/** Effective status — explicit or derived from contributions. */
export function getGoalStatus(g: Goal): MoneyGoalStatus {
  return effectiveStatus(g);
}

/** Category with default-to-'other' for legacy goals lacking the field. */
export function getGoalCategory(g: Goal): MoneyGoalCategory {
  return g.category ?? 'other';
}

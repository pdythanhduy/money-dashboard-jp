import type { SalaryInput, TakeHomeResult } from '@/types/tax';

/**
 * A single saved calculation. `id` is uuid v4 (from expo-crypto). Entries
 * are sorted descending by `timestamp` in the store.
 */
export interface HistoryEntry {
  id: string;
  timestamp: number;
  /** User-friendly label. Defaults to "Tính ngày DD/MM/YYYY" if not set at add-time. */
  label?: string;
  input: SalaryInput;
  result: TakeHomeResult;
  note?: string;
}

/** Filter chip in the history list. */
export type HistoryFilter = 'all' | 'salary' | 'business';

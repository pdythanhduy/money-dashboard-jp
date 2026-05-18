/**
 * One-shot migration: when the app boots and the user has a stored
 * calculation in `calculatorStore` (Phase 5C) but no history entries yet
 * (just upgraded to 5D), seed one history entry from that latest result.
 *
 * Idempotent — `seedFromLatest` checks the `migratedFromLatest` flag and
 * returns early on subsequent calls.
 */

import { useEffect } from 'react';

import { useCalculatorStore } from '@/store/calculatorStore';
import { useHistoryStore } from '@/store/historyStore';

export function useHistoryMigration() {
  const seed = useHistoryStore((s) => s.seedFromLatest);

  useEffect(() => {
    const { lastInput, lastResult } = useCalculatorStore.getState();
    if (lastInput && lastResult) {
      seed(lastInput, lastResult);
    }
  }, [seed]);
}

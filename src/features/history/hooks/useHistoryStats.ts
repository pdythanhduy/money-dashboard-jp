import { useMemo } from 'react';

import { computeHistoryStats, type HistoryStats } from '@/features/history/history-stats';
import { useHistoryStore } from '@/store/historyStore';
import type { HistoryFilter } from '@/types/history';

export function useHistoryStats(filter: HistoryFilter): HistoryStats {
  const entries = useHistoryStore((s) => s.entries);
  return useMemo(() => computeHistoryStats(entries, filter), [entries, filter]);
}

/**
 * Dashboard data hook — thin wrapper around the pure `computeDashboardData`
 * function that wires it to the Zustand stores and provides `refresh()` for
 * pull-to-refresh.
 *
 * Time anchors to Asia/Tokyo so users testing outside Japan still see
 * "Japanese today". `now` is captured at mount and on each `refresh()`.
 * Payday flows from `settingsStore` so a Settings change re-renders the
 * countdown badge immediately.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  computeDashboardData,
  type DashboardData,
} from '@/features/dashboard/dashboard-logic';
import { getTokyoNow } from '@/lib/date-helpers';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useDocumentsStore } from '@/store/documentsStore';
import { useSettingsStore } from '@/store/settingsStore';

export interface UseDashboardDataReturn extends DashboardData {
  refresh: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const lastResult = useCalculatorStore((state) => state.lastResult);
  const payday = useSettingsStore((s) => s.settings.payday);
  const documents = useDocumentsStore((s) => s.documents);
  const [now, setNow] = useState<Date>(() => getTokyoNow());

  const refresh = useCallback(() => {
    setNow(getTokyoNow());
  }, []);

  // Reminder gating: only surface 確定申告 if user has a Calculator result
  // (wizard needs income to summarize). Only surface 在留カード if user added
  // one with an expiry date — picks the soonest if multiple.
  const zairyuCardExpiry = useMemo(() => {
    const zairyu = documents
      .filter((d) => d.kind === 'zairyu_card' && d.expiryDate)
      .map((d) => d.expiryDate as string)
      .sort();
    return zairyu[0] ?? null;
  }, [documents]);

  const data = useMemo(
    () =>
      computeDashboardData(now, lastResult, payday, {
        zairyuCardExpiry,
        hasKakuteiContext: lastResult !== null,
      }),
    [now, lastResult, payday, zairyuCardExpiry],
  );

  return { ...data, refresh };
}

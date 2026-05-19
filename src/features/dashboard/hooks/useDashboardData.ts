/**
 * Dashboard data hook — thin wrapper around the pure `computeDashboardData`
 * function that wires it to the Zustand stores and provides `refresh()`
 * for pull-to-refresh.
 *
 * Time anchors to Asia/Tokyo so users testing outside Japan still see
 * "Japanese today". `now` is captured at mount and on each `refresh()`.
 * Payday is read from `settingsStore` so a Settings change re-renders
 * the Dashboard immediately.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  computeDashboardData,
  type DashboardData,
} from '@/features/dashboard/dashboard-logic';
import { getTokyoNow } from '@/lib/date-helpers';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useSettingsStore } from '@/store/settingsStore';

export interface UseDashboardDataReturn extends DashboardData {
  refresh: () => void;
}

export function useDashboardData(): UseDashboardDataReturn {
  const lastResult = useCalculatorStore((state) => state.lastResult);
  const payday = useSettingsStore((s) => s.settings.payday);
  const [now, setNow] = useState<Date>(() => getTokyoNow());

  const refresh = useCallback(() => {
    setNow(getTokyoNow());
  }, []);

  const data = useMemo(() => computeDashboardData(now, lastResult, payday), [now, lastResult, payday]);

  return { ...data, refresh };
}

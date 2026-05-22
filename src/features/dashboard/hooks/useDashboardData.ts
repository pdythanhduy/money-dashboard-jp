/**
 * Dashboard data hook — thin wrapper around the pure `computeDashboardData`
 * function that wires it to the Zustand stores and provides `refresh()` for
 * pull-to-refresh.
 *
 * Time anchors to Asia/Tokyo so users testing outside Japan still see
 * "Japanese today". `now` is captured at mount and on each `refresh()`.
 * Payday flows from `settingsStore` so a Settings change re-renders the
 * countdown badge immediately.
 *
 * Upcoming reminders: real documents from `useDocumentsStore` are mapped
 * through the pure `computeDocumentReminders` lib. 確定申告 system reminder
 * is gated on `hasKakuteiContext` (a Calculator result exists). No stubs.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  computeDashboardData,
  type DashboardData,
} from '@/features/dashboard/dashboard-logic';
import { getTokyoNow } from '@/lib/date-helpers';
import { computeDocumentReminders } from '@/lib/document-reminders';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useDocumentsStore } from '@/store/documentsStore';
import { useSettingsStore } from '@/store/settingsStore';

export interface UseDashboardDataReturn extends DashboardData {
  refresh: () => void;
}

/** Prefix used by the dashboard `UpcomingEventsCard` to distinguish per-doc
 *  reminders from system ones (e.g. `kakuteiShinkoku`). */
export const DOCUMENT_REMINDER_PREFIX = 'doc:';

export function useDashboardData(): UseDashboardDataReturn {
  const lastResult = useCalculatorStore((state) => state.lastResult);
  const payday = useSettingsStore((s) => s.settings.payday);
  const documents = useDocumentsStore((s) => s.documents);
  const [now, setNow] = useState<Date>(() => getTokyoNow());

  const refresh = useCallback(() => {
    setNow(getTokyoNow());
  }, []);

  const documentReminders = useMemo(() => {
    return computeDocumentReminders(documents, now).map((d) => ({
      // Encode the doc id + kind so UpcomingEventsCard can render an
      // appropriate label (Custom name or i18n fallback). Format:
      //   "doc:<kind>:<id>" — the card splits on the second ":" if present.
      i18nKey: `${DOCUMENT_REMINDER_PREFIX}${d.kind}:${d.id}`,
      date: new Date(d.expiryDate),
      daysLeft: d.daysLeft,
    }));
  }, [documents, now]);

  const data = useMemo(
    () =>
      computeDashboardData(now, lastResult, payday, {
        documentReminders,
        hasKakuteiContext: lastResult !== null,
      }),
    [now, lastResult, payday, documentReminders],
  );

  return { ...data, refresh };
}

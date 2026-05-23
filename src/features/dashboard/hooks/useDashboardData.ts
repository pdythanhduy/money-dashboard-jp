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
 * Upcoming reminders: real user-added `DocumentDeadline`s (Phase 5V) are
 * mapped via the pure `computeDocumentDeadlineReminders` lib. The
 * 確定申告 system reminder is gated on `hasKakuteiContext` (Calculator
 * result exists). No stubs.
 */

import { useCallback, useMemo, useState } from 'react';

import {
  computeDashboardData,
  type DashboardData,
} from '@/features/dashboard/dashboard-logic';
import { getTokyoNow } from '@/lib/date-helpers';
import { computeDocumentDeadlineReminders } from '@/lib/document-reminders';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useDocumentDeadlineStore } from '@/store/documentDeadlineStore';
import { useSettingsStore } from '@/store/settingsStore';

export interface UseDashboardDataReturn extends DashboardData {
  refresh: () => void;
}

/** Prefix used by the dashboard `UpcomingEventsCard` to distinguish per-doc
 *  reminders from system ones (e.g. `kakuteiShinkoku`).
 *  Format: `doc:<type>:<id>:<title>` so the card can render the user-typed
 *  title without an extra lookup. */
export const DOCUMENT_REMINDER_PREFIX = 'doc:';

export function useDashboardData(): UseDashboardDataReturn {
  const lastResult = useCalculatorStore((state) => state.lastResult);
  const payday = useSettingsStore((s) => s.settings.payday);
  const documents = useDocumentDeadlineStore((s) => s.documents);
  const [now, setNow] = useState<Date>(() => getTokyoNow());

  const refresh = useCallback(() => {
    setNow(getTokyoNow());
  }, []);

  const documentReminders = useMemo(() => {
    return computeDocumentDeadlineReminders(documents, now).map((d) => ({
      // `doc:<type>:<id>:<title>` — UpcomingEventsCard parses out the title
      // segment for direct render (avoids re-reading the store).
      i18nKey: `${DOCUMENT_REMINDER_PREFIX}${d.type}:${d.id}:${d.title}`,
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

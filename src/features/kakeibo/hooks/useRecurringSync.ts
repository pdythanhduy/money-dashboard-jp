/**
 * Auto-materialize recurring expenses into actual `kakeibo` entries.
 *
 * Runs on mount + when the date string changes (cheap watcher) + when
 * recurrings count changes. For each due recurring it dispatches
 * `addEntry` and stamps `lastGeneratedYearMonth` to make the operation
 * idempotent through the rest of the month.
 *
 * Why a hook (and not a side effect in the store): React owns the date —
 * we want the materialization to react to the user crossing midnight or
 * relaunching the app, both of which re-mount the host component.
 */

import { useEffect } from 'react';

import { findDueRecurrings, isoFromDayOfMonth } from '@/lib/recurring-expenses';
import { useKakeiboStore } from '@/store/kakeiboStore';

function todayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yearMonthOf(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function useRecurringSync(): void {
  const recurrings = useKakeiboStore((s) => s.recurrings);
  const addEntry = useKakeiboStore((s) => s.addEntry);
  const markGenerated = useKakeiboStore((s) => s.markRecurringGenerated);
  const recurringsCount = recurrings.length;
  const dateString = todayDateString();

  useEffect(() => {
    const now = new Date();
    const due = findDueRecurrings(recurrings, now);
    if (due.length === 0) return;

    const ym = yearMonthOf(now);
    for (const r of due) {
      const iso = isoFromDayOfMonth(now.getFullYear(), now.getMonth() + 1, r.dayOfMonth);
      const res = addEntry({
        date: iso,
        amount: r.amount,
        category: r.category,
        label: r.name,
        isRecurring: true,
        ...(r.note ? { note: r.note } : {}),
      });
      // Stamp regardless of `added` result: if `limit_reached` we don't want
      // to keep retrying every render (user's responsibility to free space).
      if (res.added || res.reason === 'limit_reached') {
        markGenerated(r.id, ym);
      }
    }
    // `recurrings` itself changes by reference every store mutation — depending
    // on it would loop. We key on length + date so this runs once per session
    // per date-day, plus once when the user adds/removes a recurring template.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recurringsCount, dateString]);
}

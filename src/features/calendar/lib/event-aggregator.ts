/**
 * Aggregate dated entries from every feature store into a unified
 * `CalendarEvent[]` list — the calendar view's single data source.
 *
 * Pure function: takes raw arrays in, returns events out. The screen
 * component handles store subscriptions; this file stays testable in
 * isolation (no zustand, no hooks).
 *
 * Multi-day events (trips) emit one event PER day they span, so the
 * day-detail modal can list each day's content independently.
 *
 * Recurring expenses fan out one event per month at `dayOfMonth`,
 * clamped to month-end when the month is shorter (e.g. day 31 in Feb
 * becomes Feb 28/29).
 */

import type { KakeiboEntry } from '@/lib/kakeibo-math';
import type { MedicalExpense } from '@/lib/medical-deduction';
import type { RemittanceEntry } from '@/lib/remittance-math';
import type { FurusatoDonation } from '@/store/furusatoStore';
import type { DocumentDeadline } from '@/types/document-deadline';
import type { DocumentReminder } from '@/types/document';
import type { RecurringExpense } from '@/types/recurring-expense';
import type { TripBudget } from '@/types/trip-budget';

import type { CalendarEvent } from '../types';

export interface AggregatorSources {
  kakeibo: readonly KakeiboEntry[];
  medical: readonly MedicalExpense[];
  furusato: readonly FurusatoDonation[];
  remittance: readonly RemittanceEntry[];
  trips: readonly TripBudget[];
  documents: readonly DocumentReminder[];
  documentDeadlines: readonly DocumentDeadline[];
  recurringExpenses: readonly RecurringExpense[];
}

/** Helper: every ISO date between `start` and `end` (both inclusive). */
function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const s = new Date(`${start}T00:00:00`);
  const e = new Date(`${end}T00:00:00`);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return out;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    // Use local components so the output matches `start`/`end`'s calendar
    // day (toISOString() would shift across timezones for JST users).
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    out.push(`${y}-${m}-${dd}`);
  }
  return out;
}

/** Project a recurring expense onto its concrete dates within a year. */
function expandRecurring(rec: RecurringExpense, year: number): string[] {
  const out: string[] = [];
  for (let month = 1; month <= 12; month += 1) {
    const lastDay = new Date(year, month, 0).getDate();
    const day = Math.min(rec.dayOfMonth, lastDay);
    out.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return out;
}

/**
 * Build the calendar event list for `targetYear` from the given sources.
 * Returns events sorted by date.
 */
export function aggregateCalendarEvents(
  sources: AggregatorSources,
  targetYear: number,
): CalendarEvent[] {
  const yearPrefix = String(targetYear);
  const events: CalendarEvent[] = [];

  for (const e of sources.kakeibo) {
    if (!e.date.startsWith(yearPrefix)) continue;
    events.push({
      id: `kakeibo-${e.id}`,
      date: e.date,
      kind: 'kakeibo_expense',
      labelKey: 'calendar.events.kakeibo',
      labelParams: { label: e.label ?? '' },
      amountJpy: -e.amount,
    });
  }

  for (const m of sources.medical) {
    if (!m.date.startsWith(yearPrefix)) continue;
    events.push({
      id: `medical-${m.id}`,
      date: m.date,
      kind: 'medical_expense',
      labelKey: 'calendar.events.medical',
      labelParams: { category: m.category },
      amountJpy: -m.amount,
    });
  }

  for (const f of sources.furusato) {
    if (!f.date.startsWith(yearPrefix)) continue;
    events.push({
      id: `furusato-${f.id}`,
      date: f.date,
      kind: 'furusato_donation',
      labelKey: 'calendar.events.furusato',
      labelParams: { municipality: f.targetMunicipality },
      amountJpy: -f.amount,
    });
  }

  for (const r of sources.remittance) {
    if (!r.date.startsWith(yearPrefix)) continue;
    events.push({
      id: `remittance-${r.id}`,
      date: r.date,
      kind: 'remittance',
      labelKey: 'calendar.events.remittance',
      amountJpy: -r.amountJPY,
    });
  }

  for (const t of sources.trips) {
    if (t.status === 'cancelled') continue;
    for (const d of datesBetween(t.startDate, t.endDate)) {
      if (!d.startsWith(yearPrefix)) continue;
      events.push({
        id: `trip-${t.id}-${d}`,
        date: d,
        kind: 'trip',
        labelKey: 'calendar.events.trip',
        labelParams: { title: t.title },
      });
    }
  }

  for (const d of sources.documents) {
    if (!d.expiryDate.startsWith(yearPrefix)) continue;
    events.push({
      id: `document-${d.id}`,
      date: d.expiryDate,
      kind: 'document_expiry',
      labelKey: 'calendar.events.documentExpiry',
      labelParams: { kind: d.customName ?? d.kind },
    });
  }

  for (const d of sources.documentDeadlines) {
    if (!d.expiryDate.startsWith(yearPrefix)) continue;
    events.push({
      id: `documentDeadline-${d.id}`,
      date: d.expiryDate,
      kind: 'document_expiry',
      labelKey: 'calendar.events.documentExpiry',
      labelParams: { kind: d.title },
    });
  }

  for (const rec of sources.recurringExpenses) {
    if (!rec.active) continue;
    for (const d of expandRecurring(rec, targetYear)) {
      events.push({
        id: `recurring-${rec.id}-${d}`,
        date: d,
        kind: 'recurring_expense',
        labelKey: 'calendar.events.recurring',
        labelParams: { name: rec.name },
        amountJpy: -rec.amount,
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

/** Group events by ISO date for O(1) lookup when rendering day cells. */
export function indexEventsByDate(
  events: readonly CalendarEvent[],
): ReadonlyMap<string, readonly CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const bucket = map.get(e.date);
    if (bucket) bucket.push(e);
    else map.set(e.date, [e]);
  }
  return map;
}

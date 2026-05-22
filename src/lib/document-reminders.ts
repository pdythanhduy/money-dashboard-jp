/**
 * Pure mapping from persisted `DocumentReminder`s → Dashboard reminders.
 *
 * "Show" rule: a document is surfaced on the dashboard only when its
 * expiry is within the largest `notifyDaysBefore` window the user
 * configured for it. Past-dated expiries are dropped (no overdue UI in
 * this phase). Day-of-expiry is surfaced as `daysLeft = 0`.
 *
 * Severity buckets pick a tint for the row:
 *   danger  ≤ 7  days
 *   warning ≤ 30 days
 *   normal  otherwise (still within the user's chosen reminder window)
 */

import { daysBetween } from '@/lib/date-helpers';
import type { DocumentKind, DocumentReminder } from '@/types/document';
import type { DocumentDeadline, DocumentType } from '@/types/document-deadline';

export type ReminderSeverity = 'normal' | 'warning' | 'danger';

const DASHBOARD_REMINDER_LIMIT = 5;

export interface DashboardDocumentReminder {
  id: string;
  /** Maps to `documents.kinds.<kind>` for the rendered label. */
  kind: DocumentKind;
  /** Custom user-provided label, if any. */
  customName?: string;
  expiryDate: string;
  daysLeft: number;
  severity: ReminderSeverity;
}

const DEFAULT_LIMIT = 3;

function severityFor(daysLeft: number): ReminderSeverity {
  if (daysLeft <= 7) return 'danger';
  if (daysLeft <= 30) return 'warning';
  return 'normal';
}

function maxWindow(d: DocumentReminder): number {
  // Largest configured reminder day-count — if user set [30, 7, 1] we
  // surface from 30 days out. Defaults to 30 if list is empty.
  if (!d.notifyDaysBefore || d.notifyDaysBefore.length === 0) return 30;
  return d.notifyDaysBefore.reduce((m, n) => (n > m ? n : m), 0);
}

export function computeDocumentReminders(
  documents: readonly DocumentReminder[],
  now: Date,
  limit: number = DEFAULT_LIMIT,
): DashboardDocumentReminder[] {
  const out: DashboardDocumentReminder[] = [];
  for (const d of documents) {
    const daysLeft = daysBetween(now, new Date(d.expiryDate));
    if (!Number.isFinite(daysLeft)) continue;
    if (daysLeft < 0) continue;
    if (daysLeft > maxWindow(d)) continue;
    out.push({
      id: d.id,
      kind: d.kind,
      ...(d.customName ? { customName: d.customName } : {}),
      expiryDate: d.expiryDate,
      daysLeft,
      severity: severityFor(daysLeft),
    });
  }
  out.sort((a, b) => a.daysLeft - b.daysLeft);
  return out.slice(0, limit);
}

// ---------------------------------------------------------------------------
// New canonical model: DocumentDeadline (Phase 5V)
// ---------------------------------------------------------------------------

export interface DashboardDeadlineReminder {
  id: string;
  type: DocumentType;
  title: string;
  expiryDate: string;
  daysLeft: number;
  severity: ReminderSeverity;
}

/**
 * Pure transform: persisted `DocumentDeadline`s → Dashboard reminder rows.
 *
 *   Show if 0 ≤ daysLeft ≤ remindBeforeDays.
 *   Sort ascending by daysLeft, cap at `limit` (default 5).
 *   Severity buckets: danger ≤7, warning ≤30, normal otherwise.
 */
export function computeDocumentDeadlineReminders(
  documents: readonly DocumentDeadline[],
  now: Date,
  limit: number = DASHBOARD_REMINDER_LIMIT,
): DashboardDeadlineReminder[] {
  const out: DashboardDeadlineReminder[] = [];
  for (const d of documents) {
    const daysLeft = daysBetween(now, new Date(d.expiryDate));
    if (!Number.isFinite(daysLeft)) continue;
    if (daysLeft < 0) continue;
    if (daysLeft > d.remindBeforeDays) continue;
    out.push({
      id: d.id,
      type: d.type,
      title: d.title,
      expiryDate: d.expiryDate,
      daysLeft,
      severity: severityFor(daysLeft),
    });
  }
  out.sort((a, b) => a.daysLeft - b.daysLeft);
  return out.slice(0, limit);
}

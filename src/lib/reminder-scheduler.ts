/**
 * Pure planning layer: convert `DocumentReminder`s into a flat list of
 * `PlannedReminder`s the notifications facade can hand to the OS. Stays
 * decoupled from `expo-notifications` so tests can run in node.
 */

import type { DocumentReminder } from '@/types/document';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface PlannedReminder {
  documentId: string;
  /** `${documentId}__${daysBefore}` — stable identifier for the OS. */
  notificationId: string;
  triggerDate: Date;
  daysBefore: number;
}

function parseExpiryToMidnightUTC(iso: string): Date | null {
  // Accept "YYYY-MM-DD" and full ISO; everything else → null.
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Plan all notifications for one document. Triggers in the past are
 * dropped silently — they'd reject at the OS layer anyway. Output sorted
 * by trigger ASC so the first item is the most urgent.
 */
export function planRemindersForDocument(
  doc: DocumentReminder,
  now: Date = new Date(),
): PlannedReminder[] {
  const expiry = parseExpiryToMidnightUTC(doc.expiryDate);
  if (!expiry) return [];
  const planned: PlannedReminder[] = [];
  for (const daysBefore of doc.notifyDaysBefore) {
    if (!Number.isFinite(daysBefore) || daysBefore < 0) continue;
    const trigger = new Date(expiry.getTime() - daysBefore * MS_PER_DAY);
    if (trigger.getTime() <= now.getTime()) continue;
    planned.push({
      documentId: doc.id,
      notificationId: `${doc.id}__${daysBefore}`,
      triggerDate: trigger,
      daysBefore,
    });
  }
  return planned.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
}

export function planAllReminders(
  docs: readonly DocumentReminder[],
  now: Date = new Date(),
): PlannedReminder[] {
  return docs
    .flatMap((d) => planRemindersForDocument(d, now))
    .sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
}

/**
 * Display text for a single notification. Caller passes a translator so
 * we don't reach into `i18next` from a pure module.
 */
export function buildNotificationContent(
  doc: DocumentReminder,
  daysBefore: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
): { title: string; body: string } {
  const title = doc.customName?.trim() || t(`documents.kinds.${doc.kind}`);
  // Format the expiry as DD/MM/YYYY for the body — locale-agnostic enough
  // and matches the in-app display.
  const exp = parseExpiryToMidnightUTC(doc.expiryDate);
  const date = exp
    ? `${String(exp.getDate()).padStart(2, '0')}/${String(exp.getMonth() + 1).padStart(2, '0')}/${exp.getFullYear()}`
    : doc.expiryDate;
  const body = t('documents.reminder.body', { days: daysBefore, date });
  return { title, body };
}

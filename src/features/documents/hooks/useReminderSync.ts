/**
 * Watches `documentsStore` + the user's translator and re-syncs the OS's
 * scheduled notifications. The "easy and correct" path: every time the
 * doc list changes, cancel ALL local notifications and re-schedule from
 * the current plan.
 *
 * Sync is throttled by React's effect dedup (depends on documents ref)
 * so typing in DocumentEditModal doesn't fire OS calls on every keystroke
 * — the modal commits via addDocument/updateDocument once on Save.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import {
  buildNotificationContent,
  planAllReminders,
} from '@/lib/reminder-scheduler';
import {
  cancelAllReminders,
  scheduleDocumentReminder,
} from '@/lib/notifications';
import { useDocumentsStore } from '@/store/documentsStore';

/**
 * Re-sync OS scheduled notifications when the document list changes.
 * Returns nothing; intended as a side-effect hook in DocumentsScreen.
 *
 * Exposes the inner sync as a static helper for tests.
 */
export function useReminderSync(): void {
  const documents = useDocumentsStore((s) => s.documents);
  const { t } = useTranslation();

  useEffect(() => {
    void syncReminders(documents, t);
  }, [documents, t]);
}

export async function syncReminders(
  documents: ReturnType<typeof useDocumentsStore.getState>['documents'],
  t: (key: string, opts?: Record<string, unknown>) => string,
  now: Date = new Date(),
): Promise<void> {
  // Wholesale cancel keeps the OS scheduler in sync without needing diff
  // logic — the planning layer already drops stale triggers.
  await cancelAllReminders();
  const planned = planAllReminders(documents, now);
  for (const r of planned) {
    const doc = documents.find((d) => d.id === r.documentId);
    if (!doc) continue;
    const content = buildNotificationContent(doc, r.daysBefore, t);
    await scheduleDocumentReminder({
      id: r.notificationId,
      title: content.title,
      body: content.body,
      triggerDate: r.triggerDate,
    });
  }
}

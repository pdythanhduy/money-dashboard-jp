import {
  computeDocumentDeadlineReminders,
  computeDocumentReminders,
} from '@/lib/document-reminders';
import type { DocumentReminder } from '@/types/document';
import type { DocumentDeadline } from '@/types/document-deadline';

function doc(overrides: Partial<DocumentReminder> = {}): DocumentReminder {
  return {
    id: overrides.id ?? 'd1',
    kind: overrides.kind ?? 'zairyu_card',
    expiryDate: overrides.expiryDate ?? '2026-12-31',
    notifyDaysBefore: overrides.notifyDaysBefore ?? [30, 7, 1],
    ...(overrides.customName !== undefined ? { customName: overrides.customName } : {}),
    ...(overrides.notes !== undefined ? { notes: overrides.notes } : {}),
  };
}

describe('computeDocumentReminders', () => {
  it('returns [] when no documents are saved', () => {
    expect(computeDocumentReminders([], new Date(2026, 4, 22))).toEqual([]);
  });

  it('excludes documents whose expiry is beyond their largest reminder window', () => {
    // Today May 22 2026; expiry 40 days out (Jul 1 2026); max window = 30 → excluded
    const d = doc({ expiryDate: '2026-07-01', notifyDaysBefore: [30, 7] });
    expect(computeDocumentReminders([d], new Date(2026, 4, 22))).toEqual([]);
  });

  it('includes documents within their reminder window', () => {
    // Today May 22; expiry June 11 = 20 days; window 30 → shown
    const d = doc({ id: 'within', expiryDate: '2026-06-11', notifyDaysBefore: [30] });
    const out = computeDocumentReminders([d], new Date(2026, 4, 22));
    expect(out).toHaveLength(1);
    expect(out[0]?.daysLeft).toBe(20);
    expect(out[0]?.severity).toBe('warning');
  });

  it('expiry today → daysLeft 0 and severity danger', () => {
    const d = doc({ id: 'today', expiryDate: '2026-05-22' });
    const out = computeDocumentReminders([d], new Date(2026, 4, 22));
    expect(out[0]?.daysLeft).toBe(0);
    expect(out[0]?.severity).toBe('danger');
  });

  it('excludes past-dated expiries (no overdue UI this phase)', () => {
    const d = doc({ id: 'past', expiryDate: '2026-05-01' });
    expect(computeDocumentReminders([d], new Date(2026, 4, 22))).toEqual([]);
  });

  it('sorts nearest-first and caps at the limit', () => {
    const ds = [
      doc({ id: 'a', expiryDate: '2026-06-20', notifyDaysBefore: [60] }), // 29d
      doc({ id: 'b', expiryDate: '2026-05-25', notifyDaysBefore: [60] }), // 3d
      doc({ id: 'c', expiryDate: '2026-06-10', notifyDaysBefore: [60] }), // 19d
      doc({ id: 'd', expiryDate: '2026-07-05', notifyDaysBefore: [60] }), // 44d
    ];
    const out = computeDocumentReminders(ds, new Date(2026, 4, 22), 3);
    expect(out.map((r) => r.id)).toEqual(['b', 'c', 'a']);
  });

  it('severity thresholds: danger ≤7, warning ≤30, normal beyond', () => {
    const ds = [
      doc({ id: 'red', expiryDate: '2026-05-25', notifyDaysBefore: [90] }), // 3d → danger
      doc({ id: 'orange', expiryDate: '2026-06-15', notifyDaysBefore: [90] }), // 24d → warning
      doc({ id: 'normal', expiryDate: '2026-07-15', notifyDaysBefore: [90] }), // 54d → normal
    ];
    const out = computeDocumentReminders(ds, new Date(2026, 4, 22), 10);
    expect(out.find((r) => r.id === 'red')?.severity).toBe('danger');
    expect(out.find((r) => r.id === 'orange')?.severity).toBe('warning');
    expect(out.find((r) => r.id === 'normal')?.severity).toBe('normal');
  });

  it('handles malformed expiryDate gracefully (treats as not finite, excluded)', () => {
    const d = doc({ expiryDate: 'not-a-date' });
    expect(computeDocumentReminders([d], new Date(2026, 4, 22))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// computeDocumentDeadlineReminders (Phase 5V canonical model)
// ---------------------------------------------------------------------------

function deadline(overrides: Partial<DocumentDeadline> = {}): DocumentDeadline {
  return {
    id: overrides.id ?? 'dl-1',
    type: overrides.type ?? 'residence_card',
    title: overrides.title ?? '在留カード',
    expiryDate: overrides.expiryDate ?? '2026-06-11',
    remindBeforeDays: overrides.remindBeforeDays ?? 30,
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
    ...(overrides.note !== undefined ? { note: overrides.note } : {}),
  };
}

describe('computeDocumentDeadlineReminders', () => {
  it('returns [] when no documents are saved', () => {
    expect(computeDocumentDeadlineReminders([], new Date(2026, 4, 22))).toEqual([]);
  });

  it('expiry 40 days out with remindBeforeDays=30 → NOT shown', () => {
    const d = deadline({ expiryDate: '2026-07-01', remindBeforeDays: 30 });
    expect(computeDocumentDeadlineReminders([d], new Date(2026, 4, 22))).toEqual([]);
  });

  it('expiry 20 days out with remindBeforeDays=30 → shown with warning severity', () => {
    const d = deadline({ expiryDate: '2026-06-11', remindBeforeDays: 30 });
    const out = computeDocumentDeadlineReminders([d], new Date(2026, 4, 22));
    expect(out).toHaveLength(1);
    expect(out[0]?.daysLeft).toBe(20);
    expect(out[0]?.severity).toBe('warning');
  });

  it('expiry today → daysLeft 0 and severity danger', () => {
    const d = deadline({ expiryDate: '2026-05-22', remindBeforeDays: 90 });
    const out = computeDocumentDeadlineReminders([d], new Date(2026, 4, 22));
    expect(out[0]?.daysLeft).toBe(0);
    expect(out[0]?.severity).toBe('danger');
  });

  it('past expiry → excluded (no overdue UI this phase)', () => {
    const d = deadline({ expiryDate: '2026-05-01', remindBeforeDays: 90 });
    expect(computeDocumentDeadlineReminders([d], new Date(2026, 4, 22))).toEqual([]);
  });

  it('sorts nearest-first and caps at the limit', () => {
    const ds = [
      deadline({ id: 'a', expiryDate: '2026-06-20', remindBeforeDays: 60 }),
      deadline({ id: 'b', expiryDate: '2026-05-25', remindBeforeDays: 60 }),
      deadline({ id: 'c', expiryDate: '2026-06-10', remindBeforeDays: 60 }),
      deadline({ id: 'd', expiryDate: '2026-07-05', remindBeforeDays: 60 }),
    ];
    const out = computeDocumentDeadlineReminders(ds, new Date(2026, 4, 22), 5);
    expect(out.map((r) => r.id)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('severity buckets: danger ≤7, warning ≤30, normal beyond 30', () => {
    const ds = [
      deadline({ id: 'red', expiryDate: '2026-05-25', remindBeforeDays: 90 }),
      deadline({ id: 'orange', expiryDate: '2026-06-15', remindBeforeDays: 90 }),
      deadline({ id: 'normal', expiryDate: '2026-07-15', remindBeforeDays: 90 }),
    ];
    const out = computeDocumentDeadlineReminders(ds, new Date(2026, 4, 22), 10);
    expect(out.find((r) => r.id === 'red')?.severity).toBe('danger');
    expect(out.find((r) => r.id === 'orange')?.severity).toBe('warning');
    expect(out.find((r) => r.id === 'normal')?.severity).toBe('normal');
  });

  it('preserves the user-typed title (not auto-derived from type)', () => {
    const d = deadline({ title: 'My passport renewal', expiryDate: '2026-06-11' });
    const out = computeDocumentDeadlineReminders([d], new Date(2026, 4, 22));
    expect(out[0]?.title).toBe('My passport renewal');
  });
});

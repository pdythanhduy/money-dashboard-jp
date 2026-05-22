import { computeDocumentReminders } from '@/lib/document-reminders';
import type { DocumentReminder } from '@/types/document';

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

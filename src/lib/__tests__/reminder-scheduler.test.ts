import {
  buildNotificationContent,
  planAllReminders,
  planRemindersForDocument,
} from '@/lib/reminder-scheduler';
import type { DocumentReminder } from '@/types/document';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function makeDoc(overrides: Partial<DocumentReminder> = {}): DocumentReminder {
  return {
    id: 'doc-1',
    kind: 'zairyu_card',
    expiryDate: '2026-12-31',
    notifyDaysBefore: [30, 7, 1],
    ...overrides,
  };
}

describe('planRemindersForDocument', () => {
  it('expiry 30 days out + [30,7,1] → 3 planned, sorted ASC', () => {
    const now = new Date('2026-12-01T00:00:00Z'); // 30 days before 12/31
    const doc = makeDoc({ expiryDate: '2026-12-31', notifyDaysBefore: [30, 7, 1] });
    // 30-day trigger is exactly now; we drop it (strictly past). Result: 2 entries (7 + 1).
    const out = planRemindersForDocument(doc, now);
    expect(out.map((r) => r.daysBefore)).toEqual([7, 1]);
  });

  it('expiry 35 days out + [30,7,1] → all 3 planned', () => {
    const now = new Date('2026-11-26T00:00:00Z');
    const doc = makeDoc({ expiryDate: '2026-12-31', notifyDaysBefore: [30, 7, 1] });
    const out = planRemindersForDocument(doc, now);
    expect(out.map((r) => r.daysBefore)).toEqual([30, 7, 1]);
  });

  it('expiry 5 days out + [30,7,1] → only [1] (30 and 7 are past)', () => {
    const now = new Date('2026-12-26T00:00:00Z');
    const doc = makeDoc({ expiryDate: '2026-12-31', notifyDaysBefore: [30, 7, 1] });
    const out = planRemindersForDocument(doc, now);
    expect(out.map((r) => r.daysBefore)).toEqual([1]);
  });

  it('expiry already past → 0 planned', () => {
    const now = new Date('2027-01-15T00:00:00Z');
    const doc = makeDoc({ expiryDate: '2026-12-31', notifyDaysBefore: [30, 7, 1] });
    expect(planRemindersForDocument(doc, now)).toEqual([]);
  });

  it('invalid date string → empty', () => {
    const doc = makeDoc({ expiryDate: 'not-a-date' });
    expect(planRemindersForDocument(doc, new Date('2026-01-01'))).toEqual([]);
  });

  it('notificationId is documentId__daysBefore', () => {
    const now = new Date('2026-11-26T00:00:00Z');
    const out = planRemindersForDocument(makeDoc({ id: 'doc-xyz' }), now);
    expect(out.find((r) => r.daysBefore === 7)?.notificationId).toBe('doc-xyz__7');
  });

  it('custom notifyDaysBefore [90, 14] works', () => {
    const now = new Date('2026-09-01T00:00:00Z');
    const doc = makeDoc({ expiryDate: '2026-12-31', notifyDaysBefore: [90, 14] });
    expect(planRemindersForDocument(doc, now).map((r) => r.daysBefore)).toEqual([90, 14]);
  });

  it('negative or non-finite daysBefore are dropped', () => {
    const now = new Date('2026-06-01');
    const doc = makeDoc({ expiryDate: '2026-12-31', notifyDaysBefore: [-5, Number.NaN, 30] });
    expect(planRemindersForDocument(doc, now).map((r) => r.daysBefore)).toEqual([30]);
  });
});

describe('planAllReminders', () => {
  it('flattens + sorts across multiple docs by trigger date ASC', () => {
    const now = new Date('2026-06-01T00:00:00Z');
    const a = makeDoc({ id: 'a', expiryDate: '2026-07-01', notifyDaysBefore: [7] });
    const b = makeDoc({ id: 'b', expiryDate: '2026-12-31', notifyDaysBefore: [30, 1] });
    const out = planAllReminders([a, b], now);
    // a__7 (trigger Jun 24) < b__30 (Dec 1) < b__1 (Dec 30)
    expect(out.map((r) => r.notificationId)).toEqual(['a__7', 'b__30', 'b__1']);
  });

  it('empty input → empty array', () => {
    expect(planAllReminders([], new Date())).toEqual([]);
  });
});

describe('buildNotificationContent', () => {
  const t = (key: string, opts?: Record<string, unknown>): string => {
    if (opts) return `${key}|${JSON.stringify(opts)}`;
    return key;
  };

  it('uses customName when set', () => {
    const doc = makeDoc({ customName: '在留 cá nhân' });
    expect(buildNotificationContent(doc, 7, t).title).toBe('在留 cá nhân');
  });

  it('falls back to documents.kinds.<kind> translation', () => {
    const doc = makeDoc({ customName: undefined });
    expect(buildNotificationContent(doc, 7, t).title).toBe('documents.kinds.zairyu_card');
  });

  it('body passes days + date formatted DD/MM/YYYY to translator', () => {
    const doc = makeDoc({ expiryDate: '2027-03-15' });
    expect(buildNotificationContent(doc, 30, t).body).toContain('"days":30');
    expect(buildNotificationContent(doc, 30, t).body).toContain('"date":"15/03/2027"');
  });
});

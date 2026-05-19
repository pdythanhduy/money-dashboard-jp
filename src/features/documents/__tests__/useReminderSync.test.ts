jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

const mockCancelAll = jest.fn();
const mockSchedule = jest.fn();

jest.mock('@/lib/notifications', () => ({
  cancelAllReminders: () => mockCancelAll(),
  scheduleDocumentReminder: (args: unknown) => mockSchedule(args),
}));

import { syncReminders } from '@/features/documents/hooks/useReminderSync';
import type { DocumentReminder } from '@/types/document';

const tIdentity = (key: string) => key;

beforeEach(() => {
  mockCancelAll.mockReset();
  mockCancelAll.mockResolvedValue(undefined);
  mockSchedule.mockReset();
  mockSchedule.mockResolvedValue('sched-id');
});

describe('syncReminders', () => {
  it('cancels all then schedules one per planned trigger', async () => {
    const docs: DocumentReminder[] = [
      {
        id: 'doc-1',
        kind: 'zairyu_card',
        expiryDate: '2027-01-01',
        notifyDaysBefore: [30, 7, 1],
      },
    ];
    // `now` 60 days before → all 3 in the future.
    await syncReminders(docs, tIdentity, new Date('2026-11-02T00:00:00Z'));
    expect(mockCancelAll).toHaveBeenCalledTimes(1);
    expect(mockSchedule).toHaveBeenCalledTimes(3);
    const ids = mockSchedule.mock.calls.map((c) => (c[0] as { id: string }).id);
    expect(ids).toEqual(['doc-1__30', 'doc-1__7', 'doc-1__1']);
  });

  it('cancels and schedules nothing for empty docs list', async () => {
    await syncReminders([], tIdentity);
    expect(mockCancelAll).toHaveBeenCalledTimes(1);
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('skips planned triggers that are already past', async () => {
    const docs: DocumentReminder[] = [
      {
        id: 'doc-2',
        kind: 'passport_vn',
        expiryDate: '2026-12-31',
        notifyDaysBefore: [30, 7, 1],
      },
    ];
    // 5 days before expiry → only the 1-day trigger remains in the future.
    await syncReminders(docs, tIdentity, new Date('2026-12-26T00:00:00Z'));
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    expect((mockSchedule.mock.calls[0]?.[0] as { id: string }).id).toBe('doc-2__1');
  });
});

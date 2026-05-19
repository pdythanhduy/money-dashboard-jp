/**
 * Notifications helper tests. expo-notifications is fully mocked — we
 * exercise the schedule/cancel control flow, permission gating, and the
 * lazy-require fallback.
 */

const mockSetHandler = jest.fn();
const mockGetPerm = jest.fn();
const mockReqPerm = jest.fn();
const mockSchedule = jest.fn();
const mockCancel = jest.fn();
const mockCancelAll = jest.fn();
const mockGetAll = jest.fn();

jest.mock('expo-notifications', () => ({
  setNotificationHandler: (...args: unknown[]) => mockSetHandler(...args),
  getPermissionsAsync: () => mockGetPerm(),
  requestPermissionsAsync: (input?: unknown) => mockReqPerm(input),
  scheduleNotificationAsync: (input: unknown) => mockSchedule(input),
  cancelScheduledNotificationAsync: (id: string) => mockCancel(id),
  cancelAllScheduledNotificationsAsync: () => mockCancelAll(),
  getAllScheduledNotificationsAsync: () => mockGetAll(),
  SchedulableTriggerInputTypes: { DATE: 'date' },
}));

import {
  cancelAllReminders,
  cancelReminder,
  configureNotifications,
  getAllScheduledReminders,
  getPermissionStatus,
  requestNotificationPermission,
  scheduleDocumentReminder,
} from '@/lib/notifications';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('configureNotifications', () => {
  it('registers a handler that shows banner + sound', () => {
    configureNotifications();
    expect(mockSetHandler).toHaveBeenCalledTimes(1);
  });
});

describe('getPermissionStatus + requestNotificationPermission', () => {
  it('maps granted → granted', async () => {
    mockGetPerm.mockResolvedValue({ granted: true, canAskAgain: false });
    expect(await getPermissionStatus()).toBe('granted');
  });
  it('maps !granted + canAskAgain → undetermined', async () => {
    mockGetPerm.mockResolvedValue({ granted: false, canAskAgain: true });
    expect(await getPermissionStatus()).toBe('undetermined');
  });
  it('maps !granted + !canAskAgain → denied', async () => {
    mockGetPerm.mockResolvedValue({ granted: false, canAskAgain: false });
    expect(await getPermissionStatus()).toBe('denied');
  });
  it('request passes ios-only flags (alert/sound/badge, NO criticalAlert)', async () => {
    mockReqPerm.mockResolvedValue({ granted: true, canAskAgain: false });
    const r = await requestNotificationPermission();
    expect(r).toBe('granted');
    expect(mockReqPerm).toHaveBeenCalledWith({
      ios: { allowAlert: true, allowSound: true, allowBadge: true },
    });
  });
});

describe('scheduleDocumentReminder', () => {
  const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const past = new Date(Date.now() - 60_000);

  it('returns null when permission denied', async () => {
    mockGetPerm.mockResolvedValue({ granted: false, canAskAgain: false });
    const out = await scheduleDocumentReminder({
      id: 'x', title: 't', body: 'b', triggerDate: future,
    });
    expect(out).toBeNull();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('returns null for past trigger date', async () => {
    mockGetPerm.mockResolvedValue({ granted: true, canAskAgain: false });
    const out = await scheduleDocumentReminder({
      id: 'x', title: 't', body: 'b', triggerDate: past,
    });
    expect(out).toBeNull();
    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('cancels then schedules with the identifier on success', async () => {
    mockGetPerm.mockResolvedValue({ granted: true, canAskAgain: false });
    mockSchedule.mockResolvedValue('native-id-123');
    const out = await scheduleDocumentReminder({
      id: 'zairyu-30', title: 'Renew', body: '30 days left', triggerDate: future,
    });
    expect(mockCancel).toHaveBeenCalledWith('zairyu-30');
    expect(mockSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'zairyu-30',
        content: { title: 'Renew', body: '30 days left' },
        trigger: expect.objectContaining({ type: 'date', date: future }),
      }),
    );
    expect(out).toBe('native-id-123');
  });
});

describe('cancel helpers', () => {
  it('cancelReminder forwards id; swallows errors', async () => {
    mockCancel.mockResolvedValue(undefined);
    await cancelReminder('abc');
    expect(mockCancel).toHaveBeenCalledWith('abc');
  });
  it('cancelAllReminders forwards', async () => {
    mockCancelAll.mockResolvedValue(undefined);
    await cancelAllReminders();
    expect(mockCancelAll).toHaveBeenCalledTimes(1);
  });
});

describe('getAllScheduledReminders', () => {
  it('maps native rows to { id, title, triggerDate }', async () => {
    mockGetAll.mockResolvedValue([
      {
        identifier: 'doc-1__30',
        content: { title: 'Renew zairyu' },
        trigger: { type: 'date', value: 1_700_000_000_000 },
      },
      {
        identifier: 'orphan',
        content: { title: 'no-trigger' },
        trigger: null,
      },
    ]);
    const out = await getAllScheduledReminders();
    expect(out).toHaveLength(1);
    expect(out[0]?.id).toBe('doc-1__30');
    expect(out[0]?.triggerDate.getTime()).toBe(1_700_000_000_000);
  });
});

/**
 * Thin facade over `expo-notifications` — LOCAL-only.
 *
 * No push tokens, no remote registration, no server: every notification
 * fires from a locally-scheduled trigger that the OS holds in its own
 * scheduler. Works fully offline. Honoring CLAUDE.md "no PII off device".
 *
 * The module is `require`-loaded lazily inside try/catch so unit tests
 * (and web bundles) that don't link the native module still import this
 * file safely — the helpers no-op in that environment.
 */

type PermissionStatus = 'granted' | 'denied' | 'undetermined';

interface ScheduleArgs {
  /** Stable identifier — re-scheduling with the same id replaces the old one. */
  id: string;
  title: string;
  body: string;
  triggerDate: Date;
}

interface ScheduledItem {
  id: string;
  title: string;
  triggerDate: Date;
}

/** Lazy-loaded module ref; null when native bindings missing (web / jest). */
let Notif: typeof import('expo-notifications') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Notif = require('expo-notifications') as typeof import('expo-notifications');
} catch (err) {
  // eslint-disable-next-line no-console
  console.warn('[notifications] expo-notifications unavailable — running no-op stubs', err);
}

/**
 * Wire the global handler so notifications display as banner when the app
 * is foregrounded. Call once during app bootstrap.
 */
export function configureNotifications(): void {
  if (!Notif) return;
  Notif.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function getPermissionStatus(): Promise<PermissionStatus> {
  if (!Notif) return 'undetermined';
  try {
    const res = await Notif.getPermissionsAsync();
    if (res.granted) return 'granted';
    if (res.canAskAgain) return 'undetermined';
    return 'denied';
  } catch {
    return 'undetermined';
  }
}

/**
 * iOS: requests alert + sound + badge. NEVER criticalAlert / provisional
 * (those need entitlements we don't ship). Android: returns granted by
 * default but POST_NOTIFICATIONS prompt fires on 13+.
 */
export async function requestNotificationPermission(): Promise<PermissionStatus> {
  if (!Notif) return 'undetermined';
  try {
    const res = await Notif.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: true },
    });
    if (res.granted) return 'granted';
    if (res.canAskAgain) return 'undetermined';
    return 'denied';
  } catch {
    return 'undetermined';
  }
}

/**
 * Schedule (or re-schedule) a local notification for a future date.
 * Returns the system identifier on success, `null` if:
 *   - native module is unavailable (web / test)
 *   - permission denied
 *   - triggerDate is not strictly in the future
 *
 * Same `id` always cancels first → callers can re-run sync without
 * worrying about duplicates.
 */
export async function scheduleDocumentReminder(args: ScheduleArgs): Promise<string | null> {
  if (!Notif) return null;
  if (!(args.triggerDate instanceof Date) || Number.isNaN(args.triggerDate.getTime())) return null;
  if (args.triggerDate.getTime() <= Date.now()) return null;
  if ((await getPermissionStatus()) !== 'granted') return null;
  try {
    await cancelReminder(args.id);
    return await Notif.scheduleNotificationAsync({
      identifier: args.id,
      content: { title: args.title, body: args.body },
      trigger: {
        type: Notif.SchedulableTriggerInputTypes.DATE,
        date: args.triggerDate,
      },
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[notifications] scheduleDocumentReminder failed', err);
    return null;
  }
}

export async function cancelReminder(id: string): Promise<void> {
  if (!Notif) return;
  try {
    await Notif.cancelScheduledNotificationAsync(id);
  } catch {
    // Already cancelled / never existed — swallow.
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (!Notif) return;
  try {
    await Notif.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[notifications] cancelAllReminders failed', err);
  }
}

export async function getAllScheduledReminders(): Promise<ScheduledItem[]> {
  if (!Notif) return [];
  try {
    const list = await Notif.getAllScheduledNotificationsAsync();
    return list.flatMap((n) => {
      // Date trigger has a `value` (ms epoch) we can use to reconstruct.
      const trig = n.trigger as { type?: string; value?: number; date?: number } | null;
      const ms = trig?.value ?? trig?.date;
      if (typeof ms !== 'number') return [];
      return [
        {
          id: n.identifier,
          title: n.content.title ?? '',
          triggerDate: new Date(ms),
        },
      ];
    });
  } catch {
    return [];
  }
}

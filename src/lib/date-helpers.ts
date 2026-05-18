/**
 * Date utilities tuned for Japanese payday/financial-month conventions.
 *
 * All public helpers take an explicit `Date` argument so callers can inject
 * a fixed clock in tests. `getTokyoNow()` is the only function that reads
 * the real wall clock.
 */

export type Greeting = 'morning' | 'afternoon' | 'evening';

/**
 * Current wall-clock time as if the device were in Tokyo. The returned
 * `Date` object's local-time accessors (`getDate`, `getHours`, ...) read
 * Asia/Tokyo values. Useful for users testing the app from outside Japan.
 *
 * Falls back to the raw device time if `Intl.DateTimeFormat` with timeZone
 * support is unavailable (very old runtimes only).
 */
export function getTokyoNow(): Date {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(new Date());
    const pick = (type: Intl.DateTimeFormatPartTypes): number => {
      const found = parts.find((p) => p.type === type);
      return found ? Number.parseInt(found.value, 10) : 0;
    };
    return new Date(
      pick('year'),
      pick('month') - 1,
      pick('day'),
      pick('hour'),
      pick('minute'),
      pick('second'),
    );
  } catch {
    return new Date();
  }
}

/** Greet by Asia/Tokyo hour bucket. */
export function getGreeting(now: Date): Greeting {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'afternoon';
  return 'evening';
}

/** Number of calendar days in the given date's month (handles leap Feb). */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Calendar day-of-month (1..31). */
export function getDayOfMonth(date: Date): number {
  return date.getDate();
}

/**
 * Days until the next payday at `payday`-th of a month (default 25th, the
 * most common Japanese 給料日).
 *
 * - If today is before the payday in this month, returns the gap.
 * - If today IS the payday, returns 0.
 * - If today is past, returns days to month-end plus payday (next month).
 *
 * Throws if `payday` is not in [1, 31].
 */
export function getDaysUntilPayday(today: Date, payday = 25): number {
  if (!Number.isInteger(payday) || payday < 1 || payday > 31) {
    throw new Error(`payday must be an integer in [1, 31], got ${payday}`);
  }
  const todayDay = today.getDate();
  if (todayDay < payday) return payday - todayDay;
  if (todayDay === payday) return 0;
  return getDaysInMonth(today) - todayDay + payday;
}

/**
 * Whole-day diff between two dates (target - reference), counted by
 * calendar day boundaries (i.e. ignores the time component). Negative if
 * `target` is before `reference`.
 */
export function daysBetween(reference: Date, target: Date): number {
  const start = new Date(reference.getFullYear(), reference.getMonth(), reference.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

const VIETNAMESE_WEEKDAYS = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
] as const;

const JAPANESE_WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

/** Format like "Thứ Hai, 19/5/2026". */
export function formatDateVi(date: Date): string {
  const dow = VIETNAMESE_WEEKDAYS[date.getDay()];
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return `${dow}, ${d}/${m}/${y}`;
}

/** Format like "月曜日 5月19日". */
export function formatDateJa(date: Date): string {
  const dow = JAPANESE_WEEKDAYS[date.getDay()];
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${dow}曜日 ${m}月${d}日`;
}

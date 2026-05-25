/**
 * Preset JP tax / payroll calendar events — show up automatically on the
 * calendar regardless of user data, so people know what's coming next.
 *
 * Events generated for a given year:
 * - 確定申告 deadline: 3月15日 (or next non-holiday weekday if 15th is weekend).
 *   Source: NTA 確定申告書等作成コーナー
 * - 住民税 quarterly payments (普通徴収): 6月末, 8月末, 10月末, 翌年1月末.
 *   Most municipalities follow this schedule. Source: 地方税法.
 * - 年末調整 reminder: 12月1日 — when most employers start collecting
 *   生命保険料控除申告書 etc.
 * - 給与日 (payday): every month, day-of-month from user settings.
 * - 賞与 (bonus) typical: 6月 + 12月 mid-month markers, info-only.
 *
 * All events are PRESET — no user input required. If the user has a different
 * payday they configure it in Settings and the calendar follows that.
 */

import type { CalendarEvent } from '../types';

/**
 * Compute the actual 確定申告 deadline for `fiscalYearJP` (the year the
 * income was earned). E.g. fiscalYearJP=2025 → income earned during 2025 →
 * deadline is 2026-03-15 (or next business day).
 */
function taxFilingDeadline(fiscalYearJP: number): string {
  const deadlineYear = fiscalYearJP + 1;
  // Per NTA: if 3/15 is Saturday → 3/17; if Sunday → 3/16.
  // We use a simple weekday check here (Date constructor uses local TZ but
  // 3/15 is unambiguous because we're only checking the day-of-week).
  const d = new Date(deadlineYear, 2, 15); // month is 0-indexed
  const dow = d.getDay(); // 0 = Sun, 6 = Sat
  let day = 15;
  if (dow === 6) day = 17;
  else if (dow === 0) day = 16;
  return `${deadlineYear}-03-${String(day).padStart(2, '0')}`;
}

/** Last day of a given month, formatted as ISO. */
function lastDayOfMonth(year: number, monthOneBased: number): string {
  const next = new Date(year, monthOneBased, 0); // day 0 of next month = last day of this month
  const day = next.getDate();
  return `${year}-${String(monthOneBased).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Format a year/month/day as `YYYY-MM-DD`. */
function isoDate(year: number, monthOneBased: number, day: number): string {
  return `${year}-${String(monthOneBased).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

interface FiscalEventOptions {
  /** Day-of-month for monthly payday. Falls back to month-end if value > days in month. */
  payday?: number;
}

/**
 * Build the full set of preset JP fiscal events for the given calendar year.
 * Returns events sorted by date.
 */
export function buildJpFiscalEventsForYear(
  year: number,
  options: FiscalEventOptions = {},
): readonly CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // 確定申告 — the deadline for the PRIOR fiscal year's filing.
  events.push({
    id: `tax_filing-${year}`,
    date: taxFilingDeadline(year - 1),
    kind: 'tax_filing',
    labelKey: 'calendar.events.taxFiling',
    labelParams: { fiscalYear: year - 1 },
  });

  // 住民税 quarterly (普通徴収): end of June, August, October, January next year.
  events.push({
    id: `resident_tax-${year}-q1`,
    date: lastDayOfMonth(year, 6),
    kind: 'resident_tax',
    labelKey: 'calendar.events.residentTax',
    labelParams: { quarter: 1 },
  });
  events.push({
    id: `resident_tax-${year}-q2`,
    date: lastDayOfMonth(year, 8),
    kind: 'resident_tax',
    labelKey: 'calendar.events.residentTax',
    labelParams: { quarter: 2 },
  });
  events.push({
    id: `resident_tax-${year}-q3`,
    date: lastDayOfMonth(year, 10),
    kind: 'resident_tax',
    labelKey: 'calendar.events.residentTax',
    labelParams: { quarter: 3 },
  });
  events.push({
    id: `resident_tax-${year}-q4`,
    date: lastDayOfMonth(year + 1, 1),
    kind: 'resident_tax',
    labelKey: 'calendar.events.residentTax',
    labelParams: { quarter: 4 },
  });

  // 年末調整 — employer kickoff is typically Dec 1.
  events.push({
    id: `year_end_adjustment-${year}`,
    date: isoDate(year, 12, 1),
    kind: 'year_end_adjustment',
    labelKey: 'calendar.events.yearEndAdjustment',
  });

  // 賞与 typical months — info-only markers on the 15th of June and December.
  events.push({
    id: `bonus_typical-${year}-summer`,
    date: isoDate(year, 6, 15),
    kind: 'bonus_typical',
    labelKey: 'calendar.events.bonusTypicalSummer',
  });
  events.push({
    id: `bonus_typical-${year}-winter`,
    date: isoDate(year, 12, 15),
    kind: 'bonus_typical',
    labelKey: 'calendar.events.bonusTypicalWinter',
  });

  // 給与日 — one event per month at user's payday.
  if (options.payday && options.payday > 0 && options.payday <= 31) {
    for (let month = 1; month <= 12; month += 1) {
      const lastDay = new Date(year, month, 0).getDate();
      const day = Math.min(options.payday, lastDay);
      events.push({
        id: `payday-${year}-${month}`,
        date: isoDate(year, month, day),
        kind: 'payday',
        labelKey: 'calendar.events.payday',
      });
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}

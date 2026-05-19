/**
 * Tiny date helpers specific to the Documents tab. Kept feature-local
 * because they encode behaviour like "expired" / urgency tinting.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function daysUntil(isoDate: string, now: Date = new Date()): number | null {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return null;
  // Floor both to midnight UTC so off-by-hours doesn't bleed in.
  const target = Math.floor(d.getTime() / MS_PER_DAY);
  const today = Math.floor(now.getTime() / MS_PER_DAY);
  return target - today;
}

export type UrgencyTier = 'expired' | 'red' | 'orange' | 'yellow' | 'green';

export function urgencyFromDays(days: number | null): UrgencyTier {
  if (days === null) return 'green';
  if (days < 0) return 'expired';
  if (days < 7) return 'red';
  if (days <= 30) return 'orange';
  if (days <= 60) return 'yellow';
  return 'green';
}

export function formatExpiryDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function isoFromYMD(year: number, month: number, day: number): string {
  return `${year.toString().padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function ymdFromIso(iso: string): { year: number; month: number; day: number } | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

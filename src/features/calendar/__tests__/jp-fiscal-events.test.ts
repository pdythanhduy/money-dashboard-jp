import { buildJpFiscalEventsForYear } from '@/features/calendar/lib/jp-fiscal-events';

describe('buildJpFiscalEventsForYear', () => {
  it('emits the 確定申告 deadline for the prior fiscal year', () => {
    // year=2026 → income earned 2025 → deadline 2026-03-15 (Sun → 16) wait check
    // 2026-03-15 is a Sunday → deadline pushes to 2026-03-16 (Mon)
    const events = buildJpFiscalEventsForYear(2026);
    const filing = events.find((e) => e.kind === 'tax_filing');
    expect(filing?.date).toBe('2026-03-16');
    expect(filing?.labelParams?.fiscalYear).toBe(2025);
  });

  it('emits 4 quarterly 住民税 events with correct end-of-month dates', () => {
    const events = buildJpFiscalEventsForYear(2026);
    const rt = events.filter((e) => e.kind === 'resident_tax').map((e) => e.date);
    expect(rt).toEqual([
      '2026-06-30',
      '2026-08-31',
      '2026-10-31',
      '2027-01-31',
    ]);
  });

  it('emits 年末調整 on Dec 1', () => {
    const events = buildJpFiscalEventsForYear(2026);
    const ye = events.find((e) => e.kind === 'year_end_adjustment');
    expect(ye?.date).toBe('2026-12-01');
  });

  it('emits 2 bonus typical markers (summer + winter)', () => {
    const events = buildJpFiscalEventsForYear(2026);
    const bonus = events.filter((e) => e.kind === 'bonus_typical').map((e) => e.date);
    expect(bonus.sort()).toEqual(['2026-06-15', '2026-12-15']);
  });

  it('does NOT emit paydays when payday option is undefined', () => {
    const events = buildJpFiscalEventsForYear(2026);
    expect(events.filter((e) => e.kind === 'payday')).toHaveLength(0);
  });

  it('emits 12 paydays clamped to month-end (payday=31 → Feb 28/29)', () => {
    const events = buildJpFiscalEventsForYear(2026, { payday: 31 });
    const paydays = events.filter((e) => e.kind === 'payday');
    expect(paydays).toHaveLength(12);
    // February 2026 → 28th (not a leap year)
    expect(paydays.find((e) => e.date.startsWith('2026-02'))?.date).toBe('2026-02-28');
    // April 2026 → 30th
    expect(paydays.find((e) => e.date.startsWith('2026-04'))?.date).toBe('2026-04-30');
  });

  it('emits payday=25 on the 25th of every month', () => {
    const events = buildJpFiscalEventsForYear(2026, { payday: 25 });
    const paydays = events.filter((e) => e.kind === 'payday');
    expect(paydays).toHaveLength(12);
    expect(paydays.every((e) => e.date.endsWith('-25'))).toBe(true);
  });

  it('returns events sorted by date ascending', () => {
    const events = buildJpFiscalEventsForYear(2026, { payday: 25 });
    for (let i = 1; i < events.length; i += 1) {
      expect(events[i]!.date >= events[i - 1]!.date).toBe(true);
    }
  });

  it('March 15 weekday handling: 2027-03-15 Mon → no shift', () => {
    // year=2027 → income 2026 → deadline 2027-03-15 (Mon, no shift)
    const events = buildJpFiscalEventsForYear(2027);
    const filing = events.find((e) => e.kind === 'tax_filing');
    expect(filing?.date).toBe('2027-03-15');
  });
});

import { JP_HOLIDAYS, lookupHoliday } from '@/features/calendar/lib/jp-holidays';

describe('JP holidays — FY2025/2026/2027 fixture', () => {
  it('contains all 16 fixed + moveable holidays for FY2026', () => {
    const fy2026 = JP_HOLIDAYS.filter((h) => h.date.startsWith('2026') && !h.isSubstitute);
    // 16 named holidays per 内閣府 (元日, 成人, 建国, 天皇誕生, 春分, 昭和, 憲法,
    // みどり, こども, 海, 山, 敬老, 秋分, スポーツ, 文化, 勤労感謝)
    expect(fy2026).toHaveLength(16);
  });

  it('includes the 2026-05-06 振替休日 (May 3 was Sunday)', () => {
    const sub = lookupHoliday('2026-05-06');
    expect(sub).toBeDefined();
    expect(sub?.isSubstitute).toBe(true);
  });

  it('成人の日 falls on 2nd Monday of January for each year', () => {
    expect(lookupHoliday('2025-01-13')?.nameJa).toBe('成人の日');
    expect(lookupHoliday('2026-01-12')?.nameJa).toBe('成人の日');
    expect(lookupHoliday('2027-01-11')?.nameJa).toBe('成人の日');
  });

  it('returns undefined for non-holiday dates', () => {
    expect(lookupHoliday('2026-03-15')).toBeUndefined();
    expect(lookupHoliday('2026-06-15')).toBeUndefined();
  });

  it('every holiday has both ja + vi names', () => {
    for (const h of JP_HOLIDAYS) {
      expect(h.nameJa).toBeTruthy();
      expect(h.nameVi).toBeTruthy();
    }
  });
});

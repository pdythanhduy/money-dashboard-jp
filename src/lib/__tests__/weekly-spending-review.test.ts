import { computeWeeklyReview } from '@/lib/weekly-spending-review';
import type { KakeiboEntry } from '@/lib/kakeibo-math';

function e(
  id: string,
  date: string,
  amount: number,
  category: KakeiboEntry['category'] = 'food',
): KakeiboEntry {
  return { id, date, amount, category };
}

// Anchors: 2026-05-13 is a Wednesday. Its Monday is 2026-05-11, Sunday 2026-05-17.
// Last week: Monday 2026-05-04, Sunday 2026-05-10.
const WED_2026_05_13 = new Date(2026, 4, 13, 12, 0, 0); // month index is 0-based

describe('computeWeeklyReview — week boundaries', () => {
  it('Monday anchor: week starts on the same day', () => {
    const monday = new Date(2026, 4, 11, 12);
    const r = computeWeeklyReview({ entries: [], now: monday });
    expect(r.weekStart).toBe('2026-05-11');
    expect(r.weekEnd).toBe('2026-05-17');
  });

  it('Sunday anchor: week ends on the same day', () => {
    const sunday = new Date(2026, 4, 17, 12);
    const r = computeWeeklyReview({ entries: [], now: sunday });
    expect(r.weekStart).toBe('2026-05-11');
    expect(r.weekEnd).toBe('2026-05-17');
  });

  it('mid-week anchor: returns Monday→Sunday containing it', () => {
    const r = computeWeeklyReview({ entries: [], now: WED_2026_05_13 });
    expect(r.weekStart).toBe('2026-05-11');
    expect(r.weekEnd).toBe('2026-05-17');
  });
});

describe('computeWeeklyReview — totals + diff', () => {
  it('sums entries that fall within Monday–Sunday inclusive', () => {
    const entries = [
      e('a', '2026-05-11', 1_000), // this week (Mon)
      e('b', '2026-05-14', 2_000), // this week (Thu)
      e('c', '2026-05-17', 500),  // this week (Sun)
      e('d', '2026-05-10', 9_999),  // last week (Sun)
      e('e', '2026-05-18', 9_999),  // next week — excluded
    ];
    const r = computeWeeklyReview({ entries, now: WED_2026_05_13 });
    expect(r.thisWeekTotal).toBe(3_500);
    expect(r.lastWeekTotal).toBe(9_999);
    expect(r.diff).toBe(3_500 - 9_999);
    expect(r.diffStatus).toBe('down');
  });

  it('diff up when this week > last week by > tolerance', () => {
    const entries = [
      e('a', '2026-05-13', 10_000),
      e('b', '2026-05-06', 2_000),
    ];
    const r = computeWeeklyReview({ entries, now: WED_2026_05_13 });
    expect(r.diffStatus).toBe('up');
    expect(r.diff).toBe(8_000);
  });

  it('diff down when this week < last week by > tolerance', () => {
    const entries = [
      e('a', '2026-05-13', 1_000),
      e('b', '2026-05-06', 5_000),
    ];
    const r = computeWeeklyReview({ entries, now: WED_2026_05_13 });
    expect(r.diffStatus).toBe('down');
    expect(r.diff).toBe(-4_000);
  });

  it('diff same when |this − last| < ¥500 tolerance', () => {
    const entries = [
      e('a', '2026-05-13', 1_200),
      e('b', '2026-05-06', 1_400), // diff = -200 → within tolerance
    ];
    const r = computeWeeklyReview({ entries, now: WED_2026_05_13 });
    expect(r.diffStatus).toBe('same');
    expect(r.diff).toBe(-200);
  });
});

describe('computeWeeklyReview — topCategory', () => {
  it('picks the highest-spend category for THIS week only', () => {
    const entries = [
      e('a', '2026-05-12', 3_000, 'food'),
      e('b', '2026-05-13', 5_000, 'transport'),
      e('c', '2026-05-14', 1_000, 'food'),
      e('d', '2026-05-07', 99_999, 'shopping'), // last week — ignored for top
    ];
    const r = computeWeeklyReview({ entries, now: WED_2026_05_13 });
    expect(r.topCategory).toEqual({ category: 'transport', amount: 5_000 });
  });

  it('topCategory is undefined when this week has no entries', () => {
    const entries = [e('a', '2026-05-07', 9_999, 'food')];
    const r = computeWeeklyReview({ entries, now: WED_2026_05_13 });
    expect(r.topCategory).toBeUndefined();
    // But last week has data so hasData stays true.
    expect(r.hasData).toBe(true);
  });
});

describe('computeWeeklyReview — hasData gating', () => {
  it('hasData=false when both weeks are empty', () => {
    const r = computeWeeklyReview({ entries: [], now: WED_2026_05_13 });
    expect(r.hasData).toBe(false);
    expect(r.thisWeekTotal).toBe(0);
    expect(r.lastWeekTotal).toBe(0);
  });

  it('hasData=true when only this week has data', () => {
    const entries = [e('a', '2026-05-13', 100)];
    const r = computeWeeklyReview({ entries, now: WED_2026_05_13 });
    expect(r.hasData).toBe(true);
  });

  it('hasData=true when only last week has data (the catch-up nudge case)', () => {
    const entries = [e('a', '2026-05-07', 100)];
    const r = computeWeeklyReview({ entries, now: WED_2026_05_13 });
    expect(r.hasData).toBe(true);
  });
});

describe('computeWeeklyReview — month boundary', () => {
  // Week of 2026-05-25 (Mon) → 2026-05-31 (Sun). Last week 18→24 (all May).
  // Week of 2026-06-01 (Mon) → 2026-06-07 (Sun). Last week 25→31 (crosses May/Jun).
  it('week that ends on the last day of the month is still 1 week', () => {
    const monday = new Date(2026, 4, 25, 12);
    const r = computeWeeklyReview({ entries: [], now: monday });
    expect(r.weekStart).toBe('2026-05-25');
    expect(r.weekEnd).toBe('2026-05-31');
  });

  it('week that crosses month boundary attributes entries to the right week', () => {
    const monday = new Date(2026, 5, 1, 12); // 2026-06-01 Monday
    const entries = [
      e('may30', '2026-05-30', 1_000), // last week (May 25→31)
      e('may31', '2026-05-31', 2_000), // last week
      e('jun1', '2026-06-01', 3_000),  // this week (Jun 1→7)
      e('jun7', '2026-06-07', 4_000),  // this week
    ];
    const r = computeWeeklyReview({ entries, now: monday });
    expect(r.weekStart).toBe('2026-06-01');
    expect(r.weekEnd).toBe('2026-06-07');
    expect(r.thisWeekTotal).toBe(7_000);
    expect(r.lastWeekTotal).toBe(3_000);
  });
});

describe('computeWeeklyReview — year boundary', () => {
  it('week that crosses 2026/2027 attributes entries correctly', () => {
    // 2026-12-31 is a Thursday. Its Monday is 2026-12-28, Sunday 2027-01-03.
    const thursday = new Date(2026, 11, 31, 12);
    const entries = [
      e('dec29', '2026-12-29', 1_500),
      e('dec31', '2026-12-31', 2_500),
      e('jan2', '2027-01-02', 1_000),
      e('jan3', '2027-01-03', 500),
      e('jan4', '2027-01-04', 9_999), // next week (Jan 4→10)
    ];
    const r = computeWeeklyReview({ entries, now: thursday });
    expect(r.weekStart).toBe('2026-12-28');
    expect(r.weekEnd).toBe('2027-01-03');
    expect(r.thisWeekTotal).toBe(5_500);
  });
});

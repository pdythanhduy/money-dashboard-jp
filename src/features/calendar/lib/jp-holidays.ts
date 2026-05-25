/**
 * Japanese national holidays (国民の祝日) for FY2025, FY2026, FY2027 — used to
 * tint day cells red and surface the holiday name in the day-detail modal.
 *
 * Dates verified against the official 内閣府 (Cabinet Office) public list.
 * Source: https://www8.cao.go.jp/chosei/shukujitsu/gaiyou.html
 *
 * 振替休日 (substitute holiday) rule, per 国民の祝日に関する法律 §3-2:
 * when a fixed holiday falls on a Sunday, the next non-holiday weekday
 * becomes a holiday. The list below applies this rule explicitly.
 *
 * NOTE on date arithmetic for moveable holidays:
 * - 成人の日 = 2nd Monday of January
 * - 海の日 = 3rd Monday of July
 * - 敬老の日 = 3rd Monday of September
 * - スポーツの日 = 2nd Monday of October
 * - 春分の日 / 秋分の日 are astronomically determined; official dates are
 *   announced annually by 国立天文台. Values below are the OFFICIAL gazette
 *   dates, not computed.
 */

import type { JpHoliday } from '../types';

export const JP_HOLIDAYS: readonly JpHoliday[] = [
  // ---------------- FY2025 (令和7年) ----------------
  { date: '2025-01-01', nameJa: '元日',           nameVi: 'Tết Dương lịch' },
  { date: '2025-01-13', nameJa: '成人の日',       nameVi: 'Lễ trưởng thành' },
  { date: '2025-02-11', nameJa: '建国記念の日',   nameVi: 'Quốc khánh' },
  { date: '2025-02-23', nameJa: '天皇誕生日',     nameVi: 'Sinh nhật Thiên hoàng' },
  { date: '2025-02-24', nameJa: '振替休日',       nameVi: 'Nghỉ bù', isSubstitute: true },
  { date: '2025-03-20', nameJa: '春分の日',       nameVi: 'Xuân phân' },
  { date: '2025-04-29', nameJa: '昭和の日',       nameVi: 'Ngày Showa' },
  { date: '2025-05-03', nameJa: '憲法記念日',     nameVi: 'Ngày Hiến pháp' },
  { date: '2025-05-04', nameJa: 'みどりの日',     nameVi: 'Ngày cây xanh' },
  { date: '2025-05-05', nameJa: 'こどもの日',     nameVi: 'Ngày trẻ em' },
  { date: '2025-05-06', nameJa: '振替休日',       nameVi: 'Nghỉ bù', isSubstitute: true },
  { date: '2025-07-21', nameJa: '海の日',         nameVi: 'Ngày biển' },
  { date: '2025-08-11', nameJa: '山の日',         nameVi: 'Ngày núi' },
  { date: '2025-09-15', nameJa: '敬老の日',       nameVi: 'Ngày kính lão' },
  { date: '2025-09-23', nameJa: '秋分の日',       nameVi: 'Thu phân' },
  { date: '2025-10-13', nameJa: 'スポーツの日',   nameVi: 'Ngày thể thao' },
  { date: '2025-11-03', nameJa: '文化の日',       nameVi: 'Ngày văn hóa' },
  { date: '2025-11-23', nameJa: '勤労感謝の日',   nameVi: 'Ngày cảm tạ lao động' },
  { date: '2025-11-24', nameJa: '振替休日',       nameVi: 'Nghỉ bù', isSubstitute: true },

  // ---------------- FY2026 (令和8年) ----------------
  { date: '2026-01-01', nameJa: '元日',           nameVi: 'Tết Dương lịch' },
  { date: '2026-01-12', nameJa: '成人の日',       nameVi: 'Lễ trưởng thành' },
  { date: '2026-02-11', nameJa: '建国記念の日',   nameVi: 'Quốc khánh' },
  { date: '2026-02-23', nameJa: '天皇誕生日',     nameVi: 'Sinh nhật Thiên hoàng' },
  { date: '2026-03-20', nameJa: '春分の日',       nameVi: 'Xuân phân' },
  { date: '2026-04-29', nameJa: '昭和の日',       nameVi: 'Ngày Showa' },
  { date: '2026-05-03', nameJa: '憲法記念日',     nameVi: 'Ngày Hiến pháp' },
  { date: '2026-05-04', nameJa: 'みどりの日',     nameVi: 'Ngày cây xanh' },
  { date: '2026-05-05', nameJa: 'こどもの日',     nameVi: 'Ngày trẻ em' },
  { date: '2026-05-06', nameJa: '振替休日',       nameVi: 'Nghỉ bù', isSubstitute: true },
  { date: '2026-07-20', nameJa: '海の日',         nameVi: 'Ngày biển' },
  { date: '2026-08-11', nameJa: '山の日',         nameVi: 'Ngày núi' },
  { date: '2026-09-21', nameJa: '敬老の日',       nameVi: 'Ngày kính lão' },
  { date: '2026-09-23', nameJa: '秋分の日',       nameVi: 'Thu phân' },
  { date: '2026-10-12', nameJa: 'スポーツの日',   nameVi: 'Ngày thể thao' },
  { date: '2026-11-03', nameJa: '文化の日',       nameVi: 'Ngày văn hóa' },
  { date: '2026-11-23', nameJa: '勤労感謝の日',   nameVi: 'Ngày cảm tạ lao động' },

  // ---------------- FY2027 (令和9年) ----------------
  { date: '2027-01-01', nameJa: '元日',           nameVi: 'Tết Dương lịch' },
  { date: '2027-01-11', nameJa: '成人の日',       nameVi: 'Lễ trưởng thành' },
  { date: '2027-02-11', nameJa: '建国記念の日',   nameVi: 'Quốc khánh' },
  { date: '2027-02-23', nameJa: '天皇誕生日',     nameVi: 'Sinh nhật Thiên hoàng' },
  { date: '2027-03-21', nameJa: '春分の日',       nameVi: 'Xuân phân' },
  { date: '2027-03-22', nameJa: '振替休日',       nameVi: 'Nghỉ bù', isSubstitute: true },
  { date: '2027-04-29', nameJa: '昭和の日',       nameVi: 'Ngày Showa' },
  { date: '2027-05-03', nameJa: '憲法記念日',     nameVi: 'Ngày Hiến pháp' },
  { date: '2027-05-04', nameJa: 'みどりの日',     nameVi: 'Ngày cây xanh' },
  { date: '2027-05-05', nameJa: 'こどもの日',     nameVi: 'Ngày trẻ em' },
  { date: '2027-07-19', nameJa: '海の日',         nameVi: 'Ngày biển' },
  { date: '2027-08-11', nameJa: '山の日',         nameVi: 'Ngày núi' },
  { date: '2027-09-20', nameJa: '敬老の日',       nameVi: 'Ngày kính lão' },
  { date: '2027-09-23', nameJa: '秋分の日',       nameVi: 'Thu phân' },
  { date: '2027-10-11', nameJa: 'スポーツの日',   nameVi: 'Ngày thể thao' },
  { date: '2027-11-03', nameJa: '文化の日',       nameVi: 'Ngày văn hóa' },
  { date: '2027-11-23', nameJa: '勤労感謝の日',   nameVi: 'Ngày cảm tạ lao động' },
];

const HOLIDAY_INDEX = new Map<string, JpHoliday>(JP_HOLIDAYS.map((h) => [h.date, h]));

/** O(1) holiday lookup by ISO date `YYYY-MM-DD`. Returns undefined when not a holiday. */
export function lookupHoliday(date: string): JpHoliday | undefined {
  return HOLIDAY_INDEX.get(date);
}

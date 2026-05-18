/**
 * 国民健康保険 (NHI) rates for the two municipalities supported in Phase 1.
 *
 * 国保 is municipality-level (not prefecture-level), so each city sets its
 * own rates. Adding a city requires its full 4-component rate set.
 *
 * Calculation base: 旧ただし書き所得 = 総所得金額 - ¥430,000 (the 住民税
 * basic deduction). Each component sums:
 *   所得割率 × 旧ただし書き所得 + 均等割 × 人数 + 平等割/世帯
 * capped at the component's annual cap.
 *
 * Both rate sets verified for 令和8年度 (FY2026, effective 2026-04-01).
 *
 * @see https://www.city.osaka.lg.jp/fukushi/cmsfiles/contents/0000007/7173/R7-2-4-3_houkoku2.pdf — 大阪市
 * @see https://www.city.nerima.tokyo.jp/kurashi/nenkinhoken/kokuminkenkohoken/hoken_hokenryo/keisan_hoho.html — 練馬区 (23区 unified rate)
 */

import type { FreelanceMunicipality, KokuhoRateSet } from '@/types/tax';

/**
 * Basic deduction subtracted from gross income to derive 旧ただし書き所得.
 * Equals the 住民税 basic deduction. The 令和7年12月 reform did NOT change
 * this value, so it remains ¥430,000 for FY2026.
 */
export const KOKUHO_BASIC_DEDUCTION = 430_000;

export const KOKUHO_RATES: Readonly<Record<FreelanceMunicipality, KokuhoRateSet>> = {
  'osaka-shi': {
    medical: {
      incomeRate:        0.0950,
      perPersonAmount:   34_990,
      perHouseholdAmount: 33_908,
      annualCap:         660_000,
    },
    elderlySupport: {
      incomeRate:        0.0306,
      perPersonAmount:   11_191,
      perHouseholdAmount: 10_845,
      annualCap:         260_000,
    },
    longTermCare: {
      incomeRate:        0.0260,
      perPersonAmount:   18_682,
      perHouseholdAmount:    null,
      annualCap:         170_000,
    },
    childcareSupport: {
      incomeRate:        0.0028,
      perPersonAmount:    1_841,
      perHouseholdAmount:    null,
      annualCap:          30_000,
    },
  },
  'tokyo-23ku': {
    medical: {
      incomeRate:        0.0751,
      perPersonAmount:   47_600,
      perHouseholdAmount:    null,   // 23区 uses 二方式 (no 平等割)
      annualCap:         670_000,
    },
    elderlySupport: {
      incomeRate:        0.0280,
      perPersonAmount:   17_600,
      perHouseholdAmount:    null,
      annualCap:         260_000,
    },
    longTermCare: {
      incomeRate:        0.0243,
      perPersonAmount:   17_800,
      perHouseholdAmount:    null,
      annualCap:         170_000,
    },
    childcareSupport: null,
  },
};

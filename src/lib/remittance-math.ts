/**
 * Pure remittance math: yearly aggregates, weighted average rates, provider
 * comparison by effective rate (fee-adjusted), goal progress, and the
 * 暦年贈与 (annual gift tax) threshold constant.
 *
 * No network, no rate fetching — user always enters the rate from the
 * provider confirmation email. This file stays React-free for testability.
 */

export type RemittanceProvider =
  | 'wise'
  | 'remitly'
  | 'sbi'
  | 'seven'
  | 'western_union'
  | 'shinhan'
  | 'other';

export const ALL_REMITTANCE_PROVIDERS: readonly RemittanceProvider[] = [
  'wise',
  'remitly',
  'sbi',
  'seven',
  'western_union',
  'shinhan',
  'other',
];

export interface RemittanceEntry {
  id: string;
  /** ISO date "YYYY-MM-DD". */
  date: string;
  /** Yen sent gross (before fee deducted in some providers, included in others — store as posted). */
  amountJPY: number;
  /** Provider fee in yen. May be 0. */
  feeJPY: number;
  /** VND per 1 JPY at time of transfer (e.g. 169.5). */
  exchangeRate: number;
  /** Cached `floor(amountJPY × exchangeRate)`. Store-side helper avoids
   *  re-computing on every render — kept in sync by the store on
   *  add/update. */
  amountVND: number;
  provider: RemittanceProvider;
  recipient?: string;
  note?: string;
}

/**
 * 暦年贈与 — single-recipient gifts up to ¥1.1M / calendar year are
 * exempt. The UI raises a warning per recipient as the running total
 * approaches the threshold so the user can plan.
 */
export const TAX_GIFT_THRESHOLD_JPY = 1_100_000;

export function computeAmountVND(amountJPY: number, rate: number): number {
  if (!Number.isFinite(amountJPY) || !Number.isFinite(rate)) return 0;
  if (amountJPY <= 0 || rate <= 0) return 0;
  return Math.floor(amountJPY * rate);
}

export interface YearlySummary {
  year: number;
  totalSentJPY: number;
  totalSentVND: number;
  totalFeesJPY: number;
  /** Weighted by amountJPY — naive mean would over-weight tiny test transfers. */
  avgExchangeRate: number;
  /** Highest rate seen in the year (best deal). 0 when entryCount=0. */
  bestRate: number;
  /** Lowest rate seen in the year. 0 when entryCount=0. */
  worstRate: number;
  entryCount: number;
  byProvider: Array<{
    provider: RemittanceProvider;
    count: number;
    totalJPY: number;
    totalFees: number;
    avgRate: number;
  }>;
}

function entryYear(iso: string): number {
  return Number.parseInt(iso.slice(0, 4), 10);
}

export function buildYearlySummary(entries: RemittanceEntry[], year: number): YearlySummary {
  const inYear = entries.filter((e) => entryYear(e.date) === year);

  let totalSentJPY = 0;
  let totalSentVND = 0;
  let totalFeesJPY = 0;
  let weightedRateNum = 0;
  let bestRate = 0;
  let worstRate = 0;

  for (const e of inYear) {
    totalSentJPY += e.amountJPY;
    totalSentVND += e.amountVND;
    totalFeesJPY += e.feeJPY;
    weightedRateNum += e.exchangeRate * e.amountJPY;
    if (e.exchangeRate > bestRate) bestRate = e.exchangeRate;
    if (worstRate === 0 || e.exchangeRate < worstRate) worstRate = e.exchangeRate;
  }

  const providerBuckets = new Map<
    RemittanceProvider,
    { count: number; totalJPY: number; totalFees: number; weightedRateNum: number }
  >();
  for (const e of inYear) {
    const cur = providerBuckets.get(e.provider) ?? {
      count: 0,
      totalJPY: 0,
      totalFees: 0,
      weightedRateNum: 0,
    };
    cur.count += 1;
    cur.totalJPY += e.amountJPY;
    cur.totalFees += e.feeJPY;
    cur.weightedRateNum += e.exchangeRate * e.amountJPY;
    providerBuckets.set(e.provider, cur);
  }
  const byProvider = Array.from(providerBuckets.entries()).map(([provider, b]) => ({
    provider,
    count: b.count,
    totalJPY: b.totalJPY,
    totalFees: b.totalFees,
    avgRate: b.totalJPY > 0 ? b.weightedRateNum / b.totalJPY : 0,
  }));

  return {
    year,
    totalSentJPY,
    totalSentVND,
    totalFeesJPY,
    avgExchangeRate: totalSentJPY > 0 ? weightedRateNum / totalSentJPY : 0,
    bestRate,
    worstRate,
    entryCount: inYear.length,
    byProvider,
  };
}

export interface GoalProgress {
  targetJPY: number;
  sentJPY: number;
  /** sentJPY / targetJPY. May exceed 1 if user overshoots. */
  percent: number;
  remaining: number;
  daysLeftInYear: number;
  /**
   * `remaining / daysLeft × 30`, ceiled — what you'd have to send per
   * 30-day window from today to hit the goal. 0 when no remaining or
   * no days left.
   */
  monthlyTargetRemaining: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeRemittanceGoalProgress(
  totalSentJPY: number,
  targetJPY: number,
  now: Date = new Date(),
): GoalProgress {
  const safeTarget = targetJPY > 0 ? targetJPY : 0;
  const remaining = Math.max(0, safeTarget - totalSentJPY);
  const percent = safeTarget > 0 ? totalSentJPY / safeTarget : 0;

  const yearEnd = new Date(now.getFullYear(), 11, 31);
  const daysLeftInYear = Math.max(
    0,
    Math.ceil((yearEnd.getTime() - now.getTime()) / MS_PER_DAY),
  );

  const monthlyTargetRemaining =
    remaining > 0 && daysLeftInYear > 0
      ? Math.ceil((remaining / daysLeftInYear) * 30)
      : 0;

  return {
    targetJPY: safeTarget,
    sentJPY: totalSentJPY,
    percent,
    remaining,
    daysLeftInYear,
    monthlyTargetRemaining,
  };
}

export interface ProviderComparison {
  provider: RemittanceProvider;
  /** Weighted by amountJPY. */
  avgRate: number;
  /** Mean per-transfer fee. */
  avgFee: number;
  /**
   * Effective rate the recipient actually got:
   * `(amountJPY - fee) / amountJPY × rate`. Higher = better deal.
   * Aggregated across all entries: sum((amountJPY-fee)*rate) / sum(amountJPY).
   */
  effectiveRate: number;
}

export function compareProviders(entries: RemittanceEntry[]): ProviderComparison[] {
  const buckets = new Map<
    RemittanceProvider,
    {
      count: number;
      totalJPY: number;
      totalFees: number;
      weightedRateNum: number;
      effectiveNum: number;
    }
  >();
  for (const e of entries) {
    if (e.amountJPY <= 0) continue;
    const cur = buckets.get(e.provider) ?? {
      count: 0,
      totalJPY: 0,
      totalFees: 0,
      weightedRateNum: 0,
      effectiveNum: 0,
    };
    cur.count += 1;
    cur.totalJPY += e.amountJPY;
    cur.totalFees += e.feeJPY;
    cur.weightedRateNum += e.exchangeRate * e.amountJPY;
    cur.effectiveNum += (e.amountJPY - e.feeJPY) * e.exchangeRate;
    buckets.set(e.provider, cur);
  }
  return Array.from(buckets.entries())
    .map(([provider, b]) => ({
      provider,
      avgRate: b.weightedRateNum / b.totalJPY,
      avgFee: b.totalFees / b.count,
      effectiveRate: b.effectiveNum / b.totalJPY,
    }))
    .sort((a, b) => b.effectiveRate - a.effectiveRate);
}

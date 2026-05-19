/**
 * Income "walls" — psychologically named thresholds Vietnamese workers
 * in Japan ask about constantly. Crossing one usually has a discrete
 * cost (spouse loses 配偶者控除, baito stops being parent's 扶養, social
 * insurance enrollment kicks in, etc.) so the UI shows a warning band
 * before & after each line.
 *
 * Thresholds hard-coded per CLAUDE.md "no network" rule — re-verify
 * yearly during the same FY refresh that touches `src/lib/tax-data/`.
 *
 * Severity:
 *   safe     — more than 10% below the threshold
 *   warning  — within 10% below (close enough to plan around)
 *   crossed  — at or above the threshold
 */

export type WallKey =
  | 'basic_deduction_103'
  | 'shaho_106'
  | 'shaho_130'
  | 'spouse_deduction_150'
  | 'basic_deduction_160'
  | 'spouse_deduction_201';

export interface WallProximity {
  wall: WallKey;
  threshold: number;
  /** annualIncome − threshold. Negative = below, positive = above. */
  distance: number;
  /** |distance| ÷ threshold. 0 means right on the line. */
  proximityPercent: number;
  severity: 'safe' | 'warning' | 'crossed';
}

interface WallDef {
  key: WallKey;
  threshold: number;
}

const WALLS: readonly WallDef[] = [
  { key: 'basic_deduction_103', threshold: 1_030_000 },
  { key: 'shaho_106',           threshold: 1_060_000 },
  { key: 'shaho_130',           threshold: 1_300_000 },
  { key: 'spouse_deduction_150', threshold: 1_500_000 },
  { key: 'basic_deduction_160', threshold: 1_600_000 },
  { key: 'spouse_deduction_201', threshold: 2_010_000 },
];

const WARNING_BAND = 0.10; // within 10 % below = "warning"

/**
 * Score every wall against `annualIncome` and return them all. The UI
 * filters by `severity !== 'safe'` when surfacing banners; the full list
 * is exposed so a debug panel can show context.
 */
export function detectWallProximity(annualIncome: number): WallProximity[] {
  if (!Number.isFinite(annualIncome)) return [];
  return WALLS.map(({ key, threshold }) => {
    const distance = annualIncome - threshold;
    const proximityPercent = threshold > 0 ? Math.abs(distance) / threshold : 0;
    let severity: WallProximity['severity'];
    if (distance >= 0) {
      severity = 'crossed';
    } else if (proximityPercent <= WARNING_BAND) {
      severity = 'warning';
    } else {
      severity = 'safe';
    }
    return { wall: key, threshold, distance, proximityPercent, severity };
  });
}

/** Convenience: just the walls that need surfacing in the UI. */
export function activeWalls(annualIncome: number): WallProximity[] {
  return detectWallProximity(annualIncome).filter((w) => w.severity !== 'safe');
}

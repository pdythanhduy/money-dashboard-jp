import { activeWalls, detectWallProximity, type WallProximity } from '@/lib/wall-warnings';

function pick(walls: WallProximity[], key: WallProximity['wall']): WallProximity {
  const w = walls.find((x) => x.wall === key);
  if (!w) throw new Error(`wall ${key} missing`);
  return w;
}

describe('detectWallProximity', () => {
  it('¥800,000: every wall is safe (>10% below threshold)', () => {
    const walls = detectWallProximity(800_000);
    expect(walls.every((w) => w.severity === 'safe')).toBe(true);
    expect(activeWalls(800_000)).toHaveLength(0);
  });

  it('¥1,020,000: 103万 warning (10/1030=0.97%) AND 106万 warning (40/1060=3.77%)', () => {
    const walls = detectWallProximity(1_020_000);
    expect(pick(walls, 'basic_deduction_103').severity).toBe('warning');
    expect(pick(walls, 'shaho_106').severity).toBe('warning');
    expect(pick(walls, 'shaho_130').severity).toBe('safe');
  });

  it('¥1,050,000: 103 crossed, 106 still warning (within 10%)', () => {
    const walls = detectWallProximity(1_050_000);
    expect(pick(walls, 'basic_deduction_103').severity).toBe('crossed');
    expect(pick(walls, 'basic_deduction_103').distance).toBe(20_000);
    expect(pick(walls, 'shaho_106').severity).toBe('warning');
  });

  it('¥1,310,000: 130 crossed, 150 warning (190/1500=12.67%) → safe', () => {
    const walls = detectWallProximity(1_310_000);
    expect(pick(walls, 'shaho_130').severity).toBe('crossed');
    expect(pick(walls, 'shaho_130').distance).toBe(10_000);
    expect(pick(walls, 'spouse_deduction_150').severity).toBe('safe');
  });

  it('¥2,100,000: 103/106/130/150/160 crossed, 201 crossed too', () => {
    const walls = detectWallProximity(2_100_000);
    const crossed = walls.filter((w) => w.severity === 'crossed').map((w) => w.wall);
    expect(crossed).toEqual([
      'basic_deduction_103',
      'shaho_106',
      'shaho_130',
      'spouse_deduction_150',
      'basic_deduction_160',
      'spouse_deduction_201',
    ]);
    expect(pick(walls, 'spouse_deduction_201').distance).toBe(90_000);
  });

  it('distance: ¥1,000,000 vs 103万 = −30,000', () => {
    const walls = detectWallProximity(1_000_000);
    expect(pick(walls, 'basic_deduction_103').distance).toBe(-30_000);
  });

  it('proximityPercent: exactly at the line is 0, severity=crossed', () => {
    const walls = detectWallProximity(1_030_000);
    const w = pick(walls, 'basic_deduction_103');
    expect(w.proximityPercent).toBe(0);
    expect(w.severity).toBe('crossed');
  });

  it('severity warning band boundary: 9% under = warning, 11% under = safe', () => {
    // 9% under 103万 = ¥937,300 → distance −92,700, proximityPercent ≈ 0.09
    expect(pick(detectWallProximity(937_300), 'basic_deduction_103').severity).toBe('warning');
    // 11% under 103万 = ¥916,700 → safe
    expect(pick(detectWallProximity(916_700), 'basic_deduction_103').severity).toBe('safe');
  });

  it('activeWalls filters out safe rows; returns crossed + warning only', () => {
    const out = activeWalls(1_050_000);
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((w) => w.severity !== 'safe')).toBe(true);
  });

  it('non-finite income returns empty', () => {
    expect(detectWallProximity(Number.NaN)).toEqual([]);
  });
});

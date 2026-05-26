import { buildTrendChartLayout } from '@/features/history/trend-chart-layout';
import type { MonthlyTrendPoint } from '@/features/history/history-stats';

/** Helper: build a non-null monthly-trend point with sequential year-months. */
const pt = (
  yearMonth: string,
  takeHome: number | null,
  gross: number | null,
): MonthlyTrendPoint => {
  const [y, m] = yearMonth.split('-');
  return {
    yearMonth,
    year: Number.parseInt(y!, 10),
    month: Number.parseInt(m!, 10),
    takeHome,
    gross,
  };
};

describe('buildTrendChartLayout — empty / all-null', () => {
  it('returns null for empty data', () => {
    expect(buildTrendChartLayout([], 300, 200)).toBeNull();
  });
  it('returns null when every point is null', () => {
    const allNull = [pt('2026-01', null, null), pt('2026-02', null, null)];
    expect(buildTrendChartLayout(allNull, 300, 200)).toBeNull();
  });
});

describe('buildTrendChartLayout — single non-null point', () => {
  it('places dot at correct slot position; band ±10% around value', () => {
    const data = [pt('2026-06', 200_000, 300_000)];
    const layout = buildTrendChartLayout(data, 300, 200)!;
    expect(layout).not.toBeNull();
    expect(layout.dots).toHaveLength(1);
    // single point → centered
    expect(layout.dots[0]!.x).toBeCloseTo((300 - 56 - 16) / 2 + 56, 1);
    // Y bounds: only TAKEHOME drives bounds in 0.3+ (gross is popover-only).
    // value=200_000, pad = 200_000 * 0.1 = 20_000 → yMin=180_000, yMax=220_000.
    expect(layout.yMin).toBeCloseTo(180_000, 0);
    expect(layout.yMax).toBeCloseTo(220_000, 0);
  });
});

describe('buildTrendChartLayout — 6-month sparse trend', () => {
  // 2 of 6 slots populated; rest null → gap connectors expected.
  const data = [
    pt('2026-01', 220_000, 275_000),
    pt('2026-02', null, null),
    pt('2026-03', null, null),
    pt('2026-04', 260_000, 325_000),
    pt('2026-05', null, null),
    pt('2026-06', 280_000, 350_000),
  ];

  it('emits one solid sub-path per contiguous run', () => {
    const layout = buildTrendChartLayout(data, 300, 200)!;
    // 3 isolated non-null months → 3 sub-paths each starting with M.
    expect(layout.takeHomePaths).toHaveLength(3);
    for (const p of layout.takeHomePaths) expect(p.startsWith('M ')).toBe(true);
  });

  it('emits dashed gap connectors between adjacent non-null points across nulls', () => {
    const layout = buildTrendChartLayout(data, 300, 200)!;
    // gaps: 2026-01 → 2026-04 (3-month gap), 2026-04 → 2026-06 (1-month gap)
    // → 2 connectors expected.
    expect(layout.takeHomeGapPaths).toHaveLength(2);
    for (const p of layout.takeHomeGapPaths) {
      expect(p.startsWith('M ')).toBe(true);
      expect(p.match(/L /g)?.length).toBe(1);
    }
  });

  it('dots array only contains non-null months, keyed by original slot index', () => {
    const layout = buildTrendChartLayout(data, 300, 200)!;
    expect(layout.dots).toHaveLength(3);
    expect(layout.dots.map((d) => d.index)).toEqual([0, 3, 5]);
  });

  it('xAxis covers all 6 slots even when most are empty (stable calendar)', () => {
    const layout = buildTrendChartLayout(data, 300, 200)!;
    expect(layout.xAxis).toHaveLength(6);
    expect(layout.xAxis.map((t) => t.month)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('averageTakeHome = mean of non-null months only', () => {
    const layout = buildTrendChartLayout(data, 300, 200)!;
    expect(layout.averageTakeHome).toBe(Math.floor((220_000 + 260_000 + 280_000) / 3));
    expect(layout.averageY).not.toBeNull();
  });

  it('yAxis has 5 labels in descending value order', () => {
    const layout = buildTrendChartLayout(data, 300, 200)!;
    expect(layout.yAxis).toHaveLength(5);
    const values = layout.yAxis.map((p) => p.value);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]!).toBeLessThan(values[i - 1]!);
    }
  });
});

describe('buildTrendChartLayout — degenerate sizes', () => {
  it('inner width/height clamp to 0 for very small canvas', () => {
    const data = [pt('2026-05', 100_000, 125_000), pt('2026-06', 200_000, 250_000)];
    const layout = buildTrendChartLayout(data, 10, 10)!;
    expect(layout.innerWidth).toBe(0);
    expect(layout.innerHeight).toBe(0);
  });
});

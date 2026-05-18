import { buildTrendChartLayout } from '@/features/history/trend-chart-layout';
import type { TrendPoint } from '@/features/history/history-stats';

const tp = (date: number, takeHome: number, gross: number): TrendPoint => ({ date, takeHome, gross });

describe('buildTrendChartLayout — empty', () => {
  it('returns null for empty data', () => {
    expect(buildTrendChartLayout([], 300, 200)).toBeNull();
  });
});

describe('buildTrendChartLayout — single point', () => {
  it('renders one dot in horizontal center; band ±10%', () => {
    const layout = buildTrendChartLayout([tp(1000, 200, 300)], 300, 200);
    expect(layout).not.toBeNull();
    expect(layout!.dots).toHaveLength(1);
    expect(layout!.dots[0]!.x).toBeCloseTo((300 - 56 - 16) / 2 + 56, 1); // padding left=56, right=16
    // Both takeHome (200) and gross (300) considered; min=200 max=300
    // span=100, yMin = max(0, 200-10) = 190, yMax = 310
    expect(layout!.yMin).toBeCloseTo(190, 0);
    expect(layout!.yMax).toBeCloseTo(310, 0);
  });

  it('all-equal values: synthesizes ±10% band so line is not on top axis', () => {
    const layout = buildTrendChartLayout([tp(1000, 100, 100)], 300, 200);
    expect(layout!.yMin).toBeCloseTo(90, 1);
    expect(layout!.yMax).toBeCloseTo(110, 1);
  });
});

describe('buildTrendChartLayout — multi-point spacing', () => {
  const data = [
    tp(1000, 100, 150),
    tp(2000, 200, 250),
    tp(3000, 300, 350),
  ];

  it('x positions span full inner width', () => {
    const layout = buildTrendChartLayout(data, 300, 200);
    expect(layout!.dots).toHaveLength(3);
    expect(layout!.dots[0]!.x).toBeCloseTo(56, 1); // padding.left
    expect(layout!.dots[2]!.x).toBeCloseTo(300 - 16, 1); // width - padding.right
    expect(layout!.dots[1]!.x).toBeCloseTo((56 + (300 - 16)) / 2, 1);
  });

  it('y bounds include 10% headroom on top and floor at 0', () => {
    const layout = buildTrendChartLayout(data, 300, 200);
    // overall min=100, max=350, span=250
    // yMin = max(0, 100 - 25) = 75
    // yMax = 350 + 25 = 375
    expect(layout!.yMin).toBeCloseTo(75, 0);
    expect(layout!.yMax).toBeCloseTo(375, 0);
  });

  it('takeHomePath starts with M and chains L for each subsequent point', () => {
    const layout = buildTrendChartLayout(data, 300, 200);
    expect(layout!.takeHomePath.startsWith('M ')).toBe(true);
    expect(layout!.takeHomePath.match(/L /g)?.length).toBe(2);
  });

  it('yAxis has 5 evenly spaced labels in descending value order', () => {
    const layout = buildTrendChartLayout(data, 300, 200);
    expect(layout!.yAxis).toHaveLength(5);
    const values = layout!.yAxis.map((p) => p.value);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeLessThan(values[i - 1]!);
    }
  });

  it('xAxis label count = min(5, data length)', () => {
    expect(buildTrendChartLayout(data, 300, 200)!.xAxis).toHaveLength(3);
    const big = Array.from({ length: 20 }, (_, i) => tp(i, i * 10, i * 12));
    expect(buildTrendChartLayout(big, 300, 200)!.xAxis).toHaveLength(5);
  });
});

describe('buildTrendChartLayout — degenerate sizes', () => {
  it('inner width/height clamp to 0 (not negative) for very small canvas', () => {
    const layout = buildTrendChartLayout([tp(1, 100, 150), tp(2, 200, 250)], 10, 10);
    expect(layout!.innerWidth).toBe(0);
    expect(layout!.innerHeight).toBe(0);
  });
});

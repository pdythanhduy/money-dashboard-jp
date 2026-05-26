/**
 * Pure SVG layout for the 6-month trend chart. Decoupled from
 * react-native-svg so all bounds / path-string math is easily unit-tested.
 *
 * Coordinate system: y=0 at top, increasing downwards (SVG default). All
 * returned x/y are absolute pixel coordinates inside the chart canvas.
 *
 * Design choices vs the pre-0.3 layout:
 * - X-axis ALWAYS shows one slot per month (even empty months) so the
 *   chart's calendar position is unambiguous.
 * - `takeHome: null` months break the line: the path emits
 *   `M ... L ...` sub-paths, each rendered separately. Caller renders a
 *   dashed "missing" segment between adjacent gaps for visual continuity.
 * - One canonical line (take-home). Gross moves to the popover.
 * - Horizontal reference line for the average across non-null months,
 *   labelled in the legend below the chart.
 */

import type { MonthlyTrendPoint } from './history-stats';

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_PADDING: ChartPadding = { top: 16, right: 16, bottom: 28, left: 56 };

export interface ChartLayout {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  padding: ChartPadding;
  yMin: number;
  yMax: number;
  /**
   * Sub-paths for the take-home line, one per contiguous run of non-null
   * points. Caller renders each as a separate `<Path>` so empty months
   * naturally break the line.
   */
  takeHomePaths: string[];
  /**
   * Dashed connectors that span across null gaps — drawn beneath the
   * solid sub-paths so the eye can still follow the "where it would be"
   * trajectory.
   */
  takeHomeGapPaths: string[];
  /** Per-data-point dots — `takeHome === null` slots are omitted. */
  dots: ChartDot[];
  /** 5 horizontal grid lines + their ¥ values. */
  yAxis: { y: number; value: number }[];
  /** One label per month slot — empty slots still get a tick + label. */
  xAxis: { x: number; month: number; year: number; yearMonth: string }[];
  /** Y-position of the average-take-home reference line, if computable. */
  averageY: number | null;
  /** Mean take-home across non-null months (¥). `null` when no data. */
  averageTakeHome: number | null;
}

export interface ChartDot {
  /** Slot index in the data array (0..data.length-1). */
  index: number;
  x: number;
  y: number;
  takeHome: number;
  gross: number;
  yearMonth: string;
  month: number;
  year: number;
}

/**
 * Build chart layout. Returns null when there are zero non-null points
 * (caller renders an empty-state placeholder instead).
 */
export function buildTrendChartLayout(
  data: readonly MonthlyTrendPoint[],
  width: number,
  height: number,
  paddingOverride?: Partial<ChartPadding>,
): ChartLayout | null {
  if (data.length === 0) return null;
  const nonNull = data.filter((p): p is MonthlyTrendPoint & { takeHome: number; gross: number } =>
    p.takeHome !== null,
  );
  if (nonNull.length === 0) return null;

  const padding: ChartPadding = { ...DEFAULT_PADDING, ...paddingOverride };
  const innerWidth = Math.max(0, width - padding.left - padding.right);
  const innerHeight = Math.max(0, height - padding.top - padding.bottom);

  // Y bounds: span take-home across non-null months only (gross is no
  // longer rendered as a line; it's a popover detail).
  const values = nonNull.map((d) => d.takeHome);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  let yMin: number;
  let yMax: number;
  if (rawMin === rawMax) {
    const pad = Math.max(1, Math.abs(rawMin) * 0.1);
    yMin = Math.max(0, rawMin - pad);
    yMax = rawMax + pad;
  } else {
    const span = rawMax - rawMin;
    yMin = Math.max(0, rawMin - span * 0.1);
    yMax = rawMax + span * 0.1;
  }
  const yRange = yMax - yMin || 1;

  const xFor = (i: number): number => {
    if (data.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (innerWidth * i) / (data.length - 1);
  };
  const yFor = (value: number): number =>
    padding.top + innerHeight - ((value - yMin) / yRange) * innerHeight;

  // Build sub-paths. Each contiguous run of non-null points becomes one
  // SVG path string. The very-short run length=1 still emits a path so
  // dots have a visual anchor even when isolated.
  const takeHomePaths: string[] = [];
  const takeHomeGapPaths: string[] = [];
  let currentRun: string[] = [];
  let lastNonNullIndex = -1;
  for (let i = 0; i < data.length; i += 1) {
    const p = data[i]!;
    if (p.takeHome === null) {
      if (currentRun.length > 0) {
        takeHomePaths.push(currentRun.join(' '));
        currentRun = [];
      }
      continue;
    }
    const cmd = currentRun.length === 0 ? 'M' : 'L';
    currentRun.push(`${cmd} ${xFor(i).toFixed(2)} ${yFor(p.takeHome).toFixed(2)}`);

    // If we had a previous non-null point and there was a gap of nulls
    // between, emit a dashed connector from prev → current.
    if (lastNonNullIndex !== -1 && i - lastNonNullIndex > 1) {
      const prev = data[lastNonNullIndex]!;
      takeHomeGapPaths.push(
        `M ${xFor(lastNonNullIndex).toFixed(2)} ${yFor(prev.takeHome!).toFixed(2)} ` +
          `L ${xFor(i).toFixed(2)} ${yFor(p.takeHome).toFixed(2)}`,
      );
    }
    lastNonNullIndex = i;
  }
  if (currentRun.length > 0) takeHomePaths.push(currentRun.join(' '));

  const dots: ChartDot[] = [];
  for (let i = 0; i < data.length; i += 1) {
    const p = data[i]!;
    if (p.takeHome === null || p.gross === null) continue;
    dots.push({
      index: i,
      x: xFor(i),
      y: yFor(p.takeHome),
      takeHome: p.takeHome,
      gross: p.gross,
      yearMonth: p.yearMonth,
      month: p.month,
      year: p.year,
    });
  }

  // 5 evenly-spaced y-axis labels.
  const yAxis = Array.from({ length: 5 }, (_, i) => {
    const value = yMax - ((yMax - yMin) * i) / 4;
    return { y: padding.top + (innerHeight * i) / 4, value: Math.round(value) };
  });

  // One x-label per data slot — empty months STILL render a tick so the
  // user sees the full calendar window.
  const xAxis = data.map((p, i) => ({
    x: xFor(i),
    month: p.month,
    year: p.year,
    yearMonth: p.yearMonth,
  }));

  const averageTakeHome = Math.floor(
    values.reduce((s, v) => s + v, 0) / values.length,
  );
  const averageY = averageTakeHome !== null ? yFor(averageTakeHome) : null;

  return {
    width,
    height,
    innerWidth,
    innerHeight,
    padding,
    yMin,
    yMax,
    takeHomePaths,
    takeHomeGapPaths,
    dots,
    yAxis,
    xAxis,
    averageY,
    averageTakeHome,
  };
}

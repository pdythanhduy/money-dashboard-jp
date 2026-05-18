/**
 * Pure SVG layout for the trend chart. Decoupled from react-native-svg so
 * the bounds / path-string math is easily unit-testable.
 *
 * Coordinate system: y=0 at top, increasing downwards (SVG default). All
 * returned x/y are absolute pixel coordinates inside the chart canvas.
 */

import type { TrendPoint } from './history-stats';

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
  /** SVG `<path d>` string for take-home line. Empty when no points. */
  takeHomePath: string;
  /** Same for gross. */
  grossPath: string;
  /** Per-data-point screen coords for dots / hit targets. */
  dots: ChartDot[];
  /** 5 horizontal grid lines + their ¥ values. */
  yAxis: { y: number; value: number }[];
  /** Subset of points to label on x-axis (up to 5 labels). */
  xAxis: { x: number; date: number }[];
}

export interface ChartDot {
  x: number;
  y: number;
  takeHome: number;
  gross: number;
  date: number;
}

/**
 * Build chart layout. Returns null when there is no data to plot — the
 * caller renders an empty-state placeholder instead.
 */
export function buildTrendChartLayout(
  data: readonly TrendPoint[],
  width: number,
  height: number,
  paddingOverride?: Partial<ChartPadding>,
): ChartLayout | null {
  if (data.length === 0) return null;

  const padding: ChartPadding = { ...DEFAULT_PADDING, ...paddingOverride };
  const innerWidth = Math.max(0, width - padding.left - padding.right);
  const innerHeight = Math.max(0, height - padding.top - padding.bottom);

  // Y bounds: span both series, add 10% headroom on top and floor.
  const allValues = data.flatMap((d) => [d.takeHome, d.gross]);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  let yMin: number;
  let yMax: number;
  if (rawMin === rawMax) {
    // Single value (or all-equal): create a visible band ±10% so the line
    // isn't drawn on the top axis.
    const pad = Math.max(1, Math.abs(rawMin) * 0.1);
    yMin = rawMin - pad;
    yMax = rawMax + pad;
  } else {
    const span = rawMax - rawMin;
    yMin = Math.max(0, rawMin - span * 0.1);
    yMax = rawMax + span * 0.1;
  }
  const yRange = yMax - yMin || 1;

  // X positions: evenly spaced. For single-point series, place at center.
  const xFor = (i: number): number => {
    if (data.length === 1) return padding.left + innerWidth / 2;
    return padding.left + (innerWidth * i) / (data.length - 1);
  };
  const yFor = (value: number): number =>
    padding.top + innerHeight - ((value - yMin) / yRange) * innerHeight;

  const takeHomePath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(p.takeHome).toFixed(2)}`)
    .join(' ');
  const grossPath = data
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(p.gross).toFixed(2)}`)
    .join(' ');

  const dots: ChartDot[] = data.map((p, i) => ({
    x: xFor(i),
    y: yFor(p.takeHome),
    takeHome: p.takeHome,
    gross: p.gross,
    date: p.date,
  }));

  // 5 evenly-spaced y-axis labels.
  const yAxis = Array.from({ length: 5 }, (_, i) => {
    const value = yMax - ((yMax - yMin) * i) / 4;
    return { y: padding.top + (innerHeight * i) / 4, value: Math.round(value) };
  });

  // X-axis: show up to 5 labels evenly drawn from the data points.
  const xLabelCount = Math.min(5, data.length);
  const xAxis = Array.from({ length: xLabelCount }, (_, i) => {
    const idx = Math.round(((data.length - 1) * i) / Math.max(1, xLabelCount - 1));
    return { x: xFor(idx), date: data[idx]!.date };
  });

  return {
    width,
    height,
    innerWidth,
    innerHeight,
    padding,
    yMin,
    yMax,
    takeHomePath,
    grossPath,
    dots,
    yAxis,
    xAxis,
  };
}

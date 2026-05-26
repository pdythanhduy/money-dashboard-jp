import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { buildTrendChartLayout } from '@/features/history/trend-chart-layout';
import type { MonthlyTrendPoint } from '@/features/history/history-stats';
import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme';

interface TrendChartProps {
  data: readonly MonthlyTrendPoint[];
  width: number;
  height: number;
}

/**
 * 6-month take-home trend chart.
 *
 * The chart always reserves 6 (or `data.length`) calendar slots so the
 * x-axis maps directly to known months. Missing months show as a dashed
 * connector — the eye still follows the trend, but a solid line never
 * implies income data that wasn't actually entered. A subtle horizontal
 * reference line marks the 6-month average across non-null months.
 */
export function TrendChart({ data, width, height }: TrendChartProps) {
  const { t, i18n } = useTranslation();
  const { colors, typography } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // ALL hooks must run unconditionally on every render — kept here to
  // preserve the PR #58 hooks-order fix when data transitions from empty
  // to populated.
  const layout = useMemo(() => buildTrendChartLayout(data, width, height), [data, width, height]);
  const nonNullCount = useMemo(
    () => data.reduce((n, p) => (p.takeHome !== null ? n + 1 : n), 0),
    [data],
  );
  /** Latest non-null point (callout anchor + delta computation). */
  const latestPoint = useMemo(() => {
    for (let i = data.length - 1; i >= 0; i -= 1) {
      const p = data[i];
      if (p && p.takeHome !== null) return { ...p, index: i };
    }
    return null;
  }, [data]);
  /** Previous non-null point before `latestPoint` — used for delta. */
  const previousPoint = useMemo(() => {
    if (!latestPoint) return null;
    for (let i = latestPoint.index - 1; i >= 0; i -= 1) {
      const p = data[i];
      if (p && p.takeHome !== null) return p;
    }
    return null;
  }, [data, latestPoint]);

  if (nonNullCount < 1) {
    return (
      <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.footnote, { color: colors.textSecondary, textAlign: 'center' }]}>
          {t('history.trend.needsTwoPoints')}
        </Text>
      </View>
    );
  }

  if (!layout) return null;
  const activeDot = activeIndex !== null ? layout.dots.find((d) => d.index === activeIndex) ?? null : null;
  // Default callout = latest point (so the value the user just calculated
  // is visible without requiring a tap).
  const calloutDot = activeDot ?? layout.dots[layout.dots.length - 1] ?? null;
  const delta =
    latestPoint && previousPoint && latestPoint.takeHome !== null && previousPoint.takeHome !== null
      ? latestPoint.takeHome - previousPoint.takeHome
      : null;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Y-axis grid + labels */}
        {layout.yAxis.map(({ y, value }, i) => (
          <Line
            key={`grid-${i}`}
            x1={layout.padding.left}
            x2={width - layout.padding.right}
            y1={y}
            y2={y}
            stroke={colors.border}
            strokeWidth={1}
            strokeDasharray="2 4"
          />
        ))}
        {layout.yAxis.map(({ y, value }, i) => (
          <SvgText
            key={`ylab-${i}`}
            x={layout.padding.left - 6}
            y={y + 3}
            fontSize={10}
            fill={colors.textSecondary}
            textAnchor="end"
          >
            {abbrevYen(value)}
          </SvgText>
        ))}
        {/* Average reference line (subtle, brand color) */}
        {layout.averageY !== null ? (
          <Line
            x1={layout.padding.left}
            x2={width - layout.padding.right}
            y1={layout.averageY}
            y2={layout.averageY}
            stroke={colors.brand}
            strokeWidth={1.25}
            strokeDasharray="4 4"
            opacity={0.55}
          />
        ) : null}
        {/* X-axis month labels — one per slot, EMPTY months still labelled */}
        {layout.xAxis.map((tick, i) => (
          <SvgText
            key={`xlab-${i}`}
            x={tick.x}
            y={height - 8}
            fontSize={10}
            fill={colors.textSecondary}
            textAnchor="middle"
          >
            {monthAbbrev(tick.month, i18n.language)}
          </SvgText>
        ))}
        {/* Gap connectors (dashed, faded) — drawn BEFORE solid line so the
            solid run sits on top when they overlap at the gap edges */}
        {layout.takeHomeGapPaths.map((d, i) => (
          <Path
            key={`gap-${i}`}
            d={d}
            stroke={colors.textSecondary}
            strokeWidth={1.5}
            strokeDasharray="3 4"
            fill="none"
            opacity={0.5}
          />
        ))}
        {/* Solid take-home sub-paths (one per contiguous run) */}
        {layout.takeHomePaths.map((d, i) => (
          <Path
            key={`run-${i}`}
            d={d}
            stroke={colors.accent}
            strokeWidth={2.5}
            fill="none"
          />
        ))}
        {/* Dots — latest gets larger radius for emphasis */}
        {layout.dots.map((d) => {
          const isLatest = latestPoint?.index === d.index;
          return (
            <Circle
              key={`dot-${d.index}`}
              cx={d.x}
              cy={d.y}
              r={d.index === activeIndex || isLatest ? 6 : 4}
              fill={colors.accent}
              stroke={colors.surface}
              strokeWidth={1.5}
              onPress={() => setActiveIndex(d.index === activeIndex ? null : d.index)}
            />
          );
        })}
      </Svg>
      {calloutDot ? (
        <View
          style={{
            position: 'absolute',
            left: Math.min(width - 160, Math.max(8, calloutDot.x - 80)),
            top: Math.max(8, calloutDot.y - 64),
            backgroundColor: colors.surfaceElevated,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: colors.border,
            minWidth: 140,
          }}
        >
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {monthYearLabel(calloutDot.month, calloutDot.year, i18n.language)}
          </Text>
          <Text style={[typography.footnote, { color: colors.text, fontWeight: '700' }]}>
            {formatCurrency(calloutDot.takeHome)}
          </Text>
          {/* Delta only on the latest dot when there's a previous month to compare. */}
          {!activeDot && delta !== null ? (
            <Text
              style={[
                typography.caption,
                {
                  color: delta >= 0 ? colors.success : colors.danger,
                  marginTop: 2,
                  fontWeight: '600',
                },
              ]}
            >
              {delta >= 0 ? '+' : ''}
              {formatCurrency(delta)} {t('history.trend.vsPrevMonth')}
            </Text>
          ) : null}
          {/* Gross is now popover-only detail. */}
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {t('history.trend.grossLabel')}: {formatCurrency(calloutDot.gross)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function abbrevYen(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `¥${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `¥${(value / 1_000).toFixed(0)}k`;
  return `¥${value}`;
}

/** Short month label for x-axis ticks. */
function monthAbbrev(monthOneBased: number, locale: string): string {
  if (locale.startsWith('ja')) return `${monthOneBased}月`;
  return `T${monthOneBased}`;
}

/** Long month+year label for the popover heading. */
function monthYearLabel(monthOneBased: number, year: number, locale: string): string {
  if (locale.startsWith('ja')) return `${year}年${monthOneBased}月`;
  return `T${monthOneBased}/${year}`;
}

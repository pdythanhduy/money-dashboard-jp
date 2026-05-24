import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { buildTrendChartLayout } from '@/features/history/trend-chart-layout';
import type { TrendPoint } from '@/features/history/history-stats';
import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme';

interface TrendChartProps {
  data: readonly TrendPoint[];
  width: number;
  height: number;
}

export function TrendChart({ data, width, height }: TrendChartProps) {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  // ALL hooks must run unconditionally on every render — the previous
  // structure early-returned for data.length < 2 BEFORE calling useMemo,
  // which made React see a different hook count between the "empty" and
  // "has data" paths and threw "Rendered fewer hooks than expected" as
  // soon as a user navigated into a populated History screen. Compute
  // layout unconditionally (returns null for short data, which the early
  // return below catches without touching the hook order).
  const layout = useMemo(
    () => (data.length < 2 ? null : buildTrendChartLayout(data, width, height)),
    [data, width, height],
  );

  if (data.length < 2) {
    return (
      <View
        style={{
          width,
          height,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={[typography.footnote, { color: colors.textSecondary, textAlign: 'center' }]}>
          {t('history.trend.needsTwoPoints')}
        </Text>
      </View>
    );
  }

  if (!layout) return null;
  const activeDot = activeIndex !== null ? layout.dots[activeIndex] : null;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Horizontal grid + Y-axis labels */}
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
        {/* X-axis labels */}
        {layout.xAxis.map(({ x, date }, i) => (
          <SvgText
            key={`xlab-${i}`}
            x={x}
            y={height - 8}
            fontSize={10}
            fill={colors.textSecondary}
            textAnchor="middle"
          >
            {formatMMDD(date)}
          </SvgText>
        ))}
        {/* Gross line (faded) */}
        <Path d={layout.grossPath} stroke={colors.textSecondary} strokeWidth={1.5} fill="none" opacity={0.45} />
        {/* Take-home line (accent) */}
        <Path d={layout.takeHomePath} stroke={colors.accent} strokeWidth={2.5} fill="none" />
        {/* Dots */}
        {layout.dots.map((d, i) => (
          <Circle
            key={`dot-${i}`}
            cx={d.x}
            cy={d.y}
            r={i === activeIndex ? 6 : 4}
            fill={colors.accent}
            stroke={colors.surface}
            strokeWidth={1.5}
            onPress={() => setActiveIndex(i === activeIndex ? null : i)}
          />
        ))}
      </Svg>
      {activeDot ? (
        <View
          style={{
            position: 'absolute',
            left: Math.min(width - 140, Math.max(8, activeDot.x - 70)),
            top: Math.max(8, activeDot.y - 56),
            backgroundColor: colors.surfaceElevated,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {formatFullDate(activeDot.date)}
          </Text>
          <Text style={[typography.footnote, { color: colors.text, fontWeight: '700' }]}>
            {formatCurrency(activeDot.takeHome)}
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

function formatMMDD(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatFullDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear() % 100}`;
}

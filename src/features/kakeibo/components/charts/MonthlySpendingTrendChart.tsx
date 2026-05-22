import { useTranslation } from 'react-i18next';
import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import { formatCurrency } from '@/lib/format';
import type { MonthlySpendingPoint } from '@/lib/kakeibo-charts';
import { useTheme } from '@/theme';

interface Props {
  series: readonly MonthlySpendingPoint[];
}

const HEIGHT = 160;

export function MonthlySpendingTrendChart({ series }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(240, windowWidth - spacing.lg * 2 - spacing.md * 2);
  const max = series.reduce((m, p) => (p.amount > m ? p.amount : m), 0);

  if (max === 0) {
    return (
      <View
        style={{
          height: HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.md,
          backgroundColor: colors.surface,
        }}
      >
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('kakeibo.charts.empty')}
        </Text>
      </View>
    );
  }

  const padding = { top: 28, right: 8, bottom: 24, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = HEIGHT - padding.top - padding.bottom;
  const slot = innerW / series.length;
  const barW = Math.max(8, slot * 0.55);

  const currentIdx = series.length - 1;

  return (
    <View style={{ width, height: HEIGHT }}>
      <Svg width={width} height={HEIGHT}>
        {/* Max label, top-left */}
        <SvgText x={padding.left} y={14} fontSize={10} fill={colors.textSecondary}>
          max {formatCurrency(max)}
        </SvgText>
        {/* Current label, top-right */}
        <SvgText
          x={width - padding.right}
          y={14}
          fontSize={10}
          fill={colors.brand}
          textAnchor="end"
          fontWeight="700"
        >
          {formatCurrency(series[currentIdx]?.amount ?? 0)}
        </SvgText>
        {/* Baseline */}
        <Line
          x1={padding.left}
          x2={width - padding.right}
          y1={HEIGHT - padding.bottom}
          y2={HEIGHT - padding.bottom}
          stroke={colors.border}
          strokeWidth={1}
        />
        {series.map((p, i) => {
          const h = (p.amount / max) * innerH;
          const x = padding.left + i * slot + (slot - barW) / 2;
          const y = HEIGHT - padding.bottom - h;
          const isCurrent = i === currentIdx;
          return (
            <Rect
              key={p.yearMonth}
              x={x}
              y={y}
              width={barW}
              height={Math.max(1, h)}
              rx={3}
              fill={isCurrent ? colors.brand : colors.borderStrong}
              opacity={p.amount > 0 ? 1 : 0.25}
            />
          );
        })}
        {series.map((p, i) => {
          const x = padding.left + i * slot + slot / 2;
          return (
            <SvgText
              key={`xl-${p.yearMonth}`}
              x={x}
              y={HEIGHT - 6}
              fontSize={10}
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              {p.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

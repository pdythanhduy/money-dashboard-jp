import { useTranslation } from 'react-i18next';
import { Text, useWindowDimensions, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';

import type { DailySpendingPoint } from '@/lib/kakeibo-charts';
import { useTheme } from '@/theme';

interface Props {
  series: readonly DailySpendingPoint[];
  selectedDay?: number;
  onSelectDay?: (day: number) => void;
}

const HEIGHT = 140;
const X_AXIS_DAYS = [1, 5, 10, 15, 20, 25, 30];

export function DailySpendingBarChart({ series, selectedDay, onSelectDay }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.max(220, windowWidth - spacing.lg * 2 - spacing.md * 2);
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

  const padding = { top: 12, right: 8, bottom: 22, left: 8 };
  const innerW = width - padding.left - padding.right;
  const innerH = HEIGHT - padding.top - padding.bottom;
  const slot = innerW / series.length;
  const barW = Math.max(2, slot - 2);

  return (
    <View style={{ width, height: HEIGHT }}>
      <Svg width={width} height={HEIGHT}>
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
          const h = Math.max(1, (p.amount / max) * innerH);
          const x = padding.left + i * slot + (slot - barW) / 2;
          const y = HEIGHT - padding.bottom - h;
          const fill = p.isToday
            ? colors.danger
            : selectedDay === p.day
              ? colors.warning
              : colors.brand;
          return (
            <Rect
              key={p.date}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={1.5}
              fill={fill}
              opacity={p.amount > 0 ? 1 : 0.25}
              onPress={() => onSelectDay?.(p.day)}
            />
          );
        })}
        {X_AXIS_DAYS.filter((d) => d <= series.length).map((d) => {
          const i = d - 1;
          const x = padding.left + i * slot + slot / 2;
          return (
            <SvgText
              key={`xl-${d}`}
              x={x}
              y={HEIGHT - 6}
              fontSize={9}
              fill={colors.textSecondary}
              textAnchor="middle"
            >
              {d}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

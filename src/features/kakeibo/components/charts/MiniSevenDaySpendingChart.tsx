import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import type { LastNDaysPoint } from '@/lib/kakeibo-charts';
import { useTheme } from '@/theme';

interface Props {
  series: readonly LastNDaysPoint[];
  width?: number;
  height?: number;
}

export function MiniSevenDaySpendingChart({ series, width = 120, height = 32 }: Props) {
  const { colors } = useTheme();
  const max = series.reduce((m, p) => (p.amount > m ? p.amount : m), 0);
  if (max === 0) return null;

  const slot = width / series.length;
  const barW = Math.max(2, slot - 1);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {series.map((p, i) => {
          const h = Math.max(1, (p.amount / max) * height);
          const x = i * slot + (slot - barW) / 2;
          const y = height - h;
          return (
            <Rect
              key={p.date}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={1}
              fill={p.isToday ? colors.brand : colors.borderStrong}
            />
          );
        })}
      </Svg>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface Props {
  yearMonth: string;
  onChange: (next: string) => void;
  /** Range guard so users can't scrub years into the past/future. */
  minYearMonth?: string;
  maxYearMonth?: string;
}

function ymToParts(ym: string): { year: number; month: number } {
  const [y, m] = ym.split('-').map((x) => Number.parseInt(x, 10));
  return { year: y ?? new Date().getFullYear(), month: m ?? new Date().getMonth() + 1 };
}

function shift(ym: string, delta: number): string {
  const { year, month } = ymToParts(ym);
  const total = year * 12 + (month - 1) + delta;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${String(ny).padStart(4, '0')}-${String(nm).padStart(2, '0')}`;
}

export function MonthSelector({ yearMonth, onChange, minYearMonth, maxYearMonth }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const prev = shift(yearMonth, -1);
  const next = shift(yearMonth, +1);
  const prevDisabled = Boolean(minYearMonth) && prev < (minYearMonth as string);
  const nextDisabled = Boolean(maxYearMonth) && next > (maxYearMonth as string);
  const { year, month } = ymToParts(yearMonth);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.xs,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceElevated,
        gap: spacing.xs,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('kakeibo.month.prev')}
        accessibilityState={{ disabled: prevDisabled }}
        disabled={prevDisabled}
        onPress={() => onChange(prev)}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: prevDisabled ? 0.3 : pressed ? 0.6 : 1,
        })}
      >
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={[typography.headline, { color: colors.text, fontWeight: '700' }]}>
          {t('kakeibo.month.currentLabel', { month, year })}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('kakeibo.month.next')}
        accessibilityState={{ disabled: nextDisabled }}
        disabled={nextDisabled}
        onPress={() => onChange(next)}
        style={({ pressed }) => ({
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: nextDisabled ? 0.3 : pressed ? 0.6 : 1,
        })}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

export { shift as shiftMonth };

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, Easing, Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme';

interface TakeHomeProgressCardProps {
  proportionalTakeHome: number;
  monthlyTakeHome: number;
  averageDaily: number;
  daysInMonth: number;
  daysPassed: number;
}

const COUNT_DURATION_MS = 1500;
const FILL_DURATION_MS = 1000;

export function TakeHomeProgressCard({
  proportionalTakeHome,
  monthlyTakeHome,
  averageDaily,
  daysInMonth,
  daysPassed,
}: TakeHomeProgressCardProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();

  const counter = useRef(new Animated.Value(0)).current;
  const fill = useRef(new Animated.Value(0)).current;
  const [displayedAmount, setDisplayedAmount] = useState(0);
  const [widthPercent, setWidthPercent] = useState(0);

  useEffect(() => {
    const counterListener = counter.addListener(({ value }) => {
      setDisplayedAmount(Math.floor(value));
    });
    const fillListener = fill.addListener(({ value }) => {
      setWidthPercent(value);
    });
    return () => {
      counter.removeListener(counterListener);
      fill.removeListener(fillListener);
    };
  }, [counter, fill]);

  useEffect(() => {
    counter.setValue(0);
    fill.setValue(0);
    const targetRatio = daysInMonth > 0 ? Math.min(1, daysPassed / daysInMonth) : 0;
    Animated.parallel([
      Animated.timing(counter, {
        toValue: proportionalTakeHome,
        duration: COUNT_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(fill, {
        toValue: targetRatio * 100,
        duration: FILL_DURATION_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [counter, fill, proportionalTakeHome, daysPassed, daysInMonth]);

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        ...cardShadow(isDark),
      }}
    >
      <Text style={[typography.headline, { color: colors.text }]}>
        {t('dashboard.takeHomeCard.title')}
      </Text>
      <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: 2 }]}>
        {t('dashboard.takeHomeCard.subtitle')}
      </Text>

      <View
        accessible
        accessibilityRole="text"
        accessibilityLabel={t('dashboard.a11y.takeHomeProgress', {
          earned: formatCurrency(proportionalTakeHome),
          total: formatCurrency(monthlyTakeHome),
          day: daysPassed,
          of: daysInMonth,
        })}
        style={{ alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.md }}
      >
        <Text style={[typography.largeTitle, { color: colors.brand, fontSize: 44, lineHeight: 52 }]}>
          {formatCurrency(displayedAmount)}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            {t('dashboard.takeHomeCard.earned')}
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            · {t('dashboard.takeHomeCard.asOfToday')}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 10,
          backgroundColor: colors.brandSubtle,
          borderRadius: radius.pill,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${widthPercent}%`,
            height: '100%',
            backgroundColor: colors.brand,
            borderRadius: radius.pill,
          }}
        />
        {/* Accent overlay for gradient illusion (navy → yellow at the tip) */}
        <View
          style={{
            position: 'absolute',
            right: `${Math.max(0, 100 - widthPercent)}%`,
            width: 6,
            height: '100%',
            backgroundColor: colors.accent,
          }}
        />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('dashboard.takeHomeCard.dayStart')}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('dashboard.takeHomeCard.dayEnd', { day: daysInMonth })}
        </Text>
      </View>

      <View
        style={{
          marginTop: spacing.md,
          paddingTop: spacing.md,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          gap: 6,
        }}
      >
        <InfoRow
          label={t('dashboard.takeHomeCard.expected')}
          value={formatCurrency(monthlyTakeHome)}
        />
        <InfoRow
          label={t('dashboard.takeHomeCard.averageDaily')}
          value={`${formatCurrency(averageDaily)}${t('dashboard.takeHomeCard.perDay')}`}
        />
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[typography.footnote, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typography.footnote, { color: colors.text, fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}

function cardShadow(isDark: boolean) {
  if (isDark) {
    return {
      shadowColor: '#000',
      shadowOpacity: 0.4,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    };
  }
  return {};
}

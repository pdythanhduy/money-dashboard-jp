import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { buildTripSummary, getTripLifecycleStatus } from '@/lib/trip-budget-math';
import { selectFeaturedTrip } from '@/lib/trip-dashboard';
import { useTripBudgetStore } from '@/store/tripBudgetStore';
import { useTheme } from '@/theme';

interface Props {
  onPress: () => void;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetweenIsoLocal(now: Date, iso: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return 0;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  // Floor both to local midnight by reconstructing.
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = target.getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

export function TripBudgetCard({ onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const trips = useTripBudgetStore((s) => s.trips);

  const featured = useMemo(() => selectFeaturedTrip(trips, new Date()), [trips]);
  if (!featured) return null;

  const lifecycle = getTripLifecycleStatus(featured, new Date());
  const summary = buildTripSummary(featured);

  // Time-context line.
  let timeLine = '';
  if (lifecycle === 'upcoming') {
    const days = daysBetweenIsoLocal(new Date(), featured.startDate);
    timeLine = t('trip.summary.daysUntil', { days });
  } else if (lifecycle === 'active') {
    const days = daysBetweenIsoLocal(new Date(), featured.endDate);
    timeLine = t('trip.summary.daysLeft', { days });
  } else if (lifecycle === 'ended') {
    const daysAgo = -daysBetweenIsoLocal(new Date(), featured.endDate);
    timeLine = daysAgo <= 0 ? t('trip.summary.endedToday') : t('trip.summary.endedDaysAgo', { days: daysAgo });
  }

  const accent =
    lifecycle === 'active'
      ? colors.success
      : lifecycle === 'upcoming'
        ? colors.brand
        : colors.textSecondary;
  const diffColor =
    summary.diffStatus === 'over'
      ? colors.danger
      : summary.diffStatus === 'under'
        ? colors.success
        : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('trip.dashboard.cardTitle')}
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        opacity: pressed ? 0.85 : 1,
        ...(isDark
          ? {
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }
          : {}),
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
        <Ionicons
          name={featured.type === 'business' ? 'briefcase-outline' : featured.type === 'home_visit' ? 'home-outline' : 'airplane-outline'}
          size={18}
          color={colors.brand}
        />
        <Text style={[typography.headline, { color: colors.text, flex: 1 }]} numberOfLines={1}>
          {featured.title}
        </Text>
        <Text style={[typography.caption, { color: accent, fontWeight: '700' }]}>
          {t(`trip.lifecycle.${lifecycle}`)}
        </Text>
      </View>
      <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
        {timeLine}
      </Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('trip.summary.planned')} {formatCurrency(summary.plannedTotal)}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('trip.summary.actual')} {formatCurrency(summary.actualTotal)}
        </Text>
      </View>
      {summary.diff !== 0 ? (
        <Text style={[typography.caption, { color: diffColor, fontWeight: '600', marginTop: 2 }]}>
          {summary.diffStatus === 'over'
            ? t('trip.summary.over', { amount: formatCurrency(summary.diff) })
            : t('trip.summary.under', { amount: formatCurrency(Math.abs(summary.diff)) })}
        </Text>
      ) : null}
    </Pressable>
  );
}

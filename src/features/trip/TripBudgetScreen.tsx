import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TripDetailModal } from '@/features/trip/components/TripDetailModal';
import { TripEditModal } from '@/features/trip/components/TripEditModal';
import { formatCurrency } from '@/lib/format';
import { buildTripSummary, getTripLifecycleStatus } from '@/lib/trip-budget-math';
import { useTripBudgetStore } from '@/store/tripBudgetStore';
import { useTheme } from '@/theme';
import type { TripBudget } from '@/types/trip-budget';

export function TripBudgetScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const trips = useTripBudgetStore((s) => s.trips);

  const [editing, setEditing] = useState<TripBudget | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openAdd = useCallback(() => {
    setEditing(null);
    setEditOpen(true);
  }, []);

  const openDetail = useCallback((trip: TripBudget) => {
    setDetailId(trip.id);
    setDetailOpen(true);
  }, []);

  const handleEditFromDetail = useCallback((trip: TripBudget) => {
    setEditing(trip);
    setDetailOpen(false);
    setEditOpen(true);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xs,
          gap: spacing.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[typography.largeTitle, { color: colors.text }]}>{t('trip.title')}</Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>{t('trip.subtitle')}</Text>
        </View>
      </View>

      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => <TripCard trip={item} onPress={openDetail} />}
        ListEmptyComponent={
          <View
            style={{
              marginHorizontal: spacing.lg,
              marginTop: spacing.lg,
              padding: spacing.lg,
              borderRadius: radius.md,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.border,
              backgroundColor: colors.surface,
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            <Ionicons name="airplane-outline" size={36} color={colors.textSecondary} />
            <Text style={[typography.body, { color: colors.text, textAlign: 'center', fontWeight: '600' }]}>
              {t('trip.empty.title')}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('trip.empty.body')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('trip.empty.cta')}
              onPress={openAdd}
              style={({ pressed }) => ({
                marginTop: spacing.sm,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.sm,
                backgroundColor: colors.brand,
                borderRadius: radius.pill,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: colors.textInverse, fontWeight: '600' }]}>
                {t('trip.empty.cta')}
              </Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ paddingTop: spacing.sm, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('trip.add')}
        onPress={openAdd}
        style={({ pressed }) => ({
          position: 'absolute',
          right: spacing.lg,
          bottom: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        })}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      <TripEditModal visible={editOpen} editing={editing} onClose={() => setEditOpen(false)} />
      <TripDetailModal
        visible={detailOpen}
        tripId={detailId}
        onClose={() => setDetailOpen(false)}
        onEditTrip={handleEditFromDetail}
      />
    </SafeAreaView>
  );
}

function TripCard({ trip, onPress }: { trip: TripBudget; onPress: (t: TripBudget) => void }) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const summary = buildTripSummary(trip);
  const lifecycle = getTripLifecycleStatus(trip, new Date());
  const diffColor =
    summary.diffStatus === 'over'
      ? colors.danger
      : summary.diffStatus === 'under'
        ? colors.success
        : colors.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={trip.title}
      onPress={() => onPress(trip)}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
        gap: spacing.xs,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons
          name={trip.type === 'business' ? 'briefcase-outline' : trip.type === 'home_visit' ? 'home-outline' : 'airplane-outline'}
          size={18}
          color={colors.brand}
        />
        <View style={{ flex: 1 }}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]} numberOfLines={1}>
            {trip.title}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {trip.destination ? `${trip.destination} · ` : ''}
            {trip.startDate} → {trip.endDate}
          </Text>
        </View>
        <View
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radius.pill,
            backgroundColor:
              lifecycle === 'active'
                ? colors.success
                : lifecycle === 'upcoming'
                  ? colors.brand
                  : lifecycle === 'cancelled'
                    ? colors.danger
                    : colors.border,
          }}
        >
          <Text
            style={[
              typography.caption,
              {
                color: lifecycle === 'ended' ? colors.textSecondary : colors.textInverse,
                fontWeight: '700',
              },
            ]}
          >
            {t(`trip.lifecycle.${lifecycle}`)}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs }}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('trip.summary.planned')} {formatCurrency(summary.plannedTotal)}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('trip.summary.actual')} {formatCurrency(summary.actualTotal)}
        </Text>
      </View>
      {summary.plannedTotal > 0 ? (
        <View style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' }}>
          <View
            style={{
              width: `${Math.min(100, summary.progressPercent)}%`,
              height: '100%',
              backgroundColor: summary.progressPercent > 100 ? colors.danger : colors.brand,
            }}
          />
        </View>
      ) : null}
      {summary.diff !== 0 ? (
        <Text style={[typography.caption, { color: diffColor, fontWeight: '600' }]}>
          {summary.diffStatus === 'over'
            ? t('trip.summary.over', { amount: formatCurrency(summary.diff) })
            : t('trip.summary.under', { amount: formatCurrency(Math.abs(summary.diff)) })}
        </Text>
      ) : null}
    </Pressable>
  );
}

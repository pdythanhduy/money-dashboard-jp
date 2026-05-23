import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TRIP_CATEGORY_ICONS } from '@/features/trip/category-icons';
import { TripItemModal } from '@/features/trip/components/TripItemModal';
import { formatCurrency } from '@/lib/format';
import {
  buildTripCategoryComparison,
  buildTripInsights,
  buildTripSummary,
} from '@/lib/trip-budget-math';
import { useTripBudgetStore } from '@/store/tripBudgetStore';
import { useTheme } from '@/theme';
import type {
  TripActualExpense,
  TripBudget,
  TripPlanItem,
} from '@/types/trip-budget';

interface Props {
  visible: boolean;
  tripId: string | null;
  onClose: () => void;
  onEditTrip: (t: TripBudget) => void;
}

export function TripDetailModal({ visible, tripId, onClose, onEditTrip }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const trip = useTripBudgetStore((s) =>
    tripId ? s.trips.find((x) => x.id === tripId) ?? null : null,
  );

  const [itemMode, setItemMode] = useState<'plan' | 'actual'>('plan');
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TripPlanItem | null>(null);
  const [editingActual, setEditingActual] = useState<TripActualExpense | null>(null);

  const summary = useMemo(() => (trip ? buildTripSummary(trip) : null), [trip]);
  const comparison = useMemo(() => (trip ? buildTripCategoryComparison(trip) : []), [trip]);
  const insights = useMemo(() => (trip ? buildTripInsights(trip) : []), [trip]);

  if (!trip || !summary) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} />
    );
  }

  const openAddPlan = () => {
    setItemMode('plan');
    setEditingPlan(null);
    setEditingActual(null);
    setItemModalOpen(true);
  };
  const openEditPlan = (p: TripPlanItem) => {
    setItemMode('plan');
    setEditingPlan(p);
    setEditingActual(null);
    setItemModalOpen(true);
  };
  const openAddActual = () => {
    setItemMode('actual');
    setEditingPlan(null);
    setEditingActual(null);
    setItemModalOpen(true);
  };
  const openEditActual = (a: TripActualExpense) => {
    setItemMode('actual');
    setEditingPlan(null);
    setEditingActual(a);
    setItemModalOpen(true);
  };

  const diffColor =
    summary.diffStatus === 'over'
      ? colors.danger
      : summary.diffStatus === 'under'
        ? colors.success
        : colors.textSecondary;
  const diffLine =
    summary.diffStatus === 'over'
      ? t('trip.summary.over', { amount: formatCurrency(summary.diff) })
      : summary.diffStatus === 'under'
        ? t('trip.summary.under', { amount: formatCurrency(Math.abs(summary.diff)) })
        : t('trip.summary.even');

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
          }}
        >
          <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={onClose} hitSlop={8}>
            <Ionicons name="chevron-down" size={26} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('trip.edit')}
            onPress={() => onEditTrip(trip)}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg }}>
          <View>
            <Text style={[typography.largeTitle, { color: colors.text, fontWeight: '800' }]} numberOfLines={2}>
              {trip.title}
            </Text>
            {trip.destination ? (
              <Text style={[typography.callout, { color: colors.textSecondary, marginTop: 2 }]}>
                {trip.destination}
              </Text>
            ) : null}
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
              {trip.startDate} → {trip.endDate} · {t(`trip.type.${trip.type}`)} · {t(`trip.status.${trip.status}`)}
            </Text>
          </View>

          {/* Hero summary */}
          <View
            style={{
              padding: spacing.lg,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceElevated,
              gap: spacing.xs,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('trip.summary.planned')}</Text>
              <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
                {formatCurrency(summary.plannedTotal)}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>{t('trip.summary.actual')}</Text>
              <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
                {formatCurrency(summary.actualTotal)}
              </Text>
            </View>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.xs }} />
            <Text style={[typography.title3, { color: diffColor, fontWeight: '800', textAlign: 'center' }]}>
              {diffLine}
            </Text>
            {summary.plannedTotal > 0 ? (
              <>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden', marginTop: spacing.xs }}>
                  <View
                    style={{
                      width: `${Math.min(100, summary.progressPercent)}%`,
                      height: '100%',
                      backgroundColor: summary.progressPercent > 100 ? colors.danger : colors.brand,
                    }}
                  />
                </View>
                <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginTop: 2 }]}>
                  {t('trip.summary.progress', { percent: summary.progressPercent })}
                </Text>
              </>
            ) : null}
          </View>

          {/* Settlement (business only) */}
          {summary.settlementStatus !== 'none' ? (
            <View
              style={{
                padding: spacing.md,
                borderRadius: radius.md,
                borderLeftWidth: 4,
                borderLeftColor: colors.brand,
                backgroundColor: colors.surfaceElevated,
                gap: spacing.xs,
              }}
            >
              <Text style={[typography.headline, { color: colors.text }]}>{t('trip.section.settlement')}</Text>
              <KV label={t('trip.settlement.advanceLabel')} value={formatCurrency(summary.companyAdvanceAmount)} />
              <KV label={t('trip.settlement.reimbursableLabel')} value={formatCurrency(summary.reimbursableTotal)} />
              <Text
                style={[
                  typography.callout,
                  {
                    color:
                      summary.settlementStatus === 'company_owes_user'
                        ? colors.success
                        : summary.settlementStatus === 'user_owes_company'
                          ? colors.warning
                          : colors.textSecondary,
                    fontWeight: '700',
                    marginTop: spacing.xs,
                  },
                ]}
              >
                {summary.settlementStatus === 'company_owes_user'
                  ? t('trip.settlement.companyOwesUser', { amount: formatCurrency(Math.abs(summary.settlementAmount)) })
                  : summary.settlementStatus === 'user_owes_company'
                    ? t('trip.settlement.userOwesCompany', { amount: formatCurrency(summary.settlementAmount) })
                    : t('trip.settlement.even')}
              </Text>
            </View>
          ) : null}

          {/* Plan section */}
          <SectionHeader
            title={t('trip.section.plan')}
            actionLabel={`+ ${t('trip.action.addPlan')}`}
            onAction={openAddPlan}
          />
          {trip.plannedItems.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>—</Text>
          ) : (
            trip.plannedItems.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityLabel={`${t(`trip.category.${p.category}`)} ${formatCurrency(p.plannedAmount)}`}
                onPress={() => openEditPlan(p)}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.sm,
                  padding: spacing.sm,
                  borderRadius: radius.sm,
                  backgroundColor: colors.surfaceElevated,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Ionicons name={TRIP_CATEGORY_ICONS[p.category]} size={16} color={colors.brand} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
                    {p.label ?? t(`trip.category.${p.category}`)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {t(`trip.category.${p.category}`)}
                  </Text>
                </View>
                <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
                  {formatCurrency(p.plannedAmount)}
                </Text>
              </Pressable>
            ))
          )}

          {/* Actual section */}
          <SectionHeader
            title={t('trip.section.actual')}
            actionLabel={`+ ${t('trip.action.addActual')}`}
            onAction={openAddActual}
          />
          {trip.actualExpenses.length === 0 ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>—</Text>
          ) : (
            [...trip.actualExpenses]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((a) => (
                <Pressable
                  key={a.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.date} ${formatCurrency(a.amount)}`}
                  onPress={() => openEditActual(a)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: spacing.sm,
                    padding: spacing.sm,
                    borderRadius: radius.sm,
                    backgroundColor: colors.surfaceElevated,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Ionicons name={TRIP_CATEGORY_ICONS[a.category]} size={16} color={colors.brand} />
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
                      {a.label ?? t(`trip.category.${a.category}`)}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                      {a.date} · {t(`trip.category.${a.category}`)}
                      {a.reimbursable ? ' · ¥↩' : ''}
                    </Text>
                  </View>
                  <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
                    {formatCurrency(a.amount)}
                  </Text>
                </Pressable>
              ))
          )}

          {/* Comparison */}
          {comparison.length > 0 ? (
            <View
              style={{
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceElevated,
                gap: spacing.xs,
              }}
            >
              <Text style={[typography.headline, { color: colors.text }]}>{t('trip.section.compare')}</Text>
              {comparison.map((c) => {
                const color =
                  c.diffStatus === 'over' ? colors.danger : c.diffStatus === 'under' ? colors.success : colors.textSecondary;
                return (
                  <View key={c.category} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: 2 }}>
                    <Ionicons name={TRIP_CATEGORY_ICONS[c.category]} size={14} color={colors.brand} />
                    <Text style={[typography.caption, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                      {t(`trip.category.${c.category}`)}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {formatCurrency(c.actual)} / {formatCurrency(c.planned)}
                    </Text>
                    <Text style={[typography.caption, { color, fontWeight: '700', width: 72, textAlign: 'right' }]}>
                      {c.diff > 0 ? '+' : c.diff < 0 ? '−' : ''}
                      {formatCurrency(Math.abs(c.diff))}
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : null}

          {/* Insights */}
          {insights.length > 0 ? (
            <View
              style={{
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceElevated,
                gap: spacing.sm,
              }}
            >
              <Text style={[typography.headline, { color: colors.text }]}>{t('trip.section.insights')}</Text>
              {insights.map((ins, idx) => {
                const color =
                  ins.severity === 'danger'
                    ? colors.danger
                    : ins.severity === 'warning'
                      ? colors.warning
                      : ins.severity === 'success'
                        ? colors.success
                        : colors.brand;
                const interpolated: Record<string, string | number> = {};
                for (const [k, v] of Object.entries(ins.values)) {
                  if (k === 'category' && typeof v === 'string') interpolated[k] = t(v);
                  else if (typeof v === 'number') interpolated[k] = formatCurrency(v);
                  else interpolated[k] = v;
                }
                return (
                  <View key={`${ins.type}-${idx}`} style={{ flexDirection: 'row', gap: spacing.sm }}>
                    <Ionicons
                      name={
                        ins.severity === 'danger'
                          ? 'alert-circle-outline'
                          : ins.severity === 'warning'
                            ? 'warning-outline'
                            : ins.severity === 'success'
                              ? 'checkmark-circle-outline'
                              : 'information-circle-outline'
                      }
                      size={18}
                      color={color}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.callout, { color: colors.text, fontWeight: '700' }]}>
                        {t(ins.titleKey)}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                        {t(ins.bodyKey, interpolated)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </ScrollView>

        <TripItemModal
          visible={itemModalOpen}
          mode={itemMode}
          trip={trip}
          editingPlan={editingPlan}
          editingActual={editingActual}
          onClose={() => setItemModalOpen(false)}
        />
      </SafeAreaView>
    </Modal>
  );
}

function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm }}>
      <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        hitSlop={6}
        style={({ pressed }) => ({
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: colors.brand,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={[typography.caption, { color: colors.brand, fontWeight: '600' }]}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  const { colors, typography } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}

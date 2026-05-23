import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetComparisonSection } from '@/features/kakeibo/components/BudgetComparisonSection';
import { BudgetEditScreen } from '@/features/kakeibo/components/BudgetEditScreen';
import { CategoryBreakdownBar } from '@/features/kakeibo/components/CategoryBreakdownBar';
import { CategoryFilter, type CategoryFilterValue } from '@/features/kakeibo/components/CategoryFilter';
import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import { EmptyState } from '@/features/kakeibo/components/EmptyState';
import { EntryCard } from '@/features/kakeibo/components/EntryCard';
import { EntryEditModal } from '@/features/kakeibo/components/EntryEditModal';
import { MonthComparisonCard } from '@/features/kakeibo/components/MonthComparisonCard';
import { CategorySpendingChart } from '@/features/kakeibo/components/charts/CategorySpendingChart';
import { DailySpendingBarChart } from '@/features/kakeibo/components/charts/DailySpendingBarChart';
import { MonthlySpendingTrendChart } from '@/features/kakeibo/components/charts/MonthlySpendingTrendChart';
import { SpendingInsightCard } from '@/features/kakeibo/components/charts/SpendingInsightCard';
import { MonthSelector, shiftMonth } from '@/features/kakeibo/components/MonthSelector';
import { RecurringEditModal } from '@/features/kakeibo/components/RecurringEditModal';
import { SummaryCard } from '@/features/kakeibo/components/SummaryCard';
import { useRecurringSync } from '@/features/kakeibo/hooks/useRecurringSync';
import { formatCurrency } from '@/lib/format';
import {
  buildCategorySpendingSeries,
  buildDailySpendingSeries,
  buildMonthlySpendingSeries,
  buildSpendingInsights,
} from '@/lib/kakeibo-charts';
import {
  buildMonthlyReport,
  filterEntriesByMonth,
  type KakeiboEntry,
} from '@/lib/kakeibo-math';
import { computeLivingCost } from '@/lib/living-cost-math';
import { findDueRecurrings, isoFromDayOfMonth } from '@/lib/recurring-expenses';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useTheme } from '@/theme';
import type { RecurringExpense } from '@/types/recurring-expense';

type KakeiboTab = 'overview' | 'charts' | 'list';

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function KakeiboScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const entries = useKakeiboStore((s) => s.entries);
  const budgets = useKakeiboStore((s) => s.budgets);
  const recurrings = useKakeiboStore((s) => s.recurrings);
  const toggleRecurringActive = useKakeiboStore((s) => s.toggleRecurringActive);
  const addEntry = useKakeiboStore((s) => s.addEntry);
  const markRecurringGenerated = useKakeiboStore((s) => s.markRecurringGenerated);
  const takeHomeMonthly = useCalculatorStore((s) => s.lastResult?.takeHomeMonthly);

  // IDs of recurrings that are due THIS month but haven't auto-posted
  // (autoPost=false). They render with a "Thêm vào tháng này" button.
  const pendingRecurringIds = useMemo(() => {
    const due = findDueRecurrings(recurrings, new Date());
    return new Set(due.filter((r) => !r.autoPost).map((r) => r.id));
  }, [recurrings]);

  const handlePostRecurring = useCallback(
    (r: RecurringExpense) => {
      const now = new Date();
      const iso = isoFromDayOfMonth(now.getFullYear(), now.getMonth() + 1, r.dayOfMonth);
      addEntry({
        date: iso,
        amount: r.amount,
        category: r.category,
        label: r.name,
        isRecurring: true,
        ...(r.note ? { note: r.note } : {}),
      });
      markRecurringGenerated(r.id, `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    },
    [addEntry, markRecurringGenerated],
  );

  // Materialize due recurrings into entries on mount / date change.
  useRecurringSync();

  const [tab, setTab] = useState<KakeiboTab>('overview');
  const [yearMonth, setYearMonth] = useState<string>(currentYearMonth);
  const [filter, setFilter] = useState<CategoryFilterValue>('all');
  const [editing, setEditing] = useState<KakeiboEntry | null>(null);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);

  const report = useMemo(
    () => buildMonthlyReport(entries, yearMonth, takeHomeMonthly && takeHomeMonthly > 0 ? takeHomeMonthly : undefined),
    [entries, yearMonth, takeHomeMonthly],
  );

  const prevReport = useMemo(
    () => buildMonthlyReport(entries, shiftMonth(yearMonth, -1)),
    [entries, yearMonth],
  );

  const filteredEntries = useMemo(() => {
    const inMonth = filterEntriesByMonth(entries, yearMonth);
    if (filter === 'all') return inMonth;
    return inMonth.filter((e) => e.category === filter);
  }, [entries, yearMonth, filter]);

  // Charts-tab data (only built when needed).
  const dailySeries = useMemo(
    () => (tab === 'charts' ? buildDailySpendingSeries(entries, yearMonth, new Date()) : []),
    [tab, entries, yearMonth],
  );
  const monthlySeries = useMemo(
    () => (tab === 'charts' ? buildMonthlySpendingSeries(entries, 6, new Date()) : []),
    [tab, entries],
  );
  const categorySeries = useMemo(
    () => (tab === 'charts' ? buildCategorySpendingSeries(entries, yearMonth) : []),
    [tab, entries, yearMonth],
  );
  const insights = useMemo(() => {
    if (tab !== 'charts') return [];
    const dailyAllowance =
      takeHomeMonthly && takeHomeMonthly > 0
        ? computeLivingCost({
            takeHomeMonthly,
            entries,
            recurrings,
            now: new Date(),
          }).dailyAllowance
        : undefined;
    return buildSpendingInsights({
      entries,
      yearMonth,
      ...(takeHomeMonthly && takeHomeMonthly > 0 ? { takeHomeMonthly } : {}),
      ...(dailyAllowance !== undefined ? { dailyAllowance } : {}),
      now: new Date(),
    });
  }, [tab, entries, yearMonth, takeHomeMonthly, recurrings]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setEntryModalOpen(true);
  }, []);

  const openEdit = useCallback((e: KakeiboEntry) => {
    setEditing(e);
    setEntryModalOpen(true);
  }, []);

  const closeEntryModal = useCallback(() => setEntryModalOpen(false), []);

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
          <Text style={[typography.largeTitle, { color: colors.text }]}>{t('kakeibo.title')}</Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>{t('kakeibo.subtitle')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('kakeibo.budget.title')}
          onPress={() => setBudgetOpen(true)}
          hitSlop={8}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={tab === 'charts' ? [] : filteredEntries}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EntryCard entry={item} onPress={openEdit} />}
        ListHeaderComponent={
          <>
            <TabBar tab={tab} onChange={setTab} />
            <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />
            {tab === 'charts' ? (
              <View style={{ marginHorizontal: spacing.lg, marginTop: spacing.md, gap: spacing.md }}>
                <View>
                  <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.xs }]}>
                    {t('kakeibo.charts.daily.title')}
                  </Text>
                  <DailySpendingBarChart series={dailySeries} />
                </View>
                <View>
                  <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.xs }]}>
                    {t('kakeibo.charts.monthly.title')}
                  </Text>
                  <MonthlySpendingTrendChart series={monthlySeries} />
                </View>
                <View>
                  <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.xs }]}>
                    {t('kakeibo.charts.category.title')}
                  </Text>
                  <CategorySpendingChart series={categorySeries} />
                </View>
                <SpendingInsightCard insights={insights} />
              </View>
            ) : null}
            {tab === 'overview' ? (
              <>
            <SummaryCard
              totalSpent={report.totalSpent}
              entryCount={report.entryCount}
              {...(report.totalIncome !== undefined ? { totalIncome: report.totalIncome } : {})}
              {...(report.surplus !== undefined ? { surplus: report.surplus } : {})}
            />
            {report.byCategory.length > 0 ? <CategoryBreakdownBar byCategory={report.byCategory} /> : null}
            <BudgetComparisonSection entries={entries} budgets={budgets} yearMonth={yearMonth} />
            {prevReport.totalSpent > 0 || report.totalSpent > 0 ? (
              <MonthComparisonCard prev={prevReport} current={report} />
            ) : null}
            <View
              style={{
                marginTop: spacing.md,
                paddingHorizontal: spacing.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.sm,
              }}
            >
              <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
                {t('kakeibo.recurring.title')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('kakeibo.recurring.addButton')}
                onPress={() => {
                  setEditingRecurring(null);
                  setRecurringModalOpen(true);
                }}
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
                <Text style={[typography.caption, { color: colors.brand, fontWeight: '600' }]}>
                  + {t('kakeibo.recurring.addButton')}
                </Text>
              </Pressable>
            </View>
            {recurrings.length === 0 ? (
              <Text
                style={[
                  typography.caption,
                  {
                    color: colors.textSecondary,
                    paddingHorizontal: spacing.lg,
                    paddingTop: spacing.xs,
                  },
                ]}
              >
                {t('kakeibo.recurring.emptyState')}
              </Text>
            ) : (
              <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs, gap: spacing.xs }}>
                {recurrings.map((r) => {
                  const isPending = pendingRecurringIds.has(r.id);
                  return (
                  <View
                    key={r.id}
                    style={{
                      borderRadius: radius.sm,
                      backgroundColor: colors.surfaceElevated,
                      borderLeftWidth: isPending ? 3 : 0,
                      borderLeftColor: isPending ? colors.warning : 'transparent',
                      opacity: r.active ? 1 : 0.55,
                    }}
                  >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${r.name} ¥${r.amount}`}
                    onPress={() => {
                      setEditingRecurring(r);
                      setRecurringModalOpen(true);
                    }}
                    style={({ pressed }) => ({
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: spacing.sm,
                      padding: spacing.sm,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Ionicons
                      name={CATEGORY_ICONS[r.category]}
                      size={16}
                      color={r.active ? colors.brand : colors.textSecondary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
                        {r.name}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
                        {t('kakeibo.recurring.dayLabel', { day: r.dayOfMonth })} ·{' '}
                        {formatCurrency(r.amount)}
                      </Text>
                      {isPending ? (
                        <Text style={[typography.caption, { color: colors.warning, fontWeight: '600', marginTop: 2 }]}>
                          {t('kakeibo.recurring.pendingThisMonth')}
                        </Text>
                      ) : null}
                    </View>
                    <Pressable
                      accessibilityRole="switch"
                      accessibilityLabel={t('kakeibo.recurring.activeLabel')}
                      accessibilityState={{ checked: r.active }}
                      onPress={() => toggleRecurringActive(r.id)}
                      hitSlop={8}
                      style={({ pressed }) => ({
                        paddingHorizontal: spacing.sm,
                        paddingVertical: 2,
                        borderRadius: radius.pill,
                        backgroundColor: r.active ? colors.brand : colors.border,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text
                        style={[
                          typography.caption,
                          { color: r.active ? colors.textInverse : colors.textSecondary, fontWeight: '600' },
                        ]}
                      >
                        {r.active ? 'ON' : 'OFF'}
                      </Text>
                    </Pressable>
                  </Pressable>
                  {isPending ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t('kakeibo.recurring.addThisMonth')}
                      onPress={() => handlePostRecurring(r)}
                      style={({ pressed }) => ({
                        alignSelf: 'flex-start',
                        marginLeft: spacing.sm + 16 + spacing.sm,
                        marginBottom: spacing.sm,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.xs,
                        borderRadius: radius.pill,
                        backgroundColor: colors.warning,
                        opacity: pressed ? 0.85 : 1,
                      })}
                    >
                      <Text style={[typography.caption, { color: colors.textInverse, fontWeight: '700' }]}>
                        + {t('kakeibo.recurring.addThisMonth')}
                      </Text>
                    </Pressable>
                  ) : null}
                  </View>
                  );
                })}
              </View>
            )}
              </>
            ) : null}

            {tab !== 'charts' ? (
              <>
                <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.lg }}>
                  <Text style={[typography.headline, { color: colors.text }]}>{t('kakeibo.entries.title')}</Text>
                </View>
                {/* Category filter chips are only meaningful when the entry list is
                    the primary view (List tab). Hide on Overview to reduce noise. */}
                {tab === 'list' ? <CategoryFilter value={filter} onChange={setFilter} /> : null}
                {filteredEntries.length === 0 && entries.length > 0 ? (
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, textAlign: 'center', paddingVertical: spacing.md },
                    ]}
                  >
                    {t('kakeibo.entries.empty')}
                  </Text>
                ) : null}
              </>
            ) : null}
          </>
        }
        ListEmptyComponent={tab !== 'charts' && entries.length === 0 ? <EmptyState onPressCta={openAdd} /> : null}
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('kakeibo.add.title')}
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

      <EntryEditModal
        visible={entryModalOpen}
        editing={editing}
        {...(filter !== 'all' && !editing ? { defaultCategory: filter } : {})}
        onClose={closeEntryModal}
      />
      <BudgetEditScreen visible={budgetOpen} onClose={() => setBudgetOpen(false)} />
      <RecurringEditModal
        visible={recurringModalOpen}
        editing={editingRecurring}
        onClose={() => setRecurringModalOpen(false)}
      />
    </SafeAreaView>
  );
}

function TabBar({ tab, onChange }: { tab: KakeiboTab; onChange: (next: KakeiboTab) => void }) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const tabs: Array<{ id: KakeiboTab; label: string }> = [
    { id: 'overview', label: t('kakeibo.charts.tabs.overview') },
    { id: 'charts', label: t('kakeibo.charts.tabs.charts') },
    { id: 'list', label: t('kakeibo.charts.tabs.list') },
  ];
  return (
    <View
      style={{
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginTop: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        padding: 4,
        gap: 4,
      }}
    >
      {tabs.map((tb) => {
        const selected = tab === tb.id;
        return (
          <Pressable
            key={tb.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={tb.label}
            onPress={() => onChange(tb.id)}
            style={({ pressed }) => ({
              flex: 1,
              paddingVertical: 8,
              borderRadius: radius.pill,
              backgroundColor: selected ? colors.brand : 'transparent',
              alignItems: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={[
                typography.caption,
                { color: selected ? colors.textInverse : colors.text, fontWeight: '600' },
              ]}
            >
              {tb.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

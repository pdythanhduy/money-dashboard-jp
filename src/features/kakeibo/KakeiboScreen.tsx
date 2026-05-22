import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BudgetEditScreen } from '@/features/kakeibo/components/BudgetEditScreen';
import { CategoryBreakdownBar } from '@/features/kakeibo/components/CategoryBreakdownBar';
import { CategoryFilter, type CategoryFilterValue } from '@/features/kakeibo/components/CategoryFilter';
import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import { EmptyState } from '@/features/kakeibo/components/EmptyState';
import { EntryCard } from '@/features/kakeibo/components/EntryCard';
import { EntryEditModal } from '@/features/kakeibo/components/EntryEditModal';
import { MonthComparisonCard } from '@/features/kakeibo/components/MonthComparisonCard';
import { MonthSelector, shiftMonth } from '@/features/kakeibo/components/MonthSelector';
import { RecurringEditModal } from '@/features/kakeibo/components/RecurringEditModal';
import { SummaryCard } from '@/features/kakeibo/components/SummaryCard';
import { useRecurringSync } from '@/features/kakeibo/hooks/useRecurringSync';
import { formatCurrency } from '@/lib/format';
import {
  buildMonthlyReport,
  computeAllBudgetStatuses,
  filterEntriesByMonth,
  type KakeiboEntry,
} from '@/lib/kakeibo-math';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useTheme } from '@/theme';
import type { RecurringExpense } from '@/types/recurring-expense';

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
  const takeHomeMonthly = useCalculatorStore((s) => s.lastResult?.takeHomeMonthly);

  // Materialize due recurrings into entries on mount / date change.
  useRecurringSync();

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

  const budgetStatuses = useMemo(
    () => computeAllBudgetStatuses(entries, yearMonth, budgets),
    [entries, yearMonth, budgets],
  );
  const budgetWarnings = budgetStatuses.filter((s) => s.severity !== 'safe');

  const filteredEntries = useMemo(() => {
    const inMonth = filterEntriesByMonth(entries, yearMonth);
    if (filter === 'all') return inMonth;
    return inMonth.filter((e) => e.category === filter);
  }, [entries, yearMonth, filter]);

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
        data={filteredEntries}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <EntryCard entry={item} onPress={openEdit} />}
        ListHeaderComponent={
          <>
            <MonthSelector yearMonth={yearMonth} onChange={setYearMonth} />
            <SummaryCard
              totalSpent={report.totalSpent}
              entryCount={report.entryCount}
              {...(report.totalIncome !== undefined ? { totalIncome: report.totalIncome } : {})}
              {...(report.surplus !== undefined ? { surplus: report.surplus } : {})}
            />
            {report.byCategory.length > 0 ? <CategoryBreakdownBar byCategory={report.byCategory} /> : null}
            {budgetWarnings.length > 0 ? (
              <View
                style={{
                  marginHorizontal: spacing.lg,
                  marginTop: spacing.md,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.warning,
                  backgroundColor: colors.surfaceElevated,
                  gap: spacing.xs,
                }}
              >
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t('kakeibo.budget.warningsTitle')}
                </Text>
                {budgetWarnings.map((s) => (
                  <View key={s.category} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                    <Ionicons
                      name={CATEGORY_ICONS[s.category]}
                      size={16}
                      color={s.severity === 'over' ? colors.danger : colors.warning}
                    />
                    <Text style={[typography.callout, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                      {t(`kakeibo.categories.${s.category}`)}
                    </Text>
                    <Text
                      style={[
                        typography.caption,
                        { color: s.severity === 'over' ? colors.danger : colors.warning, fontWeight: '600' },
                      ]}
                    >
                      {t('kakeibo.budget.spentOfLimit', {
                        spent: formatCurrency(s.spent),
                        limit: formatCurrency(s.limit),
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
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
                {recurrings.map((r) => (
                  <Pressable
                    key={r.id}
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
                      borderRadius: radius.sm,
                      backgroundColor: colors.surfaceElevated,
                      opacity: pressed ? 0.85 : r.active ? 1 : 0.55,
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
                ))}
              </View>
            )}

            <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.lg }}>
              <Text style={[typography.headline, { color: colors.text }]}>{t('kakeibo.entries.title')}</Text>
            </View>
            <CategoryFilter value={filter} onChange={setFilter} />
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
        }
        ListEmptyComponent={entries.length === 0 ? <EmptyState onPressCta={openAdd} /> : null}
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

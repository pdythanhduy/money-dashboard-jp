import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  CategoryFilter,
  type CategoryFilterValue,
} from '@/features/medical/components/CategoryFilter';
import { EmptyState } from '@/features/medical/components/EmptyState';
import { ExpenseCard } from '@/features/medical/components/ExpenseCard';
import { ExpenseEditModal } from '@/features/medical/components/ExpenseEditModal';
import { SummaryCard } from '@/features/medical/components/SummaryCard';
import { useMedicalSummary } from '@/features/medical/hooks/useMedicalSummary';
import { useMedicalExpensesStore } from '@/store/medicalExpensesStore';
import { useTheme } from '@/theme';
import type { MedicalExpense } from '@/lib/medical-deduction';

export function MedicalScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation();
  const expenses = useMedicalExpensesStore((s) => s.expenses);
  const summary = useMedicalSummary();

  const [editing, setEditing] = useState<MedicalExpense | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<CategoryFilterValue>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return expenses;
    return expenses.filter((e) => e.category === filter);
  }, [expenses, filter]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((e: MedicalExpense) => {
    setEditing(e);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  if (expenses.length === 0) {
    return (
      <>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <SafeAreaView edges={['top']}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: spacing.lg,
                paddingTop: spacing.sm,
                paddingBottom: spacing.sm,
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
              <Text style={[typography.title3, { color: colors.text }]}>{t('medical.title')}</Text>
            </View>
          </SafeAreaView>
          <EmptyState onPressCta={openAdd} />
        </View>
        <ExpenseEditModal visible={modalOpen} editing={editing} onClose={closeModal} />
      </>
    );
  }

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
          <Text style={[typography.largeTitle, { color: colors.text }]}>{t('medical.title')}</Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            {t('medical.subtitle')}
          </Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <ExpenseCard expense={item} onPress={openEdit} />}
        ListHeaderComponent={
          <>
            <SummaryCard
              total={summary.total}
              threshold={summary.threshold}
              deductible={summary.deductible}
              refund={summary.refund}
            />
            <CategoryFilter value={filter} onChange={setFilter} />
          </>
        }
        ListEmptyComponent={
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('medical.list.emptyForFilter')}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('medical.empty.cta')}
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

      <ExpenseEditModal visible={modalOpen} editing={editing} onClose={closeModal} />
    </SafeAreaView>
  );
}

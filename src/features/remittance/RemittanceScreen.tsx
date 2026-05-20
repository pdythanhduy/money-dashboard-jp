import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnnualGoalModal } from '@/features/remittance/components/AnnualGoalModal';
import { EmptyState } from '@/features/remittance/components/EmptyState';
import { ProviderComparisonCard } from '@/features/remittance/components/ProviderComparisonCard';
import { RemittanceCard } from '@/features/remittance/components/RemittanceCard';
import { RemittanceEditModal } from '@/features/remittance/components/RemittanceEditModal';
import { YearlySummaryCard } from '@/features/remittance/components/YearlySummaryCard';
import { formatCurrency } from '@/lib/format';
import {
  buildYearlySummary,
  compareProviders,
  computeRemittanceGoalProgress,
  TAX_GIFT_THRESHOLD_JPY,
  type RemittanceEntry,
} from '@/lib/remittance-math';
import { useRemittanceStore } from '@/store/remittanceStore';
import { useTheme } from '@/theme';

export function RemittanceScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const entries = useRemittanceStore((s) => s.entries);
  const annualGoalJPY = useRemittanceStore((s) => s.annualGoalJPY);

  const [editing, setEditing] = useState<RemittanceEntry | null>(null);
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const summary = useMemo(() => buildYearlySummary(entries, currentYear), [entries, currentYear]);
  const goal = useMemo(
    () =>
      annualGoalJPY > 0
        ? computeRemittanceGoalProgress(summary.totalSentJPY, annualGoalJPY)
        : null,
    [annualGoalJPY, summary.totalSentJPY],
  );
  const providerComparisons = useMemo(
    () => compareProviders(entries.filter((e) => e.date.startsWith(String(currentYear)))),
    [entries, currentYear],
  );

  // Per-recipient tally for the gift-tax warning. Recipients without a name
  // are aggregated under "unknown" — we don't surface a warning for them
  // since it's ambiguous which person the gift went to.
  const recipientWarnings = useMemo(() => {
    const byRecipient = new Map<string, number>();
    for (const e of entries) {
      if (!e.recipient) continue;
      if (!e.date.startsWith(String(currentYear))) continue;
      byRecipient.set(e.recipient, (byRecipient.get(e.recipient) ?? 0) + e.amountJPY);
    }
    return Array.from(byRecipient.entries())
      .filter(([, sent]) => sent >= TAX_GIFT_THRESHOLD_JPY * 0.8)
      .sort((a, b) => b[1] - a[1])
      .map(([recipient, sent]) => ({ recipient, sent }));
  }, [entries, currentYear]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setEntryModalOpen(true);
  }, []);

  const openEdit = useCallback((e: RemittanceEntry) => {
    setEditing(e);
    setEntryModalOpen(true);
  }, []);

  const yearEntries = useMemo(
    () => entries.filter((e) => e.date.startsWith(String(currentYear))),
    [entries, currentYear],
  );

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
          <Text style={[typography.largeTitle, { color: colors.text }]}>{t('remittance.title')}</Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            {t('remittance.subtitle')}
          </Text>
        </View>
      </View>

      <FlatList
        data={yearEntries}
        keyExtractor={(e) => e.id}
        renderItem={({ item }) => <RemittanceCard entry={item} onPress={openEdit} />}
        ListHeaderComponent={
          <>
            <YearlySummaryCard summary={summary} goal={goal} onPressGoal={() => setGoalModalOpen(true)} />
            {recipientWarnings.map((w) => (
              <View
                key={w.recipient}
                style={{
                  marginHorizontal: spacing.lg,
                  marginTop: spacing.md,
                  padding: spacing.md,
                  borderRadius: radius.md,
                  borderLeftWidth: 4,
                  borderLeftColor: w.sent >= TAX_GIFT_THRESHOLD_JPY ? colors.danger : colors.warning,
                  backgroundColor: colors.surfaceElevated,
                  gap: spacing.xs,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Ionicons
                    name={w.sent >= TAX_GIFT_THRESHOLD_JPY ? 'alert-circle' : 'warning'}
                    size={18}
                    color={w.sent >= TAX_GIFT_THRESHOLD_JPY ? colors.danger : colors.warning}
                  />
                  <Text style={[typography.callout, { color: colors.text, fontWeight: '700', flex: 1 }]}>
                    {t('remittance.taxWarning.title')}
                  </Text>
                </View>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t('remittance.taxWarning.body', {
                    recipient: w.recipient,
                    sent: formatCurrency(w.sent),
                  })}
                </Text>
              </View>
            ))}
            <ProviderComparisonCard comparisons={providerComparisons} />
            {yearEntries.length > 0 ? (
              <View style={{ marginTop: spacing.md, paddingHorizontal: spacing.lg }}>
                <Text style={[typography.headline, { color: colors.text }]}>
                  {t('remittance.entries.title')}
                </Text>
              </View>
            ) : null}
          </>
        }
        ListEmptyComponent={entries.length === 0 ? <EmptyState onPressCta={openAdd} /> : null}
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('remittance.add.title')}
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

      <RemittanceEditModal
        visible={entryModalOpen}
        editing={editing}
        onClose={() => setEntryModalOpen(false)}
      />
      <AnnualGoalModal visible={goalModalOpen} onClose={() => setGoalModalOpen(false)} />
    </SafeAreaView>
  );
}

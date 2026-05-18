import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FilterBar } from '@/features/history/components/FilterBar';
import { HistoryDetailModal } from '@/features/history/components/HistoryDetailModal';
import { HistoryEmptyState } from '@/features/history/components/HistoryEmptyState';
import { HistoryListItem } from '@/features/history/components/HistoryListItem';
import { StatsCard } from '@/features/history/components/StatsCard';
import { TrendChart } from '@/features/history/components/TrendChart';
import { useHistoryStats } from '@/features/history/hooks/useHistoryStats';
import type { MainTabParamList } from '@/navigation/MainTabs';
import { useHistoryStore } from '@/store/historyStore';
import { useTheme } from '@/theme';
import type { HistoryEntry, HistoryFilter } from '@/types/history';

type HistoryNavigationProp = BottomTabNavigationProp<MainTabParamList, 'History'>;

export function HistoryScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<HistoryNavigationProp>();
  const { width } = useWindowDimensions();

  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [activeEntry, setActiveEntry] = useState<HistoryEntry | null>(null);

  const entries = useHistoryStore((s) => s.entries);
  const updateEntry = useHistoryStore((s) => s.updateEntry);
  const deleteEntry = useHistoryStore((s) => s.deleteEntry);
  const clearAll = useHistoryStore((s) => s.clearAll);

  const stats = useHistoryStats(filter);

  const handleOpenItem = useCallback((entry: HistoryEntry) => setActiveEntry(entry), []);
  const handleCloseModal = useCallback(() => setActiveEntry(null), []);

  const handleSaveEdit = useCallback(
    (id: string, label: string | undefined, note: string | undefined) => {
      updateEntry(id, { label, note });
    },
    [updateEntry],
  );

  const handleDelete = useCallback((id: string) => deleteEntry(id), [deleteEntry]);

  const handleClearAll = useCallback(() => {
    Alert.alert(
      t('history.clearConfirmTitle'),
      t('history.clearConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('history.clearConfirmOk'), style: 'destructive', onPress: clearAll },
      ],
    );
  }, [clearAll, t]);

  if (entries.length === 0) {
    return <HistoryEmptyState onPressCta={() => navigation.navigate('Calculator')} />;
  }

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <HistoryListItem entry={item} onPress={handleOpenItem} />
  );

  const header = (
    <View>
      <View
        style={{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs,
        }}
      >
        <View>
          <Text style={[typography.largeTitle, { color: colors.text }]}>
            {t('history.title')}
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            {t('history.subtitle')}
          </Text>
        </View>
        <Pressable onPress={handleClearAll} hitSlop={8}>
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      <StatsCard
        totalCount={stats.totalCount}
        highestTakeHome={stats.highestTakeHome}
        averageTakeHome={stats.averageTakeHome}
        totalTaxEstimated={stats.totalTaxEstimated}
      />

      <View
        style={{
          marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md,
          backgroundColor: colors.surfaceElevated, borderRadius: 16,
        }}
      >
        <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.xs }]}>
          {t('history.trend.title')}
        </Text>
        <TrendChart data={stats.trendData} width={width - spacing.lg * 2 - spacing.md * 2} height={200} />
      </View>

      <FilterBar value={filter} onChange={setFilter} />
    </View>
  );

  const empty = (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
      <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
        {t('history.list.emptyForFilter')}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <FlatList
        data={stats.filteredEntries}
        keyExtractor={(e) => e.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        initialNumToRender={10}
        windowSize={5}
        showsVerticalScrollIndicator={false}
      />
      <HistoryDetailModal
        entry={activeEntry}
        onClose={handleCloseModal}
        onSave={handleSaveEdit}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddSavingsModal } from '@/features/goals/components/AddSavingsModal';
import { EmptyState } from '@/features/goals/components/EmptyState';
import { GoalCard } from '@/features/goals/components/GoalCard';
import { GoalDetailModal } from '@/features/goals/components/GoalDetailModal';
import { GoalEditModal } from '@/features/goals/components/GoalEditModal';
import { isGoalCompleted, useGoalsStore, type Goal } from '@/store/goalsStore';
import { useTheme } from '@/theme';

type Section = { kind: 'header'; title: string; id: string } | { kind: 'goal'; goal: Goal };

export function GoalsScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation();
  const goals = useGoalsStore((s) => s.goals);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [addSavingsOpen, setAddSavingsOpen] = useState(false);

  // Re-derive the selected goal from the store on every render so it picks
  // up contribution edits made from the AddSavings modal.
  const selectedGoal = useMemo(
    () => (selectedId ? goals.find((g) => g.id === selectedId) ?? null : null),
    [goals, selectedId],
  );

  const sections = useMemo<Section[]>(() => {
    const active = goals.filter((g) => !isGoalCompleted(g));
    const done = goals.filter((g) => isGoalCompleted(g));
    const out: Section[] = [];
    if (active.length > 0) {
      out.push({ kind: 'header', title: t('goals.sections.active'), id: 'active' });
      for (const g of active) out.push({ kind: 'goal', goal: g });
    }
    if (done.length > 0) {
      out.push({ kind: 'header', title: t('goals.sections.completed'), id: 'completed' });
      for (const g of done) out.push({ kind: 'goal', goal: g });
    }
    return out;
  }, [goals, t]);

  const openAdd = useCallback(() => {
    setEditing(null);
    setEditModalOpen(true);
  }, []);

  const openDetail = useCallback((g: Goal) => {
    setSelectedId(g.id);
    setDetailOpen(true);
  }, []);

  const openEditFromDetail = useCallback(() => {
    if (!selectedGoal) return;
    setEditing(selectedGoal);
    setDetailOpen(false);
    // Defer so Detail's slide-dismiss animation finishes before Edit mounts.
    setTimeout(() => setEditModalOpen(true), 400);
  }, [selectedGoal]);

  const openAddSavingsFromDetail = useCallback(() => {
    if (!selectedGoal) return;
    // Both modals use animationType="slide" + presentationStyle="pageSheet".
    // iOS animates slide dismiss ~350ms — if we open AddSavings synchronously
    // it races with Detail's dismiss and the second sheet never appears.
    // Wait one animation cycle, then mount.
    setDetailOpen(false);
    setTimeout(() => setAddSavingsOpen(true), 400);
  }, [selectedGoal]);

  const closeAddSavingsBackToDetail = useCallback(() => {
    setAddSavingsOpen(false);
    // Re-open detail after AddSavings finishes dismissing so the new
    // savedAmount surfaces immediately. Same animation-race rationale.
    if (selectedId) setTimeout(() => setDetailOpen(true), 400);
  }, [selectedId]);

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
          <Text style={[typography.largeTitle, { color: colors.text }]}>{t('goals.title')}</Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>{t('goals.subtitle')}</Text>
        </View>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => (item.kind === 'header' ? `h-${item.id}` : `g-${item.goal.id}`)}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>{item.title}</Text>
            </View>
          ) : (
            <GoalCard goal={item.goal} onPress={openDetail} />
          )
        }
        ListEmptyComponent={<EmptyState onPressCta={openAdd} />}
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('goals.actions.addGoal')}
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

      <GoalDetailModal
        visible={detailOpen}
        goalId={selectedId}
        onClose={() => setDetailOpen(false)}
        onEdit={openEditFromDetail}
        onAddSavings={openAddSavingsFromDetail}
      />
      <GoalEditModal
        visible={editModalOpen}
        editing={editing}
        onClose={() => setEditModalOpen(false)}
      />
      <AddSavingsModal
        visible={addSavingsOpen}
        goalId={selectedId}
        onClose={closeAddSavingsBackToDetail}
      />
    </SafeAreaView>
  );
}

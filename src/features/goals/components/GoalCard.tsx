import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { iconNameFor } from '@/features/goals/components/IconPicker';
import { formatCurrency } from '@/lib/format';
import { computeGoalProjection } from '@/lib/goals-math';
import { getSavedTotal, isGoalCompleted, type Goal } from '@/store/goalsStore';
import { useTheme } from '@/theme';

interface Props {
  goal: Goal;
  onPress: (g: Goal) => void;
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(1, percent));
  return (
    <View
      style={{
        height: 8,
        borderRadius: radius.pill,
        backgroundColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ width: `${clamped * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

function GoalCardImpl({ goal, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const saved = getSavedTotal(goal);
  const completed = isGoalCompleted(goal);
  const projection = computeGoalProjection({
    saved,
    target: goal.targetAmount,
    ...(goal.deadline ? { deadline: goal.deadline } : {}),
  });
  const accentColor = completed ? colors.success : colors.brand;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${goal.title} · ${formatCurrency(saved)} / ${formatCurrency(goal.targetAmount)}`}
      onPress={() => onPress(goal)}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
        gap: spacing.sm,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.brandSubtle,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={iconNameFor(goal.icon)} size={20} color={accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
            {goal.title}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
            {t('goals.progress.savedOfTarget', {
              saved: formatCurrency(saved),
              target: formatCurrency(goal.targetAmount),
            })}
          </Text>
        </View>
        <Text style={[typography.callout, { color: accentColor, fontWeight: '700' }]}>
          {Math.round(projection.progressPercent * 100)}%
        </Text>
      </View>
      <ProgressBar percent={projection.progressPercent} color={accentColor} />
      {completed ? (
        <Text style={[typography.caption, { color: colors.success, fontWeight: '600' }]}>
          {t('goals.progress.completed')}
        </Text>
      ) : projection.monthlyTarget && projection.monthsToDeadline ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
          {t('goals.progress.monthlyTarget', { amount: formatCurrency(projection.monthlyTarget) })}
        </Text>
      ) : null}
    </Pressable>
  );
}

export const GoalCard = memo(GoalCardImpl);

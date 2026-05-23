import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { iconNameFor } from '@/features/goals/components/IconPicker';
import { formatCurrency } from '@/lib/format';
import { computeGoalHealth } from '@/lib/money-goal-math';
import {
  getGoalCategory,
  getGoalStatus,
  getSavedTotal,
  type Goal,
} from '@/store/goalsStore';
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
  const status = getGoalStatus(goal);
  const category = getGoalCategory(goal);
  const health = computeGoalHealth({ goal });

  const accentColor = (() => {
    if (health.health === 'completed') return colors.success;
    if (health.health === 'behind') return colors.warning;
    return colors.brand;
  })();

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
        opacity: pressed ? (status === 'cancelled' || status === 'paused' ? 0.6 : 0.85) : status === 'cancelled' ? 0.55 : status === 'paused' ? 0.75 : 1,
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
            {' · '}
            {t(`goals.categories.${category}`)}
          </Text>
        </View>
        <Text style={[typography.callout, { color: accentColor, fontWeight: '700' }]}>
          {Math.round(health.progressPercent * 100)}%
        </Text>
      </View>
      <ProgressBar percent={health.progressPercent} color={accentColor} />
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs }}>
        {/* Status badge (always visible for non-default states) */}
        {status !== 'active' ? (
          <StatusBadge label={t(`goals.status.${status}`)} status={status} />
        ) : null}
        {/* Health badge */}
        <HealthBadge label={t(`goals.health.${health.health}`)} health={health.health} />
      </View>
      {/* Required-monthly-saving line, only when there is a deadline + active */}
      {status === 'active' && health.requiredMonthlySaving !== undefined ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
          {t('goals.progress.monthlyTarget', { amount: formatCurrency(health.requiredMonthlySaving) })}
        </Text>
      ) : null}
    </Pressable>
  );
}

function StatusBadge({
  label,
  status,
}: {
  label: string;
  status: 'paused' | 'completed' | 'cancelled';
}) {
  const { colors, typography, spacing, radius } = useTheme();
  const bg =
    status === 'completed'
      ? colors.success
      : status === 'paused'
        ? colors.warning
        : colors.textSecondary;
  return (
    <View
      style={{
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: radius.pill,
        backgroundColor: bg,
      }}
    >
      <Text style={[typography.caption, { color: colors.textInverse, fontWeight: '700' }]}>
        {label}
      </Text>
    </View>
  );
}

function HealthBadge({
  label,
  health,
}: {
  label: string;
  health: 'on_track' | 'behind' | 'completed' | 'no_deadline';
}) {
  const { colors, typography, spacing, radius } = useTheme();
  const fg =
    health === 'behind'
      ? colors.warning
      : health === 'completed'
        ? colors.success
        : colors.textSecondary;
  return (
    <View
      style={{
        paddingHorizontal: spacing.xs,
        paddingVertical: 2,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: fg,
      }}
    >
      <Text style={[typography.caption, { color: fg, fontWeight: '600' }]}>{label}</Text>
    </View>
  );
}

export const GoalCard = memo(GoalCardImpl);

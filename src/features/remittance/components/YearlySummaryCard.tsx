import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { formatVND } from '@/features/remittance/format-vnd';
import { formatCurrency } from '@/lib/format';
import type { GoalProgress, YearlySummary } from '@/lib/remittance-math';
import { useTheme } from '@/theme';

interface Props {
  summary: YearlySummary;
  goal: GoalProgress | null;
  onPressGoal: () => void;
}

function formatRate(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return '—';
  return rate.toFixed(2);
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(1, percent));
  return (
    <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${clamped * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

export function YearlySummaryCard({ summary, goal, onPressGoal }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.lg,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        gap: spacing.xs,
      }}
    >
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('remittance.summary.totalJPY', { year: summary.year })}
      </Text>
      <Text style={[typography.largeTitle, { color: colors.text, fontWeight: '800' }]}>
        {formatCurrency(summary.totalSentJPY)}
      </Text>
      <Text style={[typography.title3, { color: colors.danger, fontWeight: '700' }]}>
        {t('remittance.summary.totalVND', { amount: formatVND(summary.totalSentVND) })}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        {t('remittance.summary.entryCount', { count: summary.entryCount })}
      </Text>

      <View style={{ marginTop: spacing.sm, gap: 2 }}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('remittance.summary.avgRate', { rate: formatRate(summary.avgExchangeRate) })}
        </Text>
        <Text style={[typography.caption, { color: colors.success }]}>
          {t('remittance.summary.bestRate', { rate: formatRate(summary.bestRate) })}
        </Text>
        <Text style={[typography.caption, { color: colors.danger }]}>
          {t('remittance.summary.worstRate', { rate: formatRate(summary.worstRate) })}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('remittance.summary.totalFees', { amount: formatCurrency(summary.totalFeesJPY) })}
        </Text>
      </View>

      <View style={{ marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.xs }}>
        {goal && goal.targetJPY > 0 ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Ionicons name="flag-outline" size={16} color={colors.brand} />
              <Text style={[typography.callout, { color: colors.text, fontWeight: '600', flex: 1 }]}>
                {t('remittance.goal.title')}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('remittance.goal.set')}
                onPress={onPressGoal}
                hitSlop={6}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              >
                <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t('remittance.goal.progress', {
                sent: formatCurrency(goal.sentJPY),
                target: formatCurrency(goal.targetJPY),
              })}
            </Text>
            <ProgressBar percent={goal.percent} color={goal.percent >= 1 ? colors.success : colors.brand} />
            <Text style={[typography.caption, { color: colors.text, fontWeight: '600' }]}>
              {t('remittance.goal.percentLabel', { percent: Math.round(goal.percent * 100) })} ·{' '}
              {t('remittance.goal.daysLeft', { days: goal.daysLeftInYear })}
            </Text>
            {goal.monthlyTargetRemaining > 0 ? (
              <Text style={[typography.caption, { color: colors.brand, fontWeight: '600' }]}>
                {t('remittance.goal.monthlyTargetRemaining', {
                  amount: formatCurrency(goal.monthlyTargetRemaining),
                })}
              </Text>
            ) : null}
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('remittance.goal.noGoalCta')}
            onPress={onPressGoal}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name="flag-outline" size={16} color={colors.brand} />
            <Text style={[typography.callout, { color: colors.brand, fontWeight: '600', flex: 1 }]}>
              {t('remittance.goal.noGoalYet')}
            </Text>
            <Text style={[typography.callout, { color: colors.brand, fontWeight: '700' }]}>
              {t('remittance.goal.noGoalCta')} →
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

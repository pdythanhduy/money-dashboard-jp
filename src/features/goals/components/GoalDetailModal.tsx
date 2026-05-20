import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { iconNameFor } from '@/features/goals/components/IconPicker';
import { formatCurrency } from '@/lib/format';
import { computeGoalProjection } from '@/lib/goals-math';
import { useCalculatorStore } from '@/store/calculatorStore';
import { getSavedTotal, isGoalCompleted, type Goal } from '@/store/goalsStore';
import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onEdit: () => void;
  onAddSavings: () => void;
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const { colors, radius } = useTheme();
  const clamped = Math.max(0, Math.min(1, percent));
  return (
    <View style={{ height: 12, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${clamped * 100}%`, height: '100%', backgroundColor: color }} />
    </View>
  );
}

export function GoalDetailModal({ visible, goal, onClose, onEdit, onAddSavings }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const takeHomeMonthly = useCalculatorStore((s) => s.lastResult?.takeHomeMonthly);

  if (!goal) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose} />
    );
  }

  const saved = getSavedTotal(goal);
  const completed = isGoalCompleted(goal);
  const projection = computeGoalProjection({
    saved,
    target: goal.targetAmount,
    ...(goal.deadline ? { deadline: goal.deadline } : {}),
    ...(takeHomeMonthly && takeHomeMonthly > 0 ? { takeHomeMonthly } : {}),
  });
  const accentColor = completed ? colors.success : colors.brand;

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={onClose}
            hitSlop={8}
          >
            <Ionicons name="chevron-down" size={26} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('goals.actions.edit')}
            onPress={onEdit}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.lg }}
        >
          <View style={{ alignItems: 'center', gap: spacing.sm }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: colors.brandSubtle,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={iconNameFor(goal.icon)} size={36} color={accentColor} />
            </View>
            <Text style={[typography.title2, { color: colors.text, textAlign: 'center', fontWeight: '700' }]}>
              {goal.title}
            </Text>
            {goal.note ? (
              <Text style={[typography.callout, { color: colors.textSecondary, textAlign: 'center' }]}>
                {goal.note}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              padding: spacing.lg,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceElevated,
              gap: spacing.sm,
            }}
          >
            <Text style={[typography.largeTitle, { color: accentColor, fontWeight: '800', textAlign: 'center' }]}>
              {formatCurrency(saved)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('goals.progress.savedOfTarget', {
                saved: formatCurrency(saved),
                target: formatCurrency(goal.targetAmount),
              })}
            </Text>
            <ProgressBar percent={projection.progressPercent} color={accentColor} />
            <Text style={[typography.headline, { color: colors.text, textAlign: 'center', marginTop: spacing.xs }]}>
              {Math.round(projection.progressPercent * 100)}%
            </Text>
            {!completed ? (
              <Text style={[typography.callout, { color: colors.textSecondary, textAlign: 'center' }]}>
                {t('goals.progress.remaining', { amount: formatCurrency(projection.remaining) })}
              </Text>
            ) : (
              <Text style={[typography.callout, { color: colors.success, textAlign: 'center', fontWeight: '700' }]}>
                {t('goals.progress.completed')}
              </Text>
            )}
          </View>

          {!completed ? (
            <View
              style={{
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                gap: spacing.xs,
              }}
            >
              {goal.deadline ? (
                projection.monthsToDeadline === 0 ? (
                  <Text style={[typography.body, { color: colors.danger, fontWeight: '600' }]}>
                    {t('goals.progress.deadlinePast')}
                  </Text>
                ) : (
                  <>
                    <Text style={[typography.body, { color: colors.text }]}>
                      {t('goals.progress.monthsRemaining', { months: projection.monthsToDeadline })}
                    </Text>
                    {projection.monthlyTarget ? (
                      <Text style={[typography.title3, { color: colors.brand, fontWeight: '700' }]}>
                        {t('goals.progress.monthlyTarget', { amount: formatCurrency(projection.monthlyTarget) })}
                      </Text>
                    ) : null}
                    {projection.savingsRateRequired ? (
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {t('goals.progress.savingsRateRequired', {
                          percent: Math.round(projection.savingsRateRequired * 100),
                        })}
                      </Text>
                    ) : null}
                  </>
                )
              ) : (
                <Text style={[typography.body, { color: colors.textSecondary }]}>
                  {t('goals.progress.noDeadline')}
                </Text>
              )}
              {projection.monthsAtDefaultPace ? (
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  {t('goals.progress.atDefaultPace', { months: projection.monthsAtDefaultPace })}
                </Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('goals.actions.addSavings')}
            onPress={onAddSavings}
            style={({ pressed }) => ({
              minHeight: 50,
              borderRadius: radius.sm,
              backgroundColor: colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
              flexDirection: 'row',
              gap: spacing.xs,
            })}
          >
            <Ionicons name="add" size={20} color={colors.textInverse} />
            <Text style={[typography.callout, { color: colors.textInverse, fontWeight: '600' }]}>
              {t('goals.actions.addSavings')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

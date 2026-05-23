/**
 * Mon–Sun snapshot for the Dashboard. Renders only when the current OR
 * previous week has at least one entry — otherwise returns null so the
 * fresh-install Dashboard stays uncluttered.
 *
 * Tap (if `onPress` is provided) opens Kakeibo; without `onPress` the
 * card is presentational only.
 */

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { computeWeeklyReview } from '@/lib/weekly-spending-review';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useTheme } from '@/theme';

interface Props {
  /** Optional — when omitted, the card is non-clickable. */
  onPress?: () => void;
}

export function WeeklyReviewCard({ onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const entries = useKakeiboStore((s) => s.entries);

  const review = useMemo(
    () => computeWeeklyReview({ entries, now: new Date() }),
    [entries],
  );

  if (!review.hasData) return null;

  const diffLine = (() => {
    if (review.diffStatus === 'same') return t('dashboard.weeklyReview.sameAsLastWeek');
    if (review.diffStatus === 'up') {
      return t('dashboard.weeklyReview.moreThanLastWeek', {
        amount: formatCurrency(Math.abs(review.diff)),
      });
    }
    return t('dashboard.weeklyReview.lessThanLastWeek', {
      amount: formatCurrency(Math.abs(review.diff)),
    });
  })();

  const diffColor =
    review.diffStatus === 'up'
      ? colors.danger
      : review.diffStatus === 'down'
        ? colors.success
        : colors.textSecondary;

  const body = (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.xs,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="calendar-outline" size={18} color={colors.brand} />
        <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
          {t('dashboard.weeklyReview.title')}
        </Text>
        {onPress ? (
          <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
        ) : null}
      </View>
      <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
        {t('dashboard.weeklyReview.spent', { amount: formatCurrency(review.thisWeekTotal) })}
      </Text>
      <Text style={[typography.caption, { color: diffColor, fontWeight: '600' }]}>
        {diffLine}
      </Text>
      {review.topCategory ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {t('dashboard.weeklyReview.topCategory', {
            category: t(`kakeibo.categories.${review.topCategory.category}`),
          })}
        </Text>
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('dashboard.weeklyReview.title')}
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {body}
    </Pressable>
  );
}

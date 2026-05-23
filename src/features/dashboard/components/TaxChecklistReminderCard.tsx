/**
 * Dashboard reminder for the yearly tax checklist. Renders only during
 * Japan's 確定申告 filing window (Jan 1 → Mar 15) AND only when the
 * user has at least one unchecked item for the relevant tax year.
 *
 * Tap → opens the Kakutei screen (where the checklist UI will live in a
 * follow-up PR). For now the screen exists and is where the user goes to
 * tick items off.
 */

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import {
  currentTaxYear,
  isTaxSeason,
  TAX_CHECKLIST_ITEM_IDS,
} from '@/lib/tax-checklist';
import { useTaxChecklistStore } from '@/store/taxChecklistStore';
import { useTheme } from '@/theme';

interface Props {
  /** Called when user taps the card — typically navigates to Kakutei. */
  onPress: () => void;
}

export function TaxChecklistReminderCard({ onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const byYear = useTaxChecklistStore((s) => s.byYear);

  const decision = useMemo(() => {
    const now = new Date();
    if (!isTaxSeason(now)) return null;
    const year = currentTaxYear(now);
    const yearState = byYear[year] ?? {};
    const done = TAX_CHECKLIST_ITEM_IDS.reduce(
      (n, id) => (yearState[id]?.checked ? n + 1 : n),
      0,
    );
    const total = TAX_CHECKLIST_ITEM_IDS.length;
    if (done >= total) return null; // all done — no reminder
    return { year, done, total, remaining: total - done };
  }, [byYear]);

  if (!decision) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('taxChecklist.dashboard.reminderTitle')}
      onPress={onPress}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        borderLeftWidth: 4,
        borderLeftColor: colors.warning,
        gap: spacing.xs,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Ionicons name="document-text-outline" size={18} color={colors.warning} />
        <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
          {t('taxChecklist.dashboard.reminderTitle')}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </View>
      <Text style={[typography.callout, { color: colors.text }]}>
        {t('taxChecklist.dashboard.reminderBody', {
          year: decision.year,
          remaining: decision.remaining,
          total: decision.total,
        })}
      </Text>
    </Pressable>
  );
}

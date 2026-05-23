/**
 * Yearly tax / admin self-reminder inside the Kakutei screen.
 *
 * Renders 5 canonical items with check/uncheck toggle, year header,
 * progress count, and a cautious disclaimer ("not tax advice"). When
 * all items are checked, shows a small success message instead of the
 * row list.
 *
 * Year defaults to `currentTaxYear(new Date())` — flips at March 15.
 * No year picker UI in v1; year switches automatically as the calendar
 * crosses the filing window.
 */

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import {
  currentTaxYear,
  TAX_CHECKLIST_ITEM_IDS,
  type TaxChecklistItemId,
} from '@/lib/tax-checklist';
import { useTaxChecklistStore } from '@/store/taxChecklistStore';
import { useTheme } from '@/theme';

export function TaxChecklistSection() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const byYear = useTaxChecklistStore((s) => s.byYear);
  const toggleItem = useTaxChecklistStore((s) => s.toggleItem);

  const year = useMemo(() => currentTaxYear(new Date()), []);
  const yearState = byYear[year] ?? {};
  const done = TAX_CHECKLIST_ITEM_IDS.reduce(
    (n, id) => (yearState[id]?.checked ? n + 1 : n),
    0,
  );
  const total = TAX_CHECKLIST_ITEM_IDS.length;
  const allDone = done >= total;

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.sm,
      }}
    >
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Ionicons name="checkbox-outline" size={18} color={colors.brand} />
          <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
            {t('taxChecklist.title')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, fontWeight: '600' }]}>
            {t('taxChecklist.progress', { done, total })}
          </Text>
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {t('taxChecklist.yearLabel', { year })}
        </Text>
      </View>

      <Text
        style={[
          typography.caption,
          {
            color: colors.textSecondary,
            backgroundColor: colors.brandSubtle,
            paddingHorizontal: spacing.sm,
            paddingVertical: spacing.xs,
            borderRadius: radius.sm,
          },
        ]}
      >
        {t('taxChecklist.disclaimer')}
      </Text>

      {allDone ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.xs,
            paddingVertical: spacing.sm,
          }}
        >
          <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          <Text style={[typography.callout, { color: colors.success, fontWeight: '700' }]}>
            {t('taxChecklist.completedMessage')}
          </Text>
        </View>
      ) : null}

      <View style={{ gap: spacing.xs }}>
        {TAX_CHECKLIST_ITEM_IDS.map((id) => (
          <ChecklistRow
            key={id}
            id={id}
            checked={yearState[id]?.checked === true}
            onToggle={() => toggleItem(year, id)}
          />
        ))}
      </View>
    </View>
  );
}

function ChecklistRow({
  id,
  checked,
  onToggle,
}: {
  id: TaxChecklistItemId;
  checked: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={t(`taxChecklist.items.${id}.title`)}
      onPress={onToggle}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: radius.sm,
          borderWidth: 1.5,
          borderColor: checked ? colors.success : colors.borderStrong,
          backgroundColor: checked ? colors.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 2,
        }}
      >
        {checked ? <Ionicons name="checkmark" size={14} color={colors.textInverse} /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            typography.body,
            {
              color: colors.text,
              fontWeight: '600',
              textDecorationLine: checked ? 'line-through' : 'none',
              opacity: checked ? 0.6 : 1,
            },
          ]}
        >
          {t(`taxChecklist.items.${id}.title`)}
        </Text>
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, marginTop: 2, opacity: checked ? 0.6 : 1 },
          ]}
        >
          {t(`taxChecklist.items.${id}.body`)}
        </Text>
      </View>
    </Pressable>
  );
}

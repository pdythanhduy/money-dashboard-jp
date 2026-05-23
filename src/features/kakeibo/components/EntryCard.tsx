import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import { formatCurrency } from '@/lib/format';
import type { KakeiboEntry } from '@/lib/kakeibo-math';
import { useTheme } from '@/theme';

interface Props {
  entry: KakeiboEntry;
  onPress: (e: KakeiboEntry) => void;
  /**
   * When provided, render a small trash button on the right edge. Tapping it
   * does not bubble to the row's onPress (RN nested Pressables own their hit
   * area). The parent decides whether to confirm via Alert before deleting.
   */
  onDelete?: (e: KakeiboEntry) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function EntryCardImpl({ entry, onPress, onDelete }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const itemName = entry.label || t(`kakeibo.categories.${entry.category}`);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${itemName} · ${formatCurrency(entry.amount)}`}
      onPress={() => onPress(entry)}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginBottom: spacing.xs,
        padding: spacing.sm,
        paddingHorizontal: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.brandSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={CATEGORY_ICONS[entry.category]} size={16} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
          {itemName}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
          {formatDate(entry.date)} · {t(`kakeibo.categories.${entry.category}`)}
          {entry.isRecurring ? ' · ↻' : ''}
        </Text>
      </View>
      <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
        {formatCurrency(entry.amount)}
      </Text>
      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('kakeibo.entry.deleteLabel', { name: itemName })}
          onPress={() => onDelete(entry)}
          hitSlop={8}
          style={({ pressed }) => ({
            marginLeft: spacing.xs,
            padding: 4,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

export const EntryCard = memo(EntryCardImpl);

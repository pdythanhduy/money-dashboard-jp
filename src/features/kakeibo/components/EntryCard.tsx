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
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function EntryCardImpl({ entry, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.label ?? t(`kakeibo.categories.${entry.category}`)} · ${formatCurrency(entry.amount)}`}
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
          {entry.label || t(`kakeibo.categories.${entry.category}`)}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
          {formatDate(entry.date)} · {t(`kakeibo.categories.${entry.category}`)}
          {entry.isRecurring ? ' · ↻' : ''}
        </Text>
      </View>
      <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
        {formatCurrency(entry.amount)}
      </Text>
    </Pressable>
  );
}

export const EntryCard = memo(EntryCardImpl);

import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { formatCurrency, formatRelativeTime } from '@/lib/format';
import { useTheme } from '@/theme';
import type { HistoryEntry } from '@/types/history';

interface Props {
  entry: HistoryEntry;
  onPress: (entry: HistoryEntry) => void;
}

function HistoryListItemImpl({ entry, onPress }: Props) {
  const { t, i18n } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();

  const isBusiness = entry.input.category === 'business';
  const badgeColor = isBusiness ? colors.accent : colors.brand;
  const badgeLabel = t(isBusiness ? 'history.badge.business' : 'history.badge.salary');
  const locale = i18n.language === 'ja' ? 'ja' : 'vi';

  const label = entry.label ?? defaultLabel(entry.timestamp, locale);

  const subInfo = [
    entry.input.prefecture ?? entry.input.municipality ?? '—',
    t('history.list.age', { age: entry.input.age }),
  ].join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} · ${formatCurrency(entry.result.takeHomeMonthly)}`}
      onPress={() => onPress(entry)}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
        opacity: pressed ? 0.85 : 1,
        ...(isDark
          ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
          : {}),
      })}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs }}>
        <Text style={[typography.body, { color: colors.text, flex: 1, fontWeight: '600' }]} numberOfLines={1}>
          {label}
        </Text>
        <View
          style={{
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
            borderRadius: radius.pill,
            backgroundColor: badgeColor + '22',
          }}
        >
          <Text style={[typography.caption, { color: badgeColor, fontWeight: '600' }]}>
            {badgeLabel}
          </Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: spacing.xs }}>
        <Text style={[typography.title3, { color: colors.brand }]}>
          {formatCurrency(entry.result.takeHomeMonthly)}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          / {t('history.list.month')} · {formatCurrency(entry.result.takeHomeAnnual)} /{t('history.list.year')}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{subInfo}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {formatRelativeTime(entry.timestamp, locale)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

function defaultLabel(timestamp: number, locale: 'vi' | 'ja'): string {
  const d = new Date(timestamp);
  if (locale === 'ja') return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日の計算`;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `Tính ngày ${dd}/${mm}/${d.getFullYear()}`;
}

export const HistoryListItem = memo(HistoryListItemImpl);

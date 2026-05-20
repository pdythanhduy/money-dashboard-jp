import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CATEGORY_ICONS } from '@/features/kakeibo/category-icons';
import { ALL_EXPENSE_CATEGORIES, type ExpenseCategory } from '@/lib/kakeibo-math';
import { useTheme } from '@/theme';

export type CategoryFilterValue = 'all' | ExpenseCategory;

interface Props {
  value: CategoryFilterValue;
  onChange: (next: CategoryFilterValue) => void;
}

export function CategoryFilter({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const Chip = ({
    label,
    selected,
    onPress,
    icon,
  }: {
    label: string;
    selected: boolean;
    onPress: () => void;
    icon?: keyof typeof Ionicons.glyphMap;
  }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? colors.brand : colors.border,
        backgroundColor: selected ? colors.brandSubtle : colors.surface,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? colors.brand : colors.textSecondary} /> : null}
      <Text
        style={[
          typography.caption,
          { color: selected ? colors.brand : colors.text, fontWeight: selected ? '700' : '400' },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.xs }}
    >
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <Chip
          label={t('kakeibo.entries.filterAll')}
          selected={value === 'all'}
          onPress={() => onChange('all')}
        />
        {ALL_EXPENSE_CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={t(`kakeibo.categories.${c}`)}
            selected={value === c}
            onPress={() => onChange(c)}
            icon={CATEGORY_ICONS[c]}
          />
        ))}
      </View>
    </ScrollView>
  );
}

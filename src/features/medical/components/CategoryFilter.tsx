import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text } from 'react-native';

import { ALL_MEDICAL_CATEGORIES, type MedicalCategory } from '@/lib/medical-deduction';
import { useTheme } from '@/theme';

export type CategoryFilterValue = 'all' | MedicalCategory;

interface Props {
  value: CategoryFilterValue;
  onChange: (next: CategoryFilterValue) => void;
}

export function CategoryFilter({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const options: CategoryFilterValue[] = ['all', ...ALL_MEDICAL_CATEGORIES];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
      }}
    >
      {options.map((opt) => {
        const selected = value === opt;
        const label =
          opt === 'all' ? t('medical.filter.all') : t(`medical.categories.${opt}`);
        return (
          <Pressable
            key={opt}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={() => onChange(opt)}
            style={({ pressed }) => ({
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radius.pill,
              backgroundColor: selected ? colors.brand : colors.surface,
              borderWidth: 1,
              borderColor: selected ? colors.brand : colors.border,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              style={[
                typography.callout,
                { color: selected ? colors.textInverse : colors.text },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import type { JobType } from '@/features/calculator/hooks/useCalculator';

interface IncomeTypeSelectorProps {
  value: JobType;
  onChange: (value: JobType) => void;
}

const OPTIONS: Array<{
  value: JobType;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  descriptionKey: string;
}> = [
  {
    value: 'baito',
    icon: 'time-outline',
    titleKey: 'calculator.jobTypes.baito.title',
    descriptionKey: 'calculator.jobTypes.baito.description',
  },
  {
    value: 'seishain',
    icon: 'briefcase-outline',
    titleKey: 'calculator.jobTypes.seishain.title',
    descriptionKey: 'calculator.jobTypes.seishain.description',
  },
  {
    value: 'freelance',
    icon: 'laptop-outline',
    titleKey: 'calculator.jobTypes.freelance.title',
    descriptionKey: 'calculator.jobTypes.freelance.description',
  },
];

export function IncomeTypeSelector({ value, onChange }: IncomeTypeSelectorProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              padding: spacing.md,
              minHeight: 88,
              borderWidth: 2,
              borderColor: selected ? colors.accent : colors.border,
              borderRadius: radius.sm,
              backgroundColor: selected ? colors.accentSubtle : colors.surface,
              shadowColor: colors.text,
              shadowOpacity: isDark ? 0 : 0.06,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: selected ? 2 : 1,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: selected ? colors.accent : colors.brandSubtle,
              }}
            >
              <Ionicons
                name={option.icon}
                size={24}
                color={selected ? colors.textInverse : colors.brand}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {t(option.titleKey)}
              </Text>
              <Text style={[typography.footnote, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {t(option.descriptionKey)}
              </Text>
            </View>
            {selected ? <Ionicons name="checkmark-circle" size={22} color={colors.accent} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

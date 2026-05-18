import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text } from 'react-native';

import { useTheme } from '@/theme';
import type { HistoryFilter } from '@/types/history';

interface Props {
  value: HistoryFilter;
  onChange: (next: HistoryFilter) => void;
}

const OPTIONS: HistoryFilter[] = ['all', 'salary', 'business'];

export function FilterBar({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

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
      {OPTIONS.map((opt) => {
        const selected = value === opt;
        return (
          <Pressable
            key={opt}
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
              {t(`history.filter.${opt}`)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

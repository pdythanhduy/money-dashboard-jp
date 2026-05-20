import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme';
import type { GoalIcon } from '@/store/goalsStore';

interface Props {
  value: GoalIcon;
  onChange: (next: GoalIcon) => void;
}

/** Closed set: must stay in sync with `GoalIcon` and the i18n `goals.icons.*` namespace. */
export const GOAL_ICONS: ReadonlyArray<{ key: GoalIcon; ionicon: keyof typeof Ionicons.glyphMap }> = [
  { key: 'piggy', ionicon: 'wallet-outline' },
  { key: 'airplane', ionicon: 'airplane-outline' },
  { key: 'home', ionicon: 'home-outline' },
  { key: 'gift', ionicon: 'gift-outline' },
  { key: 'school', ionicon: 'school-outline' },
  { key: 'phone', ionicon: 'phone-portrait-outline' },
  { key: 'car', ionicon: 'car-outline' },
  { key: 'heart', ionicon: 'heart-outline' },
  { key: 'star', ionicon: 'star-outline' },
];

export function iconNameFor(icon: GoalIcon): keyof typeof Ionicons.glyphMap {
  const found = GOAL_ICONS.find((g) => g.key === icon);
  return found ? found.ionicon : 'star-outline';
}

export function IconPicker({ value, onChange }: Props) {
  const { t } = useTranslation();
  const { colors, spacing, typography, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {GOAL_ICONS.map((opt) => {
        const selected = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={t(`goals.icons.${opt.key}`)}
            onPress={() => onChange(opt.key)}
            style={({ pressed }) => ({
              width: 60,
              padding: spacing.sm,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: selected ? colors.brand : colors.border,
              backgroundColor: selected ? colors.brandSubtle : colors.surface,
              alignItems: 'center',
              gap: 2,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons name={opt.ionicon} size={22} color={selected ? colors.brand : colors.text} />
            <Text
              style={[
                typography.caption,
                { color: selected ? colors.brand : colors.textSecondary, fontWeight: selected ? '700' : '400' },
              ]}
              numberOfLines={1}
            >
              {t(`goals.icons.${opt.key}`)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

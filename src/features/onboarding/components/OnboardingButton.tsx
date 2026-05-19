import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text } from 'react-native';

import { useTheme } from '@/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  icon?: keyof typeof Ionicons.glyphMap;
}

export function OnboardingButton({ label, onPress, variant = 'primary', icon }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: radius.pill,
        backgroundColor: isPrimary ? colors.accent : 'transparent',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={[
          typography.headline,
          { color: isPrimary ? '#1a365d' : colors.textSecondary, fontWeight: '700' },
        ]}
      >
        {label}
      </Text>
      {icon ? <Ionicons name={icon} size={18} color={isPrimary ? '#1a365d' : colors.textSecondary} /> : null}
    </Pressable>
  );
}

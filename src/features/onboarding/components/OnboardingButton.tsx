import { Pressable, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

interface OnboardingButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  style?: ViewStyle;
}

export function OnboardingButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: OnboardingButtonProps) {
  const { colors, typography, spacing, radius } = useTheme();

  const palette = (() => {
    if (variant === 'primary') {
      return { bg: colors.accent, fg: '#1a202c', border: 'transparent' };
    }
    if (variant === 'secondary') {
      return { bg: 'transparent', fg: colors.textInverse, border: colors.textInverse };
    }
    return { bg: 'transparent', fg: colors.textInverse, border: 'transparent' };
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        {
          minHeight: 50,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.pill,
          backgroundColor: palette.bg,
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          borderColor: palette.border,
          opacity: disabled ? 0.4 : 1,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Text style={[typography.headline, { color: palette.fg }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

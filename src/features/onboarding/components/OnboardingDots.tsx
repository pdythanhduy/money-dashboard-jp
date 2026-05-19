import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

interface OnboardingDotsProps {
  count: number;
  current: number;
  onJump?: (index: number) => void;
}

export function OnboardingDots({ count, current, onJump }: OnboardingDotsProps) {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.xs,
        paddingVertical: spacing.sm,
      }}
    >
      {Array.from({ length: count }).map((_, i) => {
        const active = i === current;
        const dot = (
          <View
            style={{
              width: active ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: active ? colors.accent : 'rgba(255,255,255,0.4)',
            }}
          />
        );
        if (!onJump) return <View key={i}>{dot}</View>;
        return (
          <Pressable
            key={i}
            accessibilityRole="button"
            accessibilityLabel={`slide-${i + 1}`}
            onPress={() => onJump(i)}
            hitSlop={8}
          >
            {dot}
          </Pressable>
        );
      })}
    </View>
  );
}

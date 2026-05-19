import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';

interface Props {
  count: number;
  current: number;
  onSelect?: (index: number) => void;
}

export function OnboardingDots({ count, current, onSelect }: Props) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs }}>
      {Array.from({ length: count }, (_, i) => {
        const active = i === current;
        const dot = (
          <View
            style={{
              width: active ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: active ? colors.accent : colors.border,
            }}
          />
        );
        if (!onSelect) return <View key={i}>{dot}</View>;
        return (
          <Pressable
            key={i}
            onPress={() => onSelect(i)}
            hitSlop={8}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            {dot}
          </Pressable>
        );
      })}
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface Props {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  subtitle?: string;
  subtitleJa?: string;
  bullets?: string[];
  children?: ReactNode;
}

export function OnboardingSlide({ icon, iconColor, title, subtitle, subtitleJa, bullets, children }: Props) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ flex: 1, paddingHorizontal: spacing.xl, justifyContent: 'center' }}>
      {icon ? (
        <View style={{ alignItems: 'center', marginBottom: spacing.lg }}>
          <View
            style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              backgroundColor: colors.brandSubtle,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={56} color={iconColor ?? colors.brand} />
          </View>
        </View>
      ) : null}
      <Text style={[typography.title1, { color: colors.text, textAlign: 'center' }]}>{title}</Text>
      {subtitle ? (
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
          ]}
        >
          {subtitle}
        </Text>
      ) : null}
      {subtitleJa ? (
        <Text
          style={[
            typography.footnote,
            { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, opacity: 0.7 },
          ]}
        >
          {subtitleJa}
        </Text>
      ) : null}
      {bullets ? (
        <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
          {bullets.map((b) => (
            <View key={b} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{b}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {children}
    </View>
  );
}

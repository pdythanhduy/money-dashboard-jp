import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface SettingsSectionProps {
  title: string;
  footer?: string;
  children: ReactNode;
}

export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text
        style={[
          typography.footnote,
          {
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            paddingHorizontal: spacing.lg,
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>
      <View
        style={{
          marginHorizontal: spacing.lg,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
      {footer ? (
        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.xs,
            },
          ]}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

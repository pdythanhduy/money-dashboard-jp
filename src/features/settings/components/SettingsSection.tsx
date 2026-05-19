import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface Props {
  title: string;
  footer?: string;
  children: ReactNode;
}

export function SettingsSection({ title, footer, children }: Props) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ marginTop: spacing.lg }}>
      <Text
        style={[
          typography.footnote,
          {
            color: colors.textSecondary,
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xs,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          },
        ]}
      >
        {title}
      </Text>
      <View
        style={{
          marginHorizontal: spacing.lg,
          backgroundColor: colors.surfaceElevated,
          borderRadius: radius.md,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
      {footer ? (
        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
          ]}
        >
          {footer}
        </Text>
      ) : null}
    </View>
  );
}

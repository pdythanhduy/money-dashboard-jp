import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface DashboardSectionProps {
  /** Pre-translated short title, e.g. "HÔM NAY" / "今日". */
  title: string;
  children: ReactNode;
}

/**
 * Tiny visual section header used by the new sectioned Dashboard layout
 * (0.3+). Mirrors the SettingsScreen `SettingsSection` look — uppercase
 * footnote in `textSecondary`, no card chrome (children carry their own).
 *
 * Vertical rhythm: section header gets the same top-margin (spacing.lg)
 * the legacy stack used to give individual cards, so we don't *grow* the
 * Dashboard vertically — we just regroup what's already there.
 */
export function DashboardSection({ title, children }: DashboardSectionProps) {
  const { colors, typography, spacing } = useTheme();
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
            marginBottom: -spacing.xs,
            // ↑ negative margin so the first child card's existing
            //   marginTop: spacing.md visually sits ~spacing.xs below the
            //   header (instead of compounding to spacing.lg+md = too far).
          },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

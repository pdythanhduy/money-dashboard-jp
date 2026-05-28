import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

interface DashboardSectionProps {
  /** Pre-translated short title, e.g. "HÔM NAY" / "今日". */
  title: string;
  children: ReactNode;
  /**
   * Stable identifier used to persist collapse state. Required when
   * `collapsible` is true. Avoid renaming once shipped — old persisted
   * entries become orphaned and the section silently re-opens.
   */
  id?: string;
  /**
   * When true, the header becomes a tap target and the body folds away.
   * Collapse state persists per-section across launches via settings.
   */
  collapsible?: boolean;
}

/**
 * Tiny visual section header used by the new sectioned Dashboard layout
 * (0.3+). Mirrors the SettingsScreen `SettingsSection` look — uppercase
 * footnote in `textSecondary`, no card chrome (children carry their own).
 *
 * Vertical rhythm: section header gets the same top-margin (spacing.lg)
 * the legacy stack used to give individual cards, so we don't *grow* the
 * Dashboard vertically — we just regroup what's already there.
 *
 * Collapsibility (0.4+): opt-in via `collapsible` + `id`. Fold state lives
 * in `settings.collapsedDashboardSections` so a tap on day-1 sticks
 * across sessions. Non-collapsible sections render exactly as before.
 */
export function DashboardSection({ title, children, id, collapsible }: DashboardSectionProps) {
  const { colors, typography, spacing } = useTheme();
  const collapsed = useSettingsStore((s) =>
    collapsible && id ? s.settings.collapsedDashboardSections.includes(id) : false,
  );
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const toggle = () => {
    if (!collapsible || !id) return;
    const current = useSettingsStore.getState().settings.collapsedDashboardSections;
    const next = current.includes(id) ? current.filter((k) => k !== id) : [...current, id];
    updateSetting('collapsedDashboardSections', next);
  };

  return (
    <View style={{ marginTop: spacing.lg }}>
      {collapsible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: !collapsed }}
          accessibilityLabel={title}
          onPress={toggle}
          hitSlop={8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            marginBottom: collapsed ? 0 : -spacing.xs,
            gap: spacing.xs,
          }}
        >
          <Text
            style={[
              typography.footnote,
              {
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 0.6,
                flex: 1,
              },
            ]}
          >
            {title}
          </Text>
          <Ionicons
            name={collapsed ? 'chevron-down' : 'chevron-up'}
            size={16}
            color={colors.textSecondary}
          />
        </Pressable>
      ) : (
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
      )}
      {collapsed ? null : children}
    </View>
  );
}

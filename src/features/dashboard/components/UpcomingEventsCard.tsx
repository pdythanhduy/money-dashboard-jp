import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { UpcomingReminder } from '@/features/dashboard/dashboard-logic';
import { useTheme } from '@/theme';

interface UpcomingEventsCardProps {
  reminders: readonly UpcomingReminder[];
}

export function UpcomingEventsCard({ reminders }: UpcomingEventsCardProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();

  if (reminders.length === 0) return null;

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.lg,
        ...(isDark
          ? {
              shadowColor: '#000',
              shadowOpacity: 0.3,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            }
          : {}),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
        <Ionicons name="calendar-outline" size={18} color={colors.warning} />
        <Text style={[typography.headline, { color: colors.text }]}>
          {t('dashboard.upcoming.title')}
        </Text>
      </View>
      {reminders.map((r) => {
        // Per-document reminders use either:
        //   `doc:<type>:<id>:<title>` — Phase 5V. Render the title verbatim.
        //   `doc:<kind>:<id>`         — legacy Phase 5K. Look up i18n label.
        // System reminders (e.g. `kakuteiShinkoku`) use
        // `dashboard.upcoming.items.<key>`.
        let label: string;
        if (r.i18nKey.startsWith('doc:')) {
          const parts = r.i18nKey.slice('doc:'.length).split(':');
          if (parts.length >= 3) {
            label = parts.slice(2).join(':');
          } else {
            const kind = parts[0] ?? 'other';
            label = t(`documents.kinds.${kind}`);
          }
        } else {
          label = t(`dashboard.upcoming.items.${r.i18nKey}`);
        }
        return (
          <View
            key={r.i18nKey}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingVertical: spacing.sm,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text style={[typography.body, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {label}
            </Text>
            <Text
              style={[
                typography.caption,
                { color: r.daysLeft <= 14 ? colors.warning : colors.textSecondary, fontWeight: '600' },
              ]}
            >
              {r.daysLeft === 0
                ? t('dashboard.upcoming.today')
                : t('dashboard.upcoming.daysLeft', { days: r.daysLeft })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

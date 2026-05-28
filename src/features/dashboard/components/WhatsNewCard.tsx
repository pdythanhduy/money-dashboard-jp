import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { APP_BUILD, APP_VERSION } from '@/lib/app-info';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

/**
 * One-time release-notes card that appears on the Dashboard after the
 * app updates to a new build. Dismissing it writes `APP_BUILD` to
 * `settings.lastSeenReleaseNotesBuild`, so the next render hides it
 * until the user installs a newer build.
 *
 * No network — release notes live in i18n. Items array is keyed off the
 * current version (`releaseNotes.{version}.items.*`) and falls back to a
 * generic placeholder if a particular version's notes haven't been
 * authored yet.
 */
export function WhatsNewCard() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const seen = useSettingsStore((s) => s.settings.lastSeenReleaseNotesBuild);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  if (seen === APP_BUILD) return null;

  // Items shaped as a fixed-length tuple in i18n. We render every
  // declared key; missing translations fall back to the key string —
  // visible during dev but never on a localised release.
  const items: ReadonlyArray<string> = [
    t('releaseNotes.v030.items.bonus'),
    t('releaseNotes.v030.items.calendar'),
    t('releaseNotes.v030.items.deductions'),
  ];

  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Ionicons name="sparkles-outline" size={20} color={colors.brand} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.headline, { color: colors.text }]}>
            {t('releaseNotes.title', { version: APP_VERSION })}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('releaseNotes.dismiss')}
          onPress={() => updateSetting('lastSeenReleaseNotesBuild', APP_BUILD)}
          hitSlop={12}
          style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      <View style={{ gap: spacing.xs }}>
        {items.map((item, idx) => (
          <View key={idx} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <Text style={[typography.body, { color: colors.brand }]}>•</Text>
            <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

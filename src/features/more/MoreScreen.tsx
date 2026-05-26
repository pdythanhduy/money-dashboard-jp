import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { SettingsSection } from '@/features/settings/components/SettingsSection';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useTheme } from '@/theme';

/**
 * "More" tab — secondary navigation hub that surfaces every screen no
 * longer pinned to the bottom tab bar. Items are grouped by mental model
 * (management / Japan-life-admin / settings) rather than by feature
 * implementation, so a Vietnamese-in-Japan user can find them by intent.
 *
 * Each row pushes the target screen onto the ROOT stack (RootNavigator),
 * NOT a nested More-stack, so back-navigation lands on the More tab
 * exactly like every other screen launched from a tab.
 */

type MoreNavigation = NativeStackNavigationProp<RootStackParamList>;

interface MoreRow {
  key: keyof Pick<
    RootStackParamList,
    'History' | 'Documents' | 'Goals' | 'Kakutei' | 'TripBudget' | 'Settings'
  >;
  icon: keyof typeof Ionicons.glyphMap;
  titleKey: string;
  subtitleKey: string;
}

const GROUPS: ReadonlyArray<{
  titleKey: string;
  rows: readonly MoreRow[];
}> = [
  {
    titleKey: 'more.groups.management',
    rows: [
      { key: 'History',    icon: 'time-outline',        titleKey: 'more.items.history.title',   subtitleKey: 'more.items.history.subtitle' },
      { key: 'Documents',  icon: 'document-text-outline', titleKey: 'more.items.documents.title', subtitleKey: 'more.items.documents.subtitle' },
      { key: 'Goals',      icon: 'flag-outline',        titleKey: 'more.items.goals.title',     subtitleKey: 'more.items.goals.subtitle' },
    ],
  },
  {
    titleKey: 'more.groups.japanLife',
    rows: [
      { key: 'Kakutei',    icon: 'calculator-outline',  titleKey: 'more.items.kakutei.title',   subtitleKey: 'more.items.kakutei.subtitle' },
      { key: 'TripBudget', icon: 'airplane-outline',    titleKey: 'more.items.tripBudget.title', subtitleKey: 'more.items.tripBudget.subtitle' },
    ],
  },
  {
    titleKey: 'more.groups.settings',
    rows: [
      { key: 'Settings',   icon: 'settings-outline',    titleKey: 'more.items.settings.title',  subtitleKey: 'more.items.settings.subtitle' },
    ],
  },
];

export function MoreScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<MoreNavigation>();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <Text style={[typography.largeTitle, { color: colors.text }]}>{t('tabs.more')}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {GROUPS.map((group) => (
          <SettingsSection key={group.titleKey} title={t(group.titleKey)}>
            {group.rows.map((row, idx) => (
              <Row
                key={row.key}
                icon={row.icon}
                title={t(row.titleKey)}
                subtitle={t(row.subtitleKey)}
                isLast={idx === group.rows.length - 1}
                onPress={() => navigation.navigate(row.key)}
                accessibilityHint={t(row.subtitleKey)}
              />
            ))}
          </SettingsSection>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  isLast: boolean;
  onPress: () => void;
  accessibilityHint?: string;
}

function Row({ icon, title, subtitle, isLast, onPress, accessibilityHint }: RowProps) {
  const { colors, typography, spacing } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        minHeight: 56,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.border,
        backgroundColor: pressed ? colors.brandSubtle : 'transparent',
        gap: spacing.md,
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: colors.brandSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.text }]}>{title}</Text>
        {subtitle ? (
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
    </Pressable>
  );
}

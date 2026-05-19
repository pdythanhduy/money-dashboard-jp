import Constants from 'expo-constants';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AboutModal } from '@/features/settings/components/AboutModal';
import { ClearDataConfirmModal } from '@/features/settings/components/ClearDataConfirmModal';
import { PickerModal, type PickerOption } from '@/features/settings/components/PickerModal';
import { SettingsItem } from '@/features/settings/components/SettingsItem';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { clearAllUserData, exportUserData } from '@/features/settings/data-actions';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore, type LanguageSetting, type ThemeSetting } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import type { Prefecture } from '@/types/tax';

const PRIVACY_URL = 'https://kakei.app/privacy'; // TODO: replace once live
const TERMS_URL = 'https://kakei.app/terms';     // TODO: replace once live
const FEEDBACK_EMAIL = 'feedback@kakei.app';

const PREFECTURES: readonly Prefecture[] = [
  'tokyo', 'osaka', 'aichi', 'kanagawa', 'saitama', 'chiba', 'hyogo', 'fukuoka',
];

export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  const [activeModal, setActiveModal] = useState<
    'language' | 'theme' | 'prefecture' | 'payday' | 'about' | 'clearData' | null
  >(null);
  const close = () => setActiveModal(null);

  const languageOptions: PickerOption<LanguageSetting>[] = [
    { value: 'system', label: t('settings.language.system') },
    { value: 'vi', label: t('settings.language.vi') },
    { value: 'ja', label: t('settings.language.ja') },
  ];
  const themeOptions: PickerOption<ThemeSetting>[] = [
    { value: 'system', label: t('settings.theme.system') },
    { value: 'light', label: t('settings.theme.light') },
    { value: 'dark', label: t('settings.theme.dark') },
  ];
  const prefectureOptions: PickerOption<Prefecture>[] = PREFECTURES.map((p) => ({
    value: p,
    label: t(`calculator.prefectures.${p}.label`),
  }));
  const paydayOptions: PickerOption<number>[] = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: t('settings.payday.dayOfMonth', { day: i + 1 }),
  }));

  const versionLabel = `v${Constants.expoConfig?.version ?? '0.1.0'}`;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Text style={[typography.largeTitle, { color: colors.text }]}>
            {t('settings.title')}
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            {t('settings.subtitle')}
          </Text>
        </View>

        <SettingsSection title={t('settings.sections.personal')}>
          <SettingsItem
            kind="navigation"
            icon="globe-outline"
            label={t('settings.items.language')}
            value={t(`settings.language.${settings.language}`)}
            onPress={() => setActiveModal('language')}
          />
          <SettingsItem
            kind="navigation"
            icon="moon-outline"
            label={t('settings.items.theme')}
            value={t(`settings.theme.${settings.theme}`)}
            onPress={() => setActiveModal('theme')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.payroll')}>
          <SettingsItem
            kind="navigation"
            icon="location-outline"
            label={t('settings.items.defaultPrefecture')}
            value={
              settings.defaultPrefecture
                ? t(`calculator.prefectures.${settings.defaultPrefecture}.label`)
                : t('settings.notSet')
            }
            onPress={() => setActiveModal('prefecture')}
          />
          <SettingsItem
            kind="navigation"
            icon="calendar-outline"
            label={t('settings.items.payday')}
            value={t('settings.payday.dayOfMonth', { day: settings.payday })}
            onPress={() => setActiveModal('payday')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.notifications')} footer={t('settings.comingSoon')}>
          <SettingsItem
            kind="toggle"
            icon="notifications-outline"
            label={t('settings.items.notifications')}
            value={settings.notificationsEnabled}
            onValueChange={(v) => updateSetting('notificationsEnabled', v)}
            disabled
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.security')} footer={t('settings.comingSoon')}>
          <SettingsItem
            kind="toggle"
            icon="finger-print-outline"
            label={t('settings.items.faceId')}
            value={settings.faceIdEnabled}
            onValueChange={(v) => updateSetting('faceIdEnabled', v)}
            disabled
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.data')}>
          <SettingsItem
            kind="action"
            icon="download-outline"
            label={t('settings.items.exportData')}
            onPress={() => {
              exportUserData().catch((err) => console.warn('[export] failed', err));
            }}
          />
          <SettingsItem
            kind="action"
            icon="trash-outline"
            iconColor={colors.danger}
            label={t('settings.items.clearData')}
            destructive
            onPress={() => setActiveModal('clearData')}
            isLast={!__DEV__}
          />
          {__DEV__ ? (
            <SettingsItem
              kind="action"
              icon="refresh-outline"
              label={t('settings.items.resetOnboarding')}
              onPress={resetOnboarding}
              isLast
            />
          ) : null}
        </SettingsSection>

        <SettingsSection title={t('settings.sections.legal')}>
          <SettingsItem
            kind="navigation"
            icon="shield-checkmark-outline"
            label={t('settings.items.privacy')}
            onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
          />
          <SettingsItem
            kind="navigation"
            icon="document-text-outline"
            label={t('settings.items.terms')}
            onPress={() => Linking.openURL(TERMS_URL).catch(() => {})}
          />
          <SettingsItem
            kind="navigation"
            icon="information-circle-outline"
            label={t('settings.items.about')}
            onPress={() => setActiveModal('about')}
            isLast
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.app')}>
          <SettingsItem
            kind="navigation"
            icon="apps-outline"
            label={t('settings.items.version')}
            value={versionLabel}
            onPress={() => setActiveModal('about')}
          />
          <SettingsItem
            kind="navigation"
            icon="mail-outline"
            label={t('settings.items.feedback')}
            value={FEEDBACK_EMAIL}
            onPress={() => Linking.openURL(`mailto:${FEEDBACK_EMAIL}`).catch(() => {})}
            isLast
          />
        </SettingsSection>

        <Text
          style={[
            typography.caption,
            { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.lg, marginTop: spacing.lg },
          ]}
        >
          ❤️ {t('settings.about.madeFor')}
        </Text>
      </ScrollView>

      <PickerModal
        visible={activeModal === 'language'}
        title={t('settings.items.language')}
        options={languageOptions}
        selected={settings.language}
        onSelect={(v) => updateSetting('language', v)}
        onClose={close}
      />
      <PickerModal
        visible={activeModal === 'theme'}
        title={t('settings.items.theme')}
        options={themeOptions}
        selected={settings.theme}
        onSelect={(v) => updateSetting('theme', v)}
        onClose={close}
      />
      <PickerModal
        visible={activeModal === 'prefecture'}
        title={t('settings.items.defaultPrefecture')}
        options={prefectureOptions}
        selected={settings.defaultPrefecture}
        onSelect={(v) => updateSetting('defaultPrefecture', v)}
        onClose={close}
      />
      <PickerModal
        visible={activeModal === 'payday'}
        title={t('settings.items.payday')}
        options={paydayOptions}
        selected={settings.payday}
        onSelect={(v) => updateSetting('payday', v)}
        onClose={close}
      />
      <AboutModal visible={activeModal === 'about'} onClose={close} />
      <ClearDataConfirmModal
        visible={activeModal === 'clearData'}
        onClose={close}
        onConfirm={() => {
          clearAllUserData()
            .catch((err) => console.warn('[clear] failed', err))
            .finally(close);
        }}
      />
    </SafeAreaView>
  );
}

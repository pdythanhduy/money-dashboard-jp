/**
 * Settings tab — orchestrator for the 7 sections. Sticks all picker /
 * confirm modals at the bottom of the JSX so the JSX above stays
 * declarative (state → row → action handler).
 */

import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AboutModal } from '@/features/settings/components/AboutModal';
import { ClearDataConfirmModal } from '@/features/settings/components/ClearDataConfirmModal';
import { LanguagePicker } from '@/features/settings/components/LanguagePicker';
import { MunicipalityPicker } from '@/features/settings/components/MunicipalityPicker';
import { PaydayPicker } from '@/features/settings/components/PaydayPicker';
import { PrefecturePicker } from '@/features/settings/components/PrefecturePicker';
import { SettingsItem } from '@/features/settings/components/SettingsItem';
import { SettingsSection } from '@/features/settings/components/SettingsSection';
import { ThemePicker } from '@/features/settings/components/ThemePicker';
import { buildExportPayload, wipeAllAppData } from '@/features/settings/data-actions';
import { APP_BUILD, APP_VERSION } from '@/lib/app-info';
import { useHistoryStore } from '@/store/historyStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

type ModalKey = 'language' | 'theme' | 'prefecture' | 'municipality' | 'payday' | 'about' | 'clear';

export function SettingsScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();

  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const entries = useHistoryStore((s) => s.entries);
  const resetOnboarding = useOnboardingStore((s) => s.reset);

  const [openModal, setOpenModal] = useState<ModalKey | null>(null);

  const close = useCallback(() => setOpenModal(null), []);

  const languageDisplay = (() => {
    if (settings.language === 'vi') return t('settings.values.languageVi');
    if (settings.language === 'ja') return t('settings.values.languageJa');
    return t('settings.values.languageSystem');
  })();

  const themeDisplay = (() => {
    if (settings.theme === 'light') return t('settings.values.themeLight');
    if (settings.theme === 'dark') return t('settings.values.themeDark');
    return t('settings.values.themeSystem');
  })();

  const prefectureDisplay = settings.defaultPrefecture
    ? t(`calculator.prefectures.${settings.defaultPrefecture}.label`)
    : t('settings.values.notSet');

  const municipalityDisplay = settings.defaultMunicipality
    ? t(`calculator.municipalities.${settings.defaultMunicipality}.label`)
    : t('settings.values.notSet');

  const paydayDisplay = t('settings.values.dayOfMonth', { day: settings.payday });

  const handleExport = useCallback(async () => {
    if (entries.length === 0) {
      Alert.alert(t('settings.export.noData'));
      return;
    }
    try {
      const payload = buildExportPayload(settings, entries);
      const json = JSON.stringify(payload, null, 2);
      await Share.share({
        title: t('settings.export.shareTitle'),
        message: json,
      });
    } catch {
      Alert.alert(t('settings.export.error'));
    }
  }, [entries, settings, t]);

  const handleClearConfirm = useCallback(async () => {
    await wipeAllAppData();
    setOpenModal(null);
    Alert.alert(t('settings.clear.doneToast'));
  }, [t]);

  const openExternal = useCallback(
    (url: string) => {
      Linking.openURL(url).catch(() => {
        Alert.alert(t('settings.legal.openExternal'), url);
      });
    },
    [t],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <Text style={[typography.largeTitle, { color: colors.text }]}>
            {t('settings.title')}
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            {t('settings.subtitle')}
          </Text>
        </View>

        <SettingsSection title={t('settings.sections.personalize')}>
          <SettingsItem
            kind="value"
            icon="language-outline"
            label={t('settings.items.language')}
            value={languageDisplay}
            onPress={() => setOpenModal('language')}
          />
          <SettingsItem
            kind="value"
            icon="contrast-outline"
            label={t('settings.items.theme')}
            value={themeDisplay}
            onPress={() => setOpenModal('theme')}
            showBorder
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.salary')}>
          <SettingsItem
            kind="value"
            icon="location-outline"
            label={t('settings.items.defaultPrefecture')}
            value={prefectureDisplay}
            onPress={() => setOpenModal('prefecture')}
          />
          <SettingsItem
            kind="value"
            icon="business-outline"
            label={t('settings.items.defaultMunicipality')}
            value={municipalityDisplay}
            onPress={() => setOpenModal('municipality')}
            showBorder
          />
          <SettingsItem
            kind="value"
            icon="calendar-outline"
            label={t('settings.items.payday')}
            value={paydayDisplay}
            onPress={() => setOpenModal('payday')}
            showBorder
          />
        </SettingsSection>

        <SettingsSection
          title={t('settings.sections.notifications')}
          footer={t('settings.footers.notifications')}
        >
          <SettingsItem
            kind="toggle"
            icon="notifications-outline"
            label={t('settings.items.notifications')}
            value={settings.notificationsEnabled}
            onChange={(v) => updateSetting('notificationsEnabled', v)}
          />
        </SettingsSection>

        <SettingsSection
          title={t('settings.sections.security')}
          footer={t('settings.footers.security')}
        >
          <SettingsItem
            kind="toggle"
            icon="finger-print-outline"
            label={t('settings.items.faceId')}
            value={settings.faceIdEnabled}
            onChange={(v) => updateSetting('faceIdEnabled', v)}
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.data')}>
          <SettingsItem
            kind="navigate"
            icon="download-outline"
            label={t('settings.items.exportData')}
            onPress={handleExport}
          />
          <SettingsItem
            kind="navigate"
            icon="trash-outline"
            label={t('settings.items.clearData')}
            destructive
            onPress={() => setOpenModal('clear')}
            showBorder
          />
          {__DEV__ ? (
            <SettingsItem
              kind="navigate"
              icon="refresh-outline"
              label={t('settings.items.resetOnboarding')}
              onPress={() => {
                resetOnboarding();
                Alert.alert('Onboarding reset', 'Restart the app to see the flow.');
              }}
              showBorder
            />
          ) : null}
        </SettingsSection>

        <SettingsSection title={t('settings.sections.legal')}>
          <SettingsItem
            kind="navigate"
            icon="shield-checkmark-outline"
            label={t('settings.items.privacy')}
            onPress={() => openExternal(t('settings.legal.privacyUrl'))}
          />
          <SettingsItem
            kind="navigate"
            icon="document-text-outline"
            label={t('settings.items.terms')}
            onPress={() => openExternal(t('settings.legal.termsUrl'))}
            showBorder
          />
          <SettingsItem
            kind="navigate"
            icon="code-slash-outline"
            label={t('settings.items.licenses')}
            onPress={() => setOpenModal('about')}
            showBorder
          />
        </SettingsSection>

        <SettingsSection title={t('settings.sections.about')}>
          <SettingsItem
            kind="value"
            icon="information-circle-outline"
            label={t('settings.items.version')}
            value={APP_VERSION}
            onPress={() => setOpenModal('about')}
          />
          <SettingsItem
            kind="value"
            icon="hammer-outline"
            label={t('settings.items.build')}
            value={APP_BUILD}
            onPress={() => setOpenModal('about')}
            showBorder
          />
          <SettingsItem
            kind="navigate"
            icon="mail-outline"
            label={t('settings.items.contact')}
            onPress={() => openExternal(`mailto:${t('settings.legal.contactEmail')}`)}
            showBorder
          />
        </SettingsSection>

        <Text
          style={[
            typography.caption,
            {
              color: colors.textSecondary,
              textAlign: 'center',
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
            },
          ]}
        >
          {t('settings.items.madeFor')}
        </Text>
      </ScrollView>

      <LanguagePicker
        visible={openModal === 'language'}
        value={settings.language}
        onChange={(v) => updateSetting('language', v)}
        onClose={close}
      />
      <ThemePicker
        visible={openModal === 'theme'}
        value={settings.theme}
        onChange={(v) => updateSetting('theme', v)}
        onClose={close}
      />
      <PrefecturePicker
        visible={openModal === 'prefecture'}
        value={settings.defaultPrefecture}
        onChange={(v) => updateSetting('defaultPrefecture', v)}
        onClose={close}
      />
      <MunicipalityPicker
        visible={openModal === 'municipality'}
        value={settings.defaultMunicipality}
        onChange={(v) => updateSetting('defaultMunicipality', v)}
        onClose={close}
      />
      <PaydayPicker
        visible={openModal === 'payday'}
        value={settings.payday}
        onChange={(v) => updateSetting('payday', v)}
        onClose={close}
      />
      <AboutModal visible={openModal === 'about'} onClose={close} />
      <ClearDataConfirmModal
        visible={openModal === 'clear'}
        onClose={close}
        onConfirm={handleClearConfirm}
      />
    </SafeAreaView>
  );
}

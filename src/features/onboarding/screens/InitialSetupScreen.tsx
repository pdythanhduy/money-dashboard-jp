/**
 * Final onboarding slide — captures the three settings every new user
 * benefits from setting before they hit the dashboard:
 *
 *   - Default prefecture (drives the calculator's 健保 rate lookup).
 *   - Payday (drives dashboard's pacing & countdown).
 *   - Language preference.
 *
 * Slide 4 has no skip button (user reached the end). Finish committed by
 * the navigator's primary button via `onFinish`.
 */

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { OnboardingSlide } from '@/features/onboarding/components/OnboardingSlide';
import { LanguagePicker } from '@/features/settings/components/LanguagePicker';
import { PaydayPicker } from '@/features/settings/components/PaydayPicker';
import { PrefecturePicker } from '@/features/settings/components/PrefecturePicker';
import type { LanguageSetting } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import type { Prefecture } from '@/types/tax';

interface InitialSetupScreenProps {
  prefecture: Prefecture | null;
  payday: number;
  language: LanguageSetting;
  onChangePrefecture: (p: Prefecture) => void;
  onChangePayday: (n: number) => void;
  onChangeLanguage: (l: LanguageSetting) => void;
}

export function InitialSetupScreen({
  prefecture,
  payday,
  language,
  onChangePrefecture,
  onChangePayday,
  onChangeLanguage,
}: InitialSetupScreenProps) {
  const { t } = useTranslation();
  const { typography, spacing, radius } = useTheme();

  const [prefectureOpen, setPrefectureOpen] = useState(false);
  const [paydayOpen, setPaydayOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);

  const prefectureValue = prefecture
    ? t(`calculator.prefectures.${prefecture}.label`)
    : t('settings.values.notSet');

  const languageValue = (() => {
    if (language === 'vi') return t('settings.values.languageVi');
    if (language === 'ja') return t('settings.values.languageJa');
    return t('settings.values.languageSystem');
  })();

  return (
    <>
      <OnboardingSlide>
        <View style={{ flex: 1, paddingTop: spacing.lg }}>
          <Text style={[typography.title1, { color: '#fff', textAlign: 'center' }]}>
            {t('onboarding.slide4.title')}
          </Text>
          <Text
            style={[
              typography.callout,
              {
                color: 'rgba(255,255,255,0.7)',
                textAlign: 'center',
                marginTop: spacing.xs,
              },
            ]}
          >
            {t('onboarding.slide4.subtitle')}
          </Text>

          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <SetupRow
              icon="location-outline"
              label={t('onboarding.slide4.fields.prefecture')}
              sub={t('onboarding.slide4.fields.prefectureSub')}
              value={prefectureValue}
              onPress={() => setPrefectureOpen(true)}
            />
            <SetupRow
              icon="calendar-outline"
              label={t('onboarding.slide4.fields.payday')}
              sub={t('onboarding.slide4.fields.paydaySub')}
              value={t('settings.values.dayOfMonth', { day: payday })}
              onPress={() => setPaydayOpen(true)}
            />
            <SetupRow
              icon="language-outline"
              label={t('onboarding.slide4.fields.language')}
              sub={t('onboarding.slide4.fields.languageSub')}
              value={languageValue}
              onPress={() => setLanguageOpen(true)}
            />
          </View>

          <View
            style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: 'rgba(255,255,255,0.08)',
              flexDirection: 'row',
              gap: spacing.sm,
              alignItems: 'flex-start',
            }}
          >
            <Ionicons name="lock-closed" size={18} color="#f6ad55" style={{ marginTop: 2 }} />
            <Text style={[typography.caption, { color: 'rgba(255,255,255,0.85)', flex: 1 }]}>
              100% offline · No PII · No analytics
            </Text>
          </View>
        </View>
      </OnboardingSlide>

      <PrefecturePicker
        visible={prefectureOpen}
        value={prefecture}
        onChange={onChangePrefecture}
        onClose={() => setPrefectureOpen(false)}
      />
      <PaydayPicker
        visible={paydayOpen}
        value={payday}
        onChange={onChangePayday}
        onClose={() => setPaydayOpen(false)}
      />
      <LanguagePicker
        visible={languageOpen}
        value={language}
        onChange={onChangeLanguage}
        onClose={() => setLanguageOpen(false)}
      />
    </>
  );
}

function SetupRow({
  icon,
  label,
  sub,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  value: string;
  onPress: () => void;
}) {
  const { typography, spacing, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: 'rgba(255,255,255,0.10)',
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(246,173,85,0.20)',
        }}
      >
        <Ionicons name={icon} size={20} color="#f6ad55" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: '#fff' }]}>{label}</Text>
        <Text style={[typography.caption, { color: 'rgba(255,255,255,0.6)', marginTop: 2 }]}>
          {sub}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[typography.callout, { color: '#f6ad55', fontWeight: '600' }]}>
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.5)" />
    </Pressable>
  );
}

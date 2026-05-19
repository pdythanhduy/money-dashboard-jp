import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dimensions,
  FlatList,
  Pressable,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingButton } from '@/features/onboarding/components/OnboardingButton';
import { OnboardingDots } from '@/features/onboarding/components/OnboardingDots';
import { FeatureShowcaseScreen } from '@/features/onboarding/screens/FeatureShowcaseScreen';
import { InitialSetupScreen } from '@/features/onboarding/screens/InitialSetupScreen';
import { WelcomeScreen } from '@/features/onboarding/screens/WelcomeScreen';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import type { Prefecture } from '@/types/tax';

const SLIDE_COUNT = 4;

export function OnboardingNavigator() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { width } = Dimensions.get('window');

  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const listRef = useRef<FlatList>(null);
  const [current, setCurrent] = useState(0);

  // Local form state for slide 4. Persisted to settingsStore only on Finish.
  const [prefecture, setPrefecture] = useState<Prefecture | null>(null);
  const [payday, setPayday] = useState(25);

  const goTo = useCallback((index: number) => {
    listRef.current?.scrollToOffset({ offset: index * width, animated: true });
    setCurrent(index);
  }, [width]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / width);
      if (idx !== current && idx >= 0 && idx < SLIDE_COUNT) setCurrent(idx);
    },
    [current, width],
  );

  const finish = useCallback(() => {
    updateSetting('defaultPrefecture', prefecture);
    updateSetting('payday', payday);
    completeOnboarding();
  }, [prefecture, payday, updateSetting, completeOnboarding]);

  const skip = useCallback(() => {
    // Defaults already in store; just mark done.
    completeOnboarding();
  }, [completeOnboarding]);

  const slides = useMemo(
    () => [
      { key: 'welcome', render: () => <WelcomeScreen /> },
      {
        key: 'calc',
        render: () => (
          <FeatureShowcaseScreen
            icon="calculator-outline"
            title={t('onboarding.calc.title')}
            bullets={[
              t('onboarding.calc.bullet1'),
              t('onboarding.calc.bullet2'),
              t('onboarding.calc.bullet3'),
            ]}
          />
        ),
      },
      {
        key: 'dashboard',
        render: () => (
          <FeatureShowcaseScreen
            icon="trending-up-outline"
            title={t('onboarding.dashboard.title')}
            bullets={[
              t('onboarding.dashboard.bullet1'),
              t('onboarding.dashboard.bullet2'),
              t('onboarding.dashboard.bullet3'),
            ]}
          />
        ),
      },
      {
        key: 'setup',
        render: () => (
          <InitialSetupScreen
            prefecture={prefecture}
            onPrefectureChange={setPrefecture}
            payday={payday}
            onPaydayChange={setPayday}
          />
        ),
      },
    ],
    [t, prefecture, payday],
  );

  const isLast = current === SLIDE_COUNT - 1;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        {!isLast ? (
          <Pressable onPress={skip} hitSlop={8}>
            <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{t('onboarding.skip')}</Text>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(item) => item.key}
        renderItem={({ item }) => <View style={{ width, flex: 1 }}>{item.render()}</View>}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      />

      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg, gap: spacing.md }}>
        <OnboardingDots count={SLIDE_COUNT} current={current} onSelect={goTo} />
        <OnboardingButton
          label={t(isLast ? 'onboarding.finish' : 'onboarding.next')}
          icon="arrow-forward"
          onPress={() => (isLast ? finish() : goTo(current + 1))}
        />
      </View>
    </SafeAreaView>
  );
}

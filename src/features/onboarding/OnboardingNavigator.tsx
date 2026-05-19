/**
 * 4-slide onboarding rendered as a horizontal swipe (FlatList pagingEnabled).
 *
 * The navigator owns three pieces of chrome below the slide area:
 *   - Back arrow (hidden on slide 0)
 *   - Pagination dots (tappable → scroll programmatically)
 *   - Primary CTA — label "Next" on slides 0-2, "Finish" on slide 3
 *
 * Pending picks from slide 4 live in local state and are committed to
 * settingsStore via the batched `updateSettings` only when the user taps
 * Finish. Skip on any of slides 1-3 writes the spec defaults
 * (Tokyo / 25 / system) and marks onboarding complete.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingDots } from '@/features/onboarding/components/OnboardingDots';
import { FeatureShowcaseScreen } from '@/features/onboarding/screens/FeatureShowcaseScreen';
import { InitialSetupScreen } from '@/features/onboarding/screens/InitialSetupScreen';
import { WelcomeScreen } from '@/features/onboarding/screens/WelcomeScreen';
import {
  ONBOARDING_SLIDE_COUNT,
  useOnboardingStore,
} from '@/store/onboardingStore';
import {
  DEFAULT_SETTINGS,
  useSettingsStore,
  type LanguageSetting,
} from '@/store/settingsStore';
import { useTheme } from '@/theme';
import type { Prefecture } from '@/types/tax';

type SlideKey = 0 | 1 | 2 | 3;

export function OnboardingNavigator() {
  const { t } = useTranslation();
  const { typography, spacing, radius } = useTheme();
  const { width } = useWindowDimensions();

  const currentSlide = useOnboardingStore((s) => s.currentSlide);
  const setSlide = useOnboardingStore((s) => s.setSlide);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  const storedPrefecture = useSettingsStore((s) => s.settings.defaultPrefecture);
  const storedPayday = useSettingsStore((s) => s.settings.payday);
  const storedLanguage = useSettingsStore((s) => s.settings.language);
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [pendingPrefecture, setPendingPrefecture] = useState<Prefecture | null>(storedPrefecture);
  const [pendingPayday, setPendingPayday] = useState<number>(storedPayday);
  const [pendingLanguage, setPendingLanguage] = useState<LanguageSetting>(storedLanguage);

  const listRef = useRef<FlatList<SlideKey>>(null);

  // Restore the persisted slide position once we know the canvas width.
  useEffect(() => {
    if (!listRef.current || width === 0) return;
    listRef.current.scrollToOffset({ offset: currentSlide * width, animated: false });
    // We only re-run on width change because programmatic scroll on every
    // currentSlide write would interfere with the user's own swipes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const scrollTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(ONBOARDING_SLIDE_COUNT - 1, index));
      listRef.current?.scrollToOffset({ offset: clamped * width, animated: true });
      setSlide(clamped);
    },
    [setSlide, width],
  );

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
      if (idx !== currentSlide) setSlide(idx);
    },
    [currentSlide, setSlide, width],
  );

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (first && typeof first.index === 'number') {
        useOnboardingStore.getState().setSlide(first.index);
      }
    },
  ).current;

  const applyDefaultsAndComplete = useCallback(() => {
    updateSettings({
      defaultPrefecture: 'tokyo',
      payday: DEFAULT_SETTINGS.payday,
      language: DEFAULT_SETTINGS.language,
    });
    completeOnboarding();
  }, [completeOnboarding, updateSettings]);

  const finishWithPending = useCallback(() => {
    updateSettings({
      defaultPrefecture: pendingPrefecture ?? 'tokyo',
      payday: pendingPayday,
      language: pendingLanguage,
    });
    completeOnboarding();
  }, [completeOnboarding, pendingLanguage, pendingPayday, pendingPrefecture, updateSettings]);

  const isLast = currentSlide >= ONBOARDING_SLIDE_COUNT - 1;
  const skipHandler = isLast ? undefined : applyDefaultsAndComplete;

  const renderSlide = useCallback(
    ({ item }: { item: SlideKey }) => (
      <View style={{ width, flex: 1 }}>
        {item === 0 ? (
          <WelcomeScreen onSkip={applyDefaultsAndComplete} />
        ) : item === 1 ? (
          <FeatureShowcaseScreen slideIndex={1} onSkip={applyDefaultsAndComplete} />
        ) : item === 2 ? (
          <FeatureShowcaseScreen slideIndex={2} onSkip={applyDefaultsAndComplete} />
        ) : (
          <InitialSetupScreen
            prefecture={pendingPrefecture}
            payday={pendingPayday}
            language={pendingLanguage}
            onChangePrefecture={setPendingPrefecture}
            onChangePayday={setPendingPayday}
            onChangeLanguage={setPendingLanguage}
          />
        )}
      </View>
    ),
    [
      applyDefaultsAndComplete,
      pendingLanguage,
      pendingPayday,
      pendingPrefecture,
      width,
    ],
  );

  return (
    <LinearGradient
      colors={['#1a365d', '#2c5282', '#102a43']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <FlatList
        ref={listRef}
        data={SLIDE_KEYS}
        keyExtractor={(k) => String(k)}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        initialScrollIndex={currentSlide}
      />

      <SafeAreaView edges={['bottom']}>
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.md }}>
          <OnboardingDots
            count={ONBOARDING_SLIDE_COUNT}
            current={currentSlide}
            onJump={scrollTo}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            {currentSlide > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.back')}
                onPress={() => scrollTo(currentSlide - 1)}
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: radius.pill,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => (isLast ? finishWithPending() : scrollTo(currentSlide + 1))}
              style={{
                flex: 1,
                minHeight: 54,
                borderRadius: radius.pill,
                backgroundColor: '#f6ad55',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: spacing.xs,
              }}
            >
              <Text style={[typography.headline, { color: '#1a202c', fontWeight: '700' }]}>
                {isLast ? t('onboarding.finish') : t('onboarding.next')}
              </Text>
              <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={20} color="#1a202c" />
            </Pressable>

            {skipHandler ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.skip')}
                onPress={skipHandler}
                style={{
                  paddingHorizontal: spacing.md,
                  height: 54,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[typography.callout, { color: 'rgba(255,255,255,0.85)' }]}>
                  {t('onboarding.skip')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const SLIDE_KEYS: SlideKey[] = [0, 1, 2, 3];

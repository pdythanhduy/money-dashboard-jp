/**
 * Visual chrome shared by every onboarding slide:
 *
 *   - Full-bleed navy gradient background.
 *   - Skip button pinned top-right (renders nothing for the last slide).
 *   - Slide body in the centered scroll area.
 *   - Pagination dots + primary/secondary actions at the bottom.
 *
 * The slide owns scrolling so individual screens can stay declarative.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OnboardingDots } from '@/features/onboarding/components/OnboardingDots';
import { ONBOARDING_SLIDE_COUNT } from '@/store/onboardingStore';
import { useTheme } from '@/theme';

interface OnboardingSlideProps {
  slideIndex: number;
  onSkip?: () => void;
  onJumpToSlide?: (i: number) => void;
  primaryAction: { label: string; onPress: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onPress: () => void };
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function OnboardingSlide({
  slideIndex,
  onSkip,
  onJumpToSlide,
  primaryAction,
  secondaryAction,
  children,
  contentStyle,
}: OnboardingSlideProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <LinearGradient
      colors={['#1a365d', '#2c5282', '#102a43']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: spacing.lg,
            minHeight: 44,
            alignItems: 'center',
          }}
        >
          {onSkip ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.skip')}
              onPress={onSkip}
              hitSlop={12}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radius.pill,
                backgroundColor: 'rgba(255,255,255,0.12)',
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              <Text style={[typography.callout, { color: '#fff' }]}>
                {t('onboarding.skip')}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={[
            { flexGrow: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
            contentStyle,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          <OnboardingDots
            count={ONBOARDING_SLIDE_COUNT}
            current={slideIndex}
            {...(onJumpToSlide ? { onJump: onJumpToSlide } : {})}
          />

          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !!primaryAction.disabled }}
              disabled={primaryAction.disabled}
              onPress={primaryAction.onPress}
              style={{
                minHeight: 54,
                borderRadius: radius.pill,
                backgroundColor: colors.accent,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: primaryAction.disabled ? 0.4 : 1,
              }}
            >
              <Text style={[typography.headline, { color: '#1a202c' }]}>
                {primaryAction.label}
              </Text>
            </Pressable>

            {secondaryAction ? (
              <Pressable
                accessibilityRole="button"
                onPress={secondaryAction.onPress}
                style={{
                  minHeight: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={[typography.callout, { color: '#fff', opacity: 0.85 }]}>
                  {secondaryAction.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

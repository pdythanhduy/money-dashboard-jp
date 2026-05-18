import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { OnboardingSlide } from '@/features/onboarding/components/OnboardingSlide';
import { useTheme } from '@/theme';

interface FeatureShowcaseScreenProps {
  slideIndex: 1 | 2;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onJumpToSlide: (i: number) => void;
}

const COPY_KEY_BY_INDEX = {
  1: 'slide2',
  2: 'slide3',
} as const;

const ICON_BY_INDEX: Record<1 | 2, keyof typeof Ionicons.glyphMap> = {
  1: 'calculator',
  2: 'trending-up',
};

export function FeatureShowcaseScreen({
  slideIndex,
  onNext,
  onBack,
  onSkip,
  onJumpToSlide,
}: FeatureShowcaseScreenProps) {
  const { t } = useTranslation();
  const { typography, spacing, radius } = useTheme();
  const copy = COPY_KEY_BY_INDEX[slideIndex];

  const bulletKeys = ['reform', 'deduction', 'wall'] as const;
  const slide3BulletKeys = ['daily', 'countdown', 'trend'] as const;

  const keys = slideIndex === 1 ? bulletKeys : slide3BulletKeys;

  return (
    <OnboardingSlide
      slideIndex={slideIndex}
      onSkip={onSkip}
      onJumpToSlide={onJumpToSlide}
      primaryAction={{ label: t('onboarding.next'), onPress: onNext }}
      secondaryAction={{ label: t('onboarding.back'), onPress: onBack }}
    >
      <View style={{ flex: 1, paddingTop: spacing.xl }}>
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: radius.xl,
            backgroundColor: 'rgba(246,173,85,0.18)',
            borderWidth: 1.5,
            borderColor: '#f6ad55',
            alignItems: 'center',
            justifyContent: 'center',
            alignSelf: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <Ionicons name={ICON_BY_INDEX[slideIndex]} size={48} color="#f6ad55" />
        </View>

        <Text style={[typography.title1, { color: '#fff', textAlign: 'center' }]}>
          {t(`onboarding.${copy}.title`)}
        </Text>
        <Text
          style={[
            typography.callout,
            { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: spacing.xs },
          ]}
        >
          {t(`onboarding.${copy}.subtitle`)}
        </Text>

        <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
          {keys.map((bk) => (
            <View
              key={bk}
              style={{
                flexDirection: 'row',
                gap: spacing.md,
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: 'rgba(255,255,255,0.08)',
                alignItems: 'flex-start',
              }}
            >
              <Ionicons name="checkmark-circle" size={22} color="#f6ad55" style={{ marginTop: 2 }} />
              <Text style={[typography.body, { color: '#fff', flex: 1 }]}>
                {t(`onboarding.${copy}.bullets.${bk}`)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </OnboardingSlide>
  );
}

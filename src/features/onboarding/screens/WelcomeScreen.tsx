import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { OnboardingSlide } from '@/features/onboarding/components/OnboardingSlide';
import { useTheme } from '@/theme';

interface WelcomeScreenProps {
  onSkip: () => void;
}

export function WelcomeScreen({ onSkip }: WelcomeScreenProps) {
  const { t } = useTranslation();
  const { typography, spacing } = useTheme();

  return (
    <OnboardingSlide onSkip={onSkip}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg }}>
        <View
          style={{
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: 'rgba(246,173,85,0.18)',
            borderWidth: 2,
            borderColor: '#f6ad55',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 56, fontWeight: '700', color: '#f6ad55' }}>
            {t('onboarding.slide1.logoText')}
          </Text>
        </View>

        <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing.md }}>
          <Text style={[typography.largeTitle, { color: '#fff', textAlign: 'center' }]}>
            {t('onboarding.slide1.title')}
          </Text>
          <Text
            style={[
              typography.body,
              { color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 320 },
            ]}
          >
            {t('onboarding.slide1.subtitle')}
          </Text>
          <Text
            style={[
              typography.callout,
              { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: spacing.xs },
            ]}
          >
            {t('onboarding.slide1.subtitleJa')}
          </Text>
        </View>
      </View>
    </OnboardingSlide>
  );
}

import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useTheme } from '@/theme';

export function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl }}>
      <Text style={{ fontSize: 64, fontWeight: '800', color: colors.brand, letterSpacing: 2 }}>
        Kakei
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: 4, opacity: 0.7 }]}>
        家計
      </Text>
      <Text
        style={[
          typography.title2,
          { color: colors.text, textAlign: 'center', marginTop: spacing.xl },
        ]}
      >
        {t('onboarding.welcome.title')}
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
        ]}
      >
        {t('onboarding.welcome.subtitle')}
      </Text>
      <Text
        style={[
          typography.footnote,
          { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, opacity: 0.7 },
        ]}
      >
        {t('onboarding.welcome.subtitleJa')}
      </Text>
    </View>
  );
}

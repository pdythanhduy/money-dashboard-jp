/**
 * Visual chrome for a single onboarding slide. After the Phase 5F refactor
 * each slide is one panel inside a horizontally-paged FlatList in
 * OnboardingNavigator — so dots + primary/secondary buttons live up there,
 * NOT here.
 *
 *   - Full-bleed navy gradient background.
 *   - Skip button pinned top-right (renders nothing when `onSkip` not passed).
 *   - Content area is a centered ScrollView so long slides remain scrollable
 *     on small phones / landscape.
 */

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface OnboardingSlideProps {
  onSkip?: () => void;
  children: React.ReactNode;
  contentStyle?: ViewStyle;
}

export function OnboardingSlide({ onSkip, children, contentStyle }: OnboardingSlideProps) {
  const { t } = useTranslation();
  const { typography, spacing, radius } = useTheme();

  return (
    <LinearGradient
      colors={['#1a365d', '#2c5282', '#102a43']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
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
      </SafeAreaView>
    </LinearGradient>
  );
}

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface EmptyStateProps {
  onPressCta: () => void;
  /** Optional overrides — when not provided, falls back to the generic
   *  "Bắt đầu hành trình..." copy. Used by zero-income edge case. */
  title?: string;
  subtitle?: string;
}

export function EmptyState({ onPressCta, title, subtitle }: EmptyStateProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const titleText = title ?? t('dashboard.empty.title');
  const subtitleText = subtitle ?? t('dashboard.empty.subtitle');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
        }}
      >
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            backgroundColor: colors.brandSubtle,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.lg,
          }}
        >
          <Ionicons name="calculator-outline" size={48} color={colors.brand} />
        </View>
        <Text
          style={[
            typography.title2,
            { color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
          ]}
        >
          {titleText}
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
          ]}
        >
          {subtitleText}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.empty.cta')}
          onPress={onPressCta}
          style={({ pressed }) => ({
            backgroundColor: colors.brand,
            paddingHorizontal: spacing.xl,
            paddingVertical: spacing.md,
            borderRadius: radius.pill,
            opacity: pressed ? 0.85 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          })}
        >
          <Ionicons name="arrow-forward" size={20} color={colors.textInverse} />
          <Text style={[typography.headline, { color: colors.textInverse }]}>
            {t('dashboard.empty.cta')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

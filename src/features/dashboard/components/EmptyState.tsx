import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface EmptyStateProps {
  onPressCta: () => void;
}

export function EmptyState({ onPressCta }: EmptyStateProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

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
          {t('dashboard.empty.title')}
        </Text>
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xs },
          ]}
        >
          {t('dashboard.empty.subtitle')}
        </Text>
        <Text
          style={[
            typography.footnote,
            { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, opacity: 0.7 },
          ]}
        >
          {t('dashboard.empty.subtitleJa')}
        </Text>
        <Pressable
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

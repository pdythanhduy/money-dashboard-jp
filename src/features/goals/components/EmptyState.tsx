import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme';

interface Props {
  onPressCta: () => void;
}

export function EmptyState({ onPressCta }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View
      style={{
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.border,
        backgroundColor: colors.surface,
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <Ionicons name="flag-outline" size={36} color={colors.textSecondary} />
      <Text style={[typography.body, { color: colors.text, textAlign: 'center', fontWeight: '600' }]}>
        {t('goals.empty.title')}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
        {t('goals.empty.body')}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('goals.empty.cta')}
        onPress={onPressCta}
        style={({ pressed }) => ({
          marginTop: spacing.sm,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          backgroundColor: colors.brand,
          borderRadius: radius.pill,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={[typography.callout, { color: colors.textInverse, fontWeight: '600' }]}>
          {t('goals.empty.cta')}
        </Text>
      </Pressable>
    </View>
  );
}

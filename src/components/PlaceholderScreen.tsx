import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/theme';

interface PlaceholderScreenProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function PlaceholderScreen({ title, subtitle, icon }: PlaceholderScreenProps) {
  const { colors, typography, spacing } = useTheme();
  // eslint-disable-next-line no-console
  console.log('[PlaceholderScreen] render', title);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
          backgroundColor: colors.background,
        }}
      >
        <Text style={[typography.largeTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
        }}
      >
        <Ionicons name={icon} size={64} color={colors.textSecondary} />
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, marginTop: spacing.md, textAlign: 'center' },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </SafeAreaView>
  );
}

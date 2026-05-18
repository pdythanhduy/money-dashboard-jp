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
  // DEBUG: hardcoded orange background so we can see if PlaceholderScreen
  // actually renders inside the tab navigator. Revert to colors.background.
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'orange' }} edges={['top']}>
      <View
        style={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.sm,
        }}
      >
        <Text style={[typography.largeTitle, { color: 'black' }]}>{title}</Text>
      </View>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
        }}
      >
        <Ionicons name={icon} size={64} color="black" />
        <Text
          style={[
            typography.body,
            { color: 'black', marginTop: spacing.md, textAlign: 'center' },
          ]}
        >
          {subtitle}
        </Text>
      </View>
    </SafeAreaView>
  );
}

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export type OnboardingStackParamList = {
  Welcome: undefined;
};

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

function WelcomeScreen() {
  const { colors, typography, spacing } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, padding: spacing.lg }}>
      <Text style={[typography.title1, { color: colors.text }]}>Onboarding</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
        TODO: 3-step welcome — language picker, prefecture picker, first-time tips.
      </Text>
    </SafeAreaView>
  );
}

export function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
    </Stack.Navigator>
  );
}

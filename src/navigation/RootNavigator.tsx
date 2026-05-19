import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { OnboardingNavigator } from '@/features/onboarding/OnboardingNavigator';
import { useOnboardingStore } from '@/store/onboardingStore';

import { MainTabs } from './MainTabs';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const done = useOnboardingStore((s) => s.hasCompletedOnboarding);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {done ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}

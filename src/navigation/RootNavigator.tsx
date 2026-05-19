import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MedicalScreen } from '@/features/medical/MedicalScreen';
import { OnboardingNavigator } from '@/features/onboarding/OnboardingNavigator';
import { useOnboardingStore } from '@/store/onboardingStore';

import { MainTabs } from './MainTabs';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  /** Push from any tab; back goes to whichever tab pushed it. */
  Medical: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {hasCompletedOnboarding ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Medical" component={MedicalScreen} />
        </>
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}

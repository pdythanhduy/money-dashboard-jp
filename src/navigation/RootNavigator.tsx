import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { MainTabs } from './MainTabs';
import { OnboardingStack } from './OnboardingStack';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// TODO(Phase 5C): replace with a Zustand-backed `useSettingsStore` value.
// Phase 5A always lands on Main so the tab skeleton is visible.
const HAS_COMPLETED_ONBOARDING = true;

export function RootNavigator() {
  // eslint-disable-next-line no-console
  console.log('[RootNavigator] render, onboarded=', HAS_COMPLETED_ONBOARDING);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {HAS_COMPLETED_ONBOARDING ? (
        <Stack.Screen name="Main" component={MainTabs} />
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
      )}
    </Stack.Navigator>
  );
}

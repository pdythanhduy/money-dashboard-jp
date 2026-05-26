import type { NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { DocumentsScreen } from '@/features/documents/DocumentsScreen';
import { FurusatoScreen } from '@/features/furusato/FurusatoScreen';
import { GoalsScreen } from '@/features/goals/GoalsScreen';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import { KakuteiScreen } from '@/features/kakutei/KakuteiScreen';
import { MedicalScreen } from '@/features/medical/MedicalScreen';
import { OnboardingNavigator } from '@/features/onboarding/OnboardingNavigator';
import { RemittanceScreen } from '@/features/remittance/RemittanceScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { TripBudgetScreen } from '@/features/trip/TripBudgetScreen';
import { useOnboardingStore } from '@/store/onboardingStore';

import { MainTabs, type MainTabParamList } from './MainTabs';

export type RootStackParamList = {
  Onboarding: undefined;
  /**
   * Nested tab navigator. `NavigatorScreenParams` lets callers say
   * `navigation.navigate('Main', { screen: 'Calculator' })` from a
   * sibling root-stack screen (e.g. HistoryScreen's empty-state CTA).
   */
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  /** Push from any tab; back goes to whichever tab pushed it. */
  Medical: undefined;
  Furusato: undefined;
  Goals: undefined;
  Remittance: undefined;
  Kakutei: undefined;
  TripBudget: undefined;
  /**
   * Moved out of the bottom-tab bar in 0.3.0 to make room for Calendar
   * and Kakeibo as primary tabs. Reached via the "More" tab → row, OR
   * via direct push from Dashboard cards.
   */
  History: undefined;
  Documents: undefined;
  Settings: undefined;
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
          <Stack.Screen name="Furusato" component={FurusatoScreen} />
          <Stack.Screen name="Goals" component={GoalsScreen} />
          <Stack.Screen name="Remittance" component={RemittanceScreen} />
          <Stack.Screen name="Kakutei" component={KakuteiScreen} />
          <Stack.Screen name="TripBudget" component={TripBudgetScreen} />
          <Stack.Screen name="History" component={HistoryScreen} />
          <Stack.Screen name="Documents" component={DocumentsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}

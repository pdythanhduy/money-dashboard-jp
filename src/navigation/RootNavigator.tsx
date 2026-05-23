import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FurusatoScreen } from '@/features/furusato/FurusatoScreen';
import { GoalsScreen } from '@/features/goals/GoalsScreen';
import { KakeiboScreen } from '@/features/kakeibo/KakeiboScreen';
import { KakuteiScreen } from '@/features/kakutei/KakuteiScreen';
import { MedicalScreen } from '@/features/medical/MedicalScreen';
import { OnboardingNavigator } from '@/features/onboarding/OnboardingNavigator';
import { RemittanceScreen } from '@/features/remittance/RemittanceScreen';
import { TripBudgetScreen } from '@/features/trip/TripBudgetScreen';
import { useOnboardingStore } from '@/store/onboardingStore';

import { MainTabs } from './MainTabs';

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  /** Push from any tab; back goes to whichever tab pushed it. */
  Medical: undefined;
  Furusato: undefined;
  Goals: undefined;
  Kakeibo: undefined;
  Remittance: undefined;
  Kakutei: undefined;
  TripBudget: undefined;
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
          <Stack.Screen name="Kakeibo" component={KakeiboScreen} />
          <Stack.Screen name="Remittance" component={RemittanceScreen} />
          <Stack.Screen name="Kakutei" component={KakuteiScreen} />
          <Stack.Screen name="TripBudget" component={TripBudgetScreen} />
        </>
      ) : (
        <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      )}
    </Stack.Navigator>
  );
}

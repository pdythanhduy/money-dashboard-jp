import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CalculatorScreen } from '@/features/calculator/CalculatorScreen';
import { CalendarScreen } from '@/features/calendar/CalendarScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { KakeiboScreen } from '@/features/kakeibo/KakeiboScreen';
import { MoreScreen } from '@/features/more/MoreScreen';
import { useTheme } from '@/theme';

/**
 * 5-tab bottom bar (0.3.0+). 6-tab crowding was solved by elevating
 * Kakeibo from a root-stack screen → primary tab, demoting History /
 * Documents / Settings into the "More" tab's grouped list, and renaming
 * Dashboard → Home for label brevity. Goals / Kakutei / TripBudget /
 * Medical / Furusato / Remittance remain root-stack screens reachable
 * via Dashboard cards or via More (for the first three).
 */
export type MainTabParamList = {
  Home: undefined;
  Kakeibo: undefined;
  Calculator: undefined;
  Calendar: undefined;
  More: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabName = keyof MainTabParamList;
const TAB_ICONS: Record<TabName, keyof typeof Ionicons.glyphMap> = {
  Home:       'home-outline',
  Kakeibo:    'wallet-outline',
  Calculator: 'calculator-outline',
  Calendar:   'calendar-outline',
  More:       'ellipsis-horizontal-circle-outline',
};

export function MainTabs() {
  const { t } = useTranslation();
  const { colors, typography } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.tabBarActive,
        tabBarInactiveTintColor: colors.tabBarInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: typography.caption.fontFamily, fontSize: typography.caption.fontSize },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home"       component={DashboardScreen}  options={{ tabBarLabel: t('tabs.home') }} />
      <Tab.Screen name="Kakeibo"    component={KakeiboScreen}    options={{ tabBarLabel: t('tabs.kakeibo') }} />
      <Tab.Screen name="Calculator" component={CalculatorScreen} options={{ tabBarLabel: t('tabs.calculator') }} />
      <Tab.Screen name="Calendar"   component={CalendarScreen}   options={{ tabBarLabel: t('tabs.calendar') }} />
      <Tab.Screen name="More"       component={MoreScreen}       options={{ tabBarLabel: t('tabs.more') }} />
    </Tab.Navigator>
  );
}

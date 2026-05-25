import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { CalculatorScreen } from '@/features/calculator/CalculatorScreen';
import { CalendarScreen } from '@/features/calendar/CalendarScreen';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { DocumentsScreen } from '@/features/documents/DocumentsScreen';
import { HistoryScreen } from '@/features/history/HistoryScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { useTheme } from '@/theme';

export type MainTabParamList = {
  Dashboard: undefined;
  Calculator: undefined;
  Calendar: undefined;
  History: undefined;
  Documents: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

type TabName = keyof MainTabParamList;
const TAB_ICONS: Record<TabName, keyof typeof Ionicons.glyphMap> = {
  Dashboard:  'home-outline',
  Calculator: 'calculator-outline',
  Calendar:   'calendar-outline',
  History:    'stats-chart-outline',
  Documents:  'document-text-outline',
  Settings:   'settings-outline',
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
      <Tab.Screen name="Dashboard"  component={DashboardScreen}  options={{ tabBarLabel: t('tabs.dashboard') }} />
      <Tab.Screen name="Calculator" component={CalculatorScreen} options={{ tabBarLabel: t('tabs.calculator') }} />
      <Tab.Screen name="Calendar"   component={CalendarScreen}   options={{ tabBarLabel: t('tabs.calendar') }} />
      <Tab.Screen name="History"    component={HistoryScreen}    options={{ tabBarLabel: t('tabs.history') }} />
      <Tab.Screen name="Documents"  component={DocumentsScreen}  options={{ tabBarLabel: t('tabs.documents') }} />
      <Tab.Screen name="Settings"   component={SettingsScreen}   options={{ tabBarLabel: t('tabs.settings') }} />
    </Tab.Navigator>
  );
}

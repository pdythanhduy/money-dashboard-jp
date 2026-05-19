import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { configureNotifications } from '@/lib/notifications';
import { RootNavigator } from '@/navigation/RootNavigator';
import { useSettingsHydrated } from '@/store/settingsStore';
import { useHistoryMigration } from '@/store/useHistoryMigration';
import { useLanguageSync } from '@/store/useLanguageSync';
import { ThemeProvider, useTheme } from '@/theme';

console.log('[App] module loaded');

// Expo Go on iOS occasionally fails to auto-hide the splash, which leaves
// a white overlay covering the rendered React tree. Calling hideAsync()
// at module load + on mount makes it deterministic. Errors are swallowed
// because hideAsync rejects if the splash is already hidden.
SplashScreen.hideAsync().catch(() => {});

// Set up the foreground notification handler. Pure local — no push tokens
// requested, no remote registration. Safe to call when native module is
// absent (no-op on web/jest).
configureNotifications();

export default function App() {
  useHistoryMigration();
  useLanguageSync();
  const hydrated = useSettingsHydrated();

  useEffect(() => {
    console.log('[App] mounted');
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Hold off the navigation tree for one tick after rehydrate so the user
  // never sees default settings flash before their persisted preferences
  // load. Splash stays visible courtesy of the hideAsync above being a
  // no-op until something actually paints.
  if (!hydrated) return null;

  return (
    <ErrorBoundary>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <ThemeProvider>
          <NavigationShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function NavigationShell() {
  const { isDark } = useTheme();
  const navTheme = isDark ? DarkTheme : DefaultTheme;
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  );
}

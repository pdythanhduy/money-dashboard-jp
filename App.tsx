import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider } from '@/theme';

// Fire-and-forget — even if splash isn't auto-hiding it will be after first
// paint commit. Wrapped so an unexpected failure is logged, not silent.
SplashScreen.hideAsync().catch((err) => {
  // eslint-disable-next-line no-console
  console.warn('[splash] hideAsync failed', err);
});

// DEBUG: react-native-screens 4.x + Fabric has reports of screens rendering
// at zero size. Disabled until root cause confirmed.
enableScreens(false);

// eslint-disable-next-line no-console
console.log('[App] module loaded, screens disabled for debug');

// DEBUG: bypass providers/nav entirely — render a single magenta view to
// prove the app paints at all. Flip back to false once white screen fixed.
const DIAGNOSTIC_MODE = true;

export default function App() {
  const scheme = useColorScheme();
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[App] mounted, colorScheme=', scheme);
    // Re-attempt splash hide after mount (Expo Go sometimes needs a tick).
    SplashScreen.hideAsync().catch(() => {});
  }, [scheme]);

  if (DIAGNOSTIC_MODE) {
    // eslint-disable-next-line no-console
    console.log('[App] DIAGNOSTIC_MODE on — rendering magenta bypass');
    return (
      <View style={{ flex: 1, backgroundColor: 'magenta', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>DIAGNOSTIC OK</Text>
        <Text style={{ color: 'white', fontSize: 14, marginTop: 16 }}>
          If you see this, paint works. Issue is in nav/providers.
        </Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <View style={{ flex: 1, backgroundColor: 'cyan' }}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ThemeProvider>
            <NavigationContainer theme={navTheme}>
              <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
              <RootNavigator />
            </NavigationContainer>
          </ThemeProvider>
        </SafeAreaProvider>
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 60,
            right: 16,
            backgroundColor: 'red',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            zIndex: 9999,
          }}
        >
          <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>DEBUG</Text>
        </View>
      </View>
    </ErrorBoundary>
  );
}

import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { enableScreens } from 'react-native-screens';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider } from '@/theme';

// DEBUG: react-native-screens 4.x + Fabric has reports of screens rendering
// at zero size. Disabling native screens forces react-navigation to use
// plain View-based screens — DEFINITELY render. If turning this off fixes
// the white screen, the root cause is screens + Fabric. Remove once verified.
enableScreens(false);

// eslint-disable-next-line no-console
console.log('[App] module loaded, screens disabled for debug');

// DEBUG: temporary flag — set to true to bypass the whole navigation tree
// and render a single visible View. Useful for isolating provider vs nav.
const DIAGNOSTIC_MODE = false;

export default function App() {
  const scheme = useColorScheme();
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[App] mounted, colorScheme=', scheme);
  }, [scheme]);

  if (DIAGNOSTIC_MODE) {
    return (
      <View style={{ flex: 1, backgroundColor: 'magenta', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'white', fontSize: 32, fontWeight: 'bold' }}>DIAGNOSTIC OK</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      {/* DEBUG: cyan visible if SafeAreaProvider doesn't paint. Remove later. */}
      <View style={{ flex: 1, backgroundColor: 'cyan' }}>
        <SafeAreaProvider initialMetrics={initialWindowMetrics}>
          <ThemeProvider>
            <NavigationContainer theme={navTheme}>
              <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
              <RootNavigator />
            </NavigationContainer>
          </ThemeProvider>
        </SafeAreaProvider>
        {/* DEBUG: absolute-positioned banner always-visible if React renders */}
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

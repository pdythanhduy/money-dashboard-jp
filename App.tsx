import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/i18n';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider } from '@/theme';

// eslint-disable-next-line no-console
console.log('[App] module loaded');

export default function App() {
  const scheme = useColorScheme();
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('[App] mounted, colorScheme=', scheme);
  }, [scheme]);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
            <RootNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

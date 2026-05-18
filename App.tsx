import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '@/lib/i18n';
import { RootNavigator } from '@/navigation/RootNavigator';
import { ThemeProvider } from '@/theme';

export default function App() {
  const scheme = useColorScheme();
  const navTheme = scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          <RootNavigator />
        </NavigationContainer>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

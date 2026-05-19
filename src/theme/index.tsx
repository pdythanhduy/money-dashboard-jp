/**
 * ThemeProvider — color palette source.
 *
 * Reactivity chain:
 *   useSettingsStore.settings.theme  (user pref: 'system' | 'light' | 'dark')
 *   ↓
 *   useColorScheme() iff 'system'
 *   ↓
 *   light/dark palette from colors.ts
 *
 * Any change to settings.theme or to the system scheme re-renders the
 * provider, which propagates colors via context.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';

import { darkColors, lightColors, type ColorPalette } from './colors';
import { radius } from './radius';
import { spacing } from './spacing';
import { typography } from './typography';

export interface Theme {
  colors: ColorPalette;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  isDark: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themePref = useSettingsStore((s) => s.settings.theme);
  const systemScheme = useColorScheme();
  const effectiveScheme = themePref === 'system' ? systemScheme : themePref;
  const isDark = effectiveScheme === 'dark';

  const value = useMemo<Theme>(
    () => ({
      colors: isDark ? darkColors : lightColors,
      typography,
      spacing,
      radius,
      isDark,
    }),
    [isDark],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

const FALLBACK_THEME: Theme = {
  colors: lightColors,
  typography,
  spacing,
  radius,
  isDark: false,
};

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) {
    console.warn('[useTheme] called outside <ThemeProvider> — using fallback');
    return FALLBACK_THEME;
  }
  return t;
}

export { lightColors, darkColors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { radius } from './radius';
export type { ColorPalette } from './colors';
export type { TypographyToken } from './typography';
export type { SpacingToken } from './spacing';
export type { RadiusToken } from './radius';

/**
 * ThemeProvider — wires color palette to system color scheme (light/dark)
 * and exposes everything via `useTheme()`.
 *
 * Usage:
 *   const { colors, typography, spacing, radius, isDark } = useTheme();
 *   <View style={{ backgroundColor: colors.surface, padding: spacing.md }} />
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

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
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
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

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme must be used inside <ThemeProvider>');
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

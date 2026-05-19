/**
 * ThemeProvider — resolves color palette from the user's theme preference
 * (`system` / `light` / `dark`) stored in `useSettingsStore`. Falls back to
 * the device color scheme when set to `system`.
 *
 * Re-renders automatically when either the setting or the device scheme
 * flips, so callers never need to call `i18n.changeLanguage`-style helpers.
 *
 * Usage:
 *   const { colors, typography, spacing, radius, isDark } = useTheme();
 *   <View style={{ backgroundColor: colors.surface, padding: spacing.md }} />
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
  const scheme = useColorScheme();
  const themeSetting = useSettingsStore((s) => s.settings.theme);

  const isDark = themeSetting === 'system' ? scheme === 'dark' : themeSetting === 'dark';

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
    // eslint-disable-next-line no-console
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

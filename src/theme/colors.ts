/**
 * Color tokens — semantic, not raw hex literals.
 *
 * Naming follows iOS-style intent: `surface` / `surfaceElevated` / `text` /
 * `textSecondary` / `border`, with semantic accents (`success`, `warning`,
 * `danger`). The brand palette uses navy + warm yellow for a money-app feel.
 *
 * Add raw colors only when needed by a primitive component. Screens should
 * never import hex literals — go through `useTheme()`.
 */

export interface ColorPalette {
  brand: string;
  brandStrong: string;
  brandSubtle: string;
  accent: string;
  accentSubtle: string;

  background: string;
  surface: string;
  surfaceElevated: string;

  text: string;
  textSecondary: string;
  textInverse: string;

  border: string;
  borderStrong: string;

  success: string;
  warning: string;
  danger: string;

  tabBarActive: string;
  tabBarInactive: string;
}

const navy = '#1a365d';
const navyLight = '#2c5282';
const yellow = '#f6ad55';
const yellowSubtle = '#fef3c7';

export const lightColors: ColorPalette = {
  brand: navy,
  brandStrong: '#102a43',
  brandSubtle: '#e6edf5',
  accent: yellow,
  accentSubtle: yellowSubtle,

  background: '#f7fafc',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',

  text: '#1a202c',
  textSecondary: '#4a5568',
  textInverse: '#ffffff',

  border: '#e2e8f0',
  borderStrong: '#cbd5e0',

  success: '#38a169',
  warning: '#dd6b20',
  danger: '#e53e3e',

  tabBarActive: navy,
  tabBarInactive: '#a0aec0',
};

export const darkColors: ColorPalette = {
  brand: '#63b3ed',
  brandStrong: '#1a365d',
  brandSubtle: '#1a365d',
  accent: yellow,
  accentSubtle: '#78350f',

  background: '#0f1419',
  surface: '#1a202c',
  surfaceElevated: '#2d3748',

  text: '#f7fafc',
  textSecondary: '#cbd5e0',
  textInverse: navy,

  border: '#2d3748',
  borderStrong: '#4a5568',

  success: '#48bb78',
  warning: '#ed8936',
  danger: '#fc8181',

  tabBarActive: '#63b3ed',
  tabBarInactive: '#4a5568',
};

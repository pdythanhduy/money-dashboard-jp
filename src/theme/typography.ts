/**
 * Type scale modeled on Apple HIG. Sizes are absolute pixels (RN uses dp).
 *
 * `fontFamily: 'System'` resolves to:
 * - iOS: San Francisco (handles Japanese via OS fallback to Hiragino Sans)
 * - Android: Roboto (handles Japanese via OS fallback to Noto Sans CJK JP)
 *
 * Both platforms already render Japanese correctly without bundling a font.
 * If brand consistency across OS becomes important, add expo-font and load
 * Noto Sans JP — until then we ride the system stack.
 */

import type { TextStyle } from 'react-native';

type TextStyleToken = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing' | 'fontFamily'>;

const SYSTEM = 'System';

export const typography: Readonly<Record<TypographyToken, TextStyleToken>> = {
  largeTitle: { fontFamily: SYSTEM, fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.4 },
  title1:     { fontFamily: SYSTEM, fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.4 },
  title2:     { fontFamily: SYSTEM, fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: 0.4 },
  title3:     { fontFamily: SYSTEM, fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0.4 },
  headline:   { fontFamily: SYSTEM, fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.4 },
  body:       { fontFamily: SYSTEM, fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: -0.2 },
  callout:    { fontFamily: SYSTEM, fontSize: 14, lineHeight: 19, fontWeight: '400', letterSpacing: 0 },
  footnote:   { fontFamily: SYSTEM, fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: 0 },
  caption:    { fontFamily: SYSTEM, fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0 },
};

export type TypographyToken =
  | 'largeTitle'
  | 'title1'
  | 'title2'
  | 'title3'
  | 'headline'
  | 'body'
  | 'callout'
  | 'footnote'
  | 'caption';

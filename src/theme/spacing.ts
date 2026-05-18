/**
 * 4-point grid spacing. Use these tokens in place of raw numbers in
 * `padding`, `margin`, `gap` so layouts stay rhythmically consistent.
 */

export const spacing = {
  xs:   4,
  sm:   8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
} as const;

export type SpacingToken = keyof typeof spacing;

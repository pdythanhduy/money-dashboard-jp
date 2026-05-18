/**
 * Display formatters. Pure functions, no React, no side effects — safe to
 * call from anywhere (components, hooks, tests).
 */

/**
 * Format a yen amount with ¥ prefix and thousands separators.
 * Negative values render as "-¥1,234".
 *
 * @example formatCurrency(1_234_567) === '¥1,234,567'
 * @example formatCurrency(-1_234) === '-¥1,234'
 * @example formatCurrency(0) === '¥0'
 */
export function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  const wholeYen = Math.abs(Math.trunc(value));
  const grouped = wholeYen.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}¥${grouped}`;
}

/**
 * Format a percentage with one decimal (e.g. `0.7931` → `'79.3%'`).
 * Clamps to [0, 100] for safety.
 */
export function formatPercent(ratio: number): string {
  if (!Number.isFinite(ratio)) return '0%';
  const pct = Math.max(0, Math.min(100, ratio * 100));
  return `${pct.toFixed(1)}%`;
}

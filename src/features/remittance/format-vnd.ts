/**
 * VND formatter — Vietnamese convention uses "." as thousands separator
 * and the symbol "₫" trails the number with a non-breaking space. We
 * roll our own (no Intl polyfill on RN) so the result is stable across
 * locales the device may be set to.
 */
export function formatVND(amount: number): string {
  if (!Number.isFinite(amount)) return '0 ₫';
  const sign = amount < 0 ? '-' : '';
  const digits = Math.trunc(Math.abs(amount)).toString();
  const withThousands = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}${withThousands} ₫`;
}

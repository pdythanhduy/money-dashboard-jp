/**
 * Decides whether the Furusato納税 dashboard card / entry-point should be
 * surfaced for the current user.
 *
 * Rationale: ふるさと納税 is most useful for users whose take-home is high
 * enough that the donation limit is meaningfully > the ¥2,000 self-burden.
 * Surfacing it for baito earners with ¥1.5–2M annual income clutters the
 * dashboard with a card that wouldn't return anything.
 *
 * Once the user actually has a donation on file, we always keep the
 * entry-point visible — they're a "user of the feature" regardless of
 * what their salary looks like at this moment.
 */

/** Monthly take-home cutoff (¥) ≈ annual ¥2.4M, the point where 寄付限度額 ≥ ¥15K. */
export const FURUSATO_MIN_MONTHLY_TAKEHOME = 200_000;

export function isFurusatoUseful(
  takeHomeMonthly: number | null | undefined,
  hasExistingDonations: boolean,
): boolean {
  if (hasExistingDonations) return true;
  if (typeof takeHomeMonthly !== 'number' || !Number.isFinite(takeHomeMonthly)) return false;
  return takeHomeMonthly >= FURUSATO_MIN_MONTHLY_TAKEHOME;
}

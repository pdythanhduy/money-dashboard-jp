/**
 * User-added document deadline (residence card, visa, passport, contracts...).
 *
 * Distinct from the older Phase 5K `DocumentReminder` type (which drives
 * the existing local-notification scheduling pipeline). This newer model
 * is the canonical source for Dashboard "upcoming" reminders — see
 * `src/lib/document-reminders.ts` (`computeDocumentDeadlineReminders`).
 *
 * `remindBeforeDays` is a single value (7/14/30/60/90) so the surface
 * stays simple — the user picks one window per document.
 */

export type DocumentType =
  | 'residence_card'
  | 'visa'
  | 'my_number'
  | 'passport'
  | 'health_insurance'
  | 'housing_contract'
  | 'phone_contract'
  | 'tax'
  | 'other';

export const ALL_DOCUMENT_TYPES: readonly DocumentType[] = [
  'residence_card',
  'visa',
  'my_number',
  'passport',
  'health_insurance',
  'housing_contract',
  'phone_contract',
  'tax',
  'other',
];

export const REMIND_BEFORE_OPTIONS: readonly number[] = [7, 14, 30, 60, 90];

export interface DocumentDeadline {
  id: string;
  type: DocumentType;
  title: string;
  /** ISO date "YYYY-MM-DD". */
  expiryDate: string;
  /** Days-before-expiry the deadline starts surfacing on Dashboard. */
  remindBeforeDays: number;
  note?: string;
  /** ISO timestamps for audit + sort. */
  createdAt: string;
  updatedAt: string;
}

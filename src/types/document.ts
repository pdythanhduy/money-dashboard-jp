/**
 * Document categories the Documents tab knows how to label and remind on.
 * Add new kinds here AND in i18n `documents.kinds.*` (both vi + ja).
 */
export type DocumentKind =
  | 'zairyu_card'
  | 'passport_vn'
  | 'passport_jp'
  | 'mynumber_card'
  | 'driving_license_jp'
  | 'driving_license_vn'
  | 'health_insurance_card'
  | 'visa_renewal'
  | 'kakutei_shinkoku'
  | 'nenmatsu_chosei'
  | 'jumin_zei_q1'
  | 'jumin_zei_q2'
  | 'jumin_zei_q3'
  | 'jumin_zei_q4';

export const ALL_DOCUMENT_KINDS: readonly DocumentKind[] = [
  'zairyu_card',
  'passport_vn',
  'passport_jp',
  'mynumber_card',
  'driving_license_jp',
  'driving_license_vn',
  'health_insurance_card',
  'visa_renewal',
  'kakutei_shinkoku',
  'nenmatsu_chosei',
  'jumin_zei_q1',
  'jumin_zei_q2',
  'jumin_zei_q3',
  'jumin_zei_q4',
];

export interface DocumentReminder {
  id: string;
  kind: DocumentKind;
  /** Optional override label; falls back to `documents.kinds.<kind>` i18n. */
  customName?: string;
  /** ISO date string, e.g. "2027-03-15". */
  expiryDate: string;
  /** Days-before-expiry at which local notifications fire. */
  notifyDaysBefore: number[];
  notes?: string;
}

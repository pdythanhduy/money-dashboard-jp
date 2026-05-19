import type { HourlyJobInput } from '@/lib/hourly-wage-calculator';

/**
 * A saved baito / parttime job. `input` carries the schedule + allowances
 * `computeHourlyAnnual` already understands; the rest is presentation
 * metadata for the multi-job editor.
 */
export interface JobProfile {
  id: string;
  /** User-typed label, e.g. "Combini sáng" or "塾の講師". */
  name: string;
  /** Optional hex color for the card tag. UI may default-cycle through a palette. */
  color?: string;
  input: HourlyJobInput;
}

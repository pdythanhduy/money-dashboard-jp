/**
 * Phase 5B — SalaryForm
 *
 * Form for collecting `SalaryInput` from the user. The single source of
 * truth for the form state is `useCalculatorStore`. This component is the
 * view layer: read store, render inputs, write back on change.
 *
 * TODO(Phase 5B):
 * - Annual income: text input, numeric keyboard, comma-formatted, ¥ prefix
 * - Age: text input, numeric keyboard, 0-120 range
 * - Prefecture picker (salary): bottom-sheet or modal with 8 supported prefs
 * - Municipality picker (business): osaka-shi / tokyo-23ku
 * - hasSpouse switch + spouseAge field (conditional reveal)
 * - dependents repeater (add/remove rows, age per row)
 * - isWorkingStudent switch (hide for age > 30)
 * - blueReturnDeduction picker (business only): 0 / 100k / 550k / 650k
 * - Inline validation messages (no submit-time error wall)
 * - Submit button at bottom — calls `useCalculatorStore.compute()` which
 *   calls `calculateTakeHome` from `@/lib/tax-calculator`
 */

export function SalaryForm() {
  return null;
}

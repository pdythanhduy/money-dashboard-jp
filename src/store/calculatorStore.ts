/**
 * Phase 5B — Calculator form state store (Zustand).
 *
 * Holds the in-progress SalaryInput as user fills the form, plus the most
 * recent TakeHomeResult. NOT persisted — the History tab will save snapshots
 * via SQLite in Phase 5C.
 *
 * TODO(Phase 5B):
 * - State shape:
 *     {
 *       category: 'salary' | 'business',
 *       annualIncome: string,        // raw input, parsed on compute()
 *       age: string,
 *       prefecture?: Prefecture,
 *       municipality?: FreelanceMunicipality,
 *       hasSpouse: boolean,
 *       spouseAge?: string,
 *       dependents: { age: string, livesWithTaxpayer: boolean }[],
 *       isWorkingStudent: boolean,
 *       blueReturnDeduction: 0 | 100_000 | 550_000 | 650_000,
 *       result: TakeHomeResult | null,
 *       error: string | null,
 *     }
 * - Actions:
 *     setField<K>(key: K, value: State[K]): void
 *     addDependent / removeDependent / updateDependent(index, partial)
 *     compute(): void  — builds SalaryInput from raw strings, calls
 *       calculateTakeHome, catches validation errors, sets result or error
 *     reset(): void  — clears form back to defaults
 * - Use Zustand's `create<State>()(set => ({...}))` pattern.
 */

export const useCalculatorStore = () => {
  throw new Error('TODO(Phase 5B): implement calculatorStore');
};

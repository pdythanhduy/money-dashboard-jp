import { useMemo } from 'react';

import { deductibleAmount } from '@/lib/medical-deduction';
import {
  buildKakuteiSummary,
  type KakuteiInput,
  type KakuteiSummary,
} from '@/lib/kakutei-shinkoku';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useFurusatoStore } from '@/store/furusatoStore';
import { useKakuteiStore } from '@/store/kakuteiStore';
import { useMedicalExpensesStore } from '@/store/medicalExpensesStore';

export interface KakuteiData {
  /** Assembled input the lib needs to run. */
  input: KakuteiInput;
  /** Cached summary derived from `input`. */
  summary: KakuteiSummary;
  /** Convenience flags surfaced by step screens. */
  hasSalaryResult: boolean;
  medicalDeductibleAmount: number;
  furusatoDonationTotal: number;
}

/**
 * Aggregates inputs from Calculator + Phase 5L/5M stores + this wizard's
 * draft into one memo'd `KakuteiSummary`. Steps 2-5 all read from this.
 */
export function useKakuteiData(): KakuteiData {
  const salaryResult = useCalculatorStore((s) => s.lastResult);
  const grossAnnual = useCalculatorStore((s) => s.lastInput?.annualIncome ?? 0);
  const medicalExpenses = useMedicalExpensesStore((s) => s.expenses);
  const furusatoDonations = useFurusatoStore((s) => s.donations);
  const draft = useKakuteiStore((s) => s.draft);

  return useMemo(() => {
    const medicalDeductibleAmount = deductibleAmount(medicalExpenses, grossAnnual);
    const yearPrefix = String(draft.fiscalYear);
    const furusatoDonationTotal = furusatoDonations
      .filter((d) => d.date.startsWith(yearPrefix))
      .reduce((sum, d) => sum + d.amount, 0);

    const input: KakuteiInput = {
      fiscalYear: draft.fiscalYear,
      salaryResult,
      medicalDeductibleAmount,
      furusatoDonationTotal,
      lifeInsurancePremium: draft.lifeInsurancePremium,
      earthquakeInsurancePremium: draft.earthquakeInsurancePremium,
      publicPensionContribution: draft.publicPensionContribution,
    };

    return {
      input,
      summary: buildKakuteiSummary(input),
      hasSalaryResult: salaryResult !== null,
      medicalDeductibleAmount,
      furusatoDonationTotal,
    };
  }, [
    salaryResult,
    grossAnnual,
    medicalExpenses,
    furusatoDonations,
    draft.fiscalYear,
    draft.lifeInsurancePremium,
    draft.earthquakeInsurancePremium,
    draft.publicPensionContribution,
  ]);
}

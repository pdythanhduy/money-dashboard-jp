/**
 * Convenience hook that bundles the four numbers MedicalScreen + Dashboard
 * card display: total net expenses, threshold (income-based), deductible,
 * estimated refund. All values derived from existing stores so we never
 * duplicate state.
 */

import { useMemo } from 'react';

import {
  deductibleAmount,
  effectiveThreshold,
  estimatedTaxRefund,
  pickMarginalRate,
  totalNetExpenses,
} from '@/lib/medical-deduction';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useMedicalExpensesStore } from '@/store/medicalExpensesStore';

export interface MedicalSummary {
  total: number;
  threshold: number;
  deductible: number;
  refund: number;
  hasReachedThreshold: boolean;
  remainingToThreshold: number;
}

export function useMedicalSummary(): MedicalSummary {
  const expenses = useMedicalExpensesStore((s) => s.expenses);
  const lastInput = useCalculatorStore((s) => s.lastInput);
  const lastResult = useCalculatorStore((s) => s.lastResult);

  return useMemo(() => {
    const annualIncome = lastInput?.annualIncome ?? 0;
    const taxable = lastResult?.breakdown.taxableIncomeForNationalTax ?? 0;
    const total = totalNetExpenses(expenses);
    const threshold = effectiveThreshold(annualIncome);
    const deductible = deductibleAmount(expenses, annualIncome);
    const marginal = pickMarginalRate(taxable);
    const refund = estimatedTaxRefund(deductible, marginal);
    return {
      total,
      threshold,
      deductible,
      refund,
      hasReachedThreshold: total >= threshold,
      remainingToThreshold: Math.max(0, threshold - total),
    };
  }, [expenses, lastInput, lastResult]);
}

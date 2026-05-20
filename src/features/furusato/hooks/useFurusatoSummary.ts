/**
 * Furusato summary derived from existing stores. Auto-fills taxable
 * income + marginal rate from the latest Calculator submission so the
 * user doesn't have to retype anything.
 */

import { useMemo } from 'react';

import {
  computeFurusatoLimit,
  type FurusatoLimitResult,
} from '@/lib/furusato-calculator';
import { pickMarginalRate } from '@/lib/medical-deduction';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useFurusatoStore } from '@/store/furusatoStore';

export interface FurusatoSummary {
  hasCalculatorResult: boolean;
  /** Source values fed into the calculator. */
  residentTaxableIncome: number;
  incomeTaxMarginalRate: number;
  limit: FurusatoLimitResult;
  /** Total ¥ already donated within the period. */
  totalDonated: number;
  /** maxDonation − totalDonated, never negative. */
  remainingCapacity: number;
  /** True when the user has donated AT or BEYOND their limit. */
  hasReachedLimit: boolean;
}

export function useFurusatoSummary(
  overrides?: { residentTaxableIncome?: number; incomeTaxMarginalRate?: number },
): FurusatoSummary {
  const lastResult = useCalculatorStore((s) => s.lastResult);
  const donations = useFurusatoStore((s) => s.donations);

  return useMemo(() => {
    const fromCalc = lastResult?.breakdown.taxableIncomeForResidentTax ?? 0;
    const calcMarginal = pickMarginalRate(
      lastResult?.breakdown.taxableIncomeForNationalTax ?? 0,
    );

    const residentTaxableIncome = overrides?.residentTaxableIncome ?? fromCalc;
    const incomeTaxMarginalRate = overrides?.incomeTaxMarginalRate ?? calcMarginal;

    let limit: FurusatoLimitResult;
    try {
      limit = computeFurusatoLimit({ residentTaxableIncome, incomeTaxMarginalRate });
    } catch {
      limit = {
        maxDonation: 2_000,
        incomeTaxReduction: 0,
        residentTaxBasicReduction: 0,
        residentTaxSpecialReduction: 0,
        selfBurden: 2_000,
      };
    }

    const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);
    const remainingCapacity = Math.max(0, limit.maxDonation - totalDonated);

    return {
      hasCalculatorResult: lastResult !== null,
      residentTaxableIncome,
      incomeTaxMarginalRate,
      limit,
      totalDonated,
      remainingCapacity,
      hasReachedLimit: totalDonated >= limit.maxDonation,
    };
  }, [lastResult, donations, overrides?.residentTaxableIncome, overrides?.incomeTaxMarginalRate]);
}

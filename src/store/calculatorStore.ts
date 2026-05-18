import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { SalaryInput, TakeHomeResult } from '@/types/tax';

interface CalculatorStore {
  lastInput: SalaryInput | null;
  lastResult: TakeHomeResult | null;
  setInput: (input: SalaryInput) => void;
  setResult: (result: TakeHomeResult) => void;
  reset: () => void;
}

export const useCalculatorStore = create<CalculatorStore>()(
  persist(
    (set) => ({
      lastInput: null,
      lastResult: null,
      setInput: (input) => set({ lastInput: input }),
      setResult: (result) => set({ lastResult: result }),
      reset: () => set({ lastInput: null, lastResult: null }),
    }),
    {
      name: 'money-dashboard-jp-calculator',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastInput: state.lastInput,
        lastResult: state.lastResult,
      }),
    },
  ),
);

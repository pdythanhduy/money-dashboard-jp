jest.mock('@react-native-async-storage/async-storage', () => {
  let storage: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((k: string) => Promise.resolve(storage[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        storage[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete storage[k];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storage = {};
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `uuid-${++n}`) };
});

const mockCancelAll = jest.fn();
jest.mock('@/lib/notifications', () => ({
  cancelAllReminders: () => mockCancelAll(),
}));

import { buildExportPayload, wipeAllAppData } from '@/features/settings/data-actions';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useDocumentsStore } from '@/store/documentsStore';
import { useFurusatoStore } from '@/store/furusatoStore';
import { useHistoryStore } from '@/store/historyStore';
import { useMedicalExpensesStore } from '@/store/medicalExpensesStore';
import { useMultiJobStore } from '@/store/multiJobStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { DEFAULT_SETTINGS, useSettingsStore } from '@/store/settingsStore';
import type { HistoryEntry } from '@/types/history';
import type { SalaryInput, TakeHomeResult } from '@/types/tax';

const fakeInput: SalaryInput = {
  annualIncome: 3_600_000,
  age: 24,
  category: 'salary',
  prefecture: 'tokyo',
};

const fakeResult: TakeHomeResult = {
  grossAnnual: 3_600_000,
  incomeTax: 68_100,
  residentTax: 153_500,
  healthInsurance: 177_300,
  pension: 329_400,
  employmentInsurance: 18_000,
  nationalHealthInsurance: 0,
  nationalPension: 0,
  totalDeductions: 746_300,
  takeHomeAnnual: 2_853_700,
  takeHomeMonthly: 237_808,
  breakdown: {
    employmentIncomeDeduction: 1_160_000,
    employmentIncome: 2_440_000,
    totalIncome: 2_440_000,
    basicDeductionNationalTax: 580_000,
    basicDeductionResidentTax: 430_000,
    socialInsuranceDeduction: 524_700,
    spouseDeduction: 0,
    dependentDeduction: 0,
    workingStudentDeduction: 0,
    taxableIncomeForNationalTax: 1_335_000,
    taxableIncomeForResidentTax: 1_485_000,
    baseIncomeTax: 66_750,
    reconstructionSurtax: 1_401,
    residentTaxIncomeBased: 148_500,
    residentTaxPerCapita: 5_000,
    standardMonthlyRemuneration: 300_000,
  },
};

describe('buildExportPayload', () => {
  it('serializes app metadata + settings + history with a deterministic timestamp', () => {
    const entries: HistoryEntry[] = [
      { id: 'h1', timestamp: 1, input: fakeInput, result: fakeResult },
    ];
    const fixed = new Date('2026-05-18T10:30:00Z');
    const payload = buildExportPayload(DEFAULT_SETTINGS, entries, fixed);

    expect(payload.exportedAt).toBe('2026-05-18T10:30:00.000Z');
    expect(payload.appVersion).toBe('0.1.0');
    expect(payload.historyCount).toBe(1);
    expect(payload.history).toBe(entries);
    expect(payload.settings).toBe(DEFAULT_SETTINGS);
  });

  it('handles empty history', () => {
    const payload = buildExportPayload(DEFAULT_SETTINGS, [], new Date('2026-01-01T00:00:00Z'));
    expect(payload.historyCount).toBe(0);
    expect(payload.history).toEqual([]);
  });

  it('round-trips through JSON', () => {
    const entries: HistoryEntry[] = [
      { id: 'h1', timestamp: 1, input: fakeInput, result: fakeResult, label: 'May salary' },
    ];
    const payload = buildExportPayload(DEFAULT_SETTINGS, entries, new Date('2026-05-18T00:00:00Z'));
    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);
    expect(parsed.history[0].label).toBe('May salary');
    expect(parsed.settings.payday).toBe(25);
  });

  it('payload includes schemaVersion = 1 for forward-compat', () => {
    const payload = buildExportPayload(DEFAULT_SETTINGS, [], new Date('2026-05-19T00:00:00Z'));
    expect(payload.schemaVersion).toBe(1);
    // Round-trip preserves it so external consumers can read it back.
    const parsed = JSON.parse(JSON.stringify(payload));
    expect(parsed.schemaVersion).toBe(1);
  });

  it('schemaVersion is the FIRST documented key after exportedAt — JSON order matters for human readers', () => {
    const payload = buildExportPayload(DEFAULT_SETTINGS, [], new Date('2026-05-19T00:00:00Z'));
    const keys = Object.keys(payload);
    expect(keys[0]).toBe('schemaVersion');
  });
});

describe('wipeAllAppData', () => {
  it('resets every store to its initial state', async () => {
    mockCancelAll.mockReset();
    mockCancelAll.mockResolvedValue(undefined);
    useHistoryStore.getState().addEntry(fakeInput, fakeResult);
    useCalculatorStore.getState().setInput(fakeInput);
    useCalculatorStore.getState().setResult(fakeResult);
    useSettingsStore.getState().updateSetting('language', 'ja');
    useOnboardingStore.getState().completeOnboarding();
    useMultiJobStore.getState().addJob('Combini', {
      hourlyRate: 1_200,
      hoursPerDay: 8,
      daysPerWeek: 5,
    });
    useDocumentsStore.getState().addDocument({
      kind: 'zairyu_card',
      expiryDate: '2027-03-15',
    });
    useMedicalExpensesStore.getState().addExpense({
      date: '2026-05-01',
      amount: 12_000,
      category: 'doctor_visit',
    });
    useFurusatoStore.getState().addDonation({
      date: '2026-05-10',
      amount: 10_000,
      targetMunicipality: '大阪市',
    });

    await wipeAllAppData();

    expect(mockCancelAll).toHaveBeenCalledTimes(1);
    expect(useHistoryStore.getState().entries).toEqual([]);
    expect(useHistoryStore.getState().migratedFromLatest).toBe(false);
    expect(useCalculatorStore.getState().lastInput).toBeNull();
    expect(useCalculatorStore.getState().lastResult).toBeNull();
    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_SETTINGS);
    expect(useOnboardingStore.getState().hasCompletedOnboarding).toBe(false);
    expect(useOnboardingStore.getState().currentSlide).toBe(0);
    expect(useMultiJobStore.getState().jobs).toEqual([]);
    expect(useDocumentsStore.getState().documents).toEqual([]);
    expect(useMedicalExpensesStore.getState().expenses).toEqual([]);
    expect(useFurusatoStore.getState().donations).toEqual([]);
  });
});

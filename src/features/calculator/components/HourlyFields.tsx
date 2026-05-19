/**
 * Standalone hourly schedule form. Decoupled from `useCalculator` so it
 * can be reused by:
 *   - SalaryForm "Hourly mode" — feeds the main calculator form state.
 *   - JobEditModal (multi-job) — operates on local draft state per job.
 *
 * Holds string-typed field values (text inputs); call `toHourlyJobInput`
 * to convert into the `HourlyJobInput` the calculator engine expects.
 */

import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import {
  computeHourlyAnnual,
  type HourlyJobInput,
} from '@/lib/hourly-wage-calculator';
import { useTheme } from '@/theme';

export interface HourlyFieldsValue {
  hourlyRateInput: string;
  hoursPerDayInput: string;
  daysPerWeekInput: string;
  weeksPerYearInput: string;
  hasNightShift: boolean;
  nightHoursPerDayInput: string;
  hasOvertime: boolean;
  overtimeHoursPerDayInput: string;
  hasWeekend: boolean;
  weekendDaysPerMonthInput: string;
}

export const DEFAULT_HOURLY_FIELDS: HourlyFieldsValue = {
  hourlyRateInput: '',
  hoursPerDayInput: '8',
  daysPerWeekInput: '5',
  weeksPerYearInput: '52',
  hasNightShift: false,
  nightHoursPerDayInput: '0',
  hasOvertime: false,
  overtimeHoursPerDayInput: '0',
  hasWeekend: false,
  weekendDaysPerMonthInput: '0',
};

export interface HourlyFieldErrors {
  hourlyRate?: string;
  hoursPerDay?: string;
  daysPerWeek?: string;
}

function parseCurrencyInputDigits(value: string): number {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return 0;
  return Number.parseInt(digits, 10);
}

function parseDecimal(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return Number.NaN;
  return Number.parseFloat(normalized);
}

function formatThousands(digits: string): string {
  const n = parseCurrencyInputDigits(digits);
  if (!n) return '';
  return n.toLocaleString('en-US');
}

/**
 * Convert form values into the shape `computeHourlyAnnual` consumes,
 * honoring the per-allowance toggles.
 */
export function toHourlyJobInput(v: HourlyFieldsValue): HourlyJobInput {
  const weeksRaw = parseDecimal(v.weeksPerYearInput);
  const weeks = Number.isFinite(weeksRaw) && weeksRaw > 0 ? weeksRaw : 52;
  const input: HourlyJobInput = {
    hourlyRate: parseCurrencyInputDigits(v.hourlyRateInput),
    hoursPerDay: parseDecimal(v.hoursPerDayInput),
    daysPerWeek: parseDecimal(v.daysPerWeekInput),
    weeksPerYear: weeks,
  };
  if (v.hasNightShift) {
    const n = parseDecimal(v.nightHoursPerDayInput);
    if (Number.isFinite(n) && n > 0) input.nightHoursPerDay = n;
  }
  if (v.hasOvertime) {
    const o = parseDecimal(v.overtimeHoursPerDayInput);
    if (Number.isFinite(o) && o > 0) input.overtimeHoursPerDay = o;
  }
  if (v.hasWeekend) {
    const w = parseDecimal(v.weekendDaysPerMonthInput);
    if (Number.isFinite(w) && w > 0) input.weekendDaysPerMonth = w;
  }
  return input;
}

/** Convenience: yearly total preview without throwing on partial input. */
export function previewAnnualFromFields(v: HourlyFieldsValue): number {
  try {
    return computeHourlyAnnual(toHourlyJobInput(v)).totalAnnual;
  } catch {
    return 0;
  }
}

interface HourlyFieldsProps {
  value: HourlyFieldsValue;
  onChange: (next: HourlyFieldsValue) => void;
  errors?: HourlyFieldErrors;
  showPreview?: boolean;
}

export function HourlyFields({ value, onChange, errors, showPreview = true }: HourlyFieldsProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const set = <K extends keyof HourlyFieldsValue>(key: K, next: HourlyFieldsValue[K]) => {
    onChange({ ...value, [key]: next });
  };

  const previewTotal = useMemo(() => previewAnnualFromFields(value), [value]);

  return (
    <View style={{ gap: spacing.md }}>
      <NumericRow
        label={t('calculator.fields.hourlyRate.label')}
        placeholder={t('calculator.fields.hourlyRate.placeholder')}
        helper={t('calculator.fields.hourlyRate.helper')}
        value={value.hourlyRateInput}
        onChange={(v) => set('hourlyRateInput', v.replace(/[^\d]/g, ''))}
        prefix="¥"
        error={errors?.hourlyRate}
      />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <NumericRow
            label={t('calculator.fields.hoursPerDay.label')}
            placeholder="8"
            helper={t('calculator.fields.hoursPerDay.helper')}
            value={value.hoursPerDayInput}
            onChange={(v) => set('hoursPerDayInput', v)}
            decimal
            error={errors?.hoursPerDay}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NumericRow
            label={t('calculator.fields.daysPerWeek.label')}
            placeholder="5"
            helper={t('calculator.fields.daysPerWeek.helper')}
            value={value.daysPerWeekInput}
            onChange={(v) => set('daysPerWeekInput', v)}
            error={errors?.daysPerWeek}
          />
        </View>
      </View>

      <NumericRow
        label={t('calculator.fields.weeksPerYear.label')}
        placeholder="52"
        helper={t('calculator.fields.weeksPerYear.helper')}
        value={value.weeksPerYearInput}
        onChange={(v) => set('weeksPerYearInput', v)}
      />

      <AllowanceSection
        titleKey="nightShift"
        toggleValue={value.hasNightShift}
        onToggle={(v) => set('hasNightShift', v)}
        hoursValue={value.nightHoursPerDayInput}
        onHoursChange={(v) => set('nightHoursPerDayInput', v)}
      />
      <AllowanceSection
        titleKey="overtime"
        toggleValue={value.hasOvertime}
        onToggle={(v) => set('hasOvertime', v)}
        hoursValue={value.overtimeHoursPerDayInput}
        onHoursChange={(v) => set('overtimeHoursPerDayInput', v)}
      />
      <AllowanceSection
        titleKey="weekend"
        toggleValue={value.hasWeekend}
        onToggle={(v) => set('hasWeekend', v)}
        hoursValue={value.weekendDaysPerMonthInput}
        onHoursChange={(v) => set('weekendDaysPerMonthInput', v)}
        fieldLabelKey="daysPerMonth"
      />

      {showPreview ? (
        <View
          style={{
            padding: spacing.md,
            backgroundColor: colors.brandSubtle,
            borderRadius: radius.md,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={[typography.callout, { color: colors.text }]}>
            {t('calculator.hourlyPreview.label')}
          </Text>
          <Text style={[typography.title3, { color: colors.brand, fontWeight: '700' }]}>
            {formatCurrency(previewTotal)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

interface NumericRowProps {
  label: string;
  placeholder: string;
  helper?: string;
  value: string;
  onChange: (next: string) => void;
  prefix?: string;
  decimal?: boolean;
  error?: string;
}

function NumericRow({
  label,
  placeholder,
  helper,
  value,
  onChange,
  prefix,
  decimal,
  error,
}: NumericRowProps) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.headline, { color: colors.text }]}>{label}</Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.xs,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.surface,
        }}
      >
        {prefix ? (
          <Text style={[typography.title3, { color: colors.textSecondary }]}>{prefix}</Text>
        ) : null}
        <TextInput
          value={prefix ? formatThousands(value) : value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={decimal ? 'decimal-pad' : 'numeric'}
          inputMode={decimal ? 'decimal' : 'numeric'}
          style={{ flex: 1, minHeight: 50, color: colors.text, ...typography.title3 }}
        />
      </View>
      {helper ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{helper}</Text>
      ) : null}
      {error ? (
        <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

interface AllowanceSectionProps {
  titleKey: 'nightShift' | 'overtime' | 'weekend';
  toggleValue: boolean;
  onToggle: (next: boolean) => void;
  hoursValue: string;
  onHoursChange: (next: string) => void;
  fieldLabelKey?: 'hoursPerDay' | 'daysPerMonth';
}

function AllowanceSection({
  titleKey,
  toggleValue,
  onToggle,
  hoursValue,
  onHoursChange,
  fieldLabelKey = 'hoursPerDay',
}: AllowanceSectionProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View
      style={{
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: toggleValue }}
        accessibilityLabel={t(`calculator.allowances.${titleKey}.title`)}
        onPress={() => onToggle(!toggleValue)}
        style={{
          padding: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[typography.body, { color: colors.text }]}>
            {t(`calculator.allowances.${titleKey}.title`)}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
            {t(`calculator.allowances.${titleKey}.sub`)}
          </Text>
        </View>
        <Ionicons
          name={toggleValue ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>
      {toggleValue ? (
        <View style={{ padding: spacing.md, paddingTop: 0 }}>
          <NumericRow
            label={t(`calculator.allowances.${titleKey}.${fieldLabelKey}`)}
            placeholder="0"
            value={hoursValue}
            onChange={onHoursChange}
            decimal={fieldLabelKey === 'hoursPerDay'}
          />
        </View>
      ) : null}
    </View>
  );
}

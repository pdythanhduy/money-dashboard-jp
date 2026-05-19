import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import type { FreelanceMunicipality, Prefecture } from '@/types/tax';
import { DependentsInput } from './DependentsInput';
import { IncomeTypeSelector } from './IncomeTypeSelector';
import { PrefecturePicker, type PickerOption } from './PrefecturePicker';
import {
  BLUE_RETURN_DEDUCTIONS,
  MUNICIPALITY_VALUES,
  PREFECTURE_VALUES,
  computeHourlyTotalFromForm,
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
  type BlueReturnDeduction,
  type IncomeMode,
  type PensionType,
  type UseCalculatorReturn,
} from '@/features/calculator/hooks/useCalculator';

interface SalaryFormProps {
  calculator: UseCalculatorReturn;
}

export function SalaryForm({ calculator }: SalaryFormProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const { form, errors, updateField } = calculator;

  const prefectureOptions = useMemo<Array<PickerOption<Prefecture>>>(
    () =>
      PREFECTURE_VALUES.map((value) => ({
        value,
        label: t(`calculator.prefectures.${value}.label`),
        description: t(`calculator.prefectures.${value}.description`),
      })),
    [t],
  );

  const municipalityOptions = useMemo<Array<PickerOption<FreelanceMunicipality>>>(
    () =>
      MUNICIPALITY_VALUES.map((value) => ({
        value,
        label: t(`calculator.municipalities.${value}.label`),
        description: t(`calculator.municipalities.${value}.description`),
      })),
    [t],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: 128,
          gap: spacing.lg,
        }}
      >
        <Section title={t('calculator.sections.jobType')}>
          <IncomeTypeSelector
            value={form.jobType}
            onChange={(value) => updateField('jobType', value)}
          />
        </Section>

        <Section title={t('calculator.sections.income')}>
          <View style={{ gap: spacing.md }}>
            <IncomeModeToggle
              value={form.incomeMode}
              onChange={(value) => updateField('incomeMode', value)}
            />
            {form.incomeMode === 'annual' ? (
              <View style={{ gap: spacing.xs }}>
                <Text style={[typography.headline, { color: colors.text }]}>
                  {t('calculator.fields.annualIncome.label')}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t('calculator.fields.annualIncome.jp')}
                </Text>
                <TextInput
                  value={formatCurrencyInput(form.annualIncomeInput)}
                  onChangeText={calculator.setAnnualIncomeText}
                  placeholder={t('calculator.fields.annualIncome.placeholder')}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  inputMode="numeric"
                  style={{
                    minHeight: 56,
                    borderWidth: 1,
                    borderColor: errors.annualIncomeInput ? colors.danger : colors.border,
                    borderRadius: radius.sm,
                    paddingHorizontal: spacing.md,
                    backgroundColor: colors.surface,
                    color: colors.text,
                    ...typography.title3,
                  }}
                />
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t('calculator.fields.annualIncome.helper')}
                </Text>
                {form.jobType === 'baito' ? (
                  <Text style={[typography.caption, { color: colors.brand }]}>
                    {t('calculator.fields.annualIncome.baitoHint')}
                  </Text>
                ) : null}
                {errors.annualIncomeInput ? (
                  <Text style={[typography.caption, { color: colors.danger }]}>
                    {t(`calculator.errors.${errors.annualIncomeInput}`)}
                  </Text>
                ) : null}
                {/* Soft warning, doesn't block submit. NTA tables stay accurate
                    across all bands but enterprise-scale incomes have their own
                    tax planning that this simple calculator can't model. */}
                {parseCurrencyInput(form.annualIncomeInput) > 100_000_000 ? (
                  <Text style={[typography.caption, { color: colors.warning }]}>
                    ⚠ {t('calculator.errors.veryHighIncomeWarning')}
                  </Text>
                ) : null}
              </View>
            ) : (
              <HourlyFields calculator={calculator} />
            )}
          </View>
        </Section>

        <Section title={t('calculator.sections.personal')}>
          <View style={{ gap: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {t('calculator.fields.age.label')}
              </Text>
              <TextInput
                value={form.ageInput}
                onChangeText={calculator.setAgeText}
                placeholder={t('calculator.fields.age.placeholder')}
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                inputMode="numeric"
                style={{
                  minHeight: 52,
                  borderWidth: 1,
                  borderColor: errors.ageInput ? colors.danger : colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  backgroundColor: colors.surface,
                  color: colors.text,
                  ...typography.body,
                }}
              />
              {errors.ageInput ? (
                <Text style={[typography.caption, { color: colors.danger }]}>
                  {t(`calculator.errors.${errors.ageInput}`)}
                </Text>
              ) : null}
            </View>

            <PrefecturePicker
              label={t('calculator.fields.prefecture.label')}
              subLabel={t('calculator.fields.prefecture.jp')}
              placeholder={t('calculator.fields.prefecture.placeholder')}
              closeLabel={t('common.close')}
              value={form.prefecture}
              options={prefectureOptions}
              error={errors.prefecture ? t(`calculator.errors.${errors.prefecture}`) : undefined}
              onChange={(value) => updateField('prefecture', value)}
            />

            {form.jobType === 'seishain' ? (
              <View style={{ gap: spacing.xs }}>
                <Text style={[typography.headline, { color: colors.text }]}>
                  {t('calculator.fields.pensionType.label')}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t('calculator.fields.pensionType.helper')}
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <PensionRadio
                    value="kosei"
                    selected={form.pensionType === 'kosei'}
                    label={t('calculator.fields.pensionType.kosei')}
                    onPress={() => updateField('pensionType', 'kosei')}
                  />
                  <PensionRadio
                    value="kokumin"
                    selected={form.pensionType === 'kokumin'}
                    label={t('calculator.fields.pensionType.kokumin')}
                    onPress={() => updateField('pensionType', 'kokumin')}
                  />
                </View>
              </View>
            ) : null}

            {form.jobType === 'freelance' ? (
              <PrefecturePicker
                label={t('calculator.fields.municipality.label')}
                subLabel={t('calculator.fields.municipality.jp')}
                placeholder={t('calculator.fields.municipality.placeholder')}
                closeLabel={t('common.close')}
                value={form.municipality}
                options={municipalityOptions}
                error={errors.municipality ? t(`calculator.errors.${errors.municipality}`) : undefined}
                onChange={(value) => updateField('municipality', value)}
              />
            ) : null}
          </View>
        </Section>

        <DependentsInput form={form} updateField={updateField} />

        {form.jobType === 'freelance' ? (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: colors.border,
              overflow: 'hidden',
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => setAdvancedOpen((value) => !value)}
              style={{
                minHeight: 58,
                paddingHorizontal: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={[typography.headline, { color: colors.text }]}>
                  {t('calculator.sections.advanced')}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                  {t('calculator.advanced.subtitle')}
                </Text>
              </View>
              <Ionicons
                name={advancedOpen ? 'chevron-up' : 'chevron-down'}
                size={22}
                color={colors.textSecondary}
              />
            </Pressable>
            {advancedOpen ? (
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  padding: spacing.md,
                  gap: spacing.sm,
                }}
              >
                <Text style={[typography.body, { color: colors.text }]}>
                  {t('calculator.advanced.blueReturnDeduction')}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t('calculator.advanced.blueReturnExplain')}
                </Text>
                <View style={{ gap: spacing.sm }}>
                  {BLUE_RETURN_DEDUCTIONS.map((amount) => (
                    <Pressable
                      key={amount}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: form.blueReturnDeduction === amount }}
                      onPress={() => updateField('blueReturnDeduction', amount)}
                      style={{
                        minHeight: 44,
                        paddingHorizontal: spacing.md,
                        borderRadius: radius.sm,
                        borderWidth: 1,
                        borderColor:
                          form.blueReturnDeduction === amount ? colors.accent : colors.border,
                        backgroundColor:
                          form.blueReturnDeduction === amount ? colors.accentSubtle : colors.background,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Text style={[typography.body, { color: colors.text }]}>
                        {formatCurrency(amount)}
                      </Text>
                      {form.blueReturnDeduction === amount ? (
                        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {errors.general ? (
          <Text style={[typography.body, { color: colors.danger, textAlign: 'center' }]}>
            {t(`calculator.errors.${errors.general}`)}
          </Text>
        ) : null}
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.md,
          paddingBottom: spacing.lg,
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          shadowColor: colors.text,
          shadowOpacity: isDark ? 0 : 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
          elevation: 8,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !calculator.canSubmit }}
          disabled={!calculator.canSubmit}
          onPress={calculator.submit}
          style={{
            minHeight: 54,
            borderRadius: radius.sm,
            backgroundColor: calculator.canSubmit ? colors.accent : colors.borderStrong,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            gap: spacing.sm,
          }}
        >
          <Ionicons name="calculator-outline" size={22} color={colors.textInverse} />
          <Text style={[typography.headline, { color: colors.textInverse }]}>
            {t('calculator.actions.calculate')}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Text style={[typography.title3, { color: colors.text }]}>{title}</Text>
      {children}
    </View>
  );
}

function PensionRadio({
  value: _value,
  selected,
  label,
  onPress,
}: {
  value: PensionType;
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 44,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.border,
        borderRadius: radius.sm,
        backgroundColor: selected ? colors.accentSubtle : colors.surface,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={[typography.body, { color: colors.text, textAlign: 'center' }]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Phase 5I — Income mode toggle + hourly schedule fields
// ---------------------------------------------------------------------------

function IncomeModeToggle({
  value,
  onChange,
}: {
  value: IncomeMode;
  onChange: (next: IncomeMode) => void;
}) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const opts: IncomeMode[] = ['annual', 'hourly'];
  return (
    <View>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
        {t('calculator.incomeMode.label')}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {opts.map((opt) => {
          const selected = value === opt;
          return (
            <Pressable
              key={opt}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={t(`calculator.incomeMode.${opt}`)}
              onPress={() => onChange(opt)}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: selected ? colors.brand : colors.border,
                backgroundColor: selected ? colors.brandSubtle : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={[
                  typography.body,
                  { color: selected ? colors.brand : colors.text, fontWeight: selected ? '700' : '400' },
                ]}
              >
                {t(`calculator.incomeMode.${opt}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function HourlyFields({ calculator }: { calculator: UseCalculatorReturn }) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const { form, errors, updateField } = calculator;

  const previewTotal = useMemo(() => computeHourlyTotalFromForm(form), [form]);

  return (
    <View style={{ gap: spacing.md }}>
      <NumericRow
        label={t('calculator.fields.hourlyRate.label')}
        placeholder={t('calculator.fields.hourlyRate.placeholder')}
        helper={t('calculator.fields.hourlyRate.helper')}
        value={form.hourlyRateInput}
        onChange={(v) => updateField('hourlyRateInput', v.replace(/[^\d]/g, ''))}
        prefix="¥"
        error={errors.hourlyRateInput ? t(`calculator.errors.${errors.hourlyRateInput}`) : undefined}
      />

      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <View style={{ flex: 1 }}>
          <NumericRow
            label={t('calculator.fields.hoursPerDay.label')}
            placeholder="8"
            helper={t('calculator.fields.hoursPerDay.helper')}
            value={form.hoursPerDayInput}
            onChange={(v) => updateField('hoursPerDayInput', v)}
            decimal
            error={errors.hoursPerDayInput ? t(`calculator.errors.${errors.hoursPerDayInput}`) : undefined}
          />
        </View>
        <View style={{ flex: 1 }}>
          <NumericRow
            label={t('calculator.fields.daysPerWeek.label')}
            placeholder="5"
            helper={t('calculator.fields.daysPerWeek.helper')}
            value={form.daysPerWeekInput}
            onChange={(v) => updateField('daysPerWeekInput', v)}
            error={errors.daysPerWeekInput ? t(`calculator.errors.${errors.daysPerWeekInput}`) : undefined}
          />
        </View>
      </View>

      <NumericRow
        label={t('calculator.fields.weeksPerYear.label')}
        placeholder="52"
        helper={t('calculator.fields.weeksPerYear.helper')}
        value={form.weeksPerYearInput}
        onChange={(v) => updateField('weeksPerYearInput', v)}
      />

      <AllowanceSection
        titleKey="nightShift"
        toggleValue={form.hasNightShift}
        onToggle={(v) => updateField('hasNightShift', v)}
        hoursValue={form.nightHoursPerDayInput}
        onHoursChange={(v) => updateField('nightHoursPerDayInput', v)}
      />
      <AllowanceSection
        titleKey="overtime"
        toggleValue={form.hasOvertime}
        onToggle={(v) => updateField('hasOvertime', v)}
        hoursValue={form.overtimeHoursPerDayInput}
        onHoursChange={(v) => updateField('overtimeHoursPerDayInput', v)}
      />
      <AllowanceSection
        titleKey="weekend"
        toggleValue={form.hasWeekend}
        onToggle={(v) => updateField('hasWeekend', v)}
        hoursValue={form.weekendDaysPerMonthInput}
        onHoursChange={(v) => updateField('weekendDaysPerMonthInput', v)}
        fieldLabelKey="daysPerMonth"
      />

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
          value={prefix ? formatCurrencyInput(value).replace('¥', '') : value}
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

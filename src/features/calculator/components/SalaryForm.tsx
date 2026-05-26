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
  formatCurrency,
  formatCurrencyInput,
  parseCurrencyInput,
  type BlueReturnDeduction,
  type CalculatorFormState,
  type IncomeMode,
  type PensionType,
  type UseCalculatorReturn,
} from '@/features/calculator/hooks/useCalculator';
import {
  HourlyFields as HourlyFieldsCore,
  type HourlyFieldErrors,
  type HourlyFieldsValue,
} from './HourlyFields';
import { MultiJobEditor } from './MultiJobEditor';

interface SalaryFormProps {
  calculator: UseCalculatorReturn;
}

export function SalaryForm({ calculator }: SalaryFormProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [detailedOpen, setDetailedOpen] = useState(false);
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
        <LivePreviewBar preview={calculator.livePreview} />
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
            {form.incomeMode === 'multi-job' ? (
              <MultiJobEditor />
            ) : form.incomeMode === 'annual' ? (
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
              <>
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
                {form.municipality === 'other' ? (
                  <View style={{ gap: spacing.xs }}>
                    <Text style={[typography.headline, { color: colors.text }]}>
                      {t('calculator.fields.otherKokuhoAnnual.label')}
                    </Text>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {t('calculator.fields.otherKokuhoAnnual.helper')}
                    </Text>
                    <TextInput
                      value={formatCurrencyInput(form.otherKokuhoAnnualInput)}
                      onChangeText={(raw) =>
                        updateField('otherKokuhoAnnualInput', raw.replace(/[^\d]/g, ''))
                      }
                      placeholder="¥350,000"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      inputMode="numeric"
                      style={{
                        minHeight: 52,
                        borderWidth: 1,
                        borderColor: colors.border,
                        borderRadius: radius.sm,
                        paddingHorizontal: spacing.md,
                        backgroundColor: colors.surface,
                        color: colors.text,
                        ...typography.body,
                      }}
                    />
                  </View>
                ) : null}
              </>
            ) : null}
          </View>
        </Section>

        <DependentsInput form={form} updateField={updateField} />

        <DetailedDeductionsSection
          form={form}
          updateField={updateField}
          open={detailedOpen}
          onToggle={() => setDetailedOpen((v) => !v)}
        />

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

/**
 * Live take-home preview rendered at the top of the calculator form
 * (0.3.x). Updates as the user types valid inputs so they see the
 * estimate without an explicit "Calculate" tap. Renders a muted hint
 * instead when the form is incomplete or hits a validation snag (e.g.
 * monthlyBaseSalary × 12 + bonus disagrees with annualIncome).
 */
function LivePreviewBar({
  preview,
}: {
  preview: import('@/types/tax').TakeHomeResult | null;
}) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  if (!preview) {
    return (
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}
      >
        <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
          {t('calculator.livePreview.incomplete')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        backgroundColor: colors.brandSubtle,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.brand,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
      }}
    >
      <Text style={[typography.caption, { color: colors.brand, fontWeight: '600' }]}>
        {t('calculator.livePreview.label')}
      </Text>
      <Text
        style={[typography.title3, { color: colors.brand, fontWeight: '800' }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        ≈ {formatCurrency(preview.takeHomeMonthly)}
        <Text style={[typography.caption, { color: colors.brand, fontWeight: '400' }]}>
          {' / '}
          {t('calculator.livePreview.perMonth')}
        </Text>
      </Text>
    </View>
  );
}

/**
 * Calculator form section with card chrome (0.3.x). Section header sits
 * above the card so the card itself reads as a tappable / focused unit.
 * Matches the visual rhythm SettingsSection uses across the rest of the
 * app (small uppercase headers + grouped surface card).
 */
function Section({ title, children }: { title: string; children: ReactNode }) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text
        style={[
          typography.footnote,
          {
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.6,
            paddingHorizontal: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: spacing.md,
          gap: spacing.md,
        }}
      >
        {children}
      </View>
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
// Phase 5I — Income mode toggle
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
  const opts: IncomeMode[] = ['annual', 'hourly', 'multi-job'];
  return (
    <View>
      <Text style={[typography.caption, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
        {t('calculator.incomeMode.label')}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {opts.map((opt) => {
          const selected = value === opt;
          const i18nKey = opt === 'multi-job' ? 'multiJob' : opt;
          return (
            <Pressable
              key={opt}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={t(`calculator.incomeMode.${i18nKey}`)}
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
                paddingHorizontal: spacing.xs,
              }}
            >
              <Text
                style={[
                  typography.callout,
                  { color: selected ? colors.brand : colors.text, fontWeight: selected ? '700' : '400', textAlign: 'center' },
                ]}
                numberOfLines={2}
                adjustsFontSizeToFit
              >
                {t(`calculator.incomeMode.${i18nKey}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Thin wrapper that adapts the global `useCalculator` form state to the
 * standalone `HourlyFields` component. Multi-job mode renders the same
 * component but driven by local draft state inside `JobEditModal`.
 */
// ---------------------------------------------------------------------------
// 0.3.0 — Detailed deductions section
//
// Collapsible block exposing the new accuracy-oriented inputs:
// monthly base + bonus split, iDeCo, 生命保険料 (新制度), spouse income.
// All fields are optional — leaving them blank preserves backward-compat
// behavior with versions ≤ 0.2.x.
// ---------------------------------------------------------------------------

function DetailedDeductionsSection({
  form,
  updateField,
  open,
  onToggle,
}: {
  form: CalculatorFormState;
  updateField: <K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) => void;
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const isSalary = form.jobType !== 'freelance';
  const isAnnualMode = form.incomeMode === 'annual';
  const showBonusSplit = isSalary && isAnnualMode;
  const showSpouseIncome = form.hasDependents && form.hasSpouse;

  return (
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
        onPress={onToggle}
        style={{
          minHeight: 58,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: 1, paddingRight: spacing.sm }}>
          <Text style={[typography.headline, { color: colors.text }]}>
            {t('calculator.detailed.title')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            {t('calculator.detailed.subtitle')}
          </Text>
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textSecondary} />
      </Pressable>
      {open ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            padding: spacing.md,
            gap: spacing.lg,
          }}
        >
          {showBonusSplit ? (
            <BonusSplitBlock form={form} updateField={updateField} />
          ) : null}
          <IdecoBlock form={form} updateField={updateField} />
          <LifeInsuranceBlock form={form} updateField={updateField} />
          <EarthquakeInsuranceBlock form={form} updateField={updateField} />
          <MedicalDeductionBlock form={form} updateField={updateField} />
          {showSpouseIncome ? (
            <SpouseIncomeBlock form={form} updateField={updateField} />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function BonusSplitBlock({
  form,
  updateField,
}: {
  form: CalculatorFormState;
  updateField: <K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) => void;
}) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const detailed = form.useDetailedSalary;
  const monthlyBase = parseCurrencyInput(form.monthlyBaseSalaryInput);
  const annualBonus = parseCurrencyInput(form.annualBonusInput);
  const derivedAnnual = monthlyBase * 12 + annualBonus;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[typography.headline, { color: colors.text }]}>
        {t('calculator.detailed.bonus.title')}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('calculator.detailed.bonus.subtitle')}
      </Text>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <BonusModeRadio
          selected={!detailed}
          label={t('calculator.detailed.bonus.simple')}
          onPress={() => updateField('useDetailedSalary', false)}
        />
        <BonusModeRadio
          selected={detailed}
          label={t('calculator.detailed.bonus.detailed')}
          onPress={() => updateField('useDetailedSalary', true)}
        />
      </View>
      {detailed ? (
        <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
          <CurrencyInput
            label={t('calculator.detailed.bonus.monthlyBaseLabel')}
            value={form.monthlyBaseSalaryInput}
            placeholder="¥400,000"
            onChange={(next) => updateField('monthlyBaseSalaryInput', next)}
          />
          <CurrencyInput
            label={t('calculator.detailed.bonus.annualBonusLabel')}
            value={form.annualBonusInput}
            placeholder="¥1,200,000"
            onChange={(next) => updateField('annualBonusInput', next)}
          />
          <View style={{ gap: spacing.xs }}>
            <Text style={[typography.callout, { color: colors.text }]}>
              {t('calculator.detailed.bonus.countLabel')}
            </Text>
            <TextInput
              value={form.bonusPaymentCountInput}
              onChangeText={(value) =>
                updateField('bonusPaymentCountInput', value.replace(/[^\d]/g, ''))
              }
              placeholder="2"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              inputMode="numeric"
              style={{
                minHeight: 44,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.sm,
                paddingHorizontal: spacing.md,
                backgroundColor: colors.background,
                color: colors.text,
                ...typography.body,
              }}
            />
          </View>
          {monthlyBase > 0 ? (
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t('calculator.detailed.bonus.derived', {
                annual: formatCurrency(derivedAnnual),
                base: formatCurrency(monthlyBase),
                bonus: formatCurrency(annualBonus),
              })}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function BonusModeRadio({
  selected,
  label,
  onPress,
}: {
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
        backgroundColor: selected ? colors.accentSubtle : colors.background,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={[typography.body, { color: colors.text }]}>{label}</Text>
    </Pressable>
  );
}

function IdecoBlock({
  form,
  updateField,
}: {
  form: CalculatorFormState;
  updateField: <K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 8 }}>
      <CurrencyInput
        label={t('calculator.detailed.ideco.label')}
        helper={t('calculator.detailed.ideco.helper')}
        value={form.idecoMonthlyInput}
        placeholder="¥23,000"
        onChange={(next) => updateField('idecoMonthlyInput', next)}
      />
    </View>
  );
}

function LifeInsuranceBlock({
  form,
  updateField,
}: {
  form: CalculatorFormState;
  updateField: <K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) => void;
}) {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[typography.headline, { color: colors.text }]}>
        {t('calculator.detailed.lifeInsurance.title')}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>
        {t('calculator.detailed.lifeInsurance.subtitle')}
      </Text>
      <CurrencyInput
        label={t('calculator.detailed.lifeInsurance.generalNew')}
        value={form.lifeInsuranceGeneralNewInput}
        placeholder="¥40,000"
        onChange={(next) => updateField('lifeInsuranceGeneralNewInput', next)}
      />
      <CurrencyInput
        label={t('calculator.detailed.lifeInsurance.careMedicalNew')}
        value={form.lifeInsuranceCareMedicalNewInput}
        placeholder="¥40,000"
        onChange={(next) => updateField('lifeInsuranceCareMedicalNewInput', next)}
      />
      <CurrencyInput
        label={t('calculator.detailed.lifeInsurance.personalPensionNew')}
        value={form.lifeInsurancePersonalPensionNewInput}
        placeholder="¥40,000"
        onChange={(next) => updateField('lifeInsurancePersonalPensionNewInput', next)}
      />
    </View>
  );
}

function SpouseIncomeBlock({
  form,
  updateField,
}: {
  form: CalculatorFormState;
  updateField: <K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 8 }}>
      <CurrencyInput
        label={t('calculator.detailed.spouseIncome.label')}
        helper={t('calculator.detailed.spouseIncome.helper')}
        value={form.spouseAnnualIncomeInput}
        placeholder="¥1,030,000"
        onChange={(next) => updateField('spouseAnnualIncomeInput', next)}
      />
    </View>
  );
}

function EarthquakeInsuranceBlock({
  form,
  updateField,
}: {
  form: CalculatorFormState;
  updateField: <K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 8 }}>
      <CurrencyInput
        label={t('calculator.detailed.earthquake.label')}
        helper={t('calculator.detailed.earthquake.helper')}
        value={form.earthquakeInsurancePremiumInput}
        placeholder="¥30,000"
        onChange={(next) => updateField('earthquakeInsurancePremiumInput', next)}
      />
    </View>
  );
}

function MedicalDeductionBlock({
  form,
  updateField,
}: {
  form: CalculatorFormState;
  updateField: <K extends keyof CalculatorFormState>(key: K, value: CalculatorFormState[K]) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: 8 }}>
      <CurrencyInput
        label={t('calculator.detailed.medical.label')}
        helper={t('calculator.detailed.medical.helper')}
        value={form.medicalDeductibleInput}
        placeholder="¥0"
        onChange={(next) => updateField('medicalDeductibleInput', next)}
      />
    </View>
  );
}

/** Reusable currency text input — wraps formatCurrencyInput + numeric keyboard. */
function CurrencyInput({
  label,
  helper,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  helper?: string;
  value: string;
  placeholder?: string;
  onChange: (next: string) => void;
}) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.callout, { color: colors.text }]}>{label}</Text>
      <TextInput
        value={formatCurrencyInput(value)}
        onChangeText={(raw) => onChange(raw.replace(/[^\d]/g, ''))}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType="numeric"
        inputMode="numeric"
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          backgroundColor: colors.background,
          color: colors.text,
          ...typography.body,
        }}
      />
      {helper ? (
        <Text style={[typography.caption, { color: colors.textSecondary }]}>{helper}</Text>
      ) : null}
    </View>
  );
}

function HourlyFields({ calculator }: { calculator: UseCalculatorReturn }) {
  const { t } = useTranslation();
  const { form, errors, updateField } = calculator;

  const fieldValue: HourlyFieldsValue = {
    hourlyRateInput: form.hourlyRateInput,
    hoursPerDayInput: form.hoursPerDayInput,
    daysPerWeekInput: form.daysPerWeekInput,
    weeksPerYearInput: form.weeksPerYearInput,
    hasNightShift: form.hasNightShift,
    nightHoursPerDayInput: form.nightHoursPerDayInput,
    hasOvertime: form.hasOvertime,
    overtimeHoursPerDayInput: form.overtimeHoursPerDayInput,
    hasWeekend: form.hasWeekend,
    weekendDaysPerMonthInput: form.weekendDaysPerMonthInput,
  };

  const fieldErrors: HourlyFieldErrors = {};
  if (errors.hourlyRateInput) fieldErrors.hourlyRate = t(`calculator.errors.${errors.hourlyRateInput}`);
  if (errors.hoursPerDayInput) fieldErrors.hoursPerDay = t(`calculator.errors.${errors.hoursPerDayInput}`);
  if (errors.daysPerWeekInput) fieldErrors.daysPerWeek = t(`calculator.errors.${errors.daysPerWeekInput}`);

  return (
    <HourlyFieldsCore
      value={fieldValue}
      errors={fieldErrors}
      onChange={(next) => {
        // Diff what changed — write each modified field individually so we
        // don't blow away unrelated keys in the global form.
        (Object.keys(next) as Array<keyof HourlyFieldsValue>).forEach((key) => {
          if (next[key] !== fieldValue[key]) {
            // Both branches share the same form-state field name.
            updateField(key, next[key] as never);
          }
        });
      }}
    />
  );
}



import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';
import type {
  CalculatorFormState,
  UseCalculatorReturn,
} from '@/features/calculator/hooks/useCalculator';

interface DependentsInputProps {
  form: CalculatorFormState;
  updateField: UseCalculatorReturn['updateField'];
}

export function DependentsInput({ form, updateField }: DependentsInputProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const [expanded, setExpanded] = useState(false);

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
        onPress={() => setExpanded((value) => !value)}
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
            {t('calculator.sections.dependents')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            {t('calculator.dependents.subtitle')}
          </Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textSecondary}
        />
      </Pressable>

      {expanded ? (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.border,
            padding: spacing.md,
            gap: spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.body, { color: colors.text, flex: 1, paddingRight: spacing.md }]}>
              {t('calculator.dependents.hasDependents')}
            </Text>
            <Switch
              accessibilityLabel={t('calculator.dependents.hasDependents')}
              value={form.hasDependents}
              onValueChange={(value) => updateField('hasDependents', value)}
              trackColor={{ false: colors.borderStrong, true: colors.accentSubtle }}
              thumbColor={form.hasDependents ? colors.accent : colors.surfaceElevated}
            />
          </View>

          {form.hasDependents ? (
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={[typography.body, { color: colors.text, flex: 1, paddingRight: spacing.md }]}>
                  {t('calculator.dependents.spouse')}
                </Text>
                <Switch
                  accessibilityLabel={t('calculator.dependents.spouse')}
                  value={form.hasSpouse}
                  onValueChange={(value) => updateField('hasSpouse', value)}
                  trackColor={{ false: colors.borderStrong, true: colors.accentSubtle }}
                  thumbColor={form.hasSpouse ? colors.accent : colors.surfaceElevated}
                />
              </View>

              <Stepper
                label={t('calculator.dependents.childrenUnder16')}
                value={form.childrenUnder16}
                onChange={(value) => updateField('childrenUnder16', value)}
              />
              <Stepper
                label={t('calculator.dependents.studentChildren')}
                value={form.studentChildren16To22}
                onChange={(value) => updateField('studentChildren16To22', value)}
              />
              <Stepper
                label={t('calculator.dependents.elderly')}
                value={form.elderlyDependents70Plus}
                onChange={(value) => updateField('elderlyDependents70Plus', value)}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Text style={[typography.body, { color: colors.text, flex: 1, paddingRight: spacing.md }]}>
        {label}
      </Text>
      <View
        style={{
          width: 116,
          height: 40,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          backgroundColor: colors.background,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(Math.max(0, value - 1))}
          style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="remove" size={20} color={colors.text} />
        </Pressable>
        <Text style={[typography.headline, { color: colors.text, width: 36, textAlign: 'center' }]}>
          {value}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onChange(value + 1)}
          style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center' }}
        >
          <Ionicons name="add" size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

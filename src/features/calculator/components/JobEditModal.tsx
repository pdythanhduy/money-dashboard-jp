/**
 * Modal for creating / editing a single JobProfile in the multi-job flow.
 * Reuses the standalone HourlyFields component so visual behavior matches
 * Calculator → Hourly mode exactly.
 */

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DEFAULT_HOURLY_FIELDS,
  HourlyFields,
  toHourlyJobInput,
  type HourlyFieldsValue,
} from '@/features/calculator/components/HourlyFields';
import { useMultiJobStore } from '@/store/multiJobStore';
import { useTheme } from '@/theme';
import type { JobProfile } from '@/types/job-profile';

interface Props {
  visible: boolean;
  editing: JobProfile | null;
  onClose: () => void;
}

/**
 * Convert HourlyJobInput back to draft form fields when editing an
 * existing job (so the form pre-fills with the saved schedule).
 */
function fieldsFromJob(job: JobProfile): HourlyFieldsValue {
  const v: HourlyFieldsValue = {
    ...DEFAULT_HOURLY_FIELDS,
    hourlyRateInput: String(job.input.hourlyRate),
    hoursPerDayInput: String(job.input.hoursPerDay),
    daysPerWeekInput: String(job.input.daysPerWeek),
    weeksPerYearInput: String(job.input.weeksPerYear ?? 52),
  };
  if (job.input.nightHoursPerDay && job.input.nightHoursPerDay > 0) {
    v.hasNightShift = true;
    v.nightHoursPerDayInput = String(job.input.nightHoursPerDay);
  }
  if (job.input.overtimeHoursPerDay && job.input.overtimeHoursPerDay > 0) {
    v.hasOvertime = true;
    v.overtimeHoursPerDayInput = String(job.input.overtimeHoursPerDay);
  }
  if (job.input.weekendDaysPerMonth && job.input.weekendDaysPerMonth > 0) {
    v.hasWeekend = true;
    v.weekendDaysPerMonthInput = String(job.input.weekendDaysPerMonth);
  }
  return v;
}

export function JobEditModal({ visible, editing, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const [name, setName] = useState('');
  const [fields, setFields] = useState<HourlyFieldsValue>(DEFAULT_HOURLY_FIELDS);

  const addJob = useMultiJobStore((s) => s.addJob);
  const updateJob = useMultiJobStore((s) => s.updateJob);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setName(editing.name);
      setFields(fieldsFromJob(editing));
    } else {
      setName('');
      setFields(DEFAULT_HOURLY_FIELDS);
    }
  }, [visible, editing]);

  const canSave = name.trim().length > 0 && fields.hourlyRateInput.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const trimmedName = name.trim();
    const input = toHourlyJobInput(fields);
    if (editing) {
      updateJob(editing.id, { name: trimmedName, input });
    } else {
      addJob(trimmedName, input);
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.sm,
              paddingBottom: spacing.md,
            }}
          >
            <Text style={[typography.title3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
              {editing ? t('calculator.multiJob.editTitle') : t('calculator.multiJob.addTitle')}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ gap: spacing.xs }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {t('calculator.multiJob.nameLabel')}
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('calculator.multiJob.jobNamePlaceholder')}
                placeholderTextColor={colors.textSecondary}
                style={{
                  minHeight: 50,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  paddingHorizontal: spacing.md,
                  color: colors.text,
                  backgroundColor: colors.surface,
                  ...typography.body,
                }}
              />
            </View>

            <HourlyFields value={fields} onChange={setFields} />
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              gap: spacing.sm,
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.md,
              paddingBottom: spacing.lg,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              backgroundColor: colors.background,
            }}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.cancel')}
              onPress={onClose}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 50,
                borderRadius: radius.sm,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: colors.text }]}>{t('common.cancel')}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.save')}
              accessibilityState={{ disabled: !canSave }}
              disabled={!canSave}
              onPress={handleSave}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 50,
                borderRadius: radius.sm,
                backgroundColor: canSave ? colors.brand : colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: canSave ? colors.textInverse : colors.textSecondary, fontWeight: '600' }]}>
                {t('common.save')}
              </Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

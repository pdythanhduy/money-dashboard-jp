import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, Text, View } from 'react-native';

import { JobEditModal } from '@/features/calculator/components/JobEditModal';
import { formatCurrency } from '@/lib/format';
import { computeHourlyAnnual } from '@/lib/hourly-wage-calculator';
import { MAX_JOBS, useMultiJobStore } from '@/store/multiJobStore';
import { useTheme } from '@/theme';
import type { JobProfile } from '@/types/job-profile';

export function MultiJobEditor() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const jobs = useMultiJobStore((s) => s.jobs);
  const removeJob = useMultiJobStore((s) => s.removeJob);
  const [editing, setEditing] = useState<JobProfile | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const perJob = useMemo(() => {
    return jobs.map((j) => {
      try {
        return { id: j.id, total: computeHourlyAnnual(j.input).totalAnnual };
      } catch {
        return { id: j.id, total: 0 };
      }
    });
  }, [jobs]);

  const totalAnnual = perJob.reduce((sum, p) => sum + p.total, 0);
  const atLimit = jobs.length >= MAX_JOBS;

  const openAdd = () => {
    if (atLimit) {
      Alert.alert(t('calculator.multiJob.limitReached', { max: MAX_JOBS }));
      return;
    }
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (job: JobProfile) => {
    setEditing(job);
    setModalOpen(true);
  };

  return (
    <View style={{ gap: spacing.md }}>
      <Text style={[typography.headline, { color: colors.text }]}>
        {t('calculator.multiJob.title')}
      </Text>

      {jobs.length === 0 ? (
        <View
          style={{
            padding: spacing.lg,
            borderRadius: radius.md,
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
          }}
        >
          <Ionicons name="briefcase-outline" size={36} color={colors.textSecondary} />
          <Text
            style={[
              typography.body,
              { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
            ]}
          >
            {t('calculator.multiJob.emptyState')}
          </Text>
        </View>
      ) : (
        jobs.map((job) => {
          const total = perJob.find((p) => p.id === job.id)?.total ?? 0;
          return (
            <Pressable
              key={job.id}
              accessibilityRole="button"
              accessibilityLabel={`${job.name} · ${formatCurrency(total)}`}
              onPress={() => openEdit(job)}
              style={({ pressed }) => ({
                padding: spacing.md,
                borderRadius: radius.md,
                backgroundColor: colors.surfaceElevated,
                opacity: pressed ? 0.85 : 1,
                ...(isDark
                  ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
                  : {}),
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
                    {job.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    ¥{job.input.hourlyRate}/h · {job.input.hoursPerDay}h × {job.input.daysPerWeek}d/wk
                  </Text>
                </View>
                <Text style={[typography.body, { color: colors.brand, fontWeight: '700' }]}>
                  {formatCurrency(total)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('common.delete')}
                  onPress={(e) => {
                    e.stopPropagation();
                    removeJob(job.id);
                  }}
                  hitSlop={8}
                  style={{ marginLeft: spacing.sm, padding: spacing.xs }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>
            </Pressable>
          );
        })
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('calculator.multiJob.addJob')}
        accessibilityState={{ disabled: atLimit }}
        onPress={openAdd}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          minHeight: 50,
          borderRadius: radius.sm,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: atLimit ? colors.border : colors.brand,
          backgroundColor: colors.surface,
          opacity: pressed || atLimit ? 0.6 : 1,
        })}
      >
        <Ionicons name="add-circle-outline" size={20} color={atLimit ? colors.textSecondary : colors.brand} />
        <Text style={[typography.callout, { color: atLimit ? colors.textSecondary : colors.brand, fontWeight: '600' }]}>
          {atLimit
            ? t('calculator.multiJob.limitReached', { max: MAX_JOBS })
            : t('calculator.multiJob.addJob')}
        </Text>
      </Pressable>

      {jobs.length > 0 ? (
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
            {t('calculator.multiJob.totalLabel', { count: jobs.length })}
          </Text>
          <Text style={[typography.title3, { color: colors.brand, fontWeight: '700' }]}>
            {formatCurrency(totalAnnual)}
          </Text>
        </View>
      ) : null}

      <JobEditModal visible={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
    </View>
  );
}

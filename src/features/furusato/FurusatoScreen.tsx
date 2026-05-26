import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DonationCard } from '@/features/furusato/components/DonationCard';
import { DonationEditModal } from '@/features/furusato/components/DonationEditModal';
import { EmptyState } from '@/features/furusato/components/EmptyState';
import { LimitCalculatorCard } from '@/features/furusato/components/LimitCalculatorCard';
import { useFurusatoSummary } from '@/features/furusato/hooks/useFurusatoSummary';
import { useFurusatoStore, type FurusatoDonation } from '@/store/furusatoStore';
import { useTheme } from '@/theme';

/** Standard 所得税 marginal rate brackets (decimal). Listed in the order
 *  users typically encounter them — beginner brackets first. */
const MARGINAL_RATE_OPTIONS: readonly number[] = [0.05, 0.10, 0.20, 0.23, 0.33, 0.40, 0.45];

export function FurusatoScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const donations = useFurusatoStore((s) => s.donations);

  // Manual override: when the user toggles this on, the summary hook
  // ignores the latest Calculator result and uses the values typed
  // here. Useful when the user already knows their 課税所得 from a
  // payslip / tax return and just wants a quick limit check.
  const [manualMode, setManualMode] = useState(false);
  const [manualTaxableInput, setManualTaxableInput] = useState('');
  const [manualRate, setManualRate] = useState<number>(0.10);
  const parsedTaxable = Number.parseInt(manualTaxableInput.replace(/[^\d]/g, ''), 10);
  const overrides = manualMode
    ? {
        residentTaxableIncome: Number.isFinite(parsedTaxable) ? parsedTaxable : 0,
        incomeTaxMarginalRate: manualRate,
      }
    : undefined;
  const summary = useFurusatoSummary(overrides);

  const [editing, setEditing] = useState<FurusatoDonation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const openAdd = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((d: FurusatoDonation) => {
    setEditing(d);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xs,
          gap: spacing.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => navigation.goBack()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[typography.largeTitle, { color: colors.text }]}>{t('furusato.title')}</Text>
          <Text style={[typography.footnote, { color: colors.textSecondary }]}>
            {t('furusato.subtitle')}
          </Text>
        </View>
      </View>

      <FlatList
        data={donations}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => <DonationCard donation={item} onPress={openEdit} />}
        ListHeaderComponent={
          <>
            <LimitCalculatorCard
              limit={summary.limit}
              residentTaxableIncome={summary.residentTaxableIncome}
              incomeTaxMarginalRate={summary.incomeTaxMarginalRate}
              totalDonated={summary.totalDonated}
              remainingCapacity={summary.remainingCapacity}
              fromCalculator={summary.hasCalculatorResult && !manualMode}
            />

            {/* Manual override panel: when enabled, ignores the latest
                Calculator result and uses values typed in here. */}
            <View
              style={{
                marginHorizontal: spacing.lg,
                marginTop: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                padding: spacing.md,
                gap: spacing.sm,
              }}
            >
              <Pressable
                accessibilityRole="switch"
                accessibilityLabel={t('furusato.manual.toggle')}
                accessibilityState={{ checked: manualMode }}
                onPress={() => setManualMode((v) => !v)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}
              >
                <Ionicons
                  name={manualMode ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={manualMode ? colors.brand : colors.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
                    {t('furusato.manual.toggle')}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                    {t('furusato.manual.toggleHint')}
                  </Text>
                </View>
              </Pressable>
              {manualMode ? (
                <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
                  <View>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {t('furusato.manual.taxableIncomeLabel')}
                    </Text>
                    <TextInput
                      value={manualTaxableInput}
                      onChangeText={(raw) => setManualTaxableInput(raw.replace(/[^\d]/g, ''))}
                      placeholder="¥3,000,000"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="numeric"
                      inputMode="numeric"
                      style={{
                        marginTop: 4,
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
                  <View>
                    <Text style={[typography.caption, { color: colors.textSecondary }]}>
                      {t('furusato.manual.marginalRateLabel')}
                    </Text>
                    <View
                      style={{
                        marginTop: 4,
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: spacing.xs,
                      }}
                    >
                      {MARGINAL_RATE_OPTIONS.map((rate) => {
                        const selected = rate === manualRate;
                        return (
                          <Pressable
                            key={rate}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: selected }}
                            onPress={() => setManualRate(rate)}
                            style={{
                              minWidth: 56,
                              minHeight: 36,
                              paddingHorizontal: spacing.sm,
                              borderRadius: radius.sm,
                              borderWidth: 1,
                              borderColor: selected ? colors.brand : colors.border,
                              backgroundColor: selected ? colors.brandSubtle : colors.background,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text
                              style={[
                                typography.callout,
                                {
                                  color: selected ? colors.brand : colors.text,
                                  fontWeight: selected ? '700' : '500',
                                },
                              ]}
                            >
                              {Math.round(rate * 100)}%
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
              <Text style={[typography.headline, { color: colors.text }]}>
                {t('furusato.history.title')}
              </Text>
            </View>
            {donations.length === 0 ? <EmptyState onPressCta={openAdd} /> : null}
          </>
        }
        contentContainerStyle={{ paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('furusato.empty.cta')}
        onPress={openAdd}
        style={({ pressed }) => ({
          position: 'absolute',
          right: spacing.lg,
          bottom: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        })}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      <DonationEditModal visible={modalOpen} editing={editing} onClose={closeModal} />
    </SafeAreaView>
  );
}

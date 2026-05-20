import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DonationCard } from '@/features/furusato/components/DonationCard';
import { DonationEditModal } from '@/features/furusato/components/DonationEditModal';
import { EmptyState } from '@/features/furusato/components/EmptyState';
import { LimitCalculatorCard } from '@/features/furusato/components/LimitCalculatorCard';
import { useFurusatoSummary } from '@/features/furusato/hooks/useFurusatoSummary';
import { useFurusatoStore, type FurusatoDonation } from '@/store/furusatoStore';
import { useTheme } from '@/theme';

export function FurusatoScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation();
  const donations = useFurusatoStore((s) => s.donations);
  const summary = useFurusatoSummary();

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
              fromCalculator={summary.hasCalculatorResult}
            />
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

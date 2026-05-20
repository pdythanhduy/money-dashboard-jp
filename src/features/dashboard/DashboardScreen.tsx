import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { EmptyState } from '@/features/dashboard/components/EmptyState';
import { GreetingHeader } from '@/features/dashboard/components/GreetingHeader';
import { MonthlyTrendChart } from '@/features/dashboard/components/MonthlyTrendChart';
import { QuickStatsRow } from '@/features/dashboard/components/QuickStatsRow';
import { TakeHomeProgressCard } from '@/features/dashboard/components/TakeHomeProgressCard';
import { UpcomingEventsCard } from '@/features/dashboard/components/UpcomingEventsCard';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { useFurusatoSummary } from '@/features/furusato/hooks/useFurusatoSummary';
import { useMedicalSummary } from '@/features/medical/hooks/useMedicalSummary';
import { formatCurrency } from '@/lib/format';
import { activeWalls } from '@/lib/wall-warnings';
import type { MainTabParamList } from '@/navigation/MainTabs';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useTheme } from '@/theme';

type DashboardNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation<DashboardNavigationProp>();
  const data = useDashboardData();
  const lastInputAnnual = useCalculatorStore((s) => s.lastInput?.annualIncome ?? 0);
  const walls = activeWalls(lastInputAnnual);
  const topWall = walls[0];
  const medical = useMedicalSummary();
  const furusato = useFurusatoSummary();

  const goToCalculator = () => navigation.navigate('Calculator');
  const goToMedical = () => {
    // RootNavigator hosts Medical as a sibling of Main → reach it via the
    // root-typed parent navigator.
    const parent = navigation.getParent<{ navigate: (route: keyof RootStackParamList) => void }>();
    parent?.navigate('Medical');
  };
  const goToFurusato = () => {
    const parent = navigation.getParent<{ navigate: (route: keyof RootStackParamList) => void }>();
    parent?.navigate('Furusato');
  };

  if (!data.hasData) {
    return <EmptyState onPressCta={goToCalculator} />;
  }

  // Edge: stored calculation but monthly take-home rounds to ¥0 (income below
  // every tax/insurance threshold). Show a friendlier explainer instead of a
  // ¥0 progress bar that looks broken.
  if (data.monthlyTakeHome <= 0) {
    return (
      <EmptyState
        onPressCta={goToCalculator}
        title={t('dashboard.empty.zeroIncomeTitle')}
        subtitle={t('dashboard.empty.zeroIncomeBody')}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={data.refresh}
            tintColor={colors.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <GreetingHeader
          greeting={data.greeting}
          today={data.today}
          daysUntilPayday={data.daysUntilPayday}
          isPayday={data.isPayday}
        />
        {topWall ? (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t(`calculator.walls.${topWall.wall}.title`)}
            onPress={goToCalculator}
            style={({ pressed }) => ({
              marginHorizontal: spacing.lg,
              marginTop: spacing.md,
              padding: spacing.sm,
              paddingHorizontal: spacing.md,
              borderRadius: radius.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.surfaceElevated,
              borderLeftWidth: 4,
              borderLeftColor: topWall.severity === 'crossed' ? colors.danger : colors.warning,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Ionicons
              name={topWall.severity === 'crossed' ? 'alert-circle' : 'warning'}
              size={18}
              color={topWall.severity === 'crossed' ? colors.danger : colors.warning}
            />
            <Text style={[typography.footnote, { color: colors.text, flex: 1 }]} numberOfLines={2}>
              {t(`calculator.walls.${topWall.wall}.title`)} ·{' '}
              {topWall.severity === 'crossed'
                ? t('calculator.walls.crossedBy', { amount: formatCurrency(Math.abs(topWall.distance)) })
                : t('calculator.walls.approachingBy', { amount: formatCurrency(Math.abs(topWall.distance)) })}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </Pressable>
        ) : null}
        <TakeHomeProgressCard
          proportionalTakeHome={data.proportionalTakeHome}
          monthlyTakeHome={data.monthlyTakeHome}
          averageDaily={data.averageDaily}
          daysInMonth={data.daysInMonth}
          daysPassed={data.daysPassed}
        />
        <QuickStatsRow
          proportionalTax={data.proportionalTax}
          proportionalInsurance={data.proportionalInsurance}
          retentionRate={data.retentionRate}
          onPressTax={goToCalculator}
        />
        {medical.total > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('medical.dashboard.cardTitle')}
            onPress={goToMedical}
            style={({ pressed }) => ({
              marginHorizontal: spacing.lg,
              marginTop: spacing.md,
              padding: spacing.md,
              borderRadius: 16,
              backgroundColor: colors.surfaceElevated,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Ionicons name="medkit-outline" size={18} color={colors.brand} />
              <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
                {t('medical.dashboard.cardTitle')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
            <Text style={[typography.title3, { color: colors.brand, fontWeight: '800' }]}>
              {formatCurrency(medical.total)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {medical.hasReachedThreshold
                ? t('medical.dashboard.aboveThreshold', {
                    deductible: formatCurrency(medical.deductible),
                    refund: formatCurrency(medical.refund),
                  })
                : t('medical.dashboard.belowThreshold', {
                    remaining: formatCurrency(medical.remainingToThreshold),
                  })}
            </Text>
          </Pressable>
        ) : null}
        {furusato.hasCalculatorResult ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('furusato.dashboard.cardTitle')}
            onPress={goToFurusato}
            style={({ pressed }) => ({
              marginHorizontal: spacing.lg,
              marginTop: spacing.md,
              padding: spacing.md,
              borderRadius: 16,
              backgroundColor: colors.surfaceElevated,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Ionicons name="gift-outline" size={18} color={colors.brand} />
              <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
                {t('furusato.dashboard.cardTitle')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
            <Text style={[typography.title3, { color: colors.brand, fontWeight: '800' }]}>
              {formatCurrency(furusato.remainingCapacity)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {t('furusato.dashboard.remaining', {
                remaining: formatCurrency(furusato.remainingCapacity),
                max: formatCurrency(furusato.limit.maxDonation),
              })}
            </Text>
          </Pressable>
        ) : null}
        <MonthlyTrendChart />
        <UpcomingEventsCard reminders={data.upcomingReminders} />

        <View style={{ alignItems: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg }}>
          <Text
            style={[
              typography.caption,
              { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm },
            ]}
          >
            {t('dashboard.footer.note')}
          </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t('dashboard.footer.updateCta')}
            onPress={goToCalculator}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={[typography.footnote, { color: colors.brand, fontWeight: '600' }]}>
              {t('dashboard.footer.updateCta')} →
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

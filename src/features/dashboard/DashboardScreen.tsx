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
import type { MainTabParamList } from '@/navigation/MainTabs';
import { useTheme } from '@/theme';

type DashboardNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const navigation = useNavigation<DashboardNavigationProp>();
  const data = useDashboardData();

  const goToCalculator = () => navigation.navigate('Calculator');

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

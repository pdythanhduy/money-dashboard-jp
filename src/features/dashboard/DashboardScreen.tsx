import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { DailySpendingCard } from '@/features/dashboard/components/DailySpendingCard';
import { WeeklyReviewCard } from '@/features/dashboard/components/WeeklyReviewCard';
import { EmptyState } from '@/features/dashboard/components/EmptyState';
import { GreetingHeader } from '@/features/dashboard/components/GreetingHeader';
import { MonthlyTrendChart } from '@/features/dashboard/components/MonthlyTrendChart';
import { QuickStatsRow } from '@/features/dashboard/components/QuickStatsRow';
import { TakeHomeProgressCard } from '@/features/dashboard/components/TakeHomeProgressCard';
import { TripBudgetCard } from '@/features/dashboard/components/TripBudgetCard';
import { UpcomingEventsCard } from '@/features/dashboard/components/UpcomingEventsCard';
import { useDashboardData } from '@/features/dashboard/hooks/useDashboardData';
import { isFurusatoUseful } from '@/features/furusato/furusato-eligibility';
import { useFurusatoSummary } from '@/features/furusato/hooks/useFurusatoSummary';
import { iconNameFor } from '@/features/goals/components/IconPicker';
import { QuickAddExpenseModal } from '@/features/kakeibo/components/QuickAddExpenseModal';
import { GuidedSetupCard } from '@/features/onboarding/components/GuidedSetupCard';
import { useMedicalSummary } from '@/features/medical/hooks/useMedicalSummary';
import { formatCurrency } from '@/lib/format';
import { computeGoalProjection } from '@/lib/goals-math';
import { buildMonthlyReport } from '@/lib/kakeibo-math';
import { buildYearlySummary } from '@/lib/remittance-math';
import { activeWalls } from '@/lib/wall-warnings';
import type { MainTabParamList } from '@/navigation/MainTabs';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useCalculatorStore } from '@/store/calculatorStore';
import { useFurusatoStore } from '@/store/furusatoStore';
import { getSavedTotal, isGoalCompleted, useGoalsStore } from '@/store/goalsStore';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useRemittanceStore } from '@/store/remittanceStore';
import { useTheme } from '@/theme';

type DashboardNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Dashboard'>;

export function DashboardScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation<DashboardNavigationProp>();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const data = useDashboardData();
  const lastInputAnnual = useCalculatorStore((s) => s.lastInput?.annualIncome ?? 0);
  const walls = activeWalls(lastInputAnnual);
  const topWall = walls[0];
  const medical = useMedicalSummary();
  const furusato = useFurusatoSummary();
  const furusatoDonations = useFurusatoStore((s) => s.donations);
  const goals = useGoalsStore((s) => s.goals);
  const kakeiboEntries = useKakeiboStore((s) => s.entries);
  const kakeiboRecurrings = useKakeiboStore((s) => s.recurrings);
  const remittanceEntries = useRemittanceStore((s) => s.entries);
  const remittanceGoal = useRemittanceStore((s) => s.annualGoalJPY);
  const takeHomeMonthly = useCalculatorStore((s) => s.lastResult?.takeHomeMonthly ?? 0);
  const hasCompletedOnboarding = useOnboardingStore((s) => s.hasCompletedOnboarding);
  const hasSeenGuidedSetup = useOnboardingStore((s) => s.hasSeenGuidedSetup);

  // FAB only makes sense if the user has anything to budget AGAINST or
  // any existing log activity. Otherwise the floating "+" lands on an
  // empty dashboard with no context — confusing.
  const showQuickAddFab =
    takeHomeMonthly > 0 || kakeiboEntries.length > 0 || kakeiboRecurrings.length > 0;

  const remittanceThisYear = (() => {
    if (remittanceEntries.length === 0) return null;
    const r = buildYearlySummary(remittanceEntries, new Date().getFullYear());
    if (r.entryCount === 0) return null;
    return { totalSentJPY: r.totalSentJPY, goalJPY: remittanceGoal };
  })();

  // Current-month kakeibo: only render the card if user has at least one
  // entry this month. Previous months are reachable from KakeiboScreen.
  const kakeiboThisMonth = (() => {
    const d = new Date();
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const r = buildMonthlyReport(kakeiboEntries, ym);
    if (r.entryCount === 0) return null;
    const percentOfIncome = takeHomeMonthly > 0 ? Math.round((r.totalSpent / takeHomeMonthly) * 100) : null;
    return { totalSpent: r.totalSpent, percentOfIncome };
  })();

  // Pick the active goal closest to completion (highest progressPercent).
  // We don't compute monthly figures here — the dashboard card only needs
  // %-and-remaining, projection details live on the GoalsScreen.
  const featuredGoal = (() => {
    const active = goals.filter((g) => !isGoalCompleted(g));
    if (active.length === 0) return null;
    let best = active[0]!;
    let bestPct = getSavedTotal(best) / best.targetAmount;
    for (let i = 1; i < active.length; i++) {
      const g = active[i]!;
      const pct = getSavedTotal(g) / g.targetAmount;
      if (pct > bestPct) {
        best = g;
        bestPct = pct;
      }
    }
    const proj = computeGoalProjection({ saved: getSavedTotal(best), target: best.targetAmount });
    return { goal: best, percent: Math.round(proj.progressPercent * 100), remaining: proj.remaining };
  })();

  const goToCalculator = () => navigation.navigate('Calculator');
  const goToDocuments = () => navigation.navigate('Documents');
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
  const goToGoals = () => {
    const parent = navigation.getParent<{ navigate: (route: keyof RootStackParamList) => void }>();
    parent?.navigate('Goals');
  };
  const goToKakeibo = () => {
    const parent = navigation.getParent<{ navigate: (route: keyof RootStackParamList) => void }>();
    parent?.navigate('Kakeibo');
  };
  const goToRemittance = () => {
    const parent = navigation.getParent<{ navigate: (route: keyof RootStackParamList) => void }>();
    parent?.navigate('Remittance');
  };
  const goToKakutei = () => {
    const parent = navigation.getParent<{ navigate: (route: keyof RootStackParamList) => void }>();
    parent?.navigate('Kakutei');
  };
  const goToTripBudget = () => {
    const parent = navigation.getParent<{ navigate: (route: keyof RootStackParamList) => void }>();
    parent?.navigate('TripBudget');
  };

  // 確定申告 deadline is March 15. Surface a card when within 90 days of
  // the next March 15 — that's a meaningful planning window. Outside the
  // window we don't push it; user can still open via the (future) Settings
  // entry or by tapping the card if surfaced explicitly elsewhere.
  const kakuteiDeadline = (() => {
    const now = new Date();
    const year = now.getFullYear();
    let deadline = new Date(year, 2, 15);
    if (now.getTime() > deadline.getTime()) deadline = new Date(year + 1, 2, 15);
    const msDay = 24 * 60 * 60 * 1000;
    const days = Math.ceil((deadline.getTime() - now.getTime()) / msDay);
    if (days < 0 || days > 90) return null;
    return { days, year: deadline.getFullYear() };
  })();

  // For brand-new users who haven't run Calculator yet, the full-screen
  // EmptyState would short-circuit before GuidedSetupCard renders — leaving
  // the user with ONLY a "Calculate salary" CTA and no idea about the other
  // 4 setup steps. When the guided setup is still active, show a minimal
  // Dashboard (greeting + GuidedSetupCard) instead so they see the full
  // setup hub on first launch.
  const showGuidedSetup = hasCompletedOnboarding && !hasSeenGuidedSetup;

  if (!data.hasData) {
    if (showGuidedSetup) {
      return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
            <GreetingHeader
              greeting={data.greeting}
              today={data.today}
              daysUntilPayday={data.daysUntilPayday}
              isPayday={data.isPayday}
            />
            <GuidedSetupCard
              onSalary={goToCalculator}
              onFixedCosts={goToKakeibo}
              onBudget={goToKakeibo}
              onDocuments={goToDocuments}
              onDailyTracking={goToKakeibo}
            />
          </ScrollView>
        </View>
      );
    }
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
        <GuidedSetupCard
          onSalary={goToCalculator}
          onFixedCosts={goToKakeibo}
          onBudget={goToKakeibo}
          onDocuments={goToDocuments}
          onDailyTracking={goToKakeibo}
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
        <DailySpendingCard onPress={goToKakeibo} />
        <WeeklyReviewCard onPress={goToKakeibo} />
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
        {furusato.hasCalculatorResult &&
        isFurusatoUseful(takeHomeMonthly, furusatoDonations.length > 0) ? (
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
        {featuredGoal ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('goals.dashboard.cardTitle')}
            onPress={goToGoals}
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
              <Ionicons name={iconNameFor(featuredGoal.goal.icon)} size={18} color={colors.brand} />
              <Text style={[typography.headline, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {featuredGoal.goal.title}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
            <Text style={[typography.title3, { color: colors.brand, fontWeight: '800' }]}>
              {featuredGoal.percent}%
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {t('goals.dashboard.cardSubtitle', {
                percent: featuredGoal.percent,
                remaining: formatCurrency(featuredGoal.remaining),
              })}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('goals.dashboard.openHub')}
            onPress={goToGoals}
            style={({ pressed }) => ({
              marginHorizontal: spacing.lg,
              marginTop: spacing.md,
              padding: spacing.md,
              borderRadius: 16,
              backgroundColor: colors.surfaceElevated,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="flag-outline" size={18} color={colors.brand} />
              <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
                {t('goals.empty.title')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              {t('goals.empty.body')}
            </Text>
          </Pressable>
        )}
        {kakeiboThisMonth ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('kakeibo.dashboard.cardTitle')}
            onPress={goToKakeibo}
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
              <Ionicons name="book-outline" size={18} color={colors.brand} />
              <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
                {t('kakeibo.dashboard.cardTitle')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
            <Text style={[typography.title3, { color: colors.brand, fontWeight: '800' }]}>
              {formatCurrency(kakeiboThisMonth.totalSpent)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {kakeiboThisMonth.percentOfIncome !== null
                ? t('kakeibo.dashboard.percentOfIncome', { percent: kakeiboThisMonth.percentOfIncome })
                : t('kakeibo.dashboard.noIncome')}
            </Text>
          </Pressable>
        ) : null}
        {remittanceThisYear ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('remittance.dashboard.cardTitle')}
            onPress={goToRemittance}
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
              <Ionicons name="paper-plane-outline" size={18} color={colors.brand} />
              <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
                {t('remittance.dashboard.cardTitle')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
            <Text style={[typography.title3, { color: colors.brand, fontWeight: '800' }]}>
              {formatCurrency(remittanceThisYear.totalSentJPY)}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {remittanceThisYear.goalJPY > 0
                ? `${t('remittance.dashboard.sentLabel', { amount: formatCurrency(remittanceThisYear.totalSentJPY) })} ${t('remittance.dashboard.goalLabel', { amount: formatCurrency(remittanceThisYear.goalJPY) })}`
                : t('remittance.dashboard.noGoal')}
            </Text>
          </Pressable>
        ) : null}
        {kakuteiDeadline ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('kakutei.dashboard.cardTitle')}
            onPress={goToKakutei}
            style={({ pressed }) => ({
              marginHorizontal: spacing.lg,
              marginTop: spacing.md,
              padding: spacing.md,
              borderRadius: 16,
              borderLeftWidth: 4,
              borderLeftColor: kakuteiDeadline.days <= 30 ? colors.warning : colors.brand,
              backgroundColor: colors.surfaceElevated,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
              <Ionicons name="document-text-outline" size={18} color={colors.brand} />
              <Text style={[typography.headline, { color: colors.text, flex: 1 }]}>
                {t('kakutei.dashboard.cardTitle')}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </View>
            <Text style={[typography.title3, { color: kakuteiDeadline.days <= 30 ? colors.warning : colors.brand, fontWeight: '800' }]}>
              {t('kakutei.dashboard.daysToDeadline', { days: kakuteiDeadline.days })}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {t('kakutei.dashboard.deadlineLabel', { year: kakuteiDeadline.year })}
            </Text>
          </Pressable>
        ) : null}
        <TripBudgetCard onPress={goToTripBudget} />
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

      {showQuickAddFab ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.dailySpending.quickAddFab')}
          onPress={() => setQuickAddOpen(true)}
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
            shadowOpacity: 0.25,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
          })}
        >
          <Ionicons name="add" size={28} color={colors.textInverse} />
        </Pressable>
      ) : null}

      <QuickAddExpenseModal visible={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </View>
  );
}

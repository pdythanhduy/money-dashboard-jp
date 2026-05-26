import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useDocumentDeadlineStore } from '@/store/documentDeadlineStore';
import { useDocumentsStore } from '@/store/documentsStore';
import { useFurusatoStore } from '@/store/furusatoStore';
import { useKakeiboStore } from '@/store/kakeiboStore';
import { useMedicalExpensesStore } from '@/store/medicalExpensesStore';
import { useRemittanceStore } from '@/store/remittanceStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTripBudgetStore } from '@/store/tripBudgetStore';
import { useTheme } from '@/theme';

import { DayDetailModal } from './components/DayDetailModal';
import { MonthGrid } from './components/MonthGrid';
import {
  aggregateCalendarEvents,
  indexEventsByDate,
} from './lib/event-aggregator';
import { buildJpFiscalEventsForYear } from './lib/jp-fiscal-events';

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const today = todayIso();
  const [todayYear, todayMonth] = [Number(today.slice(0, 4)), Number(today.slice(5, 7))];
  const [year, setYear] = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const isOnToday = year === todayYear && month === todayMonth;

  const kakeibo = useKakeiboStore((s) => s.entries);
  const recurringExpenses = useKakeiboStore((s) => s.recurrings);
  const medical = useMedicalExpensesStore((s) => s.expenses);
  const furusato = useFurusatoStore((s) => s.donations);
  const remittance = useRemittanceStore((s) => s.entries);
  const trips = useTripBudgetStore((s) => s.trips);
  const documents = useDocumentsStore((s) => s.documents);
  const documentDeadlines = useDocumentDeadlineStore((s) => s.documents);
  const payday = useSettingsStore((s) => s.settings.payday);

  const events = useMemo(() => {
    const aggregated = aggregateCalendarEvents(
      {
        kakeibo,
        medical,
        furusato,
        remittance,
        trips,
        documents,
        documentDeadlines,
        recurringExpenses,
      },
      year,
    );
    const fiscal = buildJpFiscalEventsForYear(year, { payday });
    return [...aggregated, ...fiscal].sort((a, b) => a.date.localeCompare(b.date));
  }, [
    kakeibo,
    medical,
    furusato,
    remittance,
    trips,
    documents,
    documentDeadlines,
    recurringExpenses,
    payday,
    year,
  ]);

  const eventsByDate = useMemo(() => indexEventsByDate(events), [events]);

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  const monthLabel = i18n.language.startsWith('ja')
    ? `${year}年${month}月`
    : `${t(`calendar.months.${month}`)} ${year}`;

  const goPrev = () => {
    if (month === 1) {
      setYear(year - 1);
      setMonth(12);
    } else setMonth(month - 1);
  };
  const goNext = () => {
    if (month === 12) {
      setYear(year + 1);
      setMonth(1);
    } else setMonth(month + 1);
  };
  const goToday = () => {
    setYear(todayYear);
    setMonth(todayMonth);
  };

  // Bottom padding clears tab bar + home indicator. Tab bar height + extra
  // breathing room so the last card isn't flush against the chrome.
  const scrollBottomPad = spacing.xl + insets.bottom;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header is OUTSIDE the ScrollView so it stays pinned and never crowds
          the notch when the user scrolls down. */}
      <View
        style={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 44,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('calendar.prevMonth')}
            onPress={goPrev}
            hitSlop={12}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isOnToday ? monthLabel : `${monthLabel} — ${t('calendar.todayButton')}`}
            onPress={goToday}
            hitSlop={8}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: spacing.sm,
            }}
          >
            <Text
              style={[typography.title3, { color: colors.text, textAlign: 'center' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {monthLabel}
            </Text>
            {!isOnToday ? (
              <Text style={[typography.caption, { color: colors.brand, marginTop: 2 }]}>
                {t('calendar.todayButton')}
              </Text>
            ) : null}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('calendar.nextMonth')}
            onPress={goNext}
            hitSlop={12}
            style={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-forward" size={26} color={colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: scrollBottomPad,
          gap: spacing.md,
        }}
      >
        <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
          {t('calendar.tapDateHint')}
        </Text>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.sm,
          }}
        >
          <MonthGrid
            year={year}
            month={month}
            eventsByDate={eventsByDate}
            today={today}
            onDayPress={setSelectedDate}
          />
        </View>

        <LegendCard />
      </ScrollView>

      <DayDetailModal
        visible={selectedDate !== null}
        date={selectedDate}
        events={selectedEvents}
        onClose={() => setSelectedDate(null)}
      />
    </SafeAreaView>
  );
}

function LegendCard() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const items: Array<{ color: string; key: string }> = [
    { color: colors.danger, key: 'taxDeadline' },
    { color: colors.success, key: 'payday' },
    { color: colors.warning, key: 'documentExpiry' },
    { color: colors.brand, key: 'trip' },
    { color: colors.textSecondary, key: 'expense' },
  ];
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
        gap: spacing.xs,
      }}
    >
      <Text style={[typography.callout, { color: colors.text, fontWeight: '600' }]}>
        {t('calendar.legend.title')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
        {items.map((item) => (
          <View key={item.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }}
            />
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t(`calendar.legend.${item.key}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

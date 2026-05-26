import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme';

import type { CalendarEvent } from '../types';
import { DayCell } from './DayCell';

interface MonthGridProps {
  /** 1-based month (1..12). */
  month: number;
  year: number;
  eventsByDate: ReadonlyMap<string, readonly CalendarEvent[]>;
  /** ISO `YYYY-MM-DD` representing the user's "today". */
  today: string;
  onDayPress: (date: string) => void;
}

interface CellInfo {
  date: string;
  day: number;
  dayOfWeek: number;
  inCurrentMonth: boolean;
}

function isoDate(year: number, month1Based: number, day: number): string {
  return `${year}-${String(month1Based).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Build the 6×7 grid (42 cells) starting from the Sunday on/before the 1st. */
function buildGridCells(year: number, month1Based: number): CellInfo[] {
  const firstOfMonth = new Date(year, month1Based - 1, 1);
  const firstDow = firstOfMonth.getDay(); // 0 = Sun
  const cells: CellInfo[] = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(year, month1Based - 1, 1 - firstDow + i);
    cells.push({
      date: isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate()),
      day: d.getDate(),
      dayOfWeek: d.getDay(),
      inCurrentMonth: d.getMonth() === month1Based - 1,
    });
  }
  return cells;
}

export function MonthGrid({ year, month, eventsByDate, today, onDayPress }: MonthGridProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const cells = useMemo(() => buildGridCells(year, month), [year, month]);

  const weekdays = [0, 1, 2, 3, 4, 5, 6]; // Sun..Sat

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={{ flexDirection: 'row' }}>
        {weekdays.map((dow) => (
          <View key={dow} style={{ flex: 1, alignItems: 'center', paddingVertical: spacing.xs }}>
            <Text
              style={[
                typography.caption,
                {
                  color: dow === 0 ? colors.danger : dow === 6 ? colors.brand : colors.textSecondary,
                  fontWeight: '600',
                },
              ]}
            >
              {t(`calendar.weekdays.${dow}`)}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 2 }}>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <View key={row} style={{ flexDirection: 'row', gap: 2 }}>
            {cells.slice(row * 7, row * 7 + 7).map((cell) => (
              <DayCell
                key={cell.date}
                date={cell.date}
                day={cell.day}
                dayOfWeek={cell.dayOfWeek}
                inCurrentMonth={cell.inCurrentMonth}
                isToday={cell.date === today}
                events={eventsByDate.get(cell.date) ?? []}
                onPress={() => onDayPress(cell.date)}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

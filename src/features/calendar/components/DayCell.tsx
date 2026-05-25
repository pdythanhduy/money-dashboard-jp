import { Pressable, Text, View } from 'react-native';

import { useTheme } from '@/theme';

import { lookupHoliday } from '../lib/jp-holidays';
import type { CalendarEvent } from '../types';

interface DayCellProps {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  /** Day-of-month (1-31). */
  day: number;
  /** Day-of-week 0=Sun..6=Sat. Used for weekend tint. */
  dayOfWeek: number;
  /** False when this cell belongs to the previous/next month (rendered dimmed). */
  inCurrentMonth: boolean;
  /** True when this cell is the device's "today". */
  isToday: boolean;
  events: readonly CalendarEvent[];
  onPress: () => void;
}

export function DayCell({
  date,
  day,
  dayOfWeek,
  inCurrentMonth,
  isToday,
  events,
  onPress,
}: DayCellProps) {
  const { colors, typography } = useTheme();
  const holiday = lookupHoliday(date);

  // Color hierarchy: today > holiday > Sunday > Saturday > weekday.
  let textColor: string = colors.text;
  if (!inCurrentMonth) textColor = colors.textSecondary;
  else if (holiday) textColor = colors.danger;
  else if (dayOfWeek === 0) textColor = colors.danger;
  else if (dayOfWeek === 6) textColor = colors.brand;

  const hasEvents = events.length > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${date}${holiday ? ` ${holiday.nameJa}` : ''}${hasEvents ? ` (${events.length} events)` : ''}`}
      onPress={onPress}
      style={{
        flex: 1,
        aspectRatio: 1,
        padding: 4,
        borderRadius: 6,
        backgroundColor: isToday ? colors.brandSubtle : 'transparent',
        opacity: inCurrentMonth ? 1 : 0.35,
      }}
    >
      <Text
        style={[
          typography.callout,
          {
            color: textColor,
            fontWeight: isToday ? '700' : '500',
            textAlign: 'left',
          },
        ]}
      >
        {day}
      </Text>
      {hasEvents ? (
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          {events.slice(0, 3).map((e, idx) => (
            <View
              key={`${e.id}-${idx}`}
              style={{
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: dotColorFor(e, colors),
              }}
            />
          ))}
          {events.length > 3 ? (
            <Text style={[typography.caption, { color: colors.textSecondary, fontSize: 9, lineHeight: 9 }]}>
              +{events.length - 3}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

function dotColorFor(event: CalendarEvent, colors: ReturnType<typeof useTheme>['colors']): string {
  switch (event.kind) {
    case 'tax_filing':
    case 'resident_tax':
    case 'year_end_adjustment':
      return colors.danger;
    case 'payday':
    case 'bonus_typical':
      return colors.success;
    case 'document_expiry':
      return colors.warning;
    case 'trip':
      return colors.brand;
    default:
      return colors.textSecondary;
  }
}

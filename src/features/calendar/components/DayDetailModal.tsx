import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme';

import { lookupHoliday } from '../lib/jp-holidays';
import type { CalendarEvent } from '../types';

interface DayDetailModalProps {
  visible: boolean;
  date: string | null;
  events: readonly CalendarEvent[];
  onClose: () => void;
}

export function DayDetailModal({ visible, date, events, onClose }: DayDetailModalProps) {
  const { t, i18n } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  // Note: hooks above must always run; early-return is OK here because all
  // hooks (including useSafeAreaInsets) are above this line.
  if (!visible || !date) return null;
  const holiday = lookupHoliday(date);
  const heading = formatDisplayDate(date, i18n.language);
  // Clear the home indicator: at least spacing.xl, more if the device reports
  // a non-zero bottom inset (notch / Dynamic Island phones).
  const sheetBottomPad = Math.max(insets.bottom, spacing.md) + spacing.md;

  return (
    <Modal animationType="slide" transparent onRequestClose={onClose} visible={visible}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.close')}
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'flex-end',
        }}
      >
        <Pressable
          accessibilityRole="none"
          // Prevent backdrop-press from closing when tapping the sheet itself.
          onPress={() => {}}
          style={{
            backgroundColor: colors.background,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: sheetBottomPad,
            maxHeight: '80%',
          }}
        >
          {/* Drag-affordance pill — purely visual */}
          <View
            style={{
              alignSelf: 'center',
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: spacing.sm,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: spacing.sm,
              gap: spacing.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[typography.title3, { color: colors.text }]}>{heading}</Text>
              {holiday ? (
                <Text style={[typography.caption, { color: colors.danger, marginTop: spacing.xs }]}>
                  {holiday.nameJa} · {holiday.nameVi}
                </Text>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.close')}
              onPress={onClose}
              hitSlop={12}
              style={{
                width: 44,
                height: 44,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: -spacing.sm,
              }}
            >
              <Ionicons name="close" size={26} color={colors.textSecondary} />
            </Pressable>
          </View>

          {events.length === 0 && !holiday ? (
            <Text style={[typography.body, { color: colors.textSecondary, paddingVertical: spacing.lg }]}>
              {t('calendar.noEvents')}
            </Text>
          ) : (
            <ScrollView
              contentContainerStyle={{ paddingBottom: spacing.sm }}
              showsVerticalScrollIndicator={false}
            >
              {events.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const text = t(event.labelKey, event.labelParams);
  const amount = event.amountJpy;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.md,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.text }]}>{text}</Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {t(`calendar.kinds.${event.kind}`)}
        </Text>
      </View>
      {amount !== undefined ? (
        <Text
          style={[
            typography.body,
            { color: amount < 0 ? colors.danger : colors.success, fontWeight: '600' },
          ]}
        >
          {amount < 0 ? '-' : '+'}
          {formatCurrency(Math.abs(amount))}
        </Text>
      ) : null}
    </View>
  );
}

function formatDisplayDate(iso: string, locale: string): string {
  const [y, m, d] = iso.split('-').map((s) => Number.parseInt(s, 10));
  if (locale.startsWith('ja')) return `${y}年${m}月${d}日`;
  return `${d}/${m}/${y}`;
}

import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import {
  daysUntil,
  formatExpiryDate,
  urgencyFromDays,
  type UrgencyTier,
} from '@/features/documents/date-utils';
import { useTheme } from '@/theme';
import type { DocumentReminder } from '@/types/document';

interface Props {
  doc: DocumentReminder;
  onPress: (doc: DocumentReminder) => void;
}

const ICON_BY_KIND: Record<string, keyof typeof import('@expo/vector-icons').Ionicons.glyphMap> = {
  zairyu_card: 'id-card-outline',
  passport_vn: 'airplane-outline',
  passport_jp: 'airplane-outline',
  mynumber_card: 'card-outline',
  driving_license_jp: 'car-outline',
  driving_license_vn: 'car-outline',
  health_insurance_card: 'medkit-outline',
  visa_renewal: 'document-text-outline',
  kakutei_shinkoku: 'receipt-outline',
  nenmatsu_chosei: 'receipt-outline',
  jumin_zei_q1: 'calendar-outline',
  jumin_zei_q2: 'calendar-outline',
  jumin_zei_q3: 'calendar-outline',
  jumin_zei_q4: 'calendar-outline',
};

function DocumentCardImpl({ doc, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const days = daysUntil(doc.expiryDate);
  const tier = urgencyFromDays(days);
  const tint = tintForTier(tier, colors);
  const icon = ICON_BY_KIND[doc.kind] ?? 'document-outline';
  const name = doc.customName?.trim() || t(`documents.kinds.${doc.kind}`);

  const daysLabel = (() => {
    if (days === null) return doc.expiryDate;
    if (days < 0) return t('documents.expired');
    if (days === 0) return t('documents.today');
    return t('documents.daysLeft', { days });
  })();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name} · ${daysLabel}`}
      onPress={() => onPress(doc)}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
        borderLeftWidth: 4,
        borderLeftColor: tint,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        opacity: pressed ? 0.85 : 1,
        ...(isDark
          ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
          : {}),
      })}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: tint + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={18} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
          {name}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
          {t('documents.expiryLabel')} {formatExpiryDate(doc.expiryDate)}
        </Text>
      </View>
      <View
        style={{
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.pill,
          backgroundColor: tint + '22',
        }}
      >
        <Text style={[typography.caption, { color: tint, fontWeight: '700' }]}>{daysLabel}</Text>
      </View>
    </Pressable>
  );
}

function tintForTier(
  tier: UrgencyTier,
  colors: ReturnType<typeof useTheme>['colors'],
): string {
  switch (tier) {
    case 'expired':
    case 'red':
      return colors.danger;
    case 'orange':
      return colors.warning;
    case 'yellow':
      return colors.accent;
    default:
      return colors.success;
  }
}

export const DocumentCard = memo(DocumentCardImpl);

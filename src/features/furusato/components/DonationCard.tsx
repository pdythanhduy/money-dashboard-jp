import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { useTheme } from '@/theme';
import type { FurusatoDonation } from '@/store/furusatoStore';

interface Props {
  donation: FurusatoDonation;
  onPress: (d: FurusatoDonation) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function DonationCardImpl({ donation, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${donation.targetMunicipality} · ${formatCurrency(donation.amount)}`}
      onPress={() => onPress(donation)}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
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
          backgroundColor: colors.brandSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="gift-outline" size={18} color={colors.brand} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
          {donation.targetMunicipality}
        </Text>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
          {formatDate(donation.date)}
          {donation.portalSite
            ? ` · ${t(`furusato.fields.portalOptions.${donation.portalSite}`)}`
            : ''}
          {donation.giftName ? ` · ${donation.giftName}` : ''}
        </Text>
      </View>
      <Text style={[typography.body, { color: colors.brand, fontWeight: '700' }]}>
        {formatCurrency(donation.amount)}
      </Text>
    </Pressable>
  );
}

export const DonationCard = memo(DonationCardImpl);

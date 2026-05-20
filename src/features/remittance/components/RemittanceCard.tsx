import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { formatVND } from '@/features/remittance/format-vnd';
import { formatCurrency } from '@/lib/format';
import type { RemittanceEntry } from '@/lib/remittance-math';
import { useTheme } from '@/theme';

interface Props {
  entry: RemittanceEntry;
  onPress: (e: RemittanceEntry) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function RemittanceCardImpl({ entry, onPress }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${entry.recipient ?? t(`remittance.providers.${entry.provider}`)} · ${formatCurrency(entry.amountJPY)}`}
      onPress={() => onPress(entry)}
      style={({ pressed }) => ({
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        padding: spacing.md,
        backgroundColor: colors.surfaceElevated,
        borderRadius: radius.md,
        gap: spacing.xs,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
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
          <Ionicons name="paper-plane-outline" size={18} color={colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]} numberOfLines={1}>
            {entry.recipient || t(`remittance.providers.${entry.provider}`)}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]} numberOfLines={1}>
            {formatDate(entry.date)} · {t(`remittance.providers.${entry.provider}`)} · rate {entry.exchangeRate.toFixed(2)}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
            {formatCurrency(entry.amountJPY)}
          </Text>
          <Text style={[typography.caption, { color: colors.danger, fontWeight: '600' }]}>
            {formatVND(entry.amountVND)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const RemittanceCard = memo(RemittanceCardImpl);

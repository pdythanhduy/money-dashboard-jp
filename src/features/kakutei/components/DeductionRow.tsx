import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import type { DeductionLine } from '@/lib/kakutei-shinkoku';
import { useTheme } from '@/theme';

interface Props {
  line: DeductionLine;
  /** Optional icon from Ionicons.glyphMap (e.g. "medkit-outline"). */
  icon?: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  /** Optional note rendered under the label. */
  noteOverride?: string;
}

export function DeductionRow({ line, icon, noteOverride }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const note = noteOverride ?? line.note;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.xs,
      }}
    >
      {icon ? <Ionicons name={icon} size={18} color={colors.brand} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={[typography.body, { color: colors.text }]} numberOfLines={1}>
          {t(`kakutei.deductions.${line.key}`)}
        </Text>
        {note ? (
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]} numberOfLines={1}>
            {note}
          </Text>
        ) : null}
      </View>
      <Text style={[typography.body, { color: colors.text, fontWeight: '700' }]}>
        {formatCurrency(line.amount)}
      </Text>
    </View>
  );
}

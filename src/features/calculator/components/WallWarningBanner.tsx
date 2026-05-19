import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { formatCurrency } from '@/lib/format';
import { activeWalls, type WallProximity } from '@/lib/wall-warnings';
import { useTheme } from '@/theme';

interface Props {
  annualIncome: number;
}

/**
 * Cards surfaced on the Calculator result screen — one per income "wall"
 * the user is either approaching or has just crossed. Crossed = red,
 * warning = amber.
 */
export function WallWarningBanner({ annualIncome }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const walls = activeWalls(annualIncome);

  if (walls.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.xs }]}>
        {t('calculator.walls.sectionTitle')}
      </Text>
      {walls.map((w) => (
        <WallCard
          key={w.wall}
          wall={w}
          isDark={isDark}
          colors={colors}
          typography={typography}
          spacing={spacing}
          radius={radius}
          t={t}
        />
      ))}
    </View>
  );
}

function WallCard({
  wall,
  isDark,
  colors,
  typography,
  spacing,
  radius,
  t,
}: {
  wall: WallProximity;
  isDark: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
  typography: ReturnType<typeof useTheme>['typography'];
  spacing: ReturnType<typeof useTheme>['spacing'];
  radius: ReturnType<typeof useTheme>['radius'];
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const crossed = wall.severity === 'crossed';
  const tint = crossed ? colors.danger : colors.warning;
  const icon = crossed ? 'alert-circle' : 'warning';

  const distanceLabel = crossed
    ? t('calculator.walls.crossedBy', { amount: formatCurrency(Math.abs(wall.distance)) })
    : t('calculator.walls.approachingBy', { amount: formatCurrency(Math.abs(wall.distance)) });

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${t(`calculator.walls.${wall.wall}.title`)} — ${distanceLabel}`}
      style={{
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceElevated,
        borderLeftWidth: 4,
        borderLeftColor: tint,
        ...(isDark
          ? { shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }
          : {}),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 }}>
        <Ionicons name={icon} size={18} color={tint} />
        <Text style={[typography.body, { color: colors.text, fontWeight: '600', flex: 1 }]}>
          {t(`calculator.walls.${wall.wall}.title`)}
        </Text>
        <Text style={[typography.caption, { color: tint, fontWeight: '700' }]}>
          {formatCurrency(wall.threshold)}
        </Text>
      </View>
      <Text style={[typography.footnote, { color: colors.textSecondary }]}>
        {distanceLabel}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
        {t(`calculator.walls.${wall.wall}.body`)}
      </Text>
    </View>
  );
}

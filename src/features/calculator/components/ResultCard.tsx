import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme';
import type { TakeHomeResult } from '@/types/tax';
import { formatCurrency } from '@/features/calculator/hooks/useCalculator';

interface ResultCardProps {
  result: TakeHomeResult;
}

export function ResultCard({ result }: ResultCardProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const taxTotal = result.incomeTax + result.residentTax;
  const insuranceTotal = result.totalDeductions - taxTotal;
  const takeHomeRatio = result.grossAnnual > 0 ? result.takeHomeAnnual / result.grossAnnual : 0;

  return (
    <View style={{ gap: spacing.lg }}>
      <LinearGradient
        colors={[colors.brand, colors.brandStrong]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          minHeight: 190,
          borderRadius: radius.lg,
          overflow: 'hidden',
          padding: spacing.lg,
          justifyContent: 'space-between',
          shadowColor: colors.text,
          shadowOpacity: 0.16,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 5,
        }}
      >
        <View>
          <Text style={[typography.callout, { color: colors.textInverse }]}>
            {t('calculator.result.takeHomeMonthly')}
          </Text>
          <Text
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[typography.largeTitle, { color: colors.textInverse, marginTop: spacing.sm }]}
          >
            {formatCurrency(result.takeHomeMonthly)}
          </Text>
        </View>
        <View>
          <Text style={[typography.body, { color: colors.textInverse }]}>
            {t('calculator.result.takeHomeAnnual', {
              amount: formatCurrency(result.takeHomeAnnual),
            })}
          </Text>
          <Text style={[typography.caption, { color: colors.textInverse, marginTop: spacing.xs }]}>
            {t('calculator.result.takeHomeJapanese')}
          </Text>
        </View>
      </LinearGradient>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.sm,
          padding: spacing.lg,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          gap: spacing.md,
        }}
      >
        <DonutChart
          takeHome={result.takeHomeAnnual}
          tax={taxTotal}
          insurance={insuranceTotal}
          takeHomeRatio={takeHomeRatio}
        />
        <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>
          <LegendItem color={colors.brand} label={t('calculator.result.legend.takeHome')} value={result.takeHomeAnnual} />
          <LegendItem color={colors.warning} label={t('calculator.result.legend.tax')} value={taxTotal} />
          <LegendItem color={colors.danger} label={t('calculator.result.legend.insurance')} value={insuranceTotal} />
        </View>
      </View>
    </View>
  );
}

function DonutChart({
  takeHome,
  tax,
  insurance,
  takeHomeRatio,
}: {
  takeHome: number;
  tax: number;
  insurance: number;
  takeHomeRatio: number;
}) {
  const { colors, typography } = useTheme();
  const total = Math.max(1, takeHome + tax + insurance);
  const radius = 52;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;
  const segments = [
    { value: takeHome, color: colors.brand },
    { value: tax, color: colors.warning },
    { value: insurance, color: colors.danger },
  ];
  let offset = 0;

  return (
    <View style={{ width: 148, height: 148, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={148} height={148} viewBox="0 0 148 148">
        <Circle
          cx={74}
          cy={74}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {segments.map((segment, index) => {
          const dash = (segment.value / total) * circumference;
          const circle = (
            <Circle
              key={`${segment.color}-${index}`}
              cx={74}
              cy={74}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              fill="none"
              origin="74, 74"
              rotation="-90"
            />
          );
          offset += dash;
          return circle;
        })}
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={[typography.title2, { color: colors.text }]}>
          {Math.round(takeHomeRatio * 100)}%
        </Text>
      </View>
    </View>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: number }) {
  const { colors, typography, spacing, radius } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <View style={{ width: 10, height: 10, borderRadius: radius.pill, backgroundColor: color }} />
      <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.text }]}>{formatCurrency(value)}</Text>
    </View>
  );
}

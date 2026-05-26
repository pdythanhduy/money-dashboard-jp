import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { useKakuteiData } from '@/features/kakutei/hooks/useKakuteiData';
import { formatCurrency } from '@/lib/format';
import type { MainTabParamList } from '@/navigation/MainTabs';
import { useTheme } from '@/theme';

import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type Nav = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export function IncomeStep() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const data = useKakuteiData();
  const navigation = useNavigation();

  const goToCalculator = () => {
    // Wizard is presented as a modal root stack screen — pop to Main then
    // jump to Calculator tab.
    navigation.goBack();
    const parent = navigation.getParent<Nav>();
    parent?.navigate('Calculator');
  };

  return (
    <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
      <Text style={[typography.title3, { color: colors.text, fontWeight: '700' }]}>
        {t('kakutei.steps.2.title')}
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary }]}>{t('kakutei.steps.2.body')}</Text>

      {data.hasSalaryResult ? (
        <View
          style={{
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceElevated,
            gap: spacing.xs,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={[typography.callout, { color: colors.text, fontWeight: '600', flex: 1 }]}>
              {t('kakutei.steps.2.useLastResult')}
            </Text>
          </View>
          <Row label={t('kakutei.summary.gross')} value={formatCurrency(data.input.salaryResult!.grossAnnual)} />
          <Row
            label={t('kakutei.summary.employmentIncome')}
            value={formatCurrency(data.input.salaryResult!.breakdown.employmentIncome)}
          />
          <Row
            label={t('kakutei.summary.withheldTax')}
            value={formatCurrency(data.input.salaryResult!.incomeTax)}
          />
        </View>
      ) : (
        <View
          style={{
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            gap: spacing.sm,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={[typography.callout, { color: colors.text, flex: 1 }]}>
              {t('kakutei.steps.2.noResult')}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('kakutei.steps.2.openCalculator')}
            onPress={goToCalculator}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radius.pill,
              backgroundColor: colors.brand,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={[typography.callout, { color: colors.textInverse, fontWeight: '600' }]}>
              {t('kakutei.steps.2.openCalculator')}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}

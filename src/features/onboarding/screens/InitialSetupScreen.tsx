import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';
import type { Prefecture } from '@/types/tax';

const PREFECTURES: Prefecture[] = [
  'tokyo', 'osaka', 'aichi', 'kanagawa', 'saitama', 'chiba', 'hyogo', 'fukuoka',
];

interface Props {
  prefecture: Prefecture | null;
  onPrefectureChange: (p: Prefecture) => void;
  payday: number;
  onPaydayChange: (n: number) => void;
}

export function InitialSetupScreen({ prefecture, onPrefectureChange, payday, onPaydayChange }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const [paydayInput, setPaydayInput] = useState(String(payday));

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.lg }}>
      <Text style={[typography.title1, { color: colors.text, textAlign: 'center', marginBottom: spacing.sm }]}>
        {t('onboarding.setup.title')}
      </Text>
      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
        ]}
      >
        {t('onboarding.setup.subtitle')}
      </Text>

      <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.sm }]}>
        {t('onboarding.setup.prefectureLabel')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl }}>
        {PREFECTURES.map((p) => {
          const selected = prefecture === p;
          return (
            <Pressable
              key={p}
              onPress={() => onPrefectureChange(p)}
              style={({ pressed }) => ({
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: radius.pill,
                backgroundColor: selected ? colors.brand : colors.surface,
                borderWidth: 1,
                borderColor: selected ? colors.brand : colors.border,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: selected ? colors.textInverse : colors.text }]}>
                {t(`calculator.prefectures.${p}.label`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.sm }]}>
        {t('onboarding.setup.paydayLabel')}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.sm,
          backgroundColor: colors.surface,
        }}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
        <TextInput
          value={paydayInput}
          onChangeText={(v) => {
            const digits = v.replace(/[^\d]/g, '').slice(0, 2);
            setPaydayInput(digits);
            const n = Number.parseInt(digits, 10);
            if (Number.isFinite(n) && n >= 1 && n <= 31) onPaydayChange(n);
          }}
          keyboardType="number-pad"
          maxLength={2}
          placeholder="25"
          placeholderTextColor={colors.textSecondary}
          style={{
            flex: 1,
            color: colors.text,
            paddingVertical: spacing.sm,
            fontSize: typography.body.fontSize,
          }}
        />
        <Text style={[typography.footnote, { color: colors.textSecondary }]}>
          {t('onboarding.setup.paydayUnit')}
        </Text>
      </View>
      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
        {t('onboarding.setup.paydayHelper')}
      </Text>
    </ScrollView>
  );
}

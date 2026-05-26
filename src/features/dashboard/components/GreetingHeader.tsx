import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatDateJa, formatDateVi, type Greeting } from '@/lib/date-helpers';
import { useTheme } from '@/theme';

interface GreetingHeaderProps {
  greeting: Greeting;
  today: Date;
  daysUntilPayday: number;
  isPayday: boolean;
}

export function GreetingHeader({ greeting, today, daysUntilPayday, isPayday }: GreetingHeaderProps) {
  // `i18n` from useTranslation() is reactive — component re-renders when
  // i18n.changeLanguage fires. Reading from the bare `import i18n` module
  // only captures a snapshot, so the date format wouldn't refresh after
  // the user toggled the language in Settings.
  const { t, i18n } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  // Use theme tokens so the gradient inverts correctly in dark mode
  // instead of staying navy. brand → brandStrong gives a subtle vertical
  // shade that draws the eye to the headline.
  const gradientStops: [string, string] = [colors.brand, colors.brandStrong];

  return (
    <LinearGradient colors={gradientStops} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}>
      <SafeAreaView edges={['top']}>
        <View
          style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.lg,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.sm,
            }}
          >
            <Text style={[typography.title2, { color: colors.textInverse }]}>
              {t(`dashboard.greeting.${greeting}`)}, {t('dashboard.greeting.name')}
            </Text>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="person-outline" size={22} color={colors.textInverse} />
            </View>
          </View>

          <View style={{ marginBottom: spacing.sm }}>
            <Text style={[typography.footnote, { color: 'rgba(255,255,255,0.85)' }]}>
              {i18n.language === 'ja' ? formatDateJa(today) : formatDateVi(today)}
            </Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.xs,
              alignSelf: 'flex-start',
              backgroundColor: 'rgba(246,173,85,0.22)',
              paddingHorizontal: spacing.sm,
              paddingVertical: 4,
              borderRadius: radius.pill,
            }}
          >
            <Ionicons name="time-outline" size={14} color={colors.accent} />
            <Text style={[typography.caption, { color: colors.accent, fontWeight: '600' }]}>
              {isPayday
                ? t('dashboard.paydayBadgeToday')
                : t('dashboard.paydayBadge', { days: daysUntilPayday })}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

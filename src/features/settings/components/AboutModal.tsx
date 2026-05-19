import Constants from 'expo-constants';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AboutModal({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing } = useTheme();
  const version = Constants.expoConfig?.version ?? '0.1.0';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
          }}
        >
          <Text style={[typography.title3, { color: colors.text }]}>{t('settings.about.title')}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[typography.callout, { color: colors.brand }]}>{t('common.close')}</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          <Text style={{ fontSize: 48, fontWeight: '800', color: colors.brand, textAlign: 'center' }}>
            Kakei
          </Text>
          <Text style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}>
            {t('settings.about.tagline')}
          </Text>
          <Text style={[typography.footnote, { color: colors.textSecondary, textAlign: 'center' }]}>
            v{version}
          </Text>
          <Text
            style={[
              typography.body,
              { color: colors.text, marginTop: spacing.lg, lineHeight: 22 },
            ]}
          >
            {t('settings.about.credits')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.lg }]}>
            {t('settings.about.licenses')}
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            © 2026 Kakei. {t('settings.about.openSource')}
          </Text>
          <Text style={[typography.body, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>
            ❤️ {t('settings.about.madeFor')}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

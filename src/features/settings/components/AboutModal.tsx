import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { APP_VERSION, APP_BUILD } from '@/lib/app-info';
import { useTheme } from '@/theme';

interface AboutModalProps {
  visible: boolean;
  onClose: () => void;
}

export function AboutModal({ visible, onClose }: AboutModalProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? 'rgba(0,0,0,0.72)' : 'rgba(15,20,25,0.52)',
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View
            style={{
              margin: spacing.lg,
              padding: spacing.lg,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
              maxHeight: '90%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: spacing.md,
              }}
            >
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={[typography.title2, { color: colors.text }]}>
                  {t('settings.about.title')}
                </Text>
                <Text
                  style={[
                    typography.callout,
                    { color: colors.textSecondary, marginTop: spacing.xs },
                  ]}
                >
                  {t('settings.about.subtitle')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('common.close')}
                onPress={onClose}
                style={{
                  width: 40,
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radius.pill,
                  backgroundColor: colors.background,
                }}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView>
              <Text
                style={[
                  typography.body,
                  { color: colors.text, marginBottom: spacing.md },
                ]}
              >
                {t('settings.about.description')}
              </Text>

              <View
                style={{
                  padding: spacing.md,
                  borderRadius: radius.md,
                  backgroundColor: colors.background,
                  marginBottom: spacing.md,
                  gap: spacing.xs,
                }}
              >
                <Row label={t('settings.items.version')} value={APP_VERSION} />
                <Row label={t('settings.items.build')} value={APP_BUILD} />
              </View>

              <Text style={[typography.headline, { color: colors.text, marginBottom: spacing.xs }]}>
                {t('settings.about.licensesTitle')}
              </Text>
              <Text style={[typography.callout, { color: colors.textSecondary }]}>
                {t('settings.about.licensesBody')}
              </Text>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
      }}
    >
      <Text style={[typography.callout, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[typography.callout, { color: colors.text, fontWeight: '600' }]}>{value}</Text>
    </View>
  );
}

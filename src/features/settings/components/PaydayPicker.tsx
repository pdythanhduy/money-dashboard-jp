import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

interface PaydayPickerProps {
  visible: boolean;
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function PaydayPicker({ visible, value, onChange, onClose }: PaydayPickerProps) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{
          flex: 1,
          backgroundColor: isDark ? 'rgba(0,0,0,0.64)' : 'rgba(15,20,25,0.42)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            maxHeight: '72%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            paddingTop: spacing.md,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <SafeAreaView edges={['bottom']}>
            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.sm,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={[typography.title3, { color: colors.text }]}>
                  {t('settings.payday.title')}
                </Text>
                <Text
                  style={[
                    typography.caption,
                    { color: colors.textSecondary, marginTop: spacing.xs },
                  ]}
                >
                  {t('settings.payday.subtitle')}
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

            <ScrollView
              contentContainerStyle={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
                padding: spacing.lg,
                paddingTop: spacing.md,
              }}
              showsVerticalScrollIndicator={false}
            >
              {DAYS.map((day) => {
                const selected = day === value;
                return (
                  <Pressable
                    key={day}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`day-${day}`}
                    onPress={() => {
                      onChange(day);
                      onClose();
                    }}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: radius.md,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? colors.accent : colors.background,
                      borderWidth: 1,
                      borderColor: selected ? colors.accent : colors.border,
                    }}
                  >
                    <Text
                      style={[
                        typography.body,
                        {
                          color: selected ? '#1a202c' : colors.text,
                          fontWeight: selected ? '700' : '500',
                        },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

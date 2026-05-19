/**
 * Generic bottom-sheet single-select modal. Used by Language and Theme
 * pickers in Settings. Distinct from the calculator's PrefecturePicker
 * because Settings doesn't need the trigger button — the caller provides
 * its own SettingsItem row.
 */

import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface OptionPickerModalProps<T extends string> {
  visible: boolean;
  title: string;
  subtitle?: string;
  closeLabel: string;
  value?: T;
  options: Array<PickerOption<T>>;
  onChange: (value: T) => void;
  onClose: () => void;
}

export function OptionPickerModal<T extends string>({
  visible,
  title,
  subtitle,
  closeLabel,
  value,
  options,
  onChange,
  onClose,
}: OptionPickerModalProps<T>) {
  const { colors, typography, spacing, radius, isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={closeLabel}
        style={{
          flex: 1,
          backgroundColor: isDark ? 'rgba(0,0,0,0.64)' : 'rgba(15,20,25,0.42)',
          justifyContent: 'flex-end',
        }}
        onPress={onClose}
      >
        <Pressable
          accessibilityRole="none"
          style={{
            maxHeight: '72%',
            backgroundColor: colors.surface,
            borderTopLeftRadius: radius.lg,
            borderTopRightRadius: radius.lg,
            paddingTop: spacing.md,
          }}
          onPress={(event) => event.stopPropagation()}
        >
          <SafeAreaView edges={['bottom']}>
            <View
              style={{
                paddingHorizontal: spacing.lg,
                paddingBottom: spacing.sm,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flex: 1, paddingRight: spacing.md }}>
                <Text style={[typography.title3, { color: colors.text }]}>{title}</Text>
                {subtitle ? (
                  <Text
                    style={[
                      typography.caption,
                      { color: colors.textSecondary, marginTop: spacing.xs },
                    ]}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={closeLabel}
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
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(option.value);
                      onClose();
                    }}
                    style={{
                      minHeight: 58,
                      paddingHorizontal: spacing.lg,
                      paddingVertical: spacing.sm,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: spacing.md }}>
                      <Text style={[typography.body, { color: colors.text }]}>{option.label}</Text>
                      {option.description ? (
                        <Text
                          style={[
                            typography.caption,
                            { color: colors.textSecondary, marginTop: spacing.xs },
                          ]}
                        >
                          {option.description}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark" size={22} color={colors.accent} />
                    ) : null}
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

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface PickerOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface PrefecturePickerProps<T extends string> {
  label: string;
  subLabel: string;
  placeholder: string;
  closeLabel: string;
  value?: T;
  options: Array<PickerOption<T>>;
  error?: string;
  onChange: (value: T) => void;
}

export function PrefecturePicker<T extends string>({
  label,
  subLabel,
  placeholder,
  closeLabel,
  value,
  options,
  error,
  onChange,
}: PrefecturePickerProps<T>) {
  const { colors, typography, spacing, radius, isDark } = useTheme();
  const [selected] = options.filter((option) => option.value === value);
  const [open, setOpen] = useState(false);

  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={[typography.headline, { color: colors.text }]}>{label}</Text>
      <Text style={[typography.caption, { color: colors.textSecondary }]}>{subLabel}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={{
          minHeight: 52,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.border,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
        }}
      >
        <Text style={[typography.body, { color: selected ? colors.text : colors.textSecondary }]}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
      </Pressable>
      {error ? <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text> : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(0,0,0,0.64)' : 'rgba(15,20,25,0.42)',
            justifyContent: 'flex-end',
          }}
          onPress={() => setOpen(false)}
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
                <View>
                  <Text style={[typography.title3, { color: colors.text }]}>{label}</Text>
                  <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                    {subLabel}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setOpen(false)}
                  style={{
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.pill,
                    backgroundColor: colors.background,
                  }}
                  accessibilityLabel={closeLabel}
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
                        setOpen(false);
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
                      {isSelected ? <Ionicons name="checkmark" size={22} color={colors.accent} /> : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </SafeAreaView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

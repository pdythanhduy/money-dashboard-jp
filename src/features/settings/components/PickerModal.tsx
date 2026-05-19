/**
 * Generic option-list modal used by Language/Theme/Prefecture/Payday
 * pickers. Keeps each picker file tiny — they just pass options.
 */

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface PickerOption<T extends string | number> {
  value: T;
  label: string;
  description?: string;
}

interface Props<T extends string | number> {
  visible: boolean;
  title: string;
  options: readonly PickerOption<T>[];
  selected: T | null;
  onSelect: (value: T) => void;
  onClose: () => void;
}

export function PickerModal<T extends string | number>({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: Props<T>) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.md,
          }}
        >
          <Text style={[typography.title3, { color: colors.text }]}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={[typography.callout, { color: colors.brand }]}>{t('common.done')}</Text>
          </Pressable>
        </View>
        <ScrollView>
          <View
            style={{
              marginHorizontal: spacing.lg,
              backgroundColor: colors.surfaceElevated,
              borderRadius: radius.md,
              overflow: 'hidden',
            }}
          >
            {options.map((opt, i) => {
              const isLast = i === options.length - 1;
              const isSelected = opt.value === selected;
              return (
                <Pressable
                  key={String(opt.value)}
                  onPress={() => {
                    onSelect(opt.value);
                    onClose();
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.md,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: colors.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[typography.body, { color: colors.text }]}>{opt.label}</Text>
                    {opt.description ? (
                      <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                        {opt.description}
                      </Text>
                    ) : null}
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark" size={22} color={colors.brand} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

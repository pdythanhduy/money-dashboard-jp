import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BreakdownList } from '@/features/calculator/components/BreakdownList';
import { ResultCard } from '@/features/calculator/components/ResultCard';
import { useTheme } from '@/theme';
import type { HistoryEntry } from '@/types/history';

interface Props {
  entry: HistoryEntry | null;
  onClose: () => void;
  onSave: (id: string, label: string | undefined, note: string | undefined) => void;
  onDelete: (id: string) => void;
}

export function HistoryDetailModal({ entry, onClose, onSave, onDelete }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (entry) {
      setLabel(entry.label ?? '');
      setNote(entry.note ?? '');
    }
  }, [entry]);

  if (!entry) return null;

  const handleSave = () => {
    onSave(entry.id, label.trim() || undefined, note.trim() || undefined);
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      t('history.detail.deleteConfirmTitle'),
      t('history.detail.deleteConfirmBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('history.detail.deleteConfirmOk'),
          style: 'destructive',
          onPress: () => {
            onDelete(entry.id);
            onClose();
          },
        },
      ],
    );
  };

  return (
    <Modal visible={entry !== null} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
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
          <Text style={[typography.title3, { color: colors.text, flex: 1 }]} numberOfLines={1}>
            {entry.label ?? t('history.detail.title')}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.close')}
            onPress={onClose}
            hitSlop={8}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl, gap: spacing.lg }}>
          <ResultCard result={entry.result} />
          <BreakdownList result={entry.result} input={entry.input} />

          <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
            <Text style={[typography.headline, { color: colors.text }]}>
              {t('history.detail.labelField')}
            </Text>
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder={t('history.detail.labelPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
                paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
                color: colors.text, backgroundColor: colors.surface,
              }}
            />
            <Text style={[typography.headline, { color: colors.text, marginTop: spacing.sm }]}>
              {t('history.detail.noteField')}
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t('history.detail.notePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm,
                paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
                color: colors.text, backgroundColor: colors.surface,
                minHeight: 80, textAlignVertical: 'top',
              }}
            />
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('history.detail.delete')}
              onPress={handleDelete}
              style={({ pressed }) => ({
                flex: 1, minHeight: 50, borderRadius: radius.sm,
                borderWidth: 1, borderColor: colors.danger,
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: colors.danger }]}>
                {t('history.detail.delete')}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('history.detail.save')}
              onPress={handleSave}
              style={({ pressed }) => ({
                flex: 1, minHeight: 50, borderRadius: radius.sm,
                backgroundColor: colors.brand,
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={[typography.callout, { color: colors.textInverse }]}>
                {t('history.detail.save')}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

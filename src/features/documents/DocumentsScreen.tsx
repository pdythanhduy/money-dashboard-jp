import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentCard } from '@/features/documents/components/DocumentCard';
import { DocumentEditModal } from '@/features/documents/components/DocumentEditModal';
import { EmptyState } from '@/features/documents/components/EmptyState';
import { useReminderSync } from '@/features/documents/hooks/useReminderSync';
import {
  getPermissionStatus,
  requestNotificationPermission,
} from '@/lib/notifications';
import { useDocumentsStore } from '@/store/documentsStore';
import { useTheme } from '@/theme';
import type { DocumentReminder } from '@/types/document';

type PermStatus = 'granted' | 'denied' | 'undetermined';

export function DocumentsScreen() {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();
  const documents = useDocumentsStore((s) => s.documents);
  const [editing, setEditing] = useState<DocumentReminder | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [permStatus, setPermStatus] = useState<PermStatus>('undetermined');

  useReminderSync();

  useEffect(() => {
    let cancelled = false;
    void getPermissionStatus().then((s) => {
      if (!cancelled) setPermStatus(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(
    () => [...documents].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)),
    [documents],
  );

  const openAdd = useCallback(() => {
    setEditing(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((doc: DocumentReminder) => {
    setEditing(doc);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => setModalOpen(false), []);

  const handleRequestPerm = async () => {
    const next = await requestNotificationPermission();
    setPermStatus(next);
  };

  if (documents.length === 0) {
    return (
      <>
        <EmptyState onPressCta={openAdd} />
        <DocumentEditModal visible={modalOpen} editing={editing} onClose={closeModal} />
      </>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs }}>
        <Text style={[typography.largeTitle, { color: colors.text }]}>{t('documents.title')}</Text>
        <Text style={[typography.footnote, { color: colors.textSecondary }]}>
          {t('documents.subtitle')}
        </Text>
      </View>

      {permStatus !== 'granted' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('documents.permission.enableButton')}
          onPress={handleRequestPerm}
          style={({ pressed }) => ({
            marginHorizontal: spacing.lg,
            marginTop: spacing.sm,
            padding: spacing.md,
            borderRadius: radius.md,
            backgroundColor: colors.brandSubtle,
            borderLeftWidth: 4,
            borderLeftColor: colors.brand,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Ionicons name="notifications-outline" size={20} color={colors.brand} />
          <View style={{ flex: 1 }}>
            <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
              {t('documents.permission.title')}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
              {t(`documents.permission.status.${permStatus}`)}
            </Text>
          </View>
          <Text style={[typography.callout, { color: colors.brand, fontWeight: '700' }]}>
            {t('documents.permission.enableButton')}
          </Text>
        </Pressable>
      ) : null}

      <FlatList
        data={sorted}
        keyExtractor={(d) => d.id}
        renderItem={({ item }) => <DocumentCard doc={item} onPress={openEdit} />}
        contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('documents.empty.cta')}
        onPress={openAdd}
        style={({ pressed }) => ({
          position: 'absolute',
          right: spacing.lg,
          bottom: spacing.lg,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          shadowColor: '#000',
          shadowOpacity: 0.2,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        })}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </Pressable>

      <DocumentEditModal visible={modalOpen} editing={editing} onClose={closeModal} />
    </SafeAreaView>
  );
}

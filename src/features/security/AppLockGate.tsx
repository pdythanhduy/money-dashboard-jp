/**
 * Root-level gate that hides the navigation tree behind a biometric
 * prompt when `settings.faceIdEnabled` is on.
 *
 * Cold launch: if biometric lock is enabled, start in the `locked`
 * state — children never render until auth succeeds.
 *
 * Foreground transitions: an AppState listener stamps a timestamp on
 * background. On return-to-active we re-lock if the gap exceeded
 * `LOCK_TIMEOUT_MS`.
 *
 * Auth failure / cancel: stay locked, show retry. The user can always
 * tap "Mở khóa" to re-prompt — there's no escape hatch that bypasses
 * biometrics while the toggle is on.
 */

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Pressable, Text, View, type AppStateStatus } from 'react-native';

import { authenticateWithBiometrics } from '@/lib/biometric-auth';
import { useAppLockStore } from '@/store/appLockStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from '@/theme';

interface Props {
  children: React.ReactNode;
}

export function AppLockGate({ children }: Props) {
  const { t } = useTranslation();
  const { colors, typography, spacing, radius } = useTheme();

  const faceIdEnabled = useSettingsStore((s) => s.settings.faceIdEnabled);
  const locked = useAppLockStore((s) => s.locked);
  const unlock = useAppLockStore((s) => s.unlock);
  const lock = useAppLockStore((s) => s.lock);
  const markBackgrounded = useAppLockStore((s) => s.markBackgrounded);
  const checkLockOnForeground = useAppLockStore((s) => s.checkLockOnForeground);

  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const promptInFlightRef = useRef(false);

  // Cold launch: if the user has biometric lock on, start locked.
  // useEffect with [] deps fires once per mount — that's the cold-launch hook.
  useEffect(() => {
    if (faceIdEnabled) lock();
    // We intentionally do not include `faceIdEnabled` in deps — the
    // toggle-on flow in Settings already handles the just-enabled case
    // (it prompts inline). This effect is for cold launch only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // AppState listener: stamp on background, check on active.
  useEffect(() => {
    if (!faceIdEnabled) return;
    const onChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        markBackgrounded(Date.now());
      } else if (next === 'active') {
        checkLockOnForeground(Date.now());
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [faceIdEnabled, markBackgrounded, checkLockOnForeground]);

  const runPrompt = useCallback(async () => {
    if (promptInFlightRef.current) return;
    promptInFlightRef.current = true;
    setAuthMessage(null);
    const result = await authenticateWithBiometrics(t('security.biometric.unlockSubtitle'));
    promptInFlightRef.current = false;
    if (result.success) {
      unlock();
      return;
    }
    if (result.error === 'cancelled') setAuthMessage(t('security.biometric.cancelled'));
    else if (result.error === 'unavailable') setAuthMessage(t('security.biometric.unavailable'));
    else setAuthMessage(t('security.biometric.failed'));
  }, [t, unlock]);

  // Auto-prompt whenever we transition into the locked state.
  useEffect(() => {
    if (locked && faceIdEnabled) {
      void runPrompt();
    }
  }, [locked, faceIdEnabled, runPrompt]);

  if (!faceIdEnabled || !locked) return <>{children}</>;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <View
        style={{
          width: 88,
          height: 88,
          borderRadius: 44,
          backgroundColor: colors.brandSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="lock-closed" size={40} color={colors.brand} />
      </View>
      <Text
        style={[typography.largeTitle, { color: colors.text, textAlign: 'center' }]}
        accessibilityRole="header"
      >
        {t('security.biometric.unlockTitle')}
      </Text>
      <Text
        style={[typography.body, { color: colors.textSecondary, textAlign: 'center' }]}
      >
        {t('security.biometric.unlockSubtitle')}
      </Text>
      {authMessage ? (
        <Text
          style={[typography.callout, { color: colors.danger, textAlign: 'center' }]}
          accessibilityLiveRegion="polite"
        >
          {authMessage}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('security.biometric.unlockButton')}
        onPress={runPrompt}
        style={({ pressed }) => ({
          marginTop: spacing.md,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.brand,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Text style={[typography.callout, { color: colors.textInverse, fontWeight: '700' }]}>
          {t('security.biometric.unlockButton')}
        </Text>
      </Pressable>
    </View>
  );
}

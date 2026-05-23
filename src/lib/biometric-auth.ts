/**
 * Thin wrappers around `expo-local-authentication` that normalize the
 * scattered native error shapes into discriminated results the rest of
 * the app can pattern-match on.
 *
 * No React, no I/O beyond the native module. Mock the module in tests.
 *
 * On platforms without a native biometric module (web, jest by default),
 * `LocalAuthentication.hasHardwareAsync()` returns false / throws — both
 * paths surface as `available: false, reason: 'unsupported'`.
 */

import * as LocalAuthentication from 'expo-local-authentication';

export type AvailabilityReason = 'no_hardware' | 'not_enrolled' | 'unsupported';

export interface AvailabilityResult {
  available: boolean;
  reason?: AvailabilityReason;
}

export type AuthError = 'cancelled' | 'failed' | 'unavailable' | 'unknown';

export interface AuthResult {
  success: boolean;
  error?: AuthError;
}

export async function isBiometricAvailable(): Promise<AvailabilityResult> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) return { available: false, reason: 'no_hardware' };

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return { available: false, reason: 'not_enrolled' };

    return { available: true };
  } catch {
    return { available: false, reason: 'unsupported' };
  }
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<AuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      // Let the OS fall back to device passcode if the user has set one —
      // matches platform expectations (banking apps, 1Password, etc.).
      disableDeviceFallback: false,
      cancelLabel: undefined,
    });

    if (result.success) return { success: true };

    // result.error is the expo-local-authentication error string union.
    // Map the user-cancellation variants into a single 'cancelled' bucket so
    // the lock UI can show "Bạn đã hủy xác thực" instead of a generic fail.
    const err = (result as { error?: string }).error ?? 'unknown';
    if (err === 'user_cancel' || err === 'system_cancel' || err === 'app_cancel') {
      return { success: false, error: 'cancelled' };
    }
    if (err === 'not_available' || err === 'not_enrolled' || err === 'no_hardware') {
      return { success: false, error: 'unavailable' };
    }
    if (err === 'authentication_failed' || err === 'too_fast' || err === 'lockout' || err === 'user_fallback') {
      return { success: false, error: 'failed' };
    }
    return { success: false, error: 'unknown' };
  } catch {
    return { success: false, error: 'unknown' };
  }
}

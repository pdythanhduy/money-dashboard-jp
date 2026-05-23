jest.mock('expo-local-authentication', () => ({
  __esModule: true,
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

import * as LocalAuthentication from 'expo-local-authentication';

import {
  authenticateWithBiometrics,
  isBiometricAvailable,
} from '@/lib/biometric-auth';

const hasHardwareAsync = LocalAuthentication.hasHardwareAsync as jest.Mock;
const isEnrolledAsync = LocalAuthentication.isEnrolledAsync as jest.Mock;
const authenticateAsync = LocalAuthentication.authenticateAsync as jest.Mock;

beforeEach(() => {
  hasHardwareAsync.mockReset();
  isEnrolledAsync.mockReset();
  authenticateAsync.mockReset();
});

describe('isBiometricAvailable', () => {
  it('returns no_hardware when the device lacks biometric hardware', async () => {
    hasHardwareAsync.mockResolvedValue(false);
    isEnrolledAsync.mockResolvedValue(false);
    await expect(isBiometricAvailable()).resolves.toEqual({
      available: false,
      reason: 'no_hardware',
    });
  });

  it('returns not_enrolled when hardware exists but the user has not set up biometrics', async () => {
    hasHardwareAsync.mockResolvedValue(true);
    isEnrolledAsync.mockResolvedValue(false);
    await expect(isBiometricAvailable()).resolves.toEqual({
      available: false,
      reason: 'not_enrolled',
    });
  });

  it('returns available when hardware is present and enrolled', async () => {
    hasHardwareAsync.mockResolvedValue(true);
    isEnrolledAsync.mockResolvedValue(true);
    await expect(isBiometricAvailable()).resolves.toEqual({ available: true });
  });

  it('returns unsupported when the native module throws (web / jest default)', async () => {
    hasHardwareAsync.mockRejectedValue(new Error('not linked'));
    await expect(isBiometricAvailable()).resolves.toEqual({
      available: false,
      reason: 'unsupported',
    });
  });
});

describe('authenticateWithBiometrics', () => {
  it('returns success on a successful prompt', async () => {
    authenticateAsync.mockResolvedValue({ success: true });
    await expect(authenticateWithBiometrics('Unlock')).resolves.toEqual({ success: true });
  });

  it('maps user_cancel / system_cancel / app_cancel to error: cancelled', async () => {
    for (const error of ['user_cancel', 'system_cancel', 'app_cancel']) {
      authenticateAsync.mockResolvedValueOnce({ success: false, error });
      // eslint-disable-next-line no-await-in-loop
      await expect(authenticateWithBiometrics('Unlock')).resolves.toEqual({
        success: false,
        error: 'cancelled',
      });
    }
  });

  it('maps not_available / not_enrolled / no_hardware to error: unavailable', async () => {
    for (const error of ['not_available', 'not_enrolled', 'no_hardware']) {
      authenticateAsync.mockResolvedValueOnce({ success: false, error });
      // eslint-disable-next-line no-await-in-loop
      await expect(authenticateWithBiometrics('Unlock')).resolves.toEqual({
        success: false,
        error: 'unavailable',
      });
    }
  });

  it('maps authentication_failed / lockout / user_fallback to error: failed', async () => {
    for (const error of ['authentication_failed', 'too_fast', 'lockout', 'user_fallback']) {
      authenticateAsync.mockResolvedValueOnce({ success: false, error });
      // eslint-disable-next-line no-await-in-loop
      await expect(authenticateWithBiometrics('Unlock')).resolves.toEqual({
        success: false,
        error: 'failed',
      });
    }
  });

  it('falls back to unknown for an error string we do not recognize', async () => {
    authenticateAsync.mockResolvedValue({ success: false, error: 'something_new_in_sdk_55' });
    await expect(authenticateWithBiometrics('Unlock')).resolves.toEqual({
      success: false,
      error: 'unknown',
    });
  });

  it('returns unknown error when the native module throws', async () => {
    authenticateAsync.mockRejectedValue(new Error('crashed'));
    await expect(authenticateWithBiometrics('Unlock')).resolves.toEqual({
      success: false,
      error: 'unknown',
    });
  });
});

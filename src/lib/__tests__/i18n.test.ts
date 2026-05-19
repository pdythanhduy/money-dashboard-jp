/**
 * resolveLanguage maps the persisted setting to the actual i18n code:
 *   - 'vi' / 'ja' pass through;
 *   - 'system' delegates to expo-localization, falling back to 'vi'.
 */

let mockDeviceLocale: string | undefined = 'en';

jest.mock('expo-localization', () => ({
  __esModule: true,
  getLocales: jest.fn(() => [{ languageCode: mockDeviceLocale }]),
}));

import { detectDeviceLanguage, FALLBACK_LANGUAGE, resolveLanguage } from '@/lib/i18n';

describe('resolveLanguage', () => {
  it('passes through explicit vi', () => {
    expect(resolveLanguage('vi')).toBe('vi');
  });

  it('passes through explicit ja', () => {
    expect(resolveLanguage('ja')).toBe('ja');
  });

  it('falls back to vi when device locale is unrelated', () => {
    mockDeviceLocale = 'en';
    expect(resolveLanguage('system')).toBe(FALLBACK_LANGUAGE);
    expect(FALLBACK_LANGUAGE).toBe('vi');
  });

  it('picks ja when device is ja and setting is system', () => {
    mockDeviceLocale = 'ja';
    expect(resolveLanguage('system')).toBe('ja');
  });

  it('picks vi when device is vi and setting is system', () => {
    mockDeviceLocale = 'vi';
    expect(resolveLanguage('system')).toBe('vi');
  });
});

describe('detectDeviceLanguage', () => {
  it('falls back to vi when locale is undefined', () => {
    mockDeviceLocale = undefined;
    expect(detectDeviceLanguage()).toBe('vi');
  });

  it('returns the device locale when supported', () => {
    mockDeviceLocale = 'ja';
    expect(detectDeviceLanguage()).toBe('ja');
  });
});

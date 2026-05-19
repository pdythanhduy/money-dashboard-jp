/**
 * Test the pure `resolveLanguage()` selector without touching i18next init.
 * Mocks expo-localization to control device locale.
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
  },
}));

const mockGetLocales = jest.fn();
jest.mock('expo-localization', () => ({
  getLocales: () => mockGetLocales(),
}));

import { resolveLanguage } from '@/lib/i18n';

describe('resolveLanguage', () => {
  beforeEach(() => {
    mockGetLocales.mockReset();
  });

  it('explicit vi returns vi', () => {
    expect(resolveLanguage('vi')).toBe('vi');
  });
  it('explicit ja returns ja', () => {
    expect(resolveLanguage('ja')).toBe('ja');
  });
  it('system + device=ja → ja', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'ja' }]);
    expect(resolveLanguage('system')).toBe('ja');
  });
  it('system + device=vi → vi', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'vi' }]);
    expect(resolveLanguage('system')).toBe('vi');
  });
  it('system + unsupported device → vi fallback', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'en' }]);
    expect(resolveLanguage('system')).toBe('vi');
  });
  it('system + getLocales throws → vi fallback', () => {
    mockGetLocales.mockImplementation(() => {
      throw new Error('native module missing');
    });
    expect(resolveLanguage('system')).toBe('vi');
  });
});

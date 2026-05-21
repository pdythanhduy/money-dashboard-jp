import {
  FURUSATO_MIN_MONTHLY_TAKEHOME,
  isFurusatoUseful,
} from '@/features/furusato/furusato-eligibility';

describe('isFurusatoUseful', () => {
  it('returns true when take-home ≥ threshold and no existing donations', () => {
    expect(isFurusatoUseful(250_000, false)).toBe(true);
  });

  it('returns false when take-home below threshold and no existing donations', () => {
    expect(isFurusatoUseful(150_000, false)).toBe(false);
  });

  it('keeps access true once user has donated, regardless of current income', () => {
    expect(isFurusatoUseful(100_000, true)).toBe(true);
    expect(isFurusatoUseful(0, true)).toBe(true);
    expect(isFurusatoUseful(null, true)).toBe(true);
  });

  it('treats null / undefined / NaN take-home as below threshold (when no donations)', () => {
    expect(isFurusatoUseful(null, false)).toBe(false);
    expect(isFurusatoUseful(undefined, false)).toBe(false);
    expect(isFurusatoUseful(Number.NaN, false)).toBe(false);
  });

  it('exposes FURUSATO_MIN_MONTHLY_TAKEHOME = ¥200,000 as the cutoff', () => {
    expect(FURUSATO_MIN_MONTHLY_TAKEHOME).toBe(200_000);
    expect(isFurusatoUseful(FURUSATO_MIN_MONTHLY_TAKEHOME, false)).toBe(true);
    expect(isFurusatoUseful(FURUSATO_MIN_MONTHLY_TAKEHOME - 1, false)).toBe(false);
  });
});

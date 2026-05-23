import {
  currentTaxYear,
  defaultChecklistItems,
  isTaxSeason,
  TAX_CHECKLIST_ITEM_IDS,
} from '@/lib/tax-checklist';

describe('defaultChecklistItems', () => {
  it('returns the 5 canonical ids in order', () => {
    expect(defaultChecklistItems(2026)).toEqual([
      'gensen',
      'kakutei',
      'furusato',
      'medical',
      'dependent',
    ]);
  });

  it('returns a fresh array (caller mutation does not affect canonical)', () => {
    const a = defaultChecklistItems(2026);
    a.pop();
    expect(defaultChecklistItems(2026)).toEqual([
      'gensen',
      'kakutei',
      'furusato',
      'medical',
      'dependent',
    ]);
  });

  it('exports the same list via TAX_CHECKLIST_ITEM_IDS', () => {
    expect([...TAX_CHECKLIST_ITEM_IDS]).toEqual(defaultChecklistItems(2026));
  });
});

describe('isTaxSeason', () => {
  it('true throughout January', () => {
    expect(isTaxSeason(new Date(2026, 0, 1))).toBe(true);
    expect(isTaxSeason(new Date(2026, 0, 31))).toBe(true);
  });

  it('true throughout February', () => {
    expect(isTaxSeason(new Date(2026, 1, 1))).toBe(true);
    expect(isTaxSeason(new Date(2026, 1, 28))).toBe(true);
  });

  it('true March 1–15', () => {
    expect(isTaxSeason(new Date(2026, 2, 1))).toBe(true);
    expect(isTaxSeason(new Date(2026, 2, 15))).toBe(true);
  });

  it('false from March 16 onward', () => {
    expect(isTaxSeason(new Date(2026, 2, 16))).toBe(false);
    expect(isTaxSeason(new Date(2026, 2, 31))).toBe(false);
    expect(isTaxSeason(new Date(2026, 5, 15))).toBe(false);
    expect(isTaxSeason(new Date(2026, 11, 31))).toBe(false);
  });
});

describe('currentTaxYear', () => {
  it('returns previous calendar year during Jan–Mar 15 (filing window)', () => {
    expect(currentTaxYear(new Date(2027, 0, 5))).toBe(2026);
    expect(currentTaxYear(new Date(2027, 2, 15))).toBe(2026);
  });

  it('returns current calendar year after Mar 15 (preparing next filing)', () => {
    expect(currentTaxYear(new Date(2027, 2, 16))).toBe(2027);
    expect(currentTaxYear(new Date(2027, 11, 31))).toBe(2027);
  });
});

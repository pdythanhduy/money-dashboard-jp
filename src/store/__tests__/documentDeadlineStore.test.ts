jest.mock('@react-native-async-storage/async-storage', () => {
  let storage: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn((k: string) => Promise.resolve(storage[k] ?? null)),
      setItem: jest.fn((k: string, v: string) => {
        storage[k] = v;
        return Promise.resolve();
      }),
      removeItem: jest.fn((k: string) => {
        delete storage[k];
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        storage = {};
        return Promise.resolve();
      }),
    },
  };
});

jest.mock('expo-crypto', () => {
  let n = 0;
  return { randomUUID: jest.fn(() => `dl-${++n}`) };
});

import {
  MAX_DOCUMENT_DEADLINES,
  useDocumentDeadlineStore,
} from '@/store/documentDeadlineStore';

beforeEach(() => {
  useDocumentDeadlineStore.setState({ documents: [] });
});

describe('documentDeadlineStore.addDocumentDeadline', () => {
  it('returns added=true with id + createdAt/updatedAt + sorted by expiry asc', () => {
    const s = useDocumentDeadlineStore.getState();
    s.addDocumentDeadline({
      type: 'passport',
      title: 'VN passport',
      expiryDate: '2027-01-15',
      remindBeforeDays: 90,
    });
    const r = s.addDocumentDeadline({
      type: 'residence_card',
      title: '在留カード',
      expiryDate: '2026-06-11',
      remindBeforeDays: 30,
    });
    expect(r.added).toBe(true);
    expect(r.document?.id).toMatch(/^dl-/);
    expect(r.document?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(r.document?.updatedAt).toBe(r.document?.createdAt);
    expect(
      useDocumentDeadlineStore.getState().documents.map((d) => d.title),
    ).toEqual(['在留カード', 'VN passport']);
  });

  it('refuses past MAX_DOCUMENT_DEADLINES with reason=limit_reached', () => {
    const s = useDocumentDeadlineStore.getState();
    for (let i = 0; i < MAX_DOCUMENT_DEADLINES; i++) {
      s.addDocumentDeadline({
        type: 'other',
        title: `Doc ${i}`,
        expiryDate: '2027-01-01',
        remindBeforeDays: 30,
      });
    }
    const r = s.addDocumentDeadline({
      type: 'other',
      title: 'overflow',
      expiryDate: '2027-01-02',
      remindBeforeDays: 30,
    });
    expect(r.added).toBe(false);
    expect(r.reason).toBe('limit_reached');
    expect(useDocumentDeadlineStore.getState().documents).toHaveLength(
      MAX_DOCUMENT_DEADLINES,
    );
  });

  it('normalizes a malformed expiryDate to today (fallback) without dropping the row', () => {
    const r = useDocumentDeadlineStore.getState().addDocumentDeadline({
      type: 'other',
      title: 'Bad date',
      expiryDate: 'not-a-date-at-all',
      remindBeforeDays: 30,
    });
    expect(r.added).toBe(true);
    expect(r.document?.expiryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('documentDeadlineStore — update / remove / clear', () => {
  it('updateDocumentDeadline bumps updatedAt + re-sorts when expiry changes', async () => {
    const s = useDocumentDeadlineStore.getState();
    const a = s.addDocumentDeadline({
      type: 'visa',
      title: 'Visa A',
      expiryDate: '2026-06-01',
      remindBeforeDays: 30,
    }).document!;
    s.addDocumentDeadline({
      type: 'visa',
      title: 'Visa B',
      expiryDate: '2026-07-01',
      remindBeforeDays: 30,
    });
    // Wait a beat so updatedAt diverges from createdAt.
    await new Promise((r) => setTimeout(r, 5));
    s.updateDocumentDeadline(a.id, { expiryDate: '2026-08-01' });
    const list = useDocumentDeadlineStore.getState().documents;
    expect(list.map((d) => d.title)).toEqual(['Visa B', 'Visa A']);
    const updated = useDocumentDeadlineStore.getState().getDocumentDeadline(a.id)!;
    expect(updated.updatedAt).not.toBe(updated.createdAt);
  });

  it('removeDocumentDeadline drops the matching row', () => {
    const s = useDocumentDeadlineStore.getState();
    const a = s.addDocumentDeadline({
      type: 'tax',
      title: 'Kakutei 2025',
      expiryDate: '2026-03-15',
      remindBeforeDays: 30,
    }).document!;
    s.removeDocumentDeadline(a.id);
    expect(useDocumentDeadlineStore.getState().documents).toEqual([]);
  });

  it('clearDocumentDeadlines wipes everything', () => {
    const s = useDocumentDeadlineStore.getState();
    s.addDocumentDeadline({
      type: 'phone_contract',
      title: 'Softbank',
      expiryDate: '2026-12-31',
      remindBeforeDays: 30,
    });
    s.clearDocumentDeadlines();
    expect(useDocumentDeadlineStore.getState().documents).toEqual([]);
  });
});
